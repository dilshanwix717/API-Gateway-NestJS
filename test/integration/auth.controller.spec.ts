import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/presentation/controllers/auth.controller.js';
import { AuthBusinessService } from '../../src/business/services/auth-business.service.js';
import { SignupOrchestratorService } from '../../src/business/services/signup-orchestrator.service.js';

describe('AuthController (Integration)', () => {
  let controller: AuthController;

  const mockAuthBusiness = {
    login: jest.fn(),
    validateToken: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  };

  const mockSignupOrchestrator = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthBusinessService, useValue: mockAuthBusiness },
        { provide: SignupOrchestratorService, useValue: mockSignupOrchestrator },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call signup orchestrator', async () => {
    mockSignupOrchestrator.execute.mockResolvedValue({
      user_id: 'uuid-1',
      token: 'jwt-token',
    });

    const dto = {
      email: 'test@test.com',
      password: 'Password123!',
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1234567890',
      address: '123 Main St',
    };

    const result = await controller.signup(dto, 'trace-123');
    expect(result).toEqual({ user_id: 'uuid-1', token: 'jwt-token' });
    expect(mockSignupOrchestrator.execute).toHaveBeenCalledWith(dto, 'trace-123');
  });

  it('should call login', async () => {
    mockAuthBusiness.login.mockResolvedValue({
      token: 'jwt-token',
      refresh_token: 'refresh-token',
    });

    const result = await controller.login(
      { email: 'test@test.com', password: 'Password123!' },
      'trace-123',
    );
    expect(result.token).toBe('jwt-token');
  });
});
