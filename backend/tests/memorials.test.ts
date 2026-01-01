import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

describe('memorials', () => {
  const email = `memorial-${Date.now()}@example.com`;
  const password = 'Password123';
  let token = '';
  let personId = '';

  beforeAll(async () => {
    const register = await request(app).post('/api/v1/auth/register').send({ email, password });
    token = register.body.data.token;
    const person = await prisma.person.create({ data: { firstName: 'Lan', lastName: 'Nguyen' } });
    personId = person.id;
  });

  afterAll(async () => {
    if (personId) {
      await prisma.remembrance.deleteMany({ where: { memorial: { personId } } });
      await prisma.virtualOffering.deleteMany({ where: { memorial: { personId } } });
      await prisma.memorialReminder.deleteMany({ where: { memorial: { personId } } });
      await prisma.memorial.deleteMany({ where: { personId } });
      await prisma.person.deleteMany({ where: { id: personId } });
    }
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it('adds a remembrance', async () => {
    const res = await request(app)
      .post(`/api/v1/memorials/${personId}/remembrances`)
      .send({ message: 'In memory', authorName: 'Test' });
    expect(res.status).toBe(201);
  });

  it('adds an offering', async () => {
    const res = await request(app)
      .post(`/api/v1/memorials/${personId}/offerings`)
      .send({ offeringType: 'CANDLE', message: 'Light' });
    expect(res.status).toBe(201);
  });

  it('creates a reminder (auth)', async () => {
    const res = await request(app)
      .post(`/api/v1/memorials/${personId}/reminders`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Anniversary', date: new Date().toISOString(), frequency: 'ONCE' });
    expect(res.status).toBe(201);
  });
});
