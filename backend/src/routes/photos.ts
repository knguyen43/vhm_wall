/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { uploadRateLimiter } from '../middleware/rateLimiter';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => cb(null, uploadDir),
  filename: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, safeName);
  }
});

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 5 },
  fileFilter: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(ext)) {
      return cb(new Error('Only JPG, PNG, or WebP images are allowed'));
    }
    cb(null, true);
  }
});

const uploadSingle = upload.single('photo') as any;

router.post('/:personId', authMiddleware, uploadRateLimiter, uploadSingle, async (req: AuthenticatedRequest & { file?: any }, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' }
      });
    }

    const caption = typeof req.body.caption === 'string' ? req.body.caption.trim() : undefined;
    if (caption && caption.length > 200) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Caption must be 200 characters or less' }
      });
    }

    const url = `/uploads/${req.file.filename}`;
    const photo = await prisma.photo.create({
      data: {
        personId: req.params.personId,
        url,
        thumbnailUrl: url,
        caption,
        isPrimary: req.body.isPrimary === 'true'
      }
    });

    res.status(201).json({ success: true, data: photo });
  } catch (err) {
    next(err);
  }
});

router.get('/:personId', async (req, res, next) => {
  try {
    const photos = await prisma.photo.findMany({
      where: { personId: req.params.personId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: photos });
  } catch (err) {
    next(err);
  }
});

router.put('/:photoId/primary', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const photo = await prisma.photo.findUnique({ where: { id: req.params.photoId } });
    if (!photo) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Photo not found' }
      });
    }

    await prisma.$transaction([
      prisma.photo.updateMany({
        where: { personId: photo.personId },
        data: { isPrimary: false }
      }),
      prisma.photo.update({
        where: { id: photo.id },
        data: { isPrimary: true }
      })
    ]);

    const updated = await prisma.photo.findUnique({ where: { id: photo.id } });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
