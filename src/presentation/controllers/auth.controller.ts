import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { Public } from '../../cross-cutting/decorators/public.decorator.js';
import { AuthBusinessService } from '../../business/services/auth-business.service.js';
import { SignupOrchestratorService } from '../../business/services/signup-orchestrator.service.js';
import { SignupDto } from '../../dto/auth/signup.dto.js';
import { LoginDto } from '../../dto/auth/login.dto.js';
import { ValidateTokenDto } from '../../dto/auth/validate-token.dto.js';
import { RefreshTokenDto } from '../../dto/auth/refresh-token.dto.js';
import { TRACE_ID_HEADER } from '../../utils/constants.js';

@ApiTags('Auth')
@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly authBusiness: AuthBusinessService,
    private readonly signupOrchestrator: SignupOrchestratorService,
  ) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @SwaggerResponse({ status: 201, description: 'User created successfully' })
  @SwaggerResponse({ status: 500, description: 'Signup failed' })
  async signup(@Body() dto: SignupDto, @Headers(TRACE_ID_HEADER) traceId: string) {
    return this.signupOrchestrator.execute(dto, traceId);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @SwaggerResponse({ status: 200, description: 'Login successful' })
  @SwaggerResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Headers(TRACE_ID_HEADER) traceId: string) {
    return this.authBusiness.login(dto.email, dto.password, traceId);
  }

  @Post('validate-token')
  @ApiOperation({ summary: 'Validate a token (delegated to auth-service)' })
  @SwaggerResponse({ status: 200, description: 'Token is valid' })
  @SwaggerResponse({ status: 401, description: 'Token is invalid' })
  @SwaggerResponse({ status: 403, description: 'Token revoked or user banned' })
  async validateToken(@Body() dto: ValidateTokenDto, @Headers(TRACE_ID_HEADER) traceId: string) {
    await this.authBusiness.validateToken(dto.token, traceId);
    return { valid: true };
  }

  @Public()
  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh an access token' })
  @SwaggerResponse({ status: 200, description: 'Token refreshed' })
  @SwaggerResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto, @Headers(TRACE_ID_HEADER) traceId: string) {
    return this.authBusiness.refreshToken(dto.refresh_token, traceId);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and invalidate token' })
  @SwaggerResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Headers('authorization') authHeader: string,
    @Headers(TRACE_ID_HEADER) traceId: string,
  ) {
    const token = authHeader?.replace('Bearer ', '') ?? '';
    await this.authBusiness.logout(token, traceId);
    return { message: 'Logged out successfully' };
  }
}
