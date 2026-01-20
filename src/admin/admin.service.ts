// src/admin/admin.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Admin, Prisma } from '../generated/prisma/client.js';
import { AdminUserSearchDto } from './dto/admin-user-search.dto.js';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async admin(
    adminWhereUniqueInput: Prisma.AdminWhereUniqueInput,
  ): Promise<Admin | null> {
    return this.prisma.admin.findUnique({
      where: adminWhereUniqueInput,
    });
  }

  async admins(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.AdminWhereUniqueInput;
    where?: Prisma.AdminWhereInput;
    orderBy?: Prisma.AdminOrderByWithRelationInput;
  }): Promise<Admin[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.admin.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createAdmin(data: Prisma.AdminCreateInput): Promise<Admin> {
    return this.prisma.admin.create({
      data,
    });
  }

  async updateAdmin(params: {
    where: Prisma.AdminWhereUniqueInput;
    data: Prisma.AdminUpdateInput;
  }): Promise<Admin> {
    const { where, data } = params;
    return this.prisma.admin.update({
      data,
      where,
    });
  }

  async deleteAdmin(where: Prisma.AdminWhereUniqueInput): Promise<Admin> {
    return this.prisma.admin.delete({
      where,
    });
  }

  async searchUsers(dto: AdminUserSearchDto) {
    const { q, type } = dto;

    const page = dto.page ? Number(dto.page) : 1;
    const limit = dto.limit ? Number(dto.limit) : 10;
    const skip = (page - 1) * limit;

    const where: any = {
      AND: [],
    };

    if (q) {
      where.AND.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          {
            business: {
              name: { contains: q, mode: 'insensitive' },
            },
          },
        ],
      });
    }

    if (type) {
      where.AND.push({
        userType: type,
      });
    }

    if (!where.AND.length) {
      delete where.AND;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          userType: true,
          status: true,
          lastLoginAt: true,
          business: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        userType: u.userType,
        accountStatus: u.status,
        lastLogin: u.lastLoginAt,
        businessName: u.business?.name ?? null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
