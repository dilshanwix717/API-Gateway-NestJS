import { ServiceResponse } from '../../src/interfaces/service-response.interface.js';
import {
  VideoMeta,
  StreamUrl,
  VideoListResponse,
} from '../../src/integration/http/video-service.client.js';

export const mockVideoServiceClient = {
  listVideos: jest.fn<Promise<ServiceResponse<VideoListResponse>>, []>(),
  uploadVideo: jest.fn<Promise<ServiceResponse<VideoMeta>>, []>(),
  getStreamUrl: jest.fn<Promise<ServiceResponse<StreamUrl>>, []>(),
};

export function resetVideoServiceMock(): void {
  Object.values(mockVideoServiceClient).forEach((fn) => fn.mockReset());
}
