import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminJwtPayload } from '../interfaces/admin-jwt-payload.js';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor() {
    const secret = process.env.ADMIN_JWT_SECRET;

    if (!secret) {
      throw new Error('ADMIN_JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    });
    console.log("AdminJwtStrategy initialized with secret:", secret);
  }

  async validate(payload: AdminJwtPayload) {
      console.log("JWT payload:", payload);

    if (!payload.isAdmin) {
      throw new UnauthorizedException();
    }

    return {
      adminId: payload.sub,
    };
  }
}
