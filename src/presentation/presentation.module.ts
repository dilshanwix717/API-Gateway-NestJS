import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TerminusModule } from '@nestjs/terminus';
import { BusinessModule } from '../business/business.module.js';
import { AuthController } from './controllers/auth.controller.js';
import { UserController } from './controllers/user.controller.js';
import { VideoController } from './controllers/video.controller.js';
import { HealthController } from './controllers/health.controller.js';
import { MetricsController } from './controllers/metrics.controller.js';

@Module({
  imports: [BusinessModule, TerminusModule, HttpModule],
  controllers: [
    AuthController,
    UserController,
    VideoController,
    HealthController,
    MetricsController,
  ],
})
export class PresentationModule {}
