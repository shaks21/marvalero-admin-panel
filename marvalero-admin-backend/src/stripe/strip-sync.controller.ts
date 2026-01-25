// src/admin/business/sync.controller.ts
import { Controller, Post, UseGuards, Query } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { StripeSyncService } from './stripe-sync.service.js';

@UseGuards(AdminGuard)
@Controller('admin/sync')
export class StripeSyncController {
  constructor(private readonly stripeSyncService: StripeSyncService) {}

  @Post('stripe/transactions')
  async syncStripeTransactions(
    @Query('days') days = 30,
    @Query('force') force = false,
  ) {
    return this.stripeSyncService.syncRecentTransactions(days, force === true);
  }

  @Post('stripe/fix-stale')
  async fixStaleTransactions(@Query('hours') hours = 24) {
    return this.stripeSyncService.fixStaleTransactions(hours);
  }
}