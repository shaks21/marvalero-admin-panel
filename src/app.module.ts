import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { AdminModule } from './admin/admin.module.js';
import { AuditModule } from './audit/audit.module.js';
import { PrismaService } from "./prisma/prisma.service.js";
import { AdminService } from './admin/admin.service.js';  
import { TestModule } from './test/test.module.js';
import { StripeModule } from './stripe/stripe.module.js'; 

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    StripeModule,
    AuthModule,
    AdminModule,
    AuditModule,
    TestModule,
  ],
  controllers: [AppController],
  providers: [PrismaService, AdminService],
  exports: [PrismaService],
})
export class AppModule {}
