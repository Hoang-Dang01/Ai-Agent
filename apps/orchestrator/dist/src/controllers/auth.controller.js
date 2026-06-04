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
exports.signup = signup;
exports.login = login;
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const db_service_1 = require("../services/db.service");
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
/**
 * 1. User Registration Handler (Sign-up)
 * Hashes passwords securely via bcrypt before saving to PostgreSQL.
 */
async function signup(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
    }
    if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters long.' });
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Invalid email address format.' });
        return;
    }
    try {
        // Check if user already exists
        const existingUser = await db_service_1.dbService.client.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            logger_1.logger.warn({ email }, '[Auth Controller] Signup failed: Email already registered.');
            res.status(409).json({ error: 'Email address is already in use.' });
            return;
        }
        // Securely hash the password using 10 salt rounds
        const hashedPassword = await bcrypt.hash(password, 10);
        // Persist user in Postgres database
        const newUser = await db_service_1.dbService.client.user.create({
            data: {
                email,
                password: hashedPassword,
            },
        });
        logger_1.logger.info({ email: newUser.email, id: newUser.id }, '[Auth Controller] User registered successfully.');
        // Respond with clean user DTO (excluding hashed password)
        res.status(201).json({
            status: 'OK',
            user: {
                id: newUser.id,
                email: newUser.email,
                createdAt: newUser.createdAt,
            },
        });
    }
    catch (error) {
        logger_1.logger.error(error, '[Auth Controller] Signup pipeline failed:');
        res.status(500).json({ error: 'Failed to complete user registration.' });
    }
}
/**
 * 2. User Authentication Handler (Login)
 * Validates credentials and issues a Supabase-compatible JWT token.
 */
async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
    }
    try {
        // Fetch user details
        const user = await db_service_1.dbService.client.user.findUnique({
            where: { email },
        });
        if (!user) {
            logger_1.logger.warn({ email }, '[Auth Controller] Login failed: User not found.');
            res.status(401).json({ error: 'Access Denied: Invalid email or password.' });
            return;
        }
        // Compare bcrypt hashes
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            logger_1.logger.warn({ email }, '[Auth Controller] Login failed: Password mismatch.');
            res.status(401).json({ error: 'Access Denied: Invalid email or password.' });
            return;
        }
        // Generate signed Supabase GoTrue-aligned claims JWT token
        const token = jwt.sign({
            sub: user.id,
            email: user.email,
            role: 'authenticated',
            app_metadata: {
                provider: 'local',
            },
            user_metadata: {},
        }, env_1.env.JWT_SECRET, { expiresIn: '24h' } // MVP 24h expiration limit
        );
        logger_1.logger.info({ email: user.email, id: user.id }, '[Auth Controller] User authenticated successfully.');
        res.json({
            status: 'OK',
            access_token: token,
            token_type: 'Bearer',
            expires_in: 86400, // 24 hours in seconds
            user: {
                id: user.id,
                email: user.email,
            },
        });
    }
    catch (error) {
        logger_1.logger.error(error, '[Auth Controller] Login pipeline failed:');
        res.status(500).json({ error: 'Failed to complete user authentication.' });
    }
}
