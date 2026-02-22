import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './app.config.js';
import { configValidationSchema } from './config.schema.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      // Make config available globally (no need to re-import)
      isGlobal: true,

      // Load typed configuration factory
      load: [appConfig],

      // Validate environment variables at startup
      validationSchema: configValidationSchema,

      validationOptions: {
        // Stop immediately if a required env variable is invalid
        abortEarly: true,

        // Allow extra env variables that are not in schema
        allowUnknown: true,
      },
    }),
  ],
})
export class AppConfigModule {}
