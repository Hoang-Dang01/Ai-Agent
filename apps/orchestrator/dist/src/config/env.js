"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
// Load .env from root or active folder
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config(); // Fallback to local app .env
exports.env = {
    PORT: parseInt(process.env.PORT || '4000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || process.env.DB_URL || '',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    JWT_SECRET: process.env.JWT_SECRET || 'replace_this_with_a_secure_jwt_secret_key_in_production',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    AI_ENGINE_URL: process.env.AI_ENGINE_URL || 'http://localhost:8000',
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/chat',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
    STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID || '',
};
// Validate critical variables on startup
const missingVars = [];
if (!exports.env.DATABASE_URL) {
    missingVars.push('DATABASE_URL or DB_URL');
}
if (!exports.env.REDIS_URL) {
    missingVars.push('REDIS_URL');
}
if (exports.env.NODE_ENV === 'production' && exports.env.JWT_SECRET === 'replace_this_with_a_secure_jwt_secret_key_in_production') {
    console.warn('[Warning] Using default JWT secret in production mode is dangerous.');
}
if (missingVars.length > 0) {
    const errorMessage = `[Secrets Management Collapse] Missing critical environment variables on boot: ${missingVars.join(', ')}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
}
