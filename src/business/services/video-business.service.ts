import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  VideoServiceClient,
  VideoMeta,
  StreamUrl,
  VideoListResponse,
} from '../../integration/http/video-service.client.js';

@Injectable()
export class VideoBusinessService {
  private readonly logger = new Logger(VideoBusinessService.name);

  constructor(private readonly videoClient: VideoServiceClient) {}

  async listVideos(traceId: string): Promise<VideoListResponse> {
    const response = await this.videoClient.listVideos(traceId);

    if (!response.success || !response.data) {
      this.logger.warn('Failed to fetch video list');
      return { videos: [], total: 0 };
    }

    return response.data;
  }

  async uploadVideo(
    data: { title: string; description?: string; source_url: string },
    traceId: string,
  ): Promise<VideoMeta> {
    const response = await this.videoClient.uploadVideo(data, traceId);

    if (!response.success || !response.data) {
      throw new NotFoundException(response.message || 'Failed to upload video');
    }

    return response.data;
  }

  async getStreamUrl(id: string, traceId: string): Promise<StreamUrl> {
    const response = await this.videoClient.getStreamUrl(id, traceId);

    if (!response.success || !response.data) {
      throw new NotFoundException(response.message || 'Video not found');
    }

    return response.data;
  }
}
