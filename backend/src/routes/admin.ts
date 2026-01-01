import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { adminMiddleware, authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/submissions', async (req, res, next) => {
  try {
    const contributions = await prisma.contribution.findMany({
      where: { status: 'PENDING' },
      orderBy: { submittedAt: 'desc' },
      take: 50
    });
    const remembrances = await prisma.remembrance.findMany({
      where: { approved: false },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      data: { contributions, remembrances }
    });
  } catch (err) {
    next(err);
  }
});

router.put('/remembrances/:id/approve', async (req, res, next) => {
  try {
    const remembrance = await prisma.remembrance.update({
      where: { id: req.params.id },
      data: { approved: true }
    });
    res.json({ success: true, data: remembrance });
  } catch (err) {
    next(err);
  }
});

router.put('/contributions/:id/approve', async (req, res, next) => {
  try {
    const contribution = await prisma.contribution.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED' }
    });
    res.json({ success: true, data: contribution });
  } catch (err) {
    next(err);
  }
});

router.put('/contributions/:id/reject', async (req, res, next) => {
  try {
    const contribution = await prisma.contribution.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' }
    });
    res.json({ success: true, data: contribution });
  } catch (err) {
    next(err);
  }
});

export default router;
