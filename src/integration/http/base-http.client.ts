import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import CircuitBreaker from 'opossum';
import { createCircuitBreaker } from '../resilience/circuit-breaker.factory.js';
import { retryWithBackoff } from '../resilience/retry.util.js';
import { ServiceResponse } from '../../interfaces/service-response.interface.js';
import { TRACE_ID_HEADER } from '../../utils/constants.js';
import { AppConfig } from '../../config/app.config.js';

/**
 * Base class for all HTTP clients that call external services.
 * Provides built-in retry logic, circuit breaker pattern, and consistent error handling.
 */

export abstract class BaseHttpClient {
  protected readonly logger: Logger; // For logging debug/error messages
  protected readonly baseUrl: string; // The base URL of the external service
  // Circuit breaker prevents calling a failing service repeatedly
  private readonly circuitBreaker: CircuitBreaker<[string, AxiosRequestConfig], AxiosResponse>;

  constructor(
    protected readonly httpService: HttpService,
    protected readonly configService: ConfigService,
    serviceName: string,
    baseUrl: string,
  ) {
    this.logger = new Logger(serviceName);
    this.baseUrl = baseUrl;

    // Get circuit breaker settings from config, or use sensible defaults
    const appCfg = this.configService.get<AppConfig>('app');
    const cbConfig = appCfg?.circuitBreaker ?? {
      timeout: 5000, // Max time to wait for response
      errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
      resetTimeout: 30000, // Try again after 30 seconds
    };

    // Create circuit breaker that wraps our HTTP requests
    this.circuitBreaker = createCircuitBreaker(
      (url: string, config: AxiosRequestConfig) => this.executeRequest(url, config),
      serviceName,
      cbConfig,
      this.logger,
    );
  }

  // Executes the actual HTTP request and converts RxJS Observable to Promise
  private async executeRequest(url: string, config: AxiosRequestConfig): Promise<AxiosResponse> {
    const response$ = this.httpService.request({ ...config, url });
    return firstValueFrom(response$); // Convert Observable to Promise
  }

  /**
   * Core method that sends HTTP requests with retry and circuit breaker protection.
   * @param method - HTTP method (GET, POST, PUT, DELETE)
   * @param path - API endpoint path (e.g., '/users/123')
   * @param traceId - Unique ID for tracking requests across services
   * @param data - Request body data (optional)
   */
  protected async request<T>(
    method: string,
    path: string,
    traceId: string,
    data?: unknown,
  ): Promise<ServiceResponse<T>> {
    const url = `${this.baseUrl}${path}`;

    // Build the request configuration
    const appCfg = this.configService.get<AppConfig>('app');
    const config: AxiosRequestConfig = {
      method,
      headers: {
        [TRACE_ID_HEADER]: traceId, // Pass trace ID for distributed tracing
        'Content-Type': 'application/json',
        'X-Internal-API-Key': appCfg?.internalApiKey ?? '', // Service-to-service auth
      },
      data,
      timeout: appCfg?.requestTimeout ?? 10000,
    };

    try {
      // Attempt request with automatic retries (up to 2 times) if it fails
      const response = await retryWithBackoff(
        () => this.circuitBreaker.fire(url, config),
        { maxRetries: 2 },
        this.logger,
      );

      // Parse and return the response in a standard format
      const body = response.data as ServiceResponse<T>;
      return {
        success: body.success ?? true,
        message: body.message ?? 'OK',
        data: body.data ?? null,
        statusCode: response.status,
      };
    } catch (error) {
      // If all retries fail, return a standardized error response
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Request failed: ${method} ${url} - ${message}`);

      return {
        success: false,
        message,
        data: null,
        statusCode: 500,
      };
    }
  }

  // Convenience methods for common HTTP verbs

  // GET - Retrieve data from the service
  protected async get<T>(path: string, traceId: string): Promise<ServiceResponse<T>> {
    return this.request<T>('GET', path, traceId);
  }

  // POST - Create new data or trigger an action
  protected async post<T>(
    path: string,
    traceId: string,
    data?: unknown,
  ): Promise<ServiceResponse<T>> {
    return this.request<T>('POST', path, traceId, data);
  }

  // PUT - Update existing data
  protected async put<T>(
    path: string,
    traceId: string,
    data?: unknown,
  ): Promise<ServiceResponse<T>> {
    return this.request<T>('PUT', path, traceId, data);
  }

  // DELETE - Remove data from the service
  protected async delete<T>(path: string, traceId: string): Promise<ServiceResponse<T>> {
    return this.request<T>('DELETE', path, traceId);
  }

  // POST with an additional Authorization Bearer header
  protected async postWithAuthHeader<T>(
    path: string,
    traceId: string,
    data: unknown,
    bearerToken: string,
  ): Promise<ServiceResponse<T>> {
    return this.requestWithExtraHeaders<T>('POST', path, traceId, data, {
      Authorization: `Bearer ${bearerToken}`,
    });
  }

  /**
   * Like request() but allows merging additional headers.
   */
  protected async requestWithExtraHeaders<T>(
    method: string,
    path: string,
    traceId: string,
    data: unknown,
    extraHeaders: Record<string, string>,
  ): Promise<ServiceResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const appCfg = this.configService.get<AppConfig>('app');

    const config: AxiosRequestConfig = {
      method,
      headers: {
        [TRACE_ID_HEADER]: traceId,
        'Content-Type': 'application/json',
        'X-Internal-API-Key': appCfg?.internalApiKey ?? '',
        ...extraHeaders,
      },
      data,
      timeout: appCfg?.requestTimeout ?? 10000,
    };

    try {
      const response = await retryWithBackoff(
        () => this.circuitBreaker.fire(url, config),
        { maxRetries: 2 },
        this.logger,
      );

      const body = response.data as ServiceResponse<T>;
      return {
        success: body.success ?? true,
        message: body.message ?? 'OK',
        data: body.data ?? null,
        statusCode: response.status,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Request failed: ${method} ${url} - ${message}`);

      return {
        success: false,
        message,
        data: null,
        statusCode: 500,
      };
    }
  }
}
