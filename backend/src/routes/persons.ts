import { Router } from 'express';
import Joi from 'joi';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

const personSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  dateOfBirth: Joi.date().iso().optional(),
  dateOfDeath: Joi.date().iso().optional(),
  causeOfDeath: Joi.string().max(255).optional(),
  placeOfBirthId: Joi.string().optional(),
  placeOfDeathId: Joi.string().optional(),
  cemeteryId: Joi.string().optional()
});

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [persons, total] = await Promise.all([
      prisma.person.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.person.count()
    ]);

    res.json({
      success: true,
      data: persons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const person = await prisma.person.findUnique({ where: { id: req.params.id } });
    if (!person) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Person not found' }
      });
    }

    return res.json({ success: true, data: person });
  } catch (err) {
    return next(err);
  }
});

router.post('/', authMiddleware, validateBody(personSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const person = await prisma.person.create({ data: req.body });
    await prisma.contribution.create({
      data: {
        userId: req.user?.id,
        personId: person.id,
        type: 'PERSON_CREATE',
        data: req.body
      }
    });
    return res.status(201).json({ success: true, data: person });
  } catch (err) {
    return next(err);
  }
});

router.put('/:id', authMiddleware, validateBody(personSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const person = await prisma.person.update({
      where: { id: req.params.id },
      data: req.body
    });
    await prisma.contribution.create({
      data: {
        userId: req.user?.id,
        personId: person.id,
        type: 'PERSON_UPDATE',
        data: req.body
      }
    });
    return res.json({ success: true, data: person });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    await prisma.person.delete({ where: { id: req.params.id } });
    return res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    return next(err);
  }
});

export default router;
