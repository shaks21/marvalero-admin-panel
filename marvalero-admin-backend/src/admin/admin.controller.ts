//admin.controller.ts
import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  Req,
  Query,
  Patch,
} from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { AdminService } from './admin.service.js';
import { Admin as AdminModel } from '../generated/prisma/client.js';
import { AdminUserSearchDto } from './dto/admin-user-search.dto.js';
import {
  ChangeEmailDto,
  ChangePhoneDto,
  ChangeStatusDto,
} from './dto/admin-user-actions.dto.js';

@UseGuards(AdminGuard) // Apply guard globally to this controller
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('ping')
  ping(@Req() req: any) {
    return { message: 'Admin authenticated', adminId: req.user.adminId };
  }

  @Get('dashboard')
  getDashboard() {
    return { message: 'Admin dashboard' };
  }

  // Admin routes
  @Get(':id')
  async getAdminById(@Param('id') id: string): Promise<AdminModel> {
    const admin = await this.adminService.admin({ id });
    if (!admin) throw new NotFoundException('Admin not found');
    return admin;
  }

  // ✅ User search - BEFORE :userId route
  @Get('users/search')
  searchUsers(@Query() query: AdminUserSearchDto) {
    return this.adminService.searchUsers(query);
  }

  // ✅ User detail - AFTER search route
  @Get('users/:userId')
  async getUserById(@Param('userId') userId: string) {
    return this.adminService.getUserById(userId);
  }

  // User action routes
  @Post('users/:userId/reset-password')
  resetPassword(@Param('userId') userId: string, @Req() req) {
    return this.adminService.forcePasswordReset(userId, req.user.adminId);
  }

  @Patch('users/:userId/email')
  changeEmail(
    @Param('userId') userId: string,
    @Body() dto: ChangeEmailDto,
    @Req() req,
  ) {
    return this.adminService.changeEmail(userId, dto.email, req.user.adminId);
  }

  @Patch('users/:userId/phone')
  changePhone(
    @Param('userId') userId: string,
    @Body() dto: ChangePhoneDto,
    @Req() req,
  ) {
    return this.adminService.changePhone(userId, dto.phone, req.user.adminId);
  }

  @Patch('users/:userId/status')
  changeStatus(
    @Param('userId') userId: string,
    @Body() dto: ChangeStatusDto,
    @Req() req,
  ) {
    return this.adminService.changeStatus(userId, dto.status, req.user.adminId);
  }
}
