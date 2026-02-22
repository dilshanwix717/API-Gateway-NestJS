import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserServiceClient, UserProfile } from '../../integration/http/user-service.client.js';
import { RedisService } from '../../integration/cache/redis.service.js';
import { CACHE_KEYS } from '../../utils/constants.js';
import { AppConfig } from '../../config/app.config.js';

@Injectable()
export class UserBusinessService {
  private readonly logger = new Logger(UserBusinessService.name);
  private readonly cacheTtl: number;

  constructor(
    private readonly userClient: UserServiceClient,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    const appCfg = this.configService.get<AppConfig>('app');
    this.cacheTtl = appCfg?.cacheTtlSeconds ?? 300;
  }

  async getUserById(id: string, traceId: string): Promise<UserProfile> {
    // Check cache first
    const cacheKey = CACHE_KEYS.USER_PROFILE(id);
    const cached = await this.redisService.get<UserProfile>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for user ${id}`);
      return cached;
    }

    const response = await this.userClient.getUserById(id, traceId);

    if (!response.success || !response.data) {
      throw new NotFoundException(response.message || 'User not found');
    }

    // Cache the result
    await this.redisService.set(cacheKey, response.data, this.cacheTtl);
    return response.data;
  }

  async updateUser(id: string, data: Partial<UserProfile>, traceId: string): Promise<UserProfile> {
    const response = await this.userClient.updateUser(id, data, traceId);

    if (!response.success || !response.data) {
      throw new NotFoundException(response.message || 'User not found');
    }

    // Invalidate cache
    await this.redisService.del(CACHE_KEYS.USER_PROFILE(id));
    return response.data;
  }

  async deleteUser(id: string, traceId: string): Promise<void> {
    const response = await this.userClient.deleteUser(id, traceId);

    if (!response.success) {
      throw new NotFoundException(response.message || 'User not found');
    }

    // Invalidate cache
    await this.redisService.del(CACHE_KEYS.USER_PROFILE(id));
  }
}
