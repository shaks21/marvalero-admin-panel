// src/admin/business/stripe-sync.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service.js';

// Type helper for transaction status
type TransactionStatus =
  | 'succeeded'
  | 'requires_payment_method'
  | 'canceled'
  | 'processing'
  | 'requires_action'
  | 'requires_capture'
  | 'disputed'
  | 'refunded'
  | 'partially_refunded';

@Injectable()
export class StripeSyncService {
  private readonly logger = new Logger(StripeSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
  ) {}

  async syncRecentTransactions(days = 30, force = false) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);

    let hasMore = true;
    let startingAfter: string | undefined;
    let syncedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    try {
      while (hasMore) {
        // Fetch Charges instead of PaymentIntents for better refund data
        const params: Stripe.ChargeListParams = {
          limit: 100,
          created: { gte: cutoffTimestamp },
          expand: ['data.payment_intent', 'data.refunds.data'],
        };

        if (startingAfter) {
          params.starting_after = startingAfter;
        }

        const charges = await this.stripe.charges.list(params);

        console.log('Fetched charges data:', charges.data);

        for (const charge of charges.data) {
          const paymentIntentId =
            typeof charge.payment_intent === 'string'
              ? charge.payment_intent
              : charge.payment_intent?.id || charge.id;

          // ALWAYS process transactions when syncing (remove the skip logic)
          // The upsert will update if needed, create if new

          // Find business (optional)
          let businessId: string | null = null;
          if (charge.customer && typeof charge.customer === 'string') {
            const business = await this.prisma.business.findFirst({
              where: { stripeCustomerId: charge.customer },
            });
            if (business) {
              businessId = business.id;
            }
          }

          // Determine status from Charge and Refunds
          let displayStatus: TransactionStatus;
          let refundAmount = 0;

          // Check for refunds FIRST
          if (charge.refunded && charge.refunds?.data) {
            refundAmount = charge.refunds.data.reduce(
              (sum, refund) => sum + refund.amount,
              0,
            );
            if (refundAmount >= charge.amount) {
              displayStatus = 'refunded';
            } else if (refundAmount > 0) {
              displayStatus = 'partially_refunded';
            } else {
              displayStatus = charge.status as TransactionStatus;
            }
          }
          // Check for disputes
          else if (charge.disputed) {
            displayStatus = 'disputed';
          }
          // Use the charge status as a fallback
          else {
            displayStatus = charge.status as TransactionStatus;
          }

          // Prepare data
          const updateData: any = {
            status: displayStatus,
            amount: charge.amount,
            refundAmount,
            currency: charge.currency,
            description: charge.description || null,
            metadata: charge.metadata || null,
            lastSyncedAt: new Date(),
            syncedFromStripe: true,
          };

          const createData: any = {
            stripePaymentId: paymentIntentId, // Use the extracted ID
            amount: charge.amount,
            refundAmount,
            currency: charge.currency,
            status: displayStatus,
            description: charge.description || null,
            metadata: charge.metadata || null,
            userEmail: charge.receipt_email || null,
            userName:
              charge.billing_details?.name || charge.metadata?.userName || null,
            lastSyncedAt: new Date(),
            syncedFromStripe: true,
          };

          // Add business relation if found
          if (businessId) {
            updateData.business = { connect: { id: businessId } };
            createData.business = { connect: { id: businessId } };
          }

          // Upsert transaction
          try {
            const result = await this.prisma.transaction.upsert({
              where: { stripePaymentId: paymentIntentId }, // Use the extracted ID
              update: updateData,
              create: createData,
            });

            // Check if it was created or updated
            const timeDifference = Math.abs(
              result.createdAt.getTime() - result.updatedAt.getTime(),
            );
            if (timeDifference < 1000) {
              createdCount++;
            } else {
              updatedCount++;
            }

            syncedCount++;
          } catch (upsertError: any) {
            this.logger.error(
              `Error upserting transaction ${charge.id}:`,
              upsertError.message,
            );
            // Continue with next transaction
          }
        }

        hasMore = charges.has_more;
        if (charges.data.length > 0) {
          startingAfter = charges.data[charges.data.length - 1].id;
        }
      }

      return {
        success: true,
        message: `Synced ${syncedCount} transactions (${createdCount} created, ${updatedCount} updated)`,
        syncedCount,
        createdCount,
        updatedCount,
      };
    } catch (error: any) {
      this.logger.error('Error syncing Stripe transactions:', error.message);
      throw error;
    }
  }

  async fixStaleTransactions(hours = 24) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    // Fix: Use correct Prisma syntax for null check
    const staleTransactions = await this.prisma.transaction.findMany({
      where: {
        OR: [{ lastSyncedAt: { lt: cutoffDate } }, { lastSyncedAt: undefined }],
      },
      take: 100,
    });

    const results = {
      checked: staleTransactions.length,
      updated: 0,
      errors: 0,
    };

    for (const transaction of staleTransactions) {
      try {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(
          transaction.stripePaymentId,
        );

        let refundAmount = 0;
        let displayStatus: TransactionStatus =
          paymentIntent.status as TransactionStatus;

        if (paymentIntent.status === 'succeeded') {
          const refunds = await this.stripe.refunds.list({
            payment_intent: paymentIntent.id,
            limit: 10,
          });

          if (refunds.data.length > 0) {
            refundAmount = refunds.data.reduce(
              (sum, refund) => sum + refund.amount,
              0,
            );
            if (refundAmount >= paymentIntent.amount) {
              displayStatus = 'refunded';
            } else if (refundAmount > 0) {
              displayStatus = 'partially_refunded';
            }
          }
        }

        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: displayStatus,
            amount: paymentIntent.amount,
            refundAmount,
            lastSyncedAt: new Date(),
          },
        });

        results.updated++;
      } catch (error: any) {
        this.logger.error(
          `Error fixing stale transaction ${transaction.stripePaymentId}:`,
          error.message,
        );
        results.errors++;
      }
    }

    return results;
  }
}
