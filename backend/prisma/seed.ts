import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const run = async (): Promise<void> => {
  await prisma.familyRelationship.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.memorialReminder.deleteMany();
  await prisma.virtualOffering.deleteMany();
  await prisma.remembrance.deleteMany();
  await prisma.memorial.deleteMany();
  await prisma.person.deleteMany();
  await prisma.cemetery.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('DemoPass123', 12);
  await prisma.user.create({
    data: {
      email: 'demo@vhm.org',
      passwordHash
    }
  });

  const location1 = await prisma.location.create({
    data: { name: 'Saigon', city: 'Ho Chi Minh City', country: 'Vietnam' }
  });
  const location2 = await prisma.location.create({
    data: { name: 'Garden of Serenity', city: 'San Jose', country: 'USA' }
  });

  const cemetery = await prisma.cemetery.create({
    data: {
      name: 'Garden of Serenity',
      locationId: location2.id
    }
  });

  const personA = await prisma.person.create({
    data: {
      firstName: 'Minh',
      lastName: 'Tran',
      dateOfBirth: new Date('1954-04-07'),
      dateOfDeath: new Date('1988-06-04'),
      causeOfDeath: 'Lost at sea while seeking freedom',
      placeOfBirthId: location1.id,
      placeOfDeathId: location2.id,
      cemeteryId: cemetery.id
    }
  });

  const personB = await prisma.person.create({
    data: {
      firstName: 'Lan',
      lastName: 'Nguyen',
      dateOfBirth: new Date('1969-01-01'),
      dateOfDeath: new Date('1989-05-12'),
      causeOfDeath: 'Perished during the journey',
      placeOfBirthId: location1.id,
      placeOfDeathId: location2.id,
      cemeteryId: cemetery.id
    }
  });

  await prisma.familyRelationship.create({
    data: {
      personId: personA.id,
      relatedPersonId: personB.id,
      relationshipType: 'SPOUSE'
    }
  });

  const memorialA = await prisma.memorial.create({
    data: { personId: personA.id }
  });

  await prisma.remembrance.create({
    data: {
      memorialId: memorialA.id,
      message: 'Forever remembered for courage and love.',
      authorName: 'Family',
      approved: true,
      isPublic: true
    }
  });

  await prisma.virtualOffering.create({
    data: {
      memorialId: memorialA.id,
      offeringType: 'CANDLE',
      message: 'A light in our hearts'
    }
  });

  await prisma.photo.create({
    data: {
      personId: personA.id,
      url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=320&q=80',
      caption: 'In memory',
      isPrimary: true
    }
  });
};

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
