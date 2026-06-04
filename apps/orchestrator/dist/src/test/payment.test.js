"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
// Mock Stripe constructor BEFORE importing the controller
const OriginalStripe = stripe_1.default;
const StripeMock = function (key, config) {
    const instance = new OriginalStripe(key, config);
    instance.checkout.sessions.create = async function (params) {
        return {
            id: 'cs_test_mock_session_id_999',
            url: 'https://checkout.stripe.com/pay/cs_test_mock_session_id_999',
        };
    };
    return instance;
};
Object.assign(StripeMock, OriginalStripe);
StripeMock.prototype = OriginalStripe.prototype;
const stripePath = require.resolve('stripe');
require.cache[stripePath].exports = StripeMock;
// Import database, env and controllers after mocking Stripe
const db_service_1 = require("../services/db.service");
const env_1 = require("../config/env");
const payment_controller_1 = require("../controllers/payment.controller");
// Simple colored console assertions
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';
let failedTests = 0;
function assert(condition, message) {
    if (condition) {
        console.log(`${GREEN}✔ PASS:${RESET} ${message}`);
    }
    else {
        console.error(`${RED}✘ FAIL:${RESET} ${message}`);
        failedTests++;
    }
}
function mockResponse() {
    const res = {};
    res.statusCode = 200;
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.body = data;
        return res;
    };
    return res;
}
async function runTests() {
    console.log(`\n==================================================`);
    console.log(`🧪 STARTING AUTOMATED STRIPE PAYMENT TEST SUITE`);
    console.log(`==================================================\n`);
    // Stash original environment keys
    const originalStripeKey = env_1.env.STRIPE_SECRET_KEY;
    const originalPriceId = env_1.env.STRIPE_PRICE_ID;
    const originalWebhookSecret = env_1.env.STRIPE_WEBHOOK_SECRET;
    try {
        // Override environment with safe mock credentials
        env_1.env.STRIPE_SECRET_KEY = 'sk_test_mock_secret_key_antigravity_123';
        env_1.env.STRIPE_PRICE_ID = 'price_mock_premium_pack';
        env_1.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock_webhook_signature_secret_456';
        // 1. Setup DB Connection
        await db_service_1.dbService.initialize();
        console.log(`${YELLOW}⚡ Database connection initialized.${RESET}\n`);
        // Create a mock User for relations
        const testUserId = `user_stripe_test_${Date.now()}`;
        const testEmail = `operator_stripe_${Date.now()}@antigravity.ai`;
        await db_service_1.dbService.client.user.create({
            data: {
                id: testUserId,
                email: testEmail,
                password: '$2b$10$encryptedMockPasswordHereForTestingOnly',
            },
        });
        console.log(`${YELLOW}⚡ Test User created with ID: ${testUserId}${RESET}\n`);
        // ----------------------------------------------------
        // TEST 1: Checkout Redirection Session Generation
        // ----------------------------------------------------
        console.log(`${YELLOW}[TEST AREA 1] Stripe Checkout Session Generation${RESET}`);
        const checkoutReq = {
            user: {
                id: testUserId,
                email: testEmail,
            },
        };
        const checkoutRes = mockResponse();
        await (0, payment_controller_1.createCheckoutSession)(checkoutReq, checkoutRes);
        assert(checkoutRes.statusCode === 200, 'Checkout returns status code 200 OK');
        assert(checkoutRes.body.status === 'OK', 'Checkout returns status message OK');
        assert(checkoutRes.body.url === 'https://checkout.stripe.com/pay/cs_test_mock_session_id_999', 'Checkout returns correct mocked Stripe checkout URL');
        // ----------------------------------------------------
        // TEST 2: Webhook Cryptographic Signature & DB Sync
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 2] Webhook Cryptographic Verification & DB Synchronizer${RESET}`);
        const stripeInstance = new stripe_1.default(env_1.env.STRIPE_SECRET_KEY, {
            apiVersion: '2026-05-27.dahlia',
        });
        // Create a real Stripe webhook mock payload matching Express webhook format
        const webhookPayload = {
            id: 'evt_test_completed_123',
            object: 'event',
            type: 'checkout.session.completed',
            data: {
                object: {
                    id: 'cs_test_mock_session_id_999',
                    customer: 'cus_test_stripe_customer_789',
                    status: 'complete',
                    client_reference_id: testUserId,
                    current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
                    metadata: {
                        userId: testUserId,
                    },
                },
            },
        };
        const rawBodyBuffer = Buffer.from(JSON.stringify(webhookPayload));
        // Generate valid cryptographic signature using stripe-node helper
        const signatureHeader = stripeInstance.webhooks.generateTestHeaderString({
            payload: JSON.stringify(webhookPayload),
            secret: env_1.env.STRIPE_WEBHOOK_SECRET,
        });
        const webhookReq = {
            headers: {
                'stripe-signature': signatureHeader,
            },
            rawBody: rawBodyBuffer,
        };
        const webhookRes = mockResponse();
        await (0, payment_controller_1.handleStripeWebhook)(webhookReq, webhookRes);
        assert(webhookRes.statusCode === 200, 'Webhook returns 200 OK on cryptographic signature match');
        assert(webhookRes.body.received === true, 'Webhook confirmation returns positive response');
        // Retrieve and verify subscription state from database
        const subscription = await db_service_1.dbService.client.userSubscription.findUnique({
            where: { userId: testUserId },
        });
        assert(!!subscription, 'UserSubscription successfully created/upserted in database');
        if (subscription) {
            assert(subscription.stripeCustomerId === 'cus_test_stripe_customer_789', 'Subscription matches Stripe customer ID');
            assert(subscription.stripeStatus === 'complete', 'Subscription status matches checkout status "complete"');
            assert(!!subscription.lastVerifiedAt, 'Subscription has valid lastVerifiedAt timestamp');
        }
        // ----------------------------------------------------
        // TEST 3: Active Status Query & 30-Day Offline Grace Limit
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 3] Subscription status querying & 30-day offline grace period${RESET}`);
        // Query active status (within 30 days grace)
        const statusReq = {
            user: {
                id: testUserId,
            },
        };
        const statusRes = mockResponse();
        await (0, payment_controller_1.getSubscriptionStatus)(statusReq, statusRes);
        assert(statusRes.statusCode === 200, 'Query subscription status returns 200 OK');
        assert(statusRes.body.status === 'OK', 'Query returns status message OK');
        assert(statusRes.body.tier === 'PREMIUM', 'Subscription maps to active premium tier (PREMIUM)');
        assert(statusRes.body.isOfflineGraceExpired === false, 'Offline grace period is active (not expired)');
        // Mock grace period expiration: set lastVerifiedAt to 35 days ago
        console.log(`${YELLOW}⚡ Simulating offline operations for 35 days (exceeding 30-day grace limit)...${RESET}`);
        const thirtyFiveDaysAgo = new Date();
        thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
        await db_service_1.dbService.client.userSubscription.update({
            where: { userId: testUserId },
            data: {
                lastVerifiedAt: thirtyFiveDaysAgo,
            },
        });
        const statusExpiredRes = mockResponse();
        await (0, payment_controller_1.getSubscriptionStatus)(statusReq, statusExpiredRes);
        assert(statusExpiredRes.statusCode === 200, 'Query expired status returns 200 OK');
        assert(statusExpiredRes.body.isOfflineGraceExpired === true, 'Offline grace limit correctly flagged as expired');
        assert(statusExpiredRes.body.tier === 'OFFLINE_EXPIRED', 'Tier drops down to "OFFLINE_EXPIRED" to restrict UI view');
        assert(statusExpiredRes.body.offlineDurationDays >= 35, 'Offline duration correctly computed in days');
        // ----------------------------------------------------
        // TEST 4: Subscription Cancel/Delete Hook Synchronization
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 4] Webhook Subscription Cancellation Synchronization${RESET}`);
        const cancelPayload = {
            id: 'evt_test_deleted_123',
            object: 'event',
            type: 'customer.subscription.deleted',
            data: {
                object: {
                    customer: 'cus_test_stripe_customer_789',
                    status: 'canceled',
                },
            },
        };
        const cancelRawBody = Buffer.from(JSON.stringify(cancelPayload));
        const cancelSignature = stripeInstance.webhooks.generateTestHeaderString({
            payload: JSON.stringify(cancelPayload),
            secret: env_1.env.STRIPE_WEBHOOK_SECRET,
        });
        const cancelWebhookReq = {
            headers: {
                'stripe-signature': cancelSignature,
            },
            rawBody: cancelRawBody,
        };
        const cancelWebhookRes = mockResponse();
        await (0, payment_controller_1.handleStripeWebhook)(cancelWebhookReq, cancelWebhookRes);
        assert(cancelWebhookRes.statusCode === 200, 'Cancel webhook returns 200 OK');
        const updatedSub = await db_service_1.dbService.client.userSubscription.findUnique({
            where: { userId: testUserId },
        });
        assert(updatedSub?.stripeStatus === 'canceled', 'Subscription status successfully updated to "canceled" in DB');
        // ----------------------------------------------------
        // CLEANUP
        // ----------------------------------------------------
        console.log(`\n${YELLOW}🧹 Initiating database cleanup...${RESET}`);
        await db_service_1.dbService.client.userSubscription.deleteMany({
            where: { userId: testUserId },
        });
        await db_service_1.dbService.client.user.delete({
            where: { id: testUserId },
        });
        console.log(`${GREEN}✔ Cleanup finished. Removed mock users and subscriptions.${RESET}`);
        // Disconnect
        await db_service_1.dbService.disconnect();
    }
    catch (error) {
        console.error(`\n${RED}💥 Critical test execution crash: ${error.message}${RESET}`);
        console.error(error);
        failedTests++;
    }
    finally {
        // Restore original values and stubs
        env_1.env.STRIPE_SECRET_KEY = originalStripeKey;
        env_1.env.STRIPE_PRICE_ID = originalPriceId;
        env_1.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
        require.cache[stripePath].exports = OriginalStripe;
    }
    // ----------------------------------------------------
    // TEST SUITE REPORT
    // ----------------------------------------------------
    console.log(`\n==================================================`);
    console.log(`📊 FINAL TEST REPORT`);
    console.log(`==================================================`);
    if (failedTests === 0) {
        console.log(`${GREEN}★ ALL PAYMENT TESTS PASSED SUCCESSFULLY! (0 failures)${RESET}`);
        process.exit(0);
    }
    else {
        console.log(`${RED}🚨 TEST SUITE COMPLETED WITH FAILURES (${failedTests} failures)${RESET}`);
        process.exit(1);
    }
}
runTests();
