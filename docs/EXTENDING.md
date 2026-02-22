# Extending the API Gateway

This guide explains how to safely add new features to the gateway.

## Adding a New Downstream Service

### 1. Create the Integration Client

```
src/integration/http/notification-service.client.ts
```

```typescript
@Injectable()
export class NotificationServiceClient extends BaseHttpClient {
  constructor(httpService: HttpService, configService: ConfigService) {
    const appCfg = configService.get<AppConfig>('app');
    super(httpService, configService, 'NotificationServiceClient', appCfg?.services.notificationServiceUrl ?? '');
  }

  async sendEmail(data: SendEmailPayload, traceId: string): Promise<ServiceResponse<void>> {
    return this.post<void>('/notifications/email', traceId, data);
  }
}
```

### 2. Register in Integration Module

Add the client to `src/integration/integration.module.ts`:
- Add to `providers` array
- Add to `exports` array

### 3. Add Environment Variable

- Add `NOTIFICATION_SERVICE_URL` to `.env.example`
- Add to `config.schema.ts` validation
- Add to `app.config.ts` typed config

### 4. Create Business Service

```
src/business/services/notification-business.service.ts
```

Inject the integration client. Add business rules here.

### 5. Create Controller

```
src/presentation/controllers/notification.controller.ts
```

Inject the business service. Add routes with Swagger decorators.

---

## Adding a New Route to an Existing Controller

1. Add the method to the **controller** with proper decorators (`@Roles`, `@Public`, Swagger)
2. Add the business logic to the corresponding **business service**
3. If it calls a downstream service, add the method to the **integration client**
4. Create a **DTO** if the route accepts a request body
5. Add tests

---

## Adding a New RabbitMQ Event

### Publishing

Call `rabbitMQService.publish()` from a business service:

```typescript
await this.rabbitMQService.publish('notification.sent', { userId, type: 'email' }, traceId);
```

Add the routing key to `src/utils/constants.ts` under `ROUTING_KEYS`.

### Consuming

Register a handler in `RabbitMQConsumerService`:

```typescript
this.consumerService.registerHandler('notification.sent', async (event) => {
  // Handle the event
});
```

---

## Adding a New Guard

1. Create the guard in `src/cross-cutting/guards/`
2. Apply it to specific routes with `@UseGuards()` or register globally in `cross-cutting.module.ts`

---

## Adding Redis Caching to a Route

1. In the business service, use `RedisService`:

```typescript
const cached = await this.redisService.get<MyType>(cacheKey);
if (cached) return cached;

const data = await this.someClient.getData(id, traceId);
await this.redisService.set(cacheKey, data, ttlSeconds);
return data;
```

2. Invalidate cache on mutations:

```typescript
await this.redisService.del(cacheKey);
```

3. Add cache key patterns to `CACHE_KEYS` in constants.

---

## Checklist for Any Change

- [ ] Does the change respect layer boundaries?
- [ ] Are DTOs validated with class-validator?
- [ ] Is the trace ID propagated?
- [ ] Are error cases handled with appropriate HTTP status codes?
- [ ] Is the Swagger documentation updated?
- [ ] Are unit tests written?
- [ ] Does `npm run lint && npm run build && npm run test` pass?
