import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

describe('persons', () => {
  const email = `person-${Date.now()}@example.com`;
  const password = 'Password123';
  let token = '';
  let personId = '';

  beforeAll(async () => {
    const register = await request(app).post('/api/v1/auth/register').send({ email, password });
    token = register.body.data.token;
  });

  afterAll(async () => {
    if (personId) {
      await prisma.person.deleteMany({ where: { id: personId } });
    }
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it('creates a person', async () => {
    const res = await request(app)
      .post('/api/v1/persons')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Anh', lastName: 'Tran' });
    expect(res.status).toBe(201);
    personId = res.body.data.id;
  });

  it('lists persons', async () => {
    const res = await request(app).get('/api/v1/persons');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
