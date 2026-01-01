import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { searchRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/persons', searchRateLimiter, async (req, res, next) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    const deathMonth = req.query.deathMonth ? parseInt(req.query.deathMonth as string, 10) : undefined;
    const deathYear = req.query.deathYear ? parseInt(req.query.deathYear as string, 10) : undefined;
    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const where = q
      ? {
          OR: [
            { firstName: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { lastName: { contains: q, mode: Prisma.QueryMode.insensitive } }
          ]
        }
      : {};

    const useMonthOnlyFilter = Boolean(deathMonth && !deathYear);

    if (deathYear && deathMonth) {
      const start = new Date(Date.UTC(deathYear, deathMonth - 1, 1));
      const end = new Date(Date.UTC(deathYear, deathMonth, 1));
      Object.assign(where, {
        dateOfDeath: {
          gte: start,
          lt: end
        }
      });
    } else if (deathYear) {
      const start = new Date(Date.UTC(deathYear, 0, 1));
      const end = new Date(Date.UTC(deathYear + 1, 0, 1));
      Object.assign(where, {
        dateOfDeath: {
          gte: start,
          lt: end
        }
      });
    } else if (deathMonth) {
      Object.assign(where, {
        dateOfDeath: {
          not: null
        }
      });
    }

    const include = {
      placeOfBirth: true,
      placeOfDeath: true,
      cemetery: {
        include: {
          location: true
        }
      },
      photos: {
        where: { isPrimary: true },
        take: 1
      },
      memorial: {
        include: {
          _count: {
            select: {
              remembrances: true,
              virtualOfferings: true
            }
          }
        }
      },
      _count: {
        select: {
          familyRelationships: true,
          relatedRelationships: true
        }
      }
    } as const;

    let persons: any[] = [];
    let total = 0;

    if (useMonthOnlyFilter && deathMonth) {
      try {
        const whereClauses = [
          Prisma.sql`"dateOfDeath" IS NOT NULL`,
          Prisma.sql`EXTRACT(MONTH FROM "dateOfDeath") = ${deathMonth}`
        ];

        if (q) {
          const like = `%${q}%`;
          whereClauses.push(
            Prisma.sql`("firstName" ILIKE ${like} OR "lastName" ILIKE ${like})`
          );
        }

        const whereSql = Prisma.join(whereClauses, Prisma.sql` AND `);

        const countRows = await prisma.$queryRaw<{ count: number }[]>(
          Prisma.sql`SELECT COUNT(*)::int AS count FROM "persons" WHERE ${whereSql}`
        );
        total = countRows[0]?.count || 0;

        const idRows = await prisma.$queryRaw<{ id: string }[]>(
          Prisma.sql`
            SELECT "id"
            FROM "persons"
            WHERE ${whereSql}
            ORDER BY "createdAt" DESC
            LIMIT ${limit}
            OFFSET ${skip}
          `
        );
        const ids = idRows.map((row) => row.id);

        persons = ids.length
          ? await prisma.person.findMany({
              where: { id: { in: ids } },
              orderBy: { createdAt: 'desc' },
              include
            })
          : [];
      } catch (err) {
        console.error('Month-only search SQL failed, falling back to in-memory filter', err);
        const allPersons = await prisma.person.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include
        });
        const filtered = allPersons.filter((person) => {
          if (!person.dateOfDeath) return false;
          return new Date(person.dateOfDeath).getUTCMonth() + 1 === deathMonth;
        });
        total = filtered.length;
        persons = filtered.slice(skip, skip + limit);
      }
    } else {
      const [pagePersons, totalCount] = await Promise.all([
        prisma.person.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include
        }),
        prisma.person.count({ where })
      ]);
      persons = pagePersons;
      total = totalCount;
    }

    const data = persons.map(({ _count, memorial, ...person }) => ({
      ...person,
      photos: person.photos || [],
      memorialActivity: {
        remembrances: memorial?._count?.remembrances || 0,
        offerings: memorial?._count?.virtualOfferings || 0
      },
      familyCount: (_count?.familyRelationships || 0) + (_count?.relatedRelationships || 0)
    }));

    res.json({
      success: true,
      data,
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

export default router;
