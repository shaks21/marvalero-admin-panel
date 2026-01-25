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
        const params: Stripe.PaymentIntentListParams = {
          limit: 100,
          created: { gte: cutoffTimestamp },
        };
        
        if (startingAfter) {
          params.starting_after = startingAfter;
        }

        const paymentIntents = await this.stripe.paymentIntents.list(params);
        
        for (const pi of paymentIntents.data) {
          // Skip if we already have this transaction and it's recent (unless force=true)
          if (!force) {
            const existing = await this.prisma.transaction.findUnique({
              where: { stripePaymentId: pi.id },
            });
            
            if (existing && existing.lastSyncedAt && 
                existing.lastSyncedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
              continue;
            }
          }

          // Find business (optional)
          let businessId: string | null = null;
          if (pi.customer && typeof pi.customer === 'string') {
            const business = await this.prisma.business.findFirst({
              where: { stripeCustomerId: pi.customer },
            });
            if (business) {
              businessId = business.id;
            }
          }

          // Check for refunds
          let refundAmount = 0;
          let displayStatus: TransactionStatus = pi.status as TransactionStatus;
          
          if (pi.status === 'succeeded') {
            const refunds = await this.stripe.refunds.list({
              payment_intent: pi.id,
              limit: 10,
            });
            
            if (refunds.data.length > 0) {
              refundAmount = refunds.data.reduce((sum, refund) => sum + refund.amount, 0);
              if (refundAmount >= pi.amount) {
                displayStatus = 'refunded';
              } else if (refundAmount > 0) {
                displayStatus = 'partially_refunded';
              }
            }
          }

          // Prepare update data
          const updateData: any = {
            status: displayStatus,
            amount: pi.amount,
            refundAmount,
            currency: pi.currency,
            description: pi.description || null,
            metadata: pi.metadata || null,
            lastSyncedAt: new Date(),
            syncedFromStripe: true,
          };

          // Prepare create data
          const createData: any = {
            stripePaymentId: pi.id,
            amount: pi.amount,
            refundAmount,
            currency: pi.currency,
            status: displayStatus,
            description: pi.description || null,
            metadata: pi.metadata || null,
            userEmail: pi.receipt_email || null,
            userName: pi.metadata?.userName || null,
            lastSyncedAt: new Date(),
            syncedFromStripe: true,
          };

          // Add business relation if found
          if (businessId) {
            updateData.business = { connect: { id: businessId } };
            createData.business = { connect: { id: businessId } };
          } else {
            // Leave businessId as null if not found
            updateData.business = { disconnect: true };
          }

          // Upsert transaction
          try {
            const result = await this.prisma.transaction.upsert({
              where: { stripePaymentId: pi.id },
              update: updateData,
              create: createData,
            });

            // Check if it was created or updated
            const timeDifference = Math.abs(result.createdAt.getTime() - result.updatedAt.getTime());
            if (timeDifference < 1000) {
              createdCount++;
            } else {
              updatedCount++;
            }
            
            syncedCount++;
          } catch (upsertError: any) {
            this.logger.error(`Error upserting transaction ${pi.id}:`, upsertError.message);
            // Continue with next transaction
          }
        }

        hasMore = paymentIntents.has_more;
        if (paymentIntents.data.length > 0) {
          startingAfter = paymentIntents.data[paymentIntents.data.length - 1].id;
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
        OR: [
          { lastSyncedAt: { lt: cutoffDate } },
          { lastSyncedAt: undefined },
        ],
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
        let displayStatus: TransactionStatus = paymentIntent.status as TransactionStatus;

        if (paymentIntent.status === 'succeeded') {
          const refunds = await this.stripe.refunds.list({
            payment_intent: paymentIntent.id,
            limit: 10,
          });
          
          if (refunds.data.length > 0) {
            refundAmount = refunds.data.reduce((sum, refund) => sum + refund.amount, 0);
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