# Architecture

## Overview

The API Gateway is built with NestJS (TypeScript strict mode) following a **Strict Layered Architecture**. Each layer has clearly defined responsibilities and dependency rules.

## Layered Architecture

```
┌─────────────────────────────────────────────────────┐
│                Presentation Layer                    │
│         (Controllers — HTTP in/out only)             │
├─────────────────────────────────────────────────────┤
│                Business Logic Layer                  │
│    (Services — orchestration, workflows, rules)      │
├─────────────────────────────────────────────────────┤
│                Integration Layer                     │
│  (HTTP clients, RabbitMQ, Redis, Circuit Breaker)    │
├─────────────────────────────────────────────────────┤
│                Cross-Cutting Layer                   │
│  (Guards, Interceptors, Filters, Middleware, Metrics)│
├─────────────────────────────────────────────────────┤
│                    DTO Layer                         │
│        (Validated request/response objects)           │
└─────────────────────────────────────────────────────┘
```

## Dependency Rules

| Layer | Can Depend On | Cannot Depend On |
|-------|---------------|------------------|
| Presentation | Business, DTOs, Decorators | Integration |
| Business | Integration, Interfaces | Presentation, HTTP framework |
| Integration | Interfaces, Utils | Business, Presentation |
| Cross-Cutting | Interfaces, Config | Business, Integration (except via DI) |
| DTO | class-validator only | Any other layer |

## Key Patterns

### Circuit Breaker (opossum)
Each downstream service client has its own circuit breaker instance. When a service fails repeatedly, the circuit opens and requests fail fast, preventing cascade failures.

### Retry with Exponential Backoff
Safe/idempotent operations are retried with jittered exponential backoff. Non-idempotent operations fail immediately on circuit open.

### Compensating Transactions
The signup flow orchestrates across auth-service and user-service. If user-service fails after auth-service succeeds, the orchestrator calls auth-service to delete the created user, preventing orphan records.

### RabbitMQ with DLQ
- Events are published to a topic exchange with persistent delivery mode
- Each message includes an idempotency key (eventId)
- Failed messages are routed to a dead-letter queue
- Consumer checks idempotency keys to prevent duplicate processing

### Redis Caching
- User profiles are cached with configurable TTL
- Cache is invalidated on mutations (update, delete)
- Cache-aside pattern: check cache → miss → fetch from service → cache result

### JWT Validation (Hybrid)
- **Local**: RS256 signature verification, expiration check, claim extraction
- **Delegated**: Auth-service checks for revocation, bans, dynamic permissions

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Framework | NestJS |
| Language | TypeScript (strict mode) |
| Auth | RS256 JWT (jsonwebtoken) |
| Messaging | RabbitMQ (amqplib) |
| Caching | Redis (ioredis) |
| Resilience | opossum (circuit breaker) |
| Metrics | Prometheus (prom-client) |
| Tracing | OpenTelemetry + Jaeger |
| Logging | Pino (nestjs-pino) |
| API Docs | Swagger (@nestjs/swagger) |
| Validation | class-validator, class-transformer |
| Rate Limiting | @nestjs/throttler |
