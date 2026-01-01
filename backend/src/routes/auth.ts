import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { prisma } from '../lib/prisma';
import { authRateLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validation';

const router = Router();

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const signToken = (payload: { userId: string; email: string }): string => {
  const secret = process.env.JWT_SECRET || 'change-me';
  return jwt.sign(payload, secret, { expiresIn: '24h' });
};

router.post('/register', authRateLimiter, validateBody(registerSchema), async (req, res, next) => {
  try {
    const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_IN_USE', message: 'Email already registered' }
      });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await prisma.user.create({
      data: {
        email: req.body.email,
        passwordHash
      }
    });

    const token = signToken({ userId: user.id, email: user.email });

    return res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email },
        token
      }
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/login', authRateLimiter, validateBody(loginSchema), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    const match = await bcrypt.compare(req.body.password, user.passwordHash);
    if (!match) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    const token = signToken({ userId: user.id, email: user.email });

    return res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email },
        token
      }
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_TOKEN', message: 'Missing authorization token' }
    });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid token format' }
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'change-me';
    const decoded = jwt.verify(token, secret) as { userId: string; email: string };
    return res.json({
      success: true,
      data: { id: decoded.userId, email: decoded.email }
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
    });
  }
});

export default router;
