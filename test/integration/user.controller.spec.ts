import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../../src/presentation/controllers/user.controller.js';
import { UserBusinessService } from '../../src/business/services/user-business.service.js';

describe('UserController (Integration)', () => {
  let controller: UserController;

  const mockUserBusiness = {
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserBusinessService, useValue: mockUserBusiness }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get user by id', async () => {
    const mockUser = {
      id: 'uuid-1',
      email: 'test@test.com',
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1234567890',
      address: '123 Main St',
      status: 'active',
    };
    mockUserBusiness.getUserById.mockResolvedValue(mockUser);

    const result = await controller.getUserById('uuid-1', 'trace-123');
    expect(result).toEqual(mockUser);
  });

  it('should update user', async () => {
    const updated = {
      id: 'uuid-1',
      email: 'test@test.com',
      first_name: 'Jane',
      last_name: 'Doe',
      phone: '+1234567890',
      address: '123 Main St',
      status: 'active',
    };
    mockUserBusiness.updateUser.mockResolvedValue(updated);

    const result = await controller.updateUser('uuid-1', { first_name: 'Jane' }, 'trace-123');
    expect(result.first_name).toBe('Jane');
  });
});
