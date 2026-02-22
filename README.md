# API Gateway — Video Streaming Platform

Production-grade API Gateway for a video streaming microservices architecture, built with NestJS and TypeScript strict mode.

## Architecture

This gateway follows a **Strict Layered Architecture**:

- **Presentation** → Controllers (HTTP only)
- **Business Logic** → Services (orchestration, rules)
- **Integration** → HTTP clients, RabbitMQ, Redis
- **Cross-Cutting** → Guards, interceptors, filters, middleware

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full details.

## Quick Start

```bash
npm install
cp .env.example .env
docker compose up -d rabbitmq redis jaeger
npm run start:dev
```

- Gateway: http://localhost:3000
- Swagger: http://localhost:3000/api-docs
- Metrics: http://localhost:3000/metrics
- Jaeger: http://localhost:16686

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health/live | Public | Liveness probe |
| GET | /health/ready | Public | Readiness probe |
| GET | /metrics | Public | Prometheus metrics |
| GET | /api-docs | Public | Swagger UI |
| POST | /v1/auth/signup | Public | Register new user |
| POST | /v1/auth/login | Public | Login |
| POST | /v1/auth/validate-token | JWT | Delegated token validation |
| POST | /v1/auth/refresh-token | Public | Refresh access token |
| POST | /v1/auth/logout | JWT | Logout |
| GET | /v1/users/:id | JWT + Self/Admin | Get user profile |
| PUT | /v1/users/:id | JWT + Self/Admin | Update user profile |
| DELETE | /v1/users/:id | JWT + Admin | Delete user |
| GET | /v1/videos | JWT | List videos |
| POST | /v1/videos/upload | JWT + Admin | Upload video |
| GET | /v1/videos/:id/stream-url | JWT | Get stream URL |

## Key Features

- RS256 JWT validation (local + delegated)
- Circuit breaker (opossum) per downstream service
- Retry with exponential backoff
- Redis caching with TTL
- RabbitMQ events with DLQ and idempotency
- OpenTelemetry + Jaeger distributed tracing
- Prometheus metrics
- Role-based rate limiting
- Compensating transactions (signup rollback)
- Multi-stage Docker build (non-root)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Development with watch |
| `npm run build` | Production build |
| `npm run test` | Run tests |
| `npm run test:e2e` | E2E tests |
| `npm run lint` | Lint |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Request Lifecycle](docs/REQUEST-LIFECYCLE.md)
- [Onboarding Guide](docs/ONBOARDING.md)
- [API Testing Guide](docs/API-TESTING-GUIDE.md)
- [Extending the Gateway](docs/EXTENDING.md)
# API-Gateway-NestJS
