# Onboarding Guide

Welcome! This guide will get you up and running with the API Gateway.

## Prerequisites

- **Node.js** 20+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- **npm** 10+
- **Docker** & **Docker Compose** (for RabbitMQ, Redis, Jaeger)

## Quick Start

### 1. Clone and Install

```bash
cd api-gateway
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set your values. For local development, the defaults work with docker-compose.

**Important**: You need an RS256 public key for JWT validation. Generate a test keypair:

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -outform PEM -pubout -out public.pem
```

Copy the content of `public.pem` into the `JWT_PUBLIC_KEY` env var (replace newlines with `\n`).

### 3. Start Infrastructure

```bash
docker compose up -d rabbitmq redis jaeger
```

This starts:
- **RabbitMQ**: localhost:5672 (management UI: localhost:15672, guest/guest)
- **Redis**: localhost:6379
- **Jaeger**: localhost:16686 (UI), localhost:14268 (collector)

### 4. Run the Gateway

```bash
# Development (watch mode)
npm run start:dev

# Production build
npm run build && npm run start:prod
```

The gateway runs on `http://localhost:3000`.

### 5. Verify

```bash
curl http://localhost:3000/health/live
# → { "status": "ok", ... }

# Swagger UI
open http://localhost:3000/api-docs
```

## Project Structure

```
src/
├── config/          # Environment config with validation
├── presentation/    # Controllers (HTTP layer only)
├── business/        # Business logic, orchestration
├── integration/     # HTTP clients, RabbitMQ, Redis
├── cross-cutting/   # Guards, interceptors, filters, middleware
├── dto/             # Request validation objects
├── interfaces/      # TypeScript interfaces
├── telemetry/       # OpenTelemetry setup
└── utils/           # Constants, helpers
```

## Key Concepts

1. **Controllers** never contain business logic — they delegate to business services.
2. **Business services** never make HTTP calls directly — they use integration clients.
3. **Integration clients** handle circuit breakers, retries, and trace ID propagation automatically.
4. **All routes** require JWT authentication unless marked with `@Public()`.

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start in watch mode |
| `npm run build` | TypeScript build |
| `npm run test` | Run unit + integration tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |

## Useful URLs (Local)

| Service | URL |
|---------|-----|
| API Gateway | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api-docs |
| Prometheus Metrics | http://localhost:3000/metrics |
| RabbitMQ Management | http://localhost:15672 |
| Jaeger UI | http://localhost:16686 |
