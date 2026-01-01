import { Router } from 'express';
import Joi from 'joi';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

const relationshipSchema = Joi.object({
  relatedPersonId: Joi.string().required(),
  relationshipType: Joi.string().valid(
    'PARENT',
    'CHILD',
    'SPOUSE',
    'SIBLING',
    'GRANDPARENT',
    'GRANDCHILD',
    'AUNT_UNCLE',
    'NIECE_NEPHEW',
    'COUSIN',
    'OTHER'
  ).required()
});

router.get('/:personId', async (req, res, next) => {
  try {
    const relationships = await prisma.familyRelationship.findMany({
      where: {
        OR: [
          { personId: req.params.personId },
          { relatedPersonId: req.params.personId }
        ]
      },
      include: {
        person: true,
        relatedPerson: true
      }
    });
    res.json({ success: true, data: relationships });
  } catch (err) {
    next(err);
  }
});

router.post('/:personId', authMiddleware, validateBody(relationshipSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const relationship = await prisma.familyRelationship.create({
      data: {
        personId: req.params.personId,
        relatedPersonId: req.body.relatedPersonId,
        relationshipType: req.body.relationshipType
      }
    });
    res.status(201).json({ success: true, data: relationship });
  } catch (err) {
    next(err);
  }
});

export default router;
