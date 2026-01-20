//admin.controller.ts
import { Controller, UseGuards, Get, Post, Body, Param, NotFoundException, Req, Query } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { AdminService } from './admin.service.js';
import { Admin as AdminModel } from '../generated/prisma/client.js';
import { AdminUserSearchDto } from './dto/admin-user-search.dto.js';

@UseGuards(AdminGuard) // Apply guard globally to this controller
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('ping')
  ping(@Req() req: any) {
    console.log('Controller reached', req.user);
    return { message: 'Admin authenticated', adminId: req.user.adminId };
  }

  @Get('dashboard')
  getDashboard() {
    return { message: 'Admin dashboard' };
  }

  @Get(':id')
  async getAdminById(@Param('id') id: string): Promise<AdminModel> {
    const admin = await this.adminService.admin({ id });
    if (!admin) throw new NotFoundException('Admin not found');
    return admin;
  }

  @Get('users/search')
  searchUsers(@Query() query: AdminUserSearchDto) {
    return this.adminService.searchUsers(query);
  }

  // @Post()
  // async signupAdmin(
  //   @Body() adminData: { email: string; password: string },
  // ): Promise<AdminModel> {
  //   const passwordHash = adminData.password; // Replace with bcrypt in production
  //   return this.adminService.createAdmin({
  //     email: adminData.email,
  //     passwordHash,
  //   });
  // }
}
