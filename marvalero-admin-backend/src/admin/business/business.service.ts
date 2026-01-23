import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service.js';
// import { jest } from '@jest/globals'; // Add this if you use jest.fn() inside the service itself

@Injectable()
export class BusinessService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
  ) {}

  async getBusinesses() {
    const businesses = await this.prisma.business.findMany({
      include: { user: true },
    });
    if (!businesses) throw new NotFoundException();

    return businesses.map((business) => ({
      id: business.id,
      name: business.name,
      user: business.user,
      stripeCustomerId: business.stripeCustomerId,
      stripeSubscriptionId: business.stripeSubscriptionId,
    }));
  }

  async getBusiness(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { user: true },
    });
    if (!business) throw new NotFoundException();

    return {
      name: business.name,
      user: business.user,
      stripeCustomerId: business.stripeCustomerId,
      stripeSubscriptionId: business.stripeSubscriptionId,
    };
  }

  async getSubscription(businessId: string) {
    const biz = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!biz?.stripeCustomerId)
      throw new NotFoundException('Stripe customer not linked');

    // List subscriptions for this Stripe customer
    const subscriptions = await this.stripe.subscriptions.list({
      customer: biz.stripeCustomerId,
      status: 'all',
      expand: ['data.plan.product'],
    });

    return subscriptions.data;
  }

  async getPayments(businessId: string) {
    const biz = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!biz) throw new NotFoundException('Business not found'); // Business doesn't exist
    if (!biz.stripeCustomerId)
      throw new NotFoundException('Stripe customer not linked'); // Matches test

    const payments = await this.stripe.paymentIntents.list({
      customer: biz.stripeCustomerId,
    });

    return payments.data;
  }

  async getFailedPayments(businessId: string) {
    const biz = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!biz?.stripeCustomerId)
      throw new NotFoundException('Stripe customer not linked');

    const all = await this.stripe.paymentIntents.list({
      customer: biz.stripeCustomerId,
    });

    return all.data.filter(
      (pi) =>
        pi.status === 'requires_payment_method' || pi.status === 'canceled',
    );
  }

  async cancelSubscription(businessId: string, adminId: string) {
    const biz = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!biz) throw new NotFoundException('Business not found');

    if (!biz.stripeSubscriptionId)
      throw new NotFoundException('Subscription not linked');

    const canceled = await this.stripe.subscriptions.cancel(
      biz.stripeSubscriptionId,
    );

    // Update database to reflect cancellation
    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        stripeSubscriptionId: null, // remove the subscription ID
        // optionally record cancellation timestamp/status:
        subscriptionStatus: canceled.status,
      },
    });

    return { success: true, status: canceled.status };
  }

  async refundPayment(businessId: string, paymentIntentId: string) {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
    return refund;
  }

  async getDisputes(businessId: string) {
    const biz = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!biz?.stripeCustomerId)
      throw new NotFoundException('Stripe customer not linked');

    // list disputes, optionally filtered by PaymentIntent/customer
    const disputes = await this.stripe.disputes.list({
      // optionally: { payment_intent: someId, limit: 100 }
    });
    return disputes.data;
  }

  async getAllPayments(limit = 50, starting_after?: string) {
    const payments = await this.stripe.paymentIntents.list({
      limit,
      starting_after,
    });
    return payments.data; // 👈 Return the data array only
  }

  async getAllFailedPayments(limit = 50, starting_after?: string) {
    const all = await this.stripe.paymentIntents.list({
      limit,
      starting_after,
    });
    return all.data.filter(
      (pi) =>
        pi.status === 'requires_payment_method' || pi.status === 'canceled',
    );
  }

  async getAllDisputes(limit = 50, starting_after?: string) {
    const disputes = await this.stripe.disputes.list({ limit, starting_after });
    return disputes.data;
  }

  async getAllRefunds(limit = 50, starting_after?: string) {
    const refunds = await this.stripe.refunds.list({ limit, starting_after });
    return refunds.data;
  }
}
