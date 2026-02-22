# Request Lifecycle

This document explains how an HTTP request flows through the API Gateway.

## Flow Diagram

```
Client Request
      │
      ▼
┌─────────────────┐
│  Helmet (CORS)   │  Security headers
└────────┬────────┘
         ▼
┌─────────────────┐
│ TraceIdMiddleware │  Generate/propagate x-request-id
└────────┬────────┘
         ▼
┌──────────────────┐
│PrometheusMiddleware│  Start timing, count request
└────────┬─────────┘
         ▼
┌─────────────────┐
│  JwtAuthGuard    │  Verify RS256 token (skip @Public routes)
└────────┬────────┘
         ▼
┌─────────────────┐
│   RolesGuard     │  Check @Roles() against user.roles
└────────┬────────┘
         ▼
┌──────────────────┐
│RoleThrottlerGuard│  Rate limit based on user role
└────────┬─────────┘
         ▼
┌─────────────────┐
│ ValidationPipe   │  Validate DTO (class-validator)
└────────┬────────┘
         ▼
┌──────────────────┐
│TimeoutInterceptor│  Wrap in timeout observable
└────────┬─────────┘
         ▼
┌──────────────────┐
│LoggingInterceptor│  Log request start
└────────┬─────────┘
         ▼
┌─────────────────┐
│   Controller     │  Route to business service (no logic)
└────────┬────────┘
         ▼
┌──────────────────┐
│ Business Service │  Orchestrate workflow, apply rules
└────────┬─────────┘
         ▼
┌──────────────────┐
│Integration Client│  HTTP call with circuit breaker + retry
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Downstream Svc   │  auth-service / user-service / video-service
└────────┬─────────┘
         ▼
  Response bubbles back up through:
    - ResponseTransformInterceptor → wraps in ApiResponse<T>
    - LoggingInterceptor → logs duration + status
    - PrometheusMiddleware → records metrics
         ▼
      Client Response
```

## Error Flow

When any layer throws an exception:

```
Exception thrown
      │
      ▼
┌──────────────────┐
│HttpExceptionFilter│  Catches all exceptions
└────────┬─────────┘
         ▼
  Formats as ApiResponse<null>:
  {
    success: false,
    message: "error message",
    data: null,
    traceId: "x-request-id"
  }
```

## Trace ID Propagation

```
Client → Gateway (x-request-id generated or preserved)
  → Auth-Service   (x-request-id forwarded)
  → User-Service   (x-request-id forwarded)
  → RabbitMQ Event (traceId in message headers)
```
