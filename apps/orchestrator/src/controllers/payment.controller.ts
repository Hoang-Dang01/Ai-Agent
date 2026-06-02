import { Request, Response } from 'express';
import Stripe from 'stripe';
import { dbService } from '../services/db.service';
import { env } from '../config/env';
import { logger } from '../config/logger';

// Instantiate Stripe if API key is present
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-05-27.dahlia' as any, // dynamic version fallback
});

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * 1. Generates Stripe Checkout Redirection URLs for Premium Subscriptions
 */
export async function createCheckoutSession(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user;

  if (!user || !user.id || !user.email) {
    res.status(401).json({ error: 'Access Denied: Unauthenticated user.' });
    return;
  }

  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_ID) {
    logger.error('[Payment Controller] Stripe secret key or Price ID is not configured.');
    res.status(400).json({ error: 'Billing Integration is temporarily disabled on this node.' });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${env.CORS_ORIGIN}/profile?session_id={CHECKOUT_SESSION_ID}&payment_status=success`,
      cancel_url: `${env.CORS_ORIGIN}/profile?payment_status=cancel`,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: {
        userId: user.id,
      },
    });

    logger.info({ userId: user.id, email: user.email, sessionId: session.id }, '[Payment Controller] Created Stripe checkout session.');

    res.json({
      status: 'OK',
      url: session.url,
    });
  } catch (error: any) {
    logger.error(error, '[Payment Controller] Failed to create Stripe checkout session:');
    res.status(500).json({ error: 'Failed to generate checkout session.' });
  }
}

/**
 * 2. Cryptographically Verifies Raw Signature Webhook payloads and updates UserSubscription status
 */
export async function handleStripeWebhook(req: any, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'];

  if (!sig || !req.rawBody) {
    logger.warn('[Payment Webhook] Missing signature header or raw payload body.');
    res.status(400).json({ error: 'Missing webhook signature or body payload.' });
    return;
  }

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig as string,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    logger.error(err, '[Payment Webhook] Cryptographic signature construction failed:');
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
    return;
  }

  logger.info({ eventType: event.type }, '[Payment Webhook] ConstructEvent verified successfully.');

  try {
    const session = event.data.object as any;

    if (event.type === 'checkout.session.completed' || event.type === 'customer.subscription.updated') {
      const userId = session.client_reference_id || session.metadata?.userId;
      const stripeCustomerId = session.customer;
      const stripeStatus = session.status || 'active';
      
      const currentPeriodEnd = session.current_period_end 
        ? new Date(session.current_period_end * 1000) 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // default 30 days fallback

      if (userId) {
        await dbService.client.userSubscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeCustomerId: stripeCustomerId as string,
            stripePriceId: env.STRIPE_PRICE_ID,
            stripeStatus,
            currentPeriodEnd,
            lastVerifiedAt: new Date(),
          },
          update: {
            stripeCustomerId: stripeCustomerId as string,
            stripeStatus,
            currentPeriodEnd,
            lastVerifiedAt: new Date(),
          },
        });
        
        logger.info({ userId, stripeStatus }, '[Payment Webhook] UserSubscription synchronized successfully.');
      } else {
        logger.warn('[Payment Webhook] Checkout session does not contain client_reference_id.');
      }
    } 
    
    else if (event.type === 'customer.subscription.deleted') {
      const customerId = session.customer;

      if (customerId) {
        await dbService.client.userSubscription.updateMany({
          where: { stripeCustomerId: customerId as string },
          data: {
            stripeStatus: 'canceled',
            lastVerifiedAt: new Date(),
          },
        });
        logger.info({ customerId }, '[Payment Webhook] Canceled subscription status updated in database.');
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    logger.error(error, '[Payment Webhook] Processing pipeline exception caught:');
    res.status(500).json({ error: 'Failed to resolve payment webhook event.' });
  }
}

/**
 * 3. Retrieves billing status and calculates 30-day offline grace limit
 */
export async function getSubscriptionStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user;

  if (!user || !user.id) {
    res.status(401).json({ error: 'Access Denied: Unauthenticated user.' });
    return;
  }

  try {
    const subscription = await dbService.client.userSubscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription) {
      res.json({
        status: 'OK',
        tier: 'FREE',
        subscription: null,
        isOfflineGraceExpired: false,
      });
      return;
    }

    // Calculate elapsed offline grace duration in days
    const lastVerified = subscription.lastVerifiedAt;
    const diffTime = Math.abs(Date.now() - lastVerified.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Check if machine exceeded 30 days offline boundary
    const isActive = subscription.stripeStatus === 'active' || subscription.stripeStatus === 'trialing' || subscription.stripeStatus === 'complete';
    const isGraceExpired = diffDays > 30 && isActive;

    res.json({
      status: 'OK',
      tier: isGraceExpired ? 'OFFLINE_EXPIRED' : (isActive ? 'PREMIUM' : 'FREE'),
      subscription,
      offlineDurationDays: diffDays,
      isOfflineGraceExpired: isGraceExpired,
    });
  } catch (error: any) {
    logger.error(error, '[Payment Controller] Failed to fetch subscription status:');
    res.status(500).json({ error: 'Failed to fetch active subscription properties.' });
  }
}
