import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseHttpClient } from './base-http.client.js';
import { ServiceResponse } from '../../interfaces/service-response.interface.js';
import { AppConfig } from '../../config/app.config.js';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  status: string;
}

@Injectable()
export class UserServiceClient extends BaseHttpClient {
  constructor(httpService: HttpService, configService: ConfigService) {
    const appCfg = configService.get<AppConfig>('app');
    super(httpService, configService, 'UserServiceClient', appCfg?.services.userServiceUrl ?? '');
  }

  async createProfile(
    data: {
      user_id: string;
      email: string;
      first_name: string;
      last_name: string;
      phone: string;
      address: string;
      status: string;
    },
    traceId: string,
  ): Promise<ServiceResponse<UserProfile>> {
    return this.post<UserProfile>('/users', traceId, data);
  }

  async getUserById(id: string, traceId: string): Promise<ServiceResponse<UserProfile>> {
    return this.get<UserProfile>(`/users/${id}`, traceId);
  }

  async updateUser(
    id: string,
    data: Partial<UserProfile>,
    traceId: string,
  ): Promise<ServiceResponse<UserProfile>> {
    return this.put<UserProfile>(`/users/${id}`, traceId, data);
  }

  async deleteUser(id: string, traceId: string): Promise<ServiceResponse<null>> {
    return this.delete<null>(`/users/${id}`, traceId);
  }
}
