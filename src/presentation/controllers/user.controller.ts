import { Controller, Get, Put, Delete, Param, Body, Headers, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse as SwaggerResponse,
} from '@nestjs/swagger';
import { Roles } from '../../cross-cutting/decorators/roles.decorator.js';
import { SelfOrAdminGuard } from '../../cross-cutting/guards/self-or-admin.guard.js';
import { UserBusinessService } from '../../business/services/user-business.service.js';
import { UpdateUserDto } from '../../dto/user/update-user.dto.js';
import { TRACE_ID_HEADER, ROLES } from '../../utils/constants.js';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('v1/users')
export class UserController {
  constructor(private readonly userBusiness: UserBusinessService) {}

  @Get(':id')
  @Roles(ROLES.ADMIN, ROLES.USER)
  @UseGuards(SelfOrAdminGuard)
  @ApiOperation({ summary: 'Get user profile by ID' })
  @SwaggerResponse({ status: 200, description: 'User profile found' })
  @SwaggerResponse({ status: 403, description: 'Access denied' })
  @SwaggerResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string, @Headers(TRACE_ID_HEADER) traceId: string) {
    return this.userBusiness.getUserById(id, traceId);
  }

  @Put(':id')
  @Roles(ROLES.ADMIN, ROLES.USER)
  @UseGuards(SelfOrAdminGuard)
  @ApiOperation({ summary: 'Update user profile' })
  @SwaggerResponse({ status: 200, description: 'User updated' })
  @SwaggerResponse({ status: 403, description: 'Access denied' })
  @SwaggerResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Headers(TRACE_ID_HEADER) traceId: string,
  ) {
    return this.userBusiness.updateUser(id, dto, traceId);
  }

  @Delete(':id')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Delete a user (admin only)' })
  @SwaggerResponse({ status: 200, description: 'User deleted' })
  @SwaggerResponse({ status: 403, description: 'Admin access required' })
  async deleteUser(@Param('id') id: string, @Headers(TRACE_ID_HEADER) traceId: string) {
    await this.userBusiness.deleteUser(id, traceId);
    return { message: 'User deleted successfully' };
  }
}
