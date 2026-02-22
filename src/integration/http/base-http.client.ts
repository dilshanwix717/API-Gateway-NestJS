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

export abstract class BaseHttpClient {
  protected readonly logger: Logger;
  protected readonly baseUrl: string;
  private readonly circuitBreaker: CircuitBreaker<[string, AxiosRequestConfig], AxiosResponse>;

  constructor(
    protected readonly httpService: HttpService,
    protected readonly configService: ConfigService,
    serviceName: string,
    baseUrl: string,
  ) {
    this.logger = new Logger(serviceName);
    this.baseUrl = baseUrl;

    const appCfg = this.configService.get<AppConfig>('app');
    const cbConfig = appCfg?.circuitBreaker ?? {
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
    };

    this.circuitBreaker = createCircuitBreaker(
      (url: string, config: AxiosRequestConfig) => this.executeRequest(url, config),
      serviceName,
      cbConfig,
      this.logger,
    );
  }

  private async executeRequest(url: string, config: AxiosRequestConfig): Promise<AxiosResponse> {
    const response$ = this.httpService.request({ ...config, url });
    return firstValueFrom(response$);
  }

  protected async request<T>(
    method: string,
    path: string,
    traceId: string,
    data?: unknown,
  ): Promise<ServiceResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const config: AxiosRequestConfig = {
      method,
      headers: {
        [TRACE_ID_HEADER]: traceId,
        'Content-Type': 'application/json',
      },
      data,
      timeout: this.configService.get<AppConfig>('app')?.requestTimeout ?? 10000,
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

  protected async get<T>(path: string, traceId: string): Promise<ServiceResponse<T>> {
    return this.request<T>('GET', path, traceId);
  }

  protected async post<T>(
    path: string,
    traceId: string,
    data?: unknown,
  ): Promise<ServiceResponse<T>> {
    return this.request<T>('POST', path, traceId, data);
  }

  protected async put<T>(
    path: string,
    traceId: string,
    data?: unknown,
  ): Promise<ServiceResponse<T>> {
    return this.request<T>('PUT', path, traceId, data);
  }

  protected async delete<T>(path: string, traceId: string): Promise<ServiceResponse<T>> {
    return this.request<T>('DELETE', path, traceId);
  }
}
