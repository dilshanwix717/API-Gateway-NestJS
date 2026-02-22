import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseHttpClient } from './base-http.client.js';
import { ServiceResponse } from '../../interfaces/service-response.interface.js';
import { AppConfig } from '../../config/app.config.js';

export interface VideoMeta {
  id: string;
  title: string;
  description: string;
  source_url: string;
  status: string;
  created_at: string;
}

export interface StreamUrl {
  stream_url: string;
  expires_at: string;
}

export interface VideoListResponse {
  videos: VideoMeta[];
  total: number;
}

@Injectable()
export class VideoServiceClient extends BaseHttpClient {
  constructor(httpService: HttpService, configService: ConfigService) {
    const appCfg = configService.get<AppConfig>('app');
    super(httpService, configService, 'VideoServiceClient', appCfg?.services.videoServiceUrl ?? '');
  }

  async listVideos(traceId: string): Promise<ServiceResponse<VideoListResponse>> {
    return this.get<VideoListResponse>('/videos', traceId);
  }

  async uploadVideo(
    data: { title: string; description?: string; source_url: string },
    traceId: string,
  ): Promise<ServiceResponse<VideoMeta>> {
    return this.post<VideoMeta>('/videos/upload', traceId, data);
  }

  async getStreamUrl(id: string, traceId: string): Promise<ServiceResponse<StreamUrl>> {
    return this.get<StreamUrl>(`/videos/${id}/stream-url`, traceId);
  }
}
