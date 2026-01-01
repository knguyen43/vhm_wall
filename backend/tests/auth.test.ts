import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

describe('auth', () => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'Password123';
  let token = '';

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it('registers a user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email, password });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    token = res.body.data.token;
  });

  it('logs in the user', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
  });

  it('returns current user from /me', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(email);
  });
});
