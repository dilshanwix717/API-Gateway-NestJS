import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import {
  AuthServiceClient,
  AuthSignupResponse,
} from '../../integration/http/auth-service.client.js';
import { UserServiceClient } from '../../integration/http/user-service.client.js';
import { RabbitMQService } from '../../integration/messaging/rabbitmq.service.js';
import { ROUTING_KEYS } from '../../utils/constants.js';

export interface SignupResult {
  user_id: string;
  token: string;
}

export interface SignupInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
}

@Injectable()
export class SignupOrchestratorService {
  private readonly logger = new Logger(SignupOrchestratorService.name);

  constructor(
    private readonly authClient: AuthServiceClient,
    private readonly userClient: UserServiceClient,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async execute(input: SignupInput, traceId: string): Promise<SignupResult> {
    // Step 1: Create auth record
    const authResponse = await this.authClient.signup(
      { email: input.email, password: input.password },
      traceId,
    );

    if (!authResponse.success || !authResponse.data) {
      throw new InternalServerErrorException(
        authResponse.message || 'Failed to create authentication record',
      );
    }

    const authData: AuthSignupResponse = authResponse.data;

    // Step 2: Create user profile
    const profileResponse = await this.userClient.createProfile(
      {
        user_id: authData.user_id,
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone,
        address: input.address,
        status: 'active',
      },
      traceId,
    );

    if (!profileResponse.success) {
      // Compensating transaction: rollback auth record
      this.logger.warn(
        `User profile creation failed, rolling back auth record for user ${authData.user_id}`,
      );

      const rollbackResponse = await this.authClient.deleteUser(authData.user_id, traceId);
      if (!rollbackResponse.success) {
        this.logger.error(
          `CRITICAL: Rollback failed for user ${authData.user_id}. Orphan record may exist.`,
        );
      }

      throw new InternalServerErrorException(
        profileResponse.message || 'Failed to create user profile',
      );
    }

    // Step 3: Publish domain event
    this.rabbitMQService.publish(
      ROUTING_KEYS.USER_CREATED,
      {
        user_id: authData.user_id,
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
      },
      traceId,
    );

    return {
      user_id: authData.user_id,
      token: authData.token,
    };
  }
}
