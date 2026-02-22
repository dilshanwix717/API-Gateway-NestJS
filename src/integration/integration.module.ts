import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthServiceClient } from './http/auth-service.client.js';
import { UserServiceClient } from './http/user-service.client.js';
import { VideoServiceClient } from './http/video-service.client.js';
import { MessagingModule } from './messaging/messaging.module.js';
import { CacheModule } from './cache/cache.module.js';

@Module({
  imports: [HttpModule, MessagingModule, CacheModule],
  providers: [AuthServiceClient, UserServiceClient, VideoServiceClient],
  exports: [AuthServiceClient, UserServiceClient, VideoServiceClient, MessagingModule, CacheModule],
})
export class IntegrationModule {}
