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
exports.authMiddleware = authMiddleware;
const jwt = __importStar(require("jsonwebtoken"));
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
const db_service_1 = require("../services/db.service");
async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger_1.logger.warn({ path: req.path }, '[Auth Middleware] Missing or invalid authorization header');
        res.status(401).json({ error: 'Access Denied: Missing or invalid token format.' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, env_1.env.JWT_SECRET, {
            algorithms: ['HS256'],
        });
        const userId = decoded.sub || decoded.id;
        if (!userId || !decoded.email || decoded.role !== 'authenticated') {
            logger_1.logger.warn({ path: req.path, email: decoded.email, role: decoded.role }, '[Auth Middleware] Access Denied: Missing or invalid token claims.');
            res.status(403).json({ error: 'Access Denied: Missing or invalid token claims.' });
            return;
        }
        // Verify user still exists in database (Deleted User Protection)
        const dbUser = await db_service_1.dbService.client.user.findUnique({
            where: { id: userId },
            select: { id: true }
        });
        if (!dbUser) {
            logger_1.logger.warn({ userId, ip: req.ip, event: 'SECURITY_ACCESS_DENIED' }, '[Auth Middleware] Access Denied: User no longer exists in database.');
            res.status(403).json({ error: 'Access Denied: User no longer exists.' });
            return;
        }
        req.user = {
            id: userId,
            email: decoded.email,
        };
        next();
    }
    catch (error) {
        logger_1.logger.error(error, '[Auth Middleware] JWT token verification failed:');
        res.status(403).json({ error: 'Access Denied: Invalid or expired token.' });
    }
}
