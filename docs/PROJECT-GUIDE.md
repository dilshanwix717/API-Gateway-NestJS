# Complete Project Guide: API Gateway (NestJS)

> A beginner-to-professional walkthrough covering every aspect of this project.

---

## Level 1 — What Is This Project?

This is a **production-grade API Gateway** — a single entry point that sits between your frontend/clients and multiple backend microservices (Auth, User, Video). Instead of clients calling 3+ services directly, they call this one gateway, which handles:

- **Routing** requests to the right microservice
- **Authentication** (JWT verification)
- **Authorization** (role-based access control)
- **Caching** (Redis)
- **Messaging** (RabbitMQ events)
- **Resilience** (circuit breakers, retries, timeouts)
- **Observability** (logging, tracing, metrics)

```
Client → API Gateway → Auth Service
                     → User Service
                     → Video Service
```

---

## Level 2 — Tech Stack (What You Need to Know)

| Technology              | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| **NestJS 11**           | Node.js framework (TypeScript, DI, modular architecture) |
| **TypeScript** (strict) | Type-safe JavaScript                                     |
| **Redis**               | In-memory cache                                          |
| **RabbitMQ**            | Async message broker                                     |
| **Docker**              | Containerization                                         |
| **Prometheus**          | Metrics collection                                       |
| **Jaeger**              | Distributed tracing (OpenTelemetry)                      |
| **Swagger**             | API documentation UI                                     |
| **Jest**                | Testing framework                                        |

### Prerequisites

- Node.js 20+, Docker, basic TypeScript knowledge

### Getting Started

```bash
# Install dependencies
npm install

# Start infrastructure (Redis, RabbitMQ, Jaeger)
docker-compose up -d

# Start in dev mode
npm run start:dev

# Visit Swagger docs
# http://localhost:3000/api-docs
```

---

## Level 3 — Project Structure (The Architecture)

The project follows a **strict layered architecture** with 5 layers. Each layer only talks to the layer directly below it:

```
┌─────────────────────────────────────┐
│  PRESENTATION   (Controllers)       │  ← HTTP in/out
├─────────────────────────────────────┤
│  BUSINESS       (Services)          │  ← Orchestration & rules
├─────────────────────────────────────┤
│  INTEGRATION    (Clients/Cache/MQ)  │  ← External communication
├─────────────────────────────────────┤
│  CROSS-CUTTING  (Guards/Filters/..) │  ← Global concerns
├─────────────────────────────────────┤
│  CONFIG / TELEMETRY / DTOs          │  ← Foundation
└─────────────────────────────────────┘
```

### Directory Mapping

| Folder               | Layer         | Responsibility                            |
| -------------------- | ------------- | ----------------------------------------- |
| `src/presentation/`  | Presentation  | HTTP controllers (routes)                 |
| `src/business/`      | Business      | Workflow logic, orchestration             |
| `src/integration/`   | Integration   | HTTP clients, Redis, RabbitMQ             |
| `src/cross-cutting/` | Cross-Cutting | Guards, filters, interceptors, middleware |
| `src/config/`        | Config        | Environment variables, validation         |
| `src/dto/`           | Data Transfer | Request/response shapes                   |
| `src/interfaces/`    | Contracts     | TypeScript interfaces                     |
| `src/telemetry/`     | Observability | OpenTelemetry tracing                     |
| `src/utils/`         | Utilities     | Constants, helpers                        |

---

## Level 4 — The Bootstrap Flow (How the App Starts)

Read `src/main.ts` — this is where everything begins:

```
1. Import tracing (OpenTelemetry) FIRST — must initialize before anything else
2. Create NestJS application
3. Switch to Pino structured logger
4. Apply Helmet (security headers) + CORS
5. Enable shutdown hooks (graceful stop)
6. Register global ValidationPipe (reject bad requests)
7. Set up Swagger at /api-docs
8. Listen on port 3000
```

The root module `src/app.module.ts` composes everything:

- `AppConfigModule` → loads env vars
- `LoggerModule` → structured logging (JSON in prod, pretty in dev)
- `CrossCuttingModule` → global guards/filters/interceptors
- `PresentationModule` → all controllers

It also registers two global middlewares:

- `TraceIdMiddleware` → ensures every request has a unique trace ID
- `PrometheusMiddleware` → records HTTP metrics

---

## Level 5 — Request Lifecycle (What Happens When a Request Arrives)

This is the most important concept. Every HTTP request flows through this pipeline:

```
Request arrives
  │
  ├─ 1. TraceIdMiddleware      → Assigns/reads x-request-id header
  ├─ 2. PrometheusMiddleware   → Starts timing, will record metrics
  │
  ├─ 3. JwtAuthGuard           → Verifies JWT (skips @Public routes)
  ├─ 4. RolesGuard             → Checks @Roles() permissions
  ├─ 5. RoleThrottlerGuard     → Rate limiting by role
  │
  ├─ 6. ValidationPipe         → Validates DTO (rejects bad input)
  │
  ├─ 7. Controller method      → Delegates to business service
  │     └─ Business service    → Calls integration clients
  │           └─ HTTP client   → Circuit breaker → Retry → Downstream call
  │
  ├─ 8. ResponseTransformInterceptor → Wraps response in {success, data, traceId}
  ├─ 9. LoggingInterceptor     → Logs {method, url, status, duration}
  │
  └─ On error at any step:
       └─ HttpExceptionFilter  → Returns {success: false, message, traceId}
```

The detailed visual flow is documented in `docs/REQUEST-LIFECYCLE.md`.

---

## Level 6 — Configuration System

### How environment variables work

Three files work together:

1. **`src/config/app.config.ts`** — Reads `process.env` and maps to a typed `AppConfig` interface. Every config value the app uses is defined here (JWT key, service URLs, Redis host, rate limits, circuit breaker settings, etc.)

2. **`src/config/config.schema.ts`** — Joi schema that validates all environment variables at startup. If a required var is missing, the app **crashes immediately** with a descriptive error (fail-fast).

3. **`src/config/config.module.ts`** — Registers `ConfigModule.forRoot()` globally, so any service can inject `ConfigService` and call `this.configService.get('app')`.

### Key environment variables

| Variable                    | Purpose                                 | Required      |
| --------------------------- | --------------------------------------- | ------------- |
| `PORT`                      | Server port (default 3000)              | No            |
| `JWT_PUBLIC_KEY`            | RS256 public key for token verification | **Yes**       |
| `AUTH_SERVICE_URL`          | Auth microservice base URL              | **Yes**       |
| `USER_SERVICE_URL`          | User microservice base URL              | **Yes**       |
| `VIDEO_SERVICE_URL`         | Video microservice base URL             | **Yes**       |
| `RABBITMQ_URL`              | AMQP connection string                  | **Yes**       |
| `REDIS_HOST` / `REDIS_PORT` | Redis connection                        | No (defaults) |
| `JAEGER_ENDPOINT`           | Tracing collector URL                   | No            |

---

## Level 7 — Presentation Layer (Controllers)

Controllers live in `src/presentation/controllers/` and handle **only HTTP concerns** — they never contain business logic.

### API Routes

| Method   | Path                        | Auth             | Description            |
| -------- | --------------------------- | ---------------- | ---------------------- |
| `POST`   | `/v1/auth/signup`           | Public           | Register new user      |
| `POST`   | `/v1/auth/login`            | Public           | Get JWT tokens         |
| `POST`   | `/v1/auth/validate-token`   | JWT              | Check token validity   |
| `POST`   | `/v1/auth/refresh-token`    | Public           | Exchange refresh token |
| `POST`   | `/v1/auth/logout`           | JWT              | Invalidate token       |
| `GET`    | `/v1/users/:id`             | JWT + Self/Admin | Get user profile       |
| `PUT`    | `/v1/users/:id`             | JWT + Self/Admin | Update profile         |
| `DELETE` | `/v1/users/:id`             | JWT + Admin      | Delete user            |
| `GET`    | `/v1/videos`                | JWT              | List all videos        |
| `POST`   | `/v1/videos/upload`         | JWT + Admin      | Upload video           |
| `GET`    | `/v1/videos/:id/stream-url` | JWT              | Get stream URL         |
| `GET`    | `/health/live`              | Public           | Liveness probe         |
| `GET`    | `/health/ready`             | Public           | Readiness probe        |
| `GET`    | `/metrics`                  | Public           | Prometheus metrics     |

### Controller Pattern

```typescript
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authBusiness: AuthBusinessService) {}

  @Public() // Skip JWT guard
  @Post('login')
  async login(@Body() dto: LoginDto, @Headers('x-request-id') traceId: string) {
    return this.authBusiness.login(dto.email, dto.password, traceId);
  }
}
```

Key points:

- `@Public()` makes routes skip JWT verification
- `@Roles(ROLES.ADMIN)` restricts to specific roles
- `@UseGuards(SelfOrAdminGuard)` ensures users can only access their own data
- Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`) generate API docs

---

## Level 8 — DTOs & Validation

DTOs in `src/dto/` define the **shape of incoming requests** and validate them using `class-validator` decorators.

Example from `src/dto/auth/signup.dto.ts`:

```typescript
export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  first_name: string;
  // ...
}
```

The global `ValidationPipe` (set in `src/main.ts`) enforces:

- **`whitelist: true`** — strips unknown properties
- **`forbidNonWhitelisted: true`** — rejects requests with unknown fields
- **`transform: true`** — auto-converts types

If validation fails, the client gets a `400 Bad Request` with descriptive error messages.

---

## Level 9 — Business Layer (Service Logic)

Business services in `src/business/services/` contain **domain logic and orchestration**. They never make HTTP calls directly — they use integration clients.

### Auth Business — `src/business/services/auth-business.service.ts`

- `login()` → calls auth-service client, throws `UnauthorizedException` on failure
- `validateToken()` → checks validity, revocation status, and user ban status
- `refreshToken()` → exchanges refresh token for new access token
- `logout()` → best-effort (doesn't throw if downstream fails)

### Signup Orchestrator — `src/business/services/signup-orchestrator.service.ts`

The most complex business flow — a **saga pattern** with compensating transactions:

```
1. Create auth record in auth-service
2. Create user profile in user-service
3. Publish "user.created" event to RabbitMQ
   ↓
   If step 2 fails → DELETE auth record (compensating transaction)
   This prevents orphaned data!
```

### User Business — `src/business/services/user-business.service.ts`

Implements **cache-aside pattern**:

```
getUserById():
  1. Check Redis cache → hit → return cached data
  2. Cache miss → fetch from user-service
  3. Store in Redis with TTL (default 5 min)

updateUser() / deleteUser():
  → Invalidate cache after mutation
```

### Video Business — `src/business/services/video-business.service.ts`

- `listVideos()` — returns empty list on downstream failure (**graceful degradation**)
- `uploadVideo()` / `getStreamUrl()` — direct delegation to video client

---

## Level 10 — Integration Layer (External Communication)

### HTTP Clients — `src/integration/http/`

All HTTP clients extend `src/integration/http/base-http.client.ts`, which provides:

**Circuit Breaker** (via opossum):

```
CLOSED (normal) → errors exceed threshold → OPEN (fail-fast, no calls)
                                              ↓ after reset timeout
                                           HALF-OPEN (allow one test call)
                                              ↓ success → CLOSED
                                              ↓ failure → OPEN
```

**Retry with Exponential Backoff** (via `src/integration/resilience/retry.util.ts`):

```
Attempt 1 fails → wait ~200ms
Attempt 2 fails → wait ~400ms
Attempt 3 fails → give up
(Delay = min(baseMs × 2^attempt, maxMs) + random jitter)
```

**Trace ID Propagation**: Every outgoing request includes `x-request-id` header so downstream services can correlate logs.

Each client wraps a specific service:

- `auth-service.client.ts` — signup, login, validate, refresh, logout
- `user-service.client.ts` — CRUD user profiles
- `video-service.client.ts` — list, upload, stream URLs

### Redis Cache — `src/integration/cache/redis.service.ts`

- Wraps `ioredis` with `get<T>()`, `set<T>()`, `del()`, `isHealthy()`
- Auto-connects on module init, disconnects on destroy
- Used by `UserBusinessService` for cache-aside pattern

### RabbitMQ Messaging — `src/integration/messaging/`

**Publisher** — `rabbitmq.service.ts`:

- Sets up topology on connect: `events` exchange (topic) → `gateway.events` queue → `gateway.events.dlq` (dead-letter)
- `publish(routingKey, payload, traceId)` — persistent messages with idempotency keys

**Consumer** — `rabbitmq-consumer.service.ts`:

- Register handlers per event type
- Deduplicates by `eventId` (in-memory set, max 10k entries)
- ACK on success, NACK on failure → failed messages go to DLQ

---

## Level 11 — Cross-Cutting Concerns (The Middleware Pipeline)

Everything in `src/cross-cutting/` runs **globally** for every request.

### Middlewares (run first)

| File                       | Purpose                                                                                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trace-id.middleware.ts`   | Generates UUID if `x-request-id` is missing                                                                                                                                      |
| `prometheus.middleware.ts` | Records `http_requests_total`, `http_request_duration_seconds`, `http_request_errors_total`. Normalizes dynamic segments (UUIDs → `:id`) to prevent metric cardinality explosion |

### Guards (run after middleware, before controller)

| File                      | Purpose                                                                  |
| ------------------------- | ------------------------------------------------------------------------ |
| `jwt-auth.guard.ts`       | Verifies RS256 JWT, skips `@Public()` routes, attaches `user` to request |
| `roles.guard.ts`          | Checks `@Roles()` metadata against `user.roles`                          |
| `self-or-admin.guard.ts`  | For `/users/:id` — allows if admin OR `user.sub === params.id`           |
| `role-throttler.guard.ts` | Rate limits: unauthenticated=10/min, users=60/min, admins=unlimited      |

### Interceptors (wrap controller execution)

| File                                | Purpose                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `logging.interceptor.ts`            | Logs `{traceId, method, url, statusCode, duration}` after every request |
| `response-transform.interceptor.ts` | Wraps all responses in `{success: true, data, message, traceId}`        |
| `timeout.interceptor.ts`            | Kills requests exceeding timeout (default 10s)                          |

### Filter (catches all errors)

| File                       | Purpose                                                              |
| -------------------------- | -------------------------------------------------------------------- |
| `http-exception.filter.ts` | Catches all exceptions, returns `{success: false, message, traceId}` |

### Custom Decorators

| Decorator        | File                        | Purpose                          |
| ---------------- | --------------------------- | -------------------------------- |
| `@Public()`      | `public.decorator.ts`       | Skip JWT auth                    |
| `@Roles(...)`    | `roles.decorator.ts`        | Require specific roles           |
| `@CurrentUser()` | `current-user.decorator.ts` | Extract JWT payload from request |

All global providers are registered in `cross-cutting.module.ts` using `APP_GUARD`, `APP_INTERCEPTOR`, and `APP_FILTER` tokens.

---

## Level 12 — Interfaces & Contracts

Defined in `src/interfaces/`:

**`ApiResponse<T>`** — Every API response follows this shape:

```typescript
{
  success: boolean;
  message: string;
  data: T | null;
  traceId: string;
}
```

**`ServiceResponse<T>`** — Internal response from integration clients:

```typescript
{
  success: boolean;
  message: string;
  data: T | null;
  statusCode: number;
}
```

**`JwtPayload`** — Decoded JWT token:

```typescript
{ sub: string; email: string; roles: string[]; permissions: string[]; exp: number; iat: number }
```

**`AuthenticatedRequest`** — Extended Express Request with `user` and `traceId` properties.

---

## Level 13 — Observability Stack

### Structured Logging (Pino)

- JSON format in production, pretty-print in development
- Every log includes `traceId` for correlation
- Configured in `src/app.module.ts` via `nestjs-pino`

### Distributed Tracing (OpenTelemetry + Jaeger)

- Initialized in `src/telemetry/tracing.ts` — **must be imported first** in `src/main.ts`
- Auto-instruments HTTP requests, creates spans
- Traces sent to Jaeger (UI at `http://localhost:16686`)
- Graceful shutdown on `SIGTERM`

### Metrics (Prometheus)

- `prometheus.middleware.ts` records:
  - `http_requests_total` (counter) — by method, path, status
  - `http_request_duration_seconds` (histogram) — with buckets from 10ms to 10s
  - `http_request_errors_total` (counter) — 4xx/5xx errors
- Exposed at `GET /metrics`

---

## Level 14 — Constants & Naming Conventions

`src/utils/constants.ts` centralizes all magic strings:

```typescript
TRACE_ID_HEADER = 'x-request-id'
EXCHANGES = { EVENTS: 'events' }
ROUTING_KEYS = { USER_CREATED: 'user.created', ... }
QUEUES = { GATEWAY_EVENTS: 'gateway.events', DLQ: 'gateway.events.dlq' }
CACHE_KEYS = { USER_PROFILE: (id) => `user:profile:${id}`, ... }
ROLES = { ADMIN: 'admin', USER: 'user' }
```

This prevents typos and makes refactoring safe — change a value in one place.

---

## Level 15 — NestJS Module Dependency Graph

```
AppModule
  ├── AppConfigModule (global)
  ├── LoggerModule (global)
  ├── CrossCuttingModule
  │     └── ThrottlerModule
  └── PresentationModule
        └── BusinessModule
              └── IntegrationModule
                    ├── HttpModule (Axios)
                    ├── CacheModule (Redis)
                    └── MessagingModule (RabbitMQ)
```

**Dependency rule**: arrows point downward only. `PresentationModule` never imports `IntegrationModule` directly. `BusinessModule` never imports NestJS HTTP framework types.

---

## Level 16 — Testing Strategy

### Test Structure

```
test/
├── mocks/           → Reusable Jest mocks for integration clients
├── unit/            → Isolated tests (one class, all deps mocked)
├── integration/     → Controller tests (real NestJS DI, mocked services)
└── e2e/             → Full HTTP tests (supertest, real app)
```

### Mock Pattern (`test/mocks/`)

Each mock file exports:

```typescript
export const mockAuthServiceClient = {
  login: jest.fn(),
  signup: jest.fn(),
  // ...
};
export const resetAuthServiceMock = () => {
  Object.values(mockAuthServiceClient).forEach((fn) => fn.mockReset());
};
```

### Running Tests

```bash
npm test                          # Unit + integration
npm run test:cov                  # With coverage report
npm run test:e2e                  # E2E (needs RUN_E2E=true + infra)
npm run test:watch                # Watch mode
```

### E2E Tests

- Guarded by `RUN_E2E=true` environment variable
- Use `supertest` to make real HTTP requests
- Test validation (bad input → 400), auth flows, health checks
- `docker-compose.test.yml` provides isolated RabbitMQ (port 5673) and Redis (port 6380)

---

## Level 17 — Docker & Deployment

### Dockerfile

Multi-stage build for minimal production image:

```
Stage 1 (builder): Node 20 Alpine → install all deps → build TypeScript
Stage 2 (production): Node 20 Alpine → copy only prod deps + dist/ → run as non-root user
```

Built-in health check: `wget -qO- http://localhost:3000/health/live`

### Docker Compose (`docker-compose.yml`)

```yaml
api-gateway: → port 3000, depends on RabbitMQ + Redis (health checks)
rabbitmq: → ports 5672 (AMQP) + 15672 (management UI)
redis: → port 6379
jaeger: → port 16686 (UI) + 14268 (collector)
```

All on a shared `gateway-net` bridge network.

---

## Level 18 — Design Patterns Summary

| Pattern                             | Where                               | Purpose                                        |
| ----------------------------------- | ----------------------------------- | ---------------------------------------------- |
| **Layered Architecture**            | Entire project                      | Strict separation of concerns                  |
| **API Gateway**                     | The project itself                  | Single entry point for microservices           |
| **Circuit Breaker**                 | `base-http.client.ts`               | Prevent cascading failures                     |
| **Retry + Exponential Backoff**     | `retry.util.ts`                     | Handle transient failures                      |
| **Compensating Transaction (Saga)** | `signup-orchestrator.service.ts`    | Rollback on partial failure                    |
| **Cache-Aside**                     | `user-business.service.ts`          | Reduce database load                           |
| **Dead Letter Queue**               | `rabbitmq.service.ts`               | Handle failed messages                         |
| **Idempotent Consumer**             | `rabbitmq-consumer.service.ts`      | Prevent duplicate processing                   |
| **Decorator Pattern**               | Guards, interceptors, middleware    | Add behavior without modifying controllers     |
| **Strategy Pattern**                | Rate limiting per role              | Different rate limits for different user types |
| **Template Method**                 | `BaseHttpClient` → specific clients | Shared resilience, custom endpoints            |

---

## Level 19 — Security Measures

1. **Helmet** — Sets security headers (X-Frame-Options, CSP, etc.)
2. **CORS** — Enabled (configurable origins)
3. **JWT RS256** — Asymmetric key verification (public key only — gateway can verify but NOT sign tokens)
4. **Input Validation** — Strict DTO validation, whitelist + forbid unknown fields
5. **Rate Limiting** — Per-role throttling to prevent abuse
6. **Non-root Docker user** — Container runs as `appuser`, not root
7. **Environment Validation** — App crashes if required secrets are missing

---

## Level 20 — How to Extend This Project

See `docs/EXTENDING.md` for full details.

### Adding a new downstream service

1. Create a new client in `src/integration/http/` extending `BaseHttpClient`
2. Create a business service in `src/business/services/`
3. Create DTOs in `src/dto/`
4. Create a controller in `src/presentation/controllers/`
5. Register in respective modules

### Adding a new RabbitMQ event

1. Add routing key to `ROUTING_KEYS` in `src/utils/constants.ts`
2. Publish: `this.rabbitmqService.publish(ROUTING_KEYS.NEW_EVENT, payload, traceId)`
3. Consume: register handler in consumer service

### Adding a new guard

1. Create guard implementing `CanActivate` in `src/cross-cutting/guards/`
2. Register globally via `APP_GUARD` in `CrossCuttingModule` or use `@UseGuards()` per-route

---

## Recommended Reading Order

For the most productive learning path, read the files in this order:

| Step | File(s)                             | Why                                 |
| ---- | ----------------------------------- | ----------------------------------- |
| 1    | `docs/ONBOARDING.md`                | Get running, understand the basics  |
| 2    | `docs/ARCHITECTURE.md`              | Understand the big picture          |
| 3    | `src/utils/constants.ts`            | All the shared names/keys           |
| 4    | `src/interfaces/` (all 4 files)     | Data contracts                      |
| 5    | `src/config/` (all 3 files)         | How config works                    |
| 6    | `src/main.ts` → `src/app.module.ts` | Bootstrap flow                      |
| 7    | `src/dto/` (all files)              | Request validation shapes           |
| 8    | `src/cross-cutting/middlewares/`    | Trace ID + metrics                  |
| 9    | `src/cross-cutting/guards/`         | Auth & authorization                |
| 10   | `src/cross-cutting/interceptors/`   | Response wrapping, logging, timeout |
| 11   | `src/cross-cutting/filters/`        | Error handling                      |
| 12   | `src/presentation/controllers/`     | All routes                          |
| 13   | `src/business/services/`            | Business logic                      |
| 14   | `src/integration/http/`             | HTTP clients + resilience           |
| 15   | `src/integration/resilience/`       | Circuit breaker + retry             |
| 16   | `src/integration/cache/`            | Redis caching                       |
| 17   | `src/integration/messaging/`        | RabbitMQ pub/sub                    |
| 18   | `src/telemetry/tracing.ts`          | Distributed tracing                 |
| 19   | `docs/REQUEST-LIFECYCLE.md`         | Full request flow visual            |
| 20   | `docs/EXTENDING.md`                 | How to add new features             |
| 21   | `docs/API-TESTING-GUIDE.md`         | Test every endpoint                 |
| 22   | `test/` (all files)                 | Testing patterns                    |
