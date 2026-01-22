import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserMetrics() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const totalUsers = await this.prisma.user.count();
    const active = await this.prisma.user.count({
      where: { status: 'ACTIVE' },
    });
    const inactive = await this.prisma.user.count({
      where: { status: { not: 'ACTIVE' } }, // or SUSPENDED/BANNED separately
    });
    const loggedInToday = await this.prisma.user.count({
      where: { lastLoginAt: { gte: startOfDay } },
    });

    const lastLogin = await this.prisma.user.findMany({
      select: { id: true, email: true, lastLoginAt: true },
      orderBy: { lastLoginAt: 'desc' },
    });

    return {
      totalUsers,
      active,
      inactive,
      loggedInToday,
      lastLogin,
    };
  }
}
