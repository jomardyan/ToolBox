// backend/src/services/stripeService.ts

import Stripe from 'stripe';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

export class StripeService {
  /**
   * Create a customer in Stripe
   */
  static async createCustomer(userId: string, email: string, name: string) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { userId }
      });

      logger.info(`Stripe customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      logger.error('Create customer error:', error);
      throw error;
    }
  }

  /**
   * Create a subscription
   */
  static async createSubscription(
    customerId: string,
    priceId: string,
    userId: string,
    metadata?: Record<string, string>
  ) {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: { userId, ...metadata }
      });

      logger.info(`Stripe subscription created: ${subscription.id}`);
      return subscription;
    } catch (error) {
      logger.error('Create subscription error:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId: string) {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      logger.info(`Stripe subscription cancelled: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error('Cancel subscription error:', error);
      throw error;
    }
  }

  /**
   * Update subscription
   */
  static async updateSubscription(
    subscriptionId: string,
    updates: Stripe.SubscriptionUpdateParams
  ) {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, updates);
      logger.info(`Stripe subscription updated: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error('Update subscription error:', error);
      throw error;
    }
  }

  /**
   * Create a payment intent (for one-time payments)
   */
  static async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    customerId: string,
    metadata?: Record<string, string>
  ) {
    try {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customerId,
        metadata
      });

      logger.info(`Payment intent created: ${intent.id}`);
      return intent;
    } catch (error) {
      logger.error('Create payment intent error:', error);
      throw error;
    }
  }

  /**
   * Add metered usage (for pay-as-you-go billing)
   */
  static async recordUsage(subscriptionItemId: string, quantity: number) {
    try {
      const usage = await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
        quantity: Math.round(quantity)
      });

      logger.info(`Usage recorded: ${subscriptionItemId}`);
      return usage;
    } catch (error) {
      logger.error('Record usage error:', error);
      throw error;
    }
  }

  /**
   * Get invoice
   */
  static async getInvoice(invoiceId: string) {
    try {
      return await stripe.invoices.retrieve(invoiceId);
    } catch (error) {
      logger.error('Get invoice error:', error);
      throw error;
    }
  }

  /**
   * Finalize invoice
   */
  static async finalizeInvoice(invoiceId: string) {
    try {
      return await stripe.invoices.finalize(invoiceId);
    } catch (error) {
      logger.error('Finalize invoice error:', error);
      throw error;
    }
  }

  /**
   * Create invoice from subscription
   */
  static async createInvoice(customerId: string, items: Array<{ price: string; quantity: number }>) {
    try {
      const invoice = await stripe.invoices.create({
        customer: customerId,
        collection_method: 'charge_automatically'
      });

      // Add line items
      for (const item of items) {
        await stripe.invoiceItems.create({
          invoice: invoice.id,
          customer: customerId,
          price: item.price,
          quantity: item.quantity
        });
      }

      // Finalize
      return await this.finalizeInvoice(invoice.id);
    } catch (error) {
      logger.error('Create invoice error:', error);
      throw error;
    }
  }

  /**
   * List invoices for customer
   */
  static async listInvoices(customerId: string, limit: number = 10) {
    try {
      return await stripe.invoices.list({
        customer: customerId,
        limit
      });
    } catch (error) {
      logger.error('List invoices error:', error);
      throw error;
    }
  }

  /**
   * Handle webhook event
   */
  static async handleWebhookEvent(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          return await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);

        case 'customer.subscription.deleted':
          return await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);

        case 'customer.subscription.updated':
          return await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);

        case 'invoice.payment_succeeded':
          return await this.handleInvoicePaid(event.data.object as Stripe.Invoice);

        case 'invoice.payment_failed':
          return await this.handleInvoiceFailed(event.data.object as Stripe.Invoice);

        default:
          logger.info(`Unhandled webhook event: ${event.type}`);
      }
    } catch (error) {
      logger.error('Webhook event error:', error);
      throw error;
    }
  }

  private static async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    const planId = subscription.metadata?.planId;

    await prisma.subscription.create({
      data: {
        userId,
        planId,
        stripeSubscriptionId: subscription.id,
        billingCycleStart: new Date(subscription.current_period_start * 1000),
        billingCycleEnd: new Date(subscription.current_period_end * 1000),
        status: 'ACTIVE'
      }
    });

    logger.info(`Subscription created in DB: ${subscription.id}`);
  }

  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELLED',
        cancellationDate: new Date()
      }
    });

    logger.info(`Subscription cancelled in DB: ${subscription.id}`);
  }

  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        billingCycleStart: new Date(subscription.current_period_start * 1000),
        billingCycleEnd: new Date(subscription.current_period_end * 1000)
      }
    });

    logger.info(`Subscription updated in DB: ${subscription.id}`);
  }

  private static async handleInvoicePaid(invoice: Stripe.Invoice) {
    const userId = invoice.metadata?.userId;
    if (!userId || !invoice.id) return;

    await prisma.billingRecord.updateMany({
      where: { stripeInvoiceId: invoice.id },
      data: {
        status: 'PAID',
        paidAt: new Date()
      }
    });

    logger.info(`Invoice marked paid in DB: ${invoice.id}`);
  }

  private static async handleInvoiceFailed(invoice: Stripe.Invoice) {
    const userId = invoice.metadata?.userId;
    if (!userId || !invoice.id) return;

    await prisma.billingRecord.updateMany({
      where: { stripeInvoiceId: invoice.id },
      data: {
        status: 'FAILED',
        failureReason: 'Payment failed'
      }
    });

    logger.info(`Invoice marked failed in DB: ${invoice.id}`);
  }
}

export default StripeService;
