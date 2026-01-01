import { Router } from 'express';
import Joi from 'joi';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

const locationSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  city: Joi.string().max(100).optional(),
  country: Joi.string().min(1).max(100).required()
});

router.get('/', async (req, res, next) => {
  try {
    const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: locations });
  } catch (err) {
    next(err);
  }
});

router.post('/', authMiddleware, validateBody(locationSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const location = await prisma.location.create({ data: req.body });
    res.status(201).json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
});

export default router;
