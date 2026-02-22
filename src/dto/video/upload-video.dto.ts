import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadVideoDto {
  @ApiProperty({ example: 'My Awesome Video' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'A description of the video content' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 'https://storage.example.com/videos/raw/video.mp4' })
  @IsString()
  @IsNotEmpty()
  source_url!: string;
}
