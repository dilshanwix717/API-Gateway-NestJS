import { Test, TestingModule } from '@nestjs/testing';
import { VideoController } from '../../src/presentation/controllers/video.controller.js';
import { VideoBusinessService } from '../../src/business/services/video-business.service.js';

describe('VideoController (Integration)', () => {
  let controller: VideoController;

  const mockVideoBusiness = {
    listVideos: jest.fn(),
    uploadVideo: jest.fn(),
    getStreamUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoController],
      providers: [{ provide: VideoBusinessService, useValue: mockVideoBusiness }],
    }).compile();

    controller = module.get<VideoController>(VideoController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should list videos', async () => {
    mockVideoBusiness.listVideos.mockResolvedValue({ videos: [], total: 0 });
    const result = await controller.listVideos('trace-123');
    expect(result).toEqual({ videos: [], total: 0 });
  });

  it('should upload video', async () => {
    const mockVideo = {
      id: 'vid-1',
      title: 'Test Video',
      description: 'desc',
      source_url: 'https://example.com/video.mp4',
      status: 'processing',
      created_at: '2026-01-01',
    };
    mockVideoBusiness.uploadVideo.mockResolvedValue(mockVideo);

    const result = await controller.uploadVideo(
      { title: 'Test Video', source_url: 'https://example.com/video.mp4' },
      'trace-123',
    );
    expect(result.id).toBe('vid-1');
  });

  it('should get stream url', async () => {
    mockVideoBusiness.getStreamUrl.mockResolvedValue({
      stream_url: 'https://cdn.example.com/stream/vid-1',
      expires_at: '2026-01-01T01:00:00Z',
    });

    const result = await controller.getStreamUrl('vid-1', 'trace-123');
    expect(result.stream_url).toContain('vid-1');
  });
});
