import { Controller, Get, Post, Param, Body, Headers } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse as SwaggerResponse,
} from '@nestjs/swagger';
import { Roles } from '../../cross-cutting/decorators/roles.decorator.js';
import { VideoBusinessService } from '../../business/services/video-business.service.js';
import { UploadVideoDto } from '../../dto/video/upload-video.dto.js';
import { TRACE_ID_HEADER, ROLES } from '../../utils/constants.js';

@ApiTags('Videos')
@ApiBearerAuth()
@Controller('v1/videos')
export class VideoController {
  constructor(private readonly videoBusiness: VideoBusinessService) {}

  @Get()
  @ApiOperation({ summary: 'List all videos' })
  @SwaggerResponse({ status: 200, description: 'Video list retrieved' })
  async listVideos(@Headers(TRACE_ID_HEADER) traceId: string) {
    return this.videoBusiness.listVideos(traceId);
  }

  @Post('upload')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Upload a new video (admin only)' })
  @SwaggerResponse({ status: 201, description: 'Video uploaded' })
  @SwaggerResponse({ status: 403, description: 'Admin access required' })
  async uploadVideo(@Body() dto: UploadVideoDto, @Headers(TRACE_ID_HEADER) traceId: string) {
    return this.videoBusiness.uploadVideo(dto, traceId);
  }

  @Get(':id/stream-url')
  @ApiOperation({ summary: 'Get video stream URL' })
  @SwaggerResponse({ status: 200, description: 'Stream URL retrieved' })
  @SwaggerResponse({ status: 404, description: 'Video not found' })
  async getStreamUrl(@Param('id') id: string, @Headers(TRACE_ID_HEADER) traceId: string) {
    return this.videoBusiness.getStreamUrl(id, traceId);
  }
}
