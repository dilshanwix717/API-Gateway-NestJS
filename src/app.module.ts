import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule } from './config/config.module.js';
import { CrossCuttingModule } from './cross-cutting/cross-cutting.module.js';
import { PresentationModule } from './presentation/presentation.module.js';
import { TraceIdMiddleware } from './cross-cutting/middlewares/trace-id.middleware.js';
import { PrometheusMiddleware } from './cross-cutting/middlewares/prometheus.middleware.js';

@Module({
  imports: [
    // Global configuration (env validation + typed config)
    AppConfigModule,

    // Structured logging with Pino
    LoggerModule.forRoot({
      pinoHttp: {
        // Pretty logs in development, raw JSON in production
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,

        // Disable automatic request logging (handled manually if needed)
        autoLogging: false,
      },
    }),

    // Cross-cutting concerns (metrics, tracing, filters, etc.)
    CrossCuttingModule,

    // Controllers / HTTP layer
    PresentationModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      // Attach trace ID + Prometheus metrics to all routes
      .apply(TraceIdMiddleware, PrometheusMiddleware)
      .forRoutes('*');
  }
}
