import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { dbService } from '../services/db.service';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * 1. User Registration Handler (Sign-up)
 * Hashes passwords securely via bcrypt before saving to PostgreSQL.
 */
export async function signup(req: Request, res: Response): Promise<void> {
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
    const existingUser = await dbService.client.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logger.warn({ email }, '[Auth Controller] Signup failed: Email already registered.');
      res.status(409).json({ error: 'Email address is already in use.' });
      return;
    }

    // Securely hash the password using 10 salt rounds
    const hashedPassword = await bcrypt.hash(password, 10);

    // Persist user in Postgres database
    const newUser = await dbService.client.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    logger.info({ email: newUser.email, id: newUser.id }, '[Auth Controller] User registered successfully.');

    // Respond with clean user DTO (excluding hashed password)
    res.status(201).json({
      status: 'OK',
      user: {
        id: newUser.id,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error: any) {
    logger.error(error, '[Auth Controller] Signup pipeline failed:');
    res.status(500).json({ error: 'Failed to complete user registration.' });
  }
}

/**
 * 2. User Authentication Handler (Login)
 * Validates credentials and issues a Supabase-compatible JWT token.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  try {
    // Fetch user details
    const user = await dbService.client.user.findUnique({
      where: { email },
    });

    if (!user) {
      logger.warn({ email }, '[Auth Controller] Login failed: User not found.');
      res.status(401).json({ error: 'Access Denied: Invalid email or password.' });
      return;
    }

    // Compare bcrypt hashes
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      logger.warn({ email }, '[Auth Controller] Login failed: Password mismatch.');
      res.status(401).json({ error: 'Access Denied: Invalid email or password.' });
      return;
    }

    // Generate signed Supabase GoTrue-aligned claims JWT token
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: 'authenticated',
        app_metadata: {
          provider: 'local',
        },
        user_metadata: {},
      },
      env.JWT_SECRET,
      { expiresIn: '24h' } // MVP 24h expiration limit
    );

    logger.info({ email: user.email, id: user.id }, '[Auth Controller] User authenticated successfully.');

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
  } catch (error: any) {
    logger.error(error, '[Auth Controller] Login pipeline failed:');
    res.status(500).json({ error: 'Failed to complete user authentication.' });
  }
}
