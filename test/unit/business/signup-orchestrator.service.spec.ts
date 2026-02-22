import { InternalServerErrorException } from '@nestjs/common';
import { SignupOrchestratorService } from '../../../src/business/services/signup-orchestrator.service.js';
import { mockAuthServiceClient, resetAuthServiceMock } from '../../mocks/auth-service.mock.js';
import { mockUserServiceClient, resetUserServiceMock } from '../../mocks/user-service.mock.js';
import { mockRabbitMQService, resetRabbitMQMock } from '../../mocks/rabbitmq.mock.js';

describe('SignupOrchestratorService', () => {
  let service: SignupOrchestratorService;

  const signupInput = {
    email: 'test@test.com',
    password: 'Password123!',
    first_name: 'John',
    last_name: 'Doe',
    phone: '+1234567890',
    address: '123 Main St',
  };
  const traceId = 'trace-123';

  beforeEach(() => {
    resetAuthServiceMock();
    resetUserServiceMock();
    resetRabbitMQMock();

    service = new SignupOrchestratorService(
      mockAuthServiceClient as never,
      mockUserServiceClient as never,
      mockRabbitMQService as never,
    );
  });

  it('should complete signup successfully', async () => {
    mockAuthServiceClient.signup.mockResolvedValue({
      success: true,
      message: 'Created',
      data: { user_id: 'uuid-1', token: 'jwt-token' },
      statusCode: 201,
    });

    mockUserServiceClient.createProfile.mockResolvedValue({
      success: true,
      message: 'Created',
      data: {
        id: 'uuid-1',
        email: 'test@test.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890',
        address: '123 Main St',
        status: 'active',
      },
      statusCode: 201,
    });

    const result = await service.execute(signupInput, traceId);

    expect(result.user_id).toBe('uuid-1');
    expect(result.token).toBe('jwt-token');
    expect(mockRabbitMQService.publish).toHaveBeenCalledWith(
      'user.created',
      expect.objectContaining({ user_id: 'uuid-1' }),
      traceId,
    );
  });

  it('should throw when auth-service fails', async () => {
    mockAuthServiceClient.signup.mockResolvedValue({
      success: false,
      message: 'Email already exists',
      data: null,
      statusCode: 409,
    });

    await expect(service.execute(signupInput, traceId)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(mockUserServiceClient.createProfile).not.toHaveBeenCalled();
  });

  it('should rollback when user-service fails', async () => {
    mockAuthServiceClient.signup.mockResolvedValue({
      success: true,
      message: 'Created',
      data: { user_id: 'uuid-1', token: 'jwt-token' },
      statusCode: 201,
    });

    mockUserServiceClient.createProfile.mockResolvedValue({
      success: false,
      message: 'Profile creation failed',
      data: null,
      statusCode: 500,
    });

    mockAuthServiceClient.deleteUser.mockResolvedValue({
      success: true,
      message: 'Deleted',
      data: null,
      statusCode: 200,
    });

    await expect(service.execute(signupInput, traceId)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(mockAuthServiceClient.deleteUser).toHaveBeenCalledWith('uuid-1', traceId);
  });
});
