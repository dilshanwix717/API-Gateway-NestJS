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

// Groups all routes under the "Auth" section in Swagger UI
@ApiTags('Auth')
// All endpoints in this controller start with /v1/auth
@Controller('v1/auth')
export class AuthController {
  // NestJS injects these services automatically (Dependency Injection)
  constructor(
    private readonly authBusiness: AuthBusinessService,
    private readonly signupOrchestrator: SignupOrchestratorService,
  ) {}

  // POST /v1/auth/signup — no JWT required (@Public)
  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @SwaggerResponse({ status: 201, description: 'User created successfully' })
  @SwaggerResponse({ status: 500, description: 'Signup failed' })
  async signup(@Body() dto: SignupDto, @Headers(TRACE_ID_HEADER) traceId: string) {
    // Delegates to the orchestrator which coordinates user + auth creation
    return this.signupOrchestrator.execute(dto, traceId);
  }

  // POST /v1/auth/login — no JWT required (@Public)
  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @SwaggerResponse({ status: 200, description: 'Login successful' })
  @SwaggerResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Headers(TRACE_ID_HEADER) traceId: string) {
    return this.authBusiness.login(dto.email, dto.password, traceId);
  }

  // POST /v1/auth/validate-token — requires a valid JWT (no @Public)
  @Post('validate-token')
  @ApiOperation({ summary: 'Validate a token (delegated to auth-service)' })
  @SwaggerResponse({ status: 200, description: 'Token is valid' })
  @SwaggerResponse({ status: 401, description: 'Token is invalid' })
  @SwaggerResponse({ status: 403, description: 'Token revoked or user banned' })
  async validateToken(@Body() dto: ValidateTokenDto, @Headers(TRACE_ID_HEADER) traceId: string) {
    // Throws if invalid; if we reach the return, the token is good
    await this.authBusiness.validateToken(dto.token, traceId);
    return { valid: true };
  }

  // POST /v1/auth/refresh-token — swap an expired access token for a new one
  @Public()
  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh an access token' })
  @SwaggerResponse({ status: 200, description: 'Token refreshed' })
  @SwaggerResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto, @Headers(TRACE_ID_HEADER) traceId: string) {
    return this.authBusiness.refreshToken(dto.refresh_token, traceId);
  }

  // POST /v1/auth/logout — requires JWT (no @Public)
  @Post('logout')
  @ApiOperation({ summary: 'Logout and invalidate token' })
  @SwaggerResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Body() body: { refresh_token: string },
    @Headers('authorization') authHeader: string,
    @Headers(TRACE_ID_HEADER) traceId: string,
  ) {
    // Strip the "Bearer " prefix to get the raw access token
    const accessToken = authHeader?.replace('Bearer ', '') ?? '';
    const refreshToken = body?.refresh_token ?? '';
    await this.authBusiness.logout(accessToken, refreshToken, traceId);
    return { message: 'Logged out successfully' };
  }
}
