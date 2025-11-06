// backend/src/routes/webhookRoutes.ts (Simplified)
//
// Webhook routes for handling Stripe events
// Note: This requires proper setup with Stripe API keys and webhook secrets

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import logger from '../utils/logger';

const router = Router();

// Initialize Stripe only if available
let stripe: any = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    const Stripe = require('stripe');
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  } catch (err) {
    logger.warn('Failed to initialize Stripe');
  }
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Stripe Webhook Handler
 * POST /stripe/webhook
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    if (!stripe) {
      logger.warn('Webhook received but Stripe not configured');
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    // Get the signature from headers
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      logger.warn('Webhook request missing stripe-signature header');
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event: any;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.body as string,
        sig,
        webhookSecret
      );
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
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
      case 'charge.refunded':
        logger.info(`Processing ${event.type} event`);
        // TODO: Implement event handlers based on your business logic
        break;

      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }

    // Record webhook event in database if model exists
    try {
      if (event.id) {
        await prisma.stripeWebhookEvent.create({
          data: {
            eventId: event.id,
            type: event.type,
            data: JSON.stringify(event.data),
            processed: true,
            processedAt: new Date()
          }
        });
      }
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

export default router;
