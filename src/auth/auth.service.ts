import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateAdmin(email: string, password: string) {
    // Input validation
    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }

    const admin = await this.prisma.admin.findUnique({
      where: { email },
    });

    // Check if admin exists
    if (!admin) {
      // Use same error message to prevent email enumeration
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if admin is active
    if (!admin.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Verify password hash exists
    if (!admin.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare passwords
    const passwordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Remove sensitive data before returning
    const { passwordHash, ...result } = admin;
    return result;
  }

  async login(admin: any) {
    const payload = {
      sub: admin.id, // Make sure this matches what you expect
      isAdmin: true, // Make sure this is boolean true, not string
    };

    this.logger.debug(`Creating JWT with payload: ${JSON.stringify(payload)}`);

    return {
      accessToken: this.jwtService.sign(payload, {
        secret: process.env.ADMIN_JWT_SECRET,
        expiresIn: '24h',
      }),
    };
  }
}
