import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    adminId: string;
    actionType: string;
    targetUserId?: string;
    metadata?: Record<string, any>;
  }) {
    await this.prisma.adminAuditLog.create({
      data: {
        adminId: params.adminId,
        actionType: params.actionType,
        targetUserId: params.targetUserId,
        metadata: params.metadata,
      },
    });
  }
}
