import { Module } from '@nestjs/common';
import { IntegrationModule } from '../integration/integration.module.js';
import { AuthBusinessService } from './services/auth-business.service.js';
import { SignupOrchestratorService } from './services/signup-orchestrator.service.js';
import { UserBusinessService } from './services/user-business.service.js';
import { VideoBusinessService } from './services/video-business.service.js';

@Module({
  imports: [IntegrationModule],
  providers: [
    AuthBusinessService,
    SignupOrchestratorService,
    UserBusinessService,
    VideoBusinessService,
  ],
  exports: [
    AuthBusinessService,
    SignupOrchestratorService,
    UserBusinessService,
    VideoBusinessService,
  ],
})
export class BusinessModule {}
