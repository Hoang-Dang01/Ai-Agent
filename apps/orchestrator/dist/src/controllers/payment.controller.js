"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSession = createCheckoutSession;
exports.handleStripeWebhook = handleStripeWebhook;
exports.getSubscriptionStatus = getSubscriptionStatus;
const stripe_1 = __importDefault(require("stripe"));
const db_service_1 = require("../services/db.service");
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
// Instantiate Stripe if API key is present
const stripe = new stripe_1.default(env_1.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-05-27.dahlia', // dynamic version fallback
});
/**
 * 1. Generates Stripe Checkout Redirection URLs for Premium Subscriptions
 */
async function createCheckoutSession(req, res) {
    const user = req.user;
    if (!user || !user.id || !user.email) {
        res.status(401).json({ error: 'Access Denied: Unauthenticated user.' });
        return;
    }
    if (!env_1.env.STRIPE_SECRET_KEY || !env_1.env.STRIPE_PRICE_ID) {
        logger_1.logger.error('[Payment Controller] Stripe secret key or Price ID is not configured.');
        res.status(400).json({ error: 'Billing Integration is temporarily disabled on this node.' });
        return;
    }
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: env_1.env.STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${env_1.env.CORS_ORIGIN}/profile?session_id={CHECKOUT_SESSION_ID}&payment_status=success`,
            cancel_url: `${env_1.env.CORS_ORIGIN}/profile?payment_status=cancel`,
            client_reference_id: user.id,
            customer_email: user.email,
            metadata: {
                userId: user.id,
            },
        });
        logger_1.logger.info({ userId: user.id, email: user.email, sessionId: session.id }, '[Payment Controller] Created Stripe checkout session.');
        res.json({
            status: 'OK',
            url: session.url,
        });
    }
    catch (error) {
        logger_1.logger.error(error, '[Payment Controller] Failed to create Stripe checkout session:');
        res.status(500).json({ error: 'Failed to generate checkout session.' });
    }
}
/**
 * 2. Cryptographically Verifies Raw Signature Webhook payloads and updates UserSubscription status
 */
async function handleStripeWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    if (!sig || !req.rawBody) {
        logger_1.logger.warn('[Payment Webhook] Missing signature header or raw payload body.');
        res.status(400).json({ error: 'Missing webhook signature or body payload.' });
        return;
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, env_1.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        logger_1.logger.error(err, '[Payment Webhook] Cryptographic signature construction failed:');
        res.status(400).json({ error: `Webhook Error: ${err.message}` });
        return;
    }
    logger_1.logger.info({ eventType: event.type }, '[Payment Webhook] ConstructEvent verified successfully.');
    try {
        const session = event.data.object;
        if (event.type === 'checkout.session.completed' || event.type === 'customer.subscription.updated') {
            const userId = session.client_reference_id || session.metadata?.userId;
            const stripeCustomerId = session.customer;
            const stripeStatus = session.status || 'active';
            const currentPeriodEnd = session.current_period_end
                ? new Date(session.current_period_end * 1000)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // default 30 days fallback
            if (userId) {
                await db_service_1.dbService.client.userSubscription.upsert({
                    where: { userId },
                    create: {
                        userId,
                        stripeCustomerId: stripeCustomerId,
                        stripePriceId: env_1.env.STRIPE_PRICE_ID,
                        stripeStatus,
                        currentPeriodEnd,
                        lastVerifiedAt: new Date(),
                    },
                    update: {
                        stripeCustomerId: stripeCustomerId,
                        stripeStatus,
                        currentPeriodEnd,
                        lastVerifiedAt: new Date(),
                    },
                });
                logger_1.logger.info({ userId, stripeStatus }, '[Payment Webhook] UserSubscription synchronized successfully.');
            }
            else {
                logger_1.logger.warn('[Payment Webhook] Checkout session does not contain client_reference_id.');
            }
        }
        else if (event.type === 'customer.subscription.deleted') {
            const customerId = session.customer;
            if (customerId) {
                await db_service_1.dbService.client.userSubscription.updateMany({
                    where: { stripeCustomerId: customerId },
                    data: {
                        stripeStatus: 'canceled',
                        lastVerifiedAt: new Date(),
                    },
                });
                logger_1.logger.info({ customerId }, '[Payment Webhook] Canceled subscription status updated in database.');
            }
        }
        res.json({ received: true });
    }
    catch (error) {
        logger_1.logger.error(error, '[Payment Webhook] Processing pipeline exception caught:');
        res.status(500).json({ error: 'Failed to resolve payment webhook event.' });
    }
}
/**
 * 3. Retrieves billing status and calculates 30-day offline grace limit
 */
async function getSubscriptionStatus(req, res) {
    const user = req.user;
    if (!user || !user.id) {
        res.status(401).json({ error: 'Access Denied: Unauthenticated user.' });
        return;
    }
    try {
        const subscription = await db_service_1.dbService.client.userSubscription.findUnique({
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
    }
    catch (error) {
        logger_1.logger.error(error, '[Payment Controller] Failed to fetch subscription status:');
        res.status(500).json({ error: 'Failed to fetch active subscription properties.' });
    }
}
