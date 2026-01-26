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
    console.log('Business fetched for payments:', biz);
    if (!biz) throw new NotFoundException('Business not found'); // Business doesn't exist
    if (!biz.stripeCustomerId)
      throw new NotFoundException('Stripe customer not linked'); // Matches test

    const payments = await this.stripe.paymentIntents.list({
      customer: biz.stripeCustomerId,
    });

    console.log(
      'Fetched payments for business:',
      businessId,
      payments.data.length,
    );

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

  // Immediate DB update in refundPayment()
  async refundPayment(paymentIntentId: string) {
    const pi = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    if (pi.status !== 'succeeded') {
      throw new Error(`Cannot refund: ${pi.status}`);
    }

    // Optimistic update
    await this.prisma.transaction.update({
      where: { stripePaymentId: paymentIntentId },
      data: { status: 'refund_pending' },
    });

    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
    });

    // Confirm update
    await this.prisma.transaction.update({
      where: { stripePaymentId: paymentIntentId },
      data: {
        status: 'refunded',
        refundAmount: refund.amount,
      },
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

  // async getAllPayments(limit = 50, starting_after?: string) {
  //   const listParams: Stripe.PaymentIntentListParams = { limit };
  //   if (starting_after) listParams.starting_after = starting_after;

  //   // 1. Fetch from Stripe
  //   const payments = await this.stripe.paymentIntents.list(listParams);

  //   // 2. Identify unique Stripe Customer IDs from the batch
  //   const stripeCustomerIds = [
  //     ...new Set(
  //       payments.data.map((p) => p.customer as string).filter((id) => !!id),
  //     ),
  //   ];

  //   // 3. Batch fetch businesses from DB that match these IDs
  //   const businesses = await this.prisma.business.findMany({
  //     where: { stripeCustomerId: { in: stripeCustomerIds } },
  //     include: { user: { select: { name: true, email: true } } },
  //   });

  //   // 4. Create a lookup map for O(1) access
  //   const businessMap = new Map(businesses.map((b) => [b.stripeCustomerId, b]));

  //   // 5. Format the data for the frontend
  //   const formattedData = payments.data.map((pi) => {
  //     const biz = businessMap.get(pi.customer as string);

  //     return {
  //       id: pi.id,
  //       stripePaymentId: pi.id,
  //       description: pi.description || 'Payment',
  //       amount: pi.amount,
  //       currency: pi.currency,
  //       status: pi.status,
  //       // Priority: DB User Name -> Stripe Metadata -> Default
  //       userName: biz?.user?.name || pi.metadata?.userName || 'Unknown User',
  //       userEmail: biz?.user?.email || pi.receipt_email || 'No Email',
  //       businessId: biz?.id || pi.metadata?.businessId,
  //       businessName: biz?.name || pi.metadata?.businessName,
  //       createdAt: new Date(pi.created * 1000).toISOString(),
  //       customerId: pi.customer as string,
  //     };
  //   });

  //   return {
  //     data: formattedData,
  //     hasMore: payments.has_more,
  //     nextCursor:
  //       payments.data.length > 0
  //         ? payments.data[payments.data.length - 1].id
  //         : undefined,
  //   };
  // }

  // In your BusinessService's getAllPayments method:
  async getAllPayments(limit = 50, cursor?: string) {
    const where: any = {};

    if (cursor) {
      const cursorTransaction = await this.prisma.transaction.findUnique({
        where: { id: cursor },
      });

      if (cursorTransaction) {
        where.createdAt = { lt: cursorTransaction.createdAt };
      }
    }

    const transactions = await this.prisma.transaction.findMany({
      take: limit,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        business: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Format for frontend
    const formattedData = transactions.map((t) => ({
      id: t.id,
      stripePaymentId: t.stripePaymentId,
      description: t.description || 'Payment',
      amount: t.amount,
      refundAmount: t.refundAmount,
      currency: t.currency,
      status: t.status,
      refunded: t.refundAmount > 0,
      userName: t.business?.user?.name || t.userName || 'Unknown User',
      userEmail: t.business?.user?.email || t.userEmail || 'No Email',
      businessId: t.business?.id,
      businessName: t.business?.name,
      createdAt: t.createdAt.toISOString(),
      customerId: t.business?.stripeCustomerId,
    }));

    const nextCursor =
      transactions.length > 0
        ? transactions[transactions.length - 1].id
        : undefined;

    return {
      data: formattedData,
      hasMore: transactions.length === limit,
      nextCursor,
    };
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

  async getGlobalPaymentStats() {
    const stats = await this.prisma.transaction.aggregate({
      _sum: {
        amount: true,
        refundAmount: true,
      },
      _count: {
        id: true,
      },
    });

    const succeededTotal = await this.prisma.transaction.aggregate({
      where: { status: 'succeeded' },
      _sum: { amount: true },
    });

    return {
      totalTransactions: stats._count.id,
      completedRevenue: (succeededTotal._sum.amount || 0) / 100,
      totalVolume: (stats._sum.amount || 0) / 100,
      totalRefunded: (stats._sum.refundAmount || 0) / 100,
    };
  }

  // async getGlobalPaymentStats() {
  //   // Production Tip: Don't use .list() for stats if you have >1000 payments.
  //   // Use Stripe's Balance APIs or query your own DB 'Transactions' table.
  //   // For now, this is fixed to be accurate:
  //   const allPayments = await this.stripe.paymentIntents.list({ limit: 100 });
  //   const allRefunds = await this.stripe.refunds.list({ limit: 100 });

  //   return {
  //     totalTransactions: allPayments.data.length,
  //     completedRevenue:
  //       allPayments.data
  //         .filter((p) => p.status === 'succeeded')
  //         .reduce((acc, p) => acc + p.amount_received, 0) / 100,
  //     totalVolume: allPayments.data.reduce((acc, p) => acc + p.amount, 0) / 100,
  //     totalRefunded:
  //       allRefunds.data.reduce((acc, r) => acc + r.amount, 0) / 100,
  //   };
  // }
}
