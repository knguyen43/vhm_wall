import { Router } from 'express';
import Joi from 'joi';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

const remembranceSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
  authorName: Joi.string().max(100).optional(),
  isPublic: Joi.boolean().default(true)
});

const offeringSchema = Joi.object({
  offeringType: Joi.string().valid('CANDLE', 'FLOWER', 'INCENSE', 'PRAYER').required(),
  message: Joi.string().max(500).optional(),
  authorName: Joi.string().max(100).optional()
});

const reminderSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  date: Joi.date().required(),
  frequency: Joi.string().valid('ONCE', 'YEARLY', 'MONTHLY').default('ONCE')
});

const getOrCreateMemorial = async (personId: string) => {
  const existing = await prisma.memorial.findUnique({ where: { personId } });
  if (existing) return existing;
  return prisma.memorial.create({ data: { personId } });
};

router.get('/:personId/remembrances', async (req, res, next) => {
  try {
    const remembrances = await prisma.remembrance.findMany({
      where: {
        memorial: { personId: req.params.personId },
        approved: true,
        isPublic: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: remembrances });
  } catch (err) {
    next(err);
  }
});

router.post('/:personId/remembrances', validateBody(remembranceSchema), async (req, res, next) => {
  try {
    const memorial = await getOrCreateMemorial(req.params.personId);
    const remembrance = await prisma.remembrance.create({
      data: {
        memorialId: memorial.id,
        message: req.body.message,
        authorName: req.body.authorName,
        isPublic: req.body.isPublic,
        approved: false
      }
    });
    await prisma.contribution.create({
      data: {
        personId: req.params.personId,
        type: 'REMEMBRANCE',
        data: {
          memorialId: memorial.id,
          message: req.body.message,
          authorName: req.body.authorName,
          isPublic: req.body.isPublic
        }
      }
    });

    res.status(201).json({ success: true, data: remembrance });
  } catch (err) {
    next(err);
  }
});

router.get('/:personId/offerings', async (req, res, next) => {
  try {
    const memorial = await prisma.memorial.findUnique({
      where: { personId: req.params.personId }
    });

    if (!memorial) {
      return res.json({
        success: true,
        data: { totalCount: 0, counts: {}, recent: [] }
      });
    }

    const [totalCount, counts, recent] = await Promise.all([
      prisma.virtualOffering.count({ where: { memorialId: memorial.id } }),
      prisma.virtualOffering.groupBy({
        by: ['offeringType'],
        where: { memorialId: memorial.id },
        _count: { offeringType: true }
      }),
      prisma.virtualOffering.findMany({
        where: { memorialId: memorial.id },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ]);

    const countMap = counts.reduce<Record<string, number>>((acc, item) => {
      acc[item.offeringType] = item._count.offeringType;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalCount,
        counts: countMap,
        recent
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:personId/offerings', validateBody(offeringSchema), async (req, res, next) => {
  try {
    const memorial = await getOrCreateMemorial(req.params.personId);
    const offering = await prisma.virtualOffering.create({
      data: {
        memorialId: memorial.id,
        offeringType: req.body.offeringType,
        message: req.body.message,
        authorName: req.body.authorName
      }
    });
    await prisma.contribution.create({
      data: {
        personId: req.params.personId,
        type: 'OFFERING',
        data: {
          memorialId: memorial.id,
          offeringType: req.body.offeringType,
          message: req.body.message,
          authorName: req.body.authorName
        }
      }
    });

    res.status(201).json({ success: true, data: offering });
  } catch (err) {
    next(err);
  }
});

router.get('/:personId/reminders', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const reminders = await prisma.memorialReminder.findMany({
      where: {
        userId: req.user?.id,
        memorial: { personId: req.params.personId },
        active: true
      },
      orderBy: { date: 'asc' }
    });
    res.json({ success: true, data: reminders });
  } catch (err) {
    next(err);
  }
});

router.post('/:personId/reminders', authMiddleware, validateBody(reminderSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const memorial = await getOrCreateMemorial(req.params.personId);
    const reminder = await prisma.memorialReminder.create({
      data: {
        userId: req.user?.id as string,
        memorialId: memorial.id,
        title: req.body.title,
        date: req.body.date,
        frequency: req.body.frequency
      }
    });

    res.status(201).json({ success: true, data: reminder });
  } catch (err) {
    next(err);
  }
});

router.delete('/reminders/:id', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const reminder = await prisma.memorialReminder.findUnique({
      where: { id: req.params.id }
    });
    if (!reminder || reminder.userId !== req.user?.id) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Reminder not found' }
      });
    }

    await prisma.memorialReminder.update({
      where: { id: req.params.id },
      data: { active: false }
    });

    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
});

export default router;
