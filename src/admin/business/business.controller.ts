import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BusinessService } from './business.service.js';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
// import { RolesGuard } from '../auth/guards/roles.guard.js';
// import { Roles } from '../auth/decorators/roles.decorator.js';
import { AdminGuard } from '../../auth/guards/admin.guard.js';


@UseGuards(AdminGuard) // Apply guard globally to this controller
@Controller('admin/business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get('businesses')
  getBusinesses() {
    return this.businessService.getBusinesses();
  }

  @Get(':id')
  getBusiness(@Param('id') id: string) {
    return this.businessService.getBusiness(id);
  }

  @Get(':id/subscription')
  getSubscription(@Param('id') id: string) {
    return this.businessService.getSubscription(id);
  }

  @Get(':id/payments')
  getPayments(@Param('id') id: string) {
    return this.businessService.getPayments(id);
  }

  @Patch(':id/cancel-subscription')
  cancelSubscription(@Param('id') id: string, @Req() req) {
    return this.businessService.cancelSubscription(id, req.user.adminId);
  }
}
