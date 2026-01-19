import { Module } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
// import { APP_GUARD } from '@nestjs/core';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  providers: [
    // {
    //   provide: APP_GUARD,
    //   useClass: AdminGuard,
    // },
    AdminService, 
    PrismaService
  ],
  controllers: [AdminController],
})
export class AdminModule {}
