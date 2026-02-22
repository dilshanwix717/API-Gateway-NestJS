import { ServiceResponse } from '../../src/interfaces/service-response.interface.js';
import { UserProfile } from '../../src/integration/http/user-service.client.js';

export const mockUserServiceClient = {
  createProfile: jest.fn<Promise<ServiceResponse<UserProfile>>, []>(),
  getUserById: jest.fn<Promise<ServiceResponse<UserProfile>>, []>(),
  updateUser: jest.fn<Promise<ServiceResponse<UserProfile>>, []>(),
  deleteUser: jest.fn<Promise<ServiceResponse<null>>, []>(),
};

export function resetUserServiceMock(): void {
  Object.values(mockUserServiceClient).forEach((fn) => fn.mockReset());
}
