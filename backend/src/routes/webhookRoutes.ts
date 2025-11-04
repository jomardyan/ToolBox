// backend/src/routes/webhookRoutes.ts

import { Router, Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { db } from '../config/database';
import logger from '../utils/logger';

const router = Router();

// Initialize Stripe with webhook secret
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Stripe Webhook Handler
 * POST /stripe/webhook
 * 
 * Handles various Stripe events:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the signature from headers
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      logger.warn('Webhook request missing stripe-signature header');
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.body as string,
        sig,
        webhookSecret
      ) as Stripe.Event;
    } catch (err: any) {
      logger.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Log incoming event
    logger.info(`Received Stripe webhook event: ${event.type}`, {
      eventId: event.id,
      eventType: event.type
    });

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }

    // Record webhook event in database
    try {
      await db.stripeWebhookEvent.create({
        data: {
          stripeEventId: event.id,
          type: event.type,
          data: JSON.stringify(event.data),
          processed: true,
          processedAt: new Date()
        }
      });
    } catch (err: any) {
      logger.error(`Failed to record webhook event: ${err.message}`);
      // Don't fail the webhook response even if we can't record it
    }

    // Respond to Stripe
    res.json({ received: true });

  } catch (err: any) {
    logger.error(`Webhook handler error: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    logger.info(`Processing subscription.created event`, {
      subscriptionId: subscription.id,
      customerId: subscription.customer
    });

    // Find user by Stripe customer ID
    const user = await db.user.findUnique({
      where: { stripeCustomerId: subscription.customer as string }
    });

    if (!user) {
      logger.warn(`No user found for Stripe customer: ${subscription.customer}`);
      return;
    }

    // Get plan from Stripe price ID
    const priceId = subscription.items.data[0]?.price.id;
    const plan = await db.plan.findUnique({
      where: { stripePriceId: priceId }
    });

    if (!plan) {
      logger.warn(`No plan found for price ID: ${priceId}`);
      return;
    }

    // Create or update subscription
    const subscriptionStatus = subscription.status === 'active' ? 'ACTIVE' : 'PENDING';

    const nextBillingDate = new Date(subscription.current_period_end * 1000);

    await db.subscription.upsert({
      where: {
        userId_planId: {
          userId: user.id,
          planId: plan.id
        }
      },
      create: {
        userId: user.id,
        planId: plan.id,
        stripeSubscriptionId: subscription.id,
        status: subscriptionStatus,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: nextBillingDate,
        cancelledAt: null
      },
      update: {
        status: subscriptionStatus,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: nextBillingDate
      }
    });

    logger.info(`Subscription created/updated for user ${user.id} with plan ${plan.id}`);

  } catch (err: any) {
    logger.error(`Error handling subscription.created: ${err.message}`, {
      stack: err.stack
    });
  }
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    logger.info(`Processing subscription.updated event`, {
      subscriptionId: subscription.id,
      customerId: subscription.customer
    });

    // Find subscription by Stripe ID
    const existingSubscription = await db.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id }
    });

    if (!existingSubscription) {
      logger.warn(`No subscription found for Stripe ID: ${subscription.id}`);
      return;
    }

    // Update subscription status
    const status = subscription.status === 'active' ? 'ACTIVE' : 'PENDING';
    const nextBillingDate = new Date(subscription.current_period_end * 1000);

    await db.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: nextBillingDate
      }
    });

    logger.info(`Subscription ${subscription.id} updated with status: ${status}`);

  } catch (err: any) {
    logger.error(`Error handling subscription.updated: ${err.message}`, {
      stack: err.stack
    });
  }
}

/**
 * Handle subscription deleted event (cancelled)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    logger.info(`Processing subscription.deleted event`, {
      subscriptionId: subscription.id,
      customerId: subscription.customer
    });

    // Find and update subscription
    const existingSubscription = await db.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id }
    });

    if (!existingSubscription) {
      logger.warn(`No subscription found for Stripe ID: ${subscription.id}`);
      return;
    }

    // Mark subscription as cancelled
    await db.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      }
    });

    logger.info(`Subscription ${subscription.id} marked as cancelled`);

  } catch (err: any) {
    logger.error(`Error handling subscription.deleted: ${err.message}`, {
      stack: err.stack
    });
  }
}

/**
 * Handle invoice payment succeeded event
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    logger.info(`Processing invoice.payment_succeeded event`, {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      amount: invoice.amount_paid
    });

    // Find user by Stripe customer ID
    const user = await db.user.findUnique({
      where: { stripeCustomerId: invoice.customer as string }
    });

    if (!user) {
      logger.warn(`No user found for Stripe customer: ${invoice.customer}`);
      return;
    }

    // Create billing record
    const amount = invoice.amount_paid / 100; // Convert cents to dollars

    const existingRecord = await db.billingRecord.findFirst({
      where: {
        stripeInvoiceId: invoice.id
      }
    });

    if (!existingRecord) {
      // Find related subscription to link to plan
      let subscriptionId: string | null = null;

      if (invoice.subscription) {
        const subscription = await db.subscription.findUnique({
          where: { stripeSubscriptionId: invoice.subscription as string }
        });
        subscriptionId = subscription?.id || null;
      }

      await db.billingRecord.create({
        data: {
          userId: user.id,
          subscriptionId,
          stripeInvoiceId: invoice.id,
          amount,
          currency: invoice.currency || 'usd',
          status: 'PAID',
          paidAt: new Date(invoice.paid_date ? invoice.paid_date * 1000 : Date.now()),
          description: invoice.description || 'Invoice payment',
          type: 'SUBSCRIPTION'
        }
      });

      logger.info(`Billing record created for user ${user.id}: $${amount}`);
    } else {
      // Update existing record
      await db.billingRecord.update({
        where: { id: existingRecord.id },
        data: {
          status: 'PAID',
          paidAt: new Date(invoice.paid_date ? invoice.paid_date * 1000 : Date.now())
        }
      });

      logger.info(`Billing record updated for user ${user.id}`);
    }

  } catch (err: any) {
    logger.error(`Error handling invoice.payment_succeeded: ${err.message}`, {
      stack: err.stack
    });
  }
}

/**
 * Handle invoice payment failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    logger.info(`Processing invoice.payment_failed event`, {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      attemptCount: invoice.attempt_count
    });

    // Find user by Stripe customer ID
    const user = await db.user.findUnique({
      where: { stripeCustomerId: invoice.customer as string }
    });

    if (!user) {
      logger.warn(`No user found for Stripe customer: ${invoice.customer}`);
      return;
    }

    // Create or update billing record
    const amount = (invoice.amount_remaining || invoice.amount_due) / 100; // Convert cents to dollars

    let billingRecord = await db.billingRecord.findFirst({
      where: {
        stripeInvoiceId: invoice.id
      }
    });

    if (!billingRecord) {
      // Find related subscription
      let subscriptionId: string | null = null;

      if (invoice.subscription) {
        const subscription = await db.subscription.findUnique({
          where: { stripeSubscriptionId: invoice.subscription as string }
        });
        subscriptionId = subscription?.id || null;
      }

      billingRecord = await db.billingRecord.create({
        data: {
          userId: user.id,
          subscriptionId,
          stripeInvoiceId: invoice.id,
          amount,
          currency: invoice.currency || 'usd',
          status: 'FAILED',
          description: `Payment failed - Attempt ${invoice.attempt_count}`,
          type: 'SUBSCRIPTION'
        }
      });
    } else {
      // Update existing record
      await db.billingRecord.update({
        where: { id: billingRecord.id },
        data: {
          status: 'FAILED',
          description: `Payment failed - Attempt ${invoice.attempt_count}`
        }
      });
    }

    logger.info(`Payment failure recorded for user ${user.id}`);

    // TODO: Send email to user about failed payment

  } catch (err: any) {
    logger.error(`Error handling invoice.payment_failed: ${err.message}`, {
      stack: err.stack
    });
  }
}

/**
 * Handle charge refunded event
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  try {
    logger.info(`Processing charge.refunded event`, {
      chargeId: charge.id,
      customerId: charge.customer,
      amount: charge.amount_refunded
    });

    // Find related billing record and update it
    const billingRecord = await db.billingRecord.findFirst({
      where: {
        stripeInvoiceId: charge.invoice as string
      }
    });

    if (billingRecord) {
      const refundAmount = charge.amount_refunded / 100;

      await db.billingRecord.update({
        where: { id: billingRecord.id },
        data: {
          status: 'REFUNDED',
          description: `Refunded $${refundAmount}`
        }
      });

      logger.info(`Refund recorded for billing record ${billingRecord.id}: $${refundAmount}`);
    }

  } catch (err: any) {
    logger.error(`Error handling charge.refunded: ${err.message}`, {
      stack: err.stack
    });
  }
}

export default router;
