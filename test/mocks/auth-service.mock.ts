import { ServiceResponse } from '../../src/interfaces/service-response.interface.js';
import {
  AuthSignupResponse,
  AuthLoginResponse,
  AuthValidateResponse,
  AuthRefreshResponse,
} from '../../src/integration/http/auth-service.client.js';

export const mockAuthServiceClient = {
  signup: jest.fn<Promise<ServiceResponse<AuthSignupResponse>>, []>(),
  login: jest.fn<Promise<ServiceResponse<AuthLoginResponse>>, []>(),
  validateToken: jest.fn<Promise<ServiceResponse<AuthValidateResponse>>, []>(),
  refreshToken: jest.fn<Promise<ServiceResponse<AuthRefreshResponse>>, []>(),
  logout: jest.fn<Promise<ServiceResponse<null>>, []>(),
  deleteUser: jest.fn<Promise<ServiceResponse<null>>, []>(),
};

export function resetAuthServiceMock(): void {
  Object.values(mockAuthServiceClient).forEach((fn) => fn.mockReset());
}
