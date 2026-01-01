import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

describe('photos', () => {
  const email = `photo-${Date.now()}@example.com`;
  const password = 'Password123';
  let token = '';
  let personId = '';
  let uploadedPath = '';

  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
  const pngBuffer = Buffer.from(pngBase64, 'base64');

  beforeAll(async () => {
    const register = await request(app).post('/api/v1/auth/register').send({ email, password });
    token = register.body.data.token;
    const person = await prisma.person.create({ data: { firstName: 'Minh', lastName: 'Le' } });
    personId = person.id;
  });

  afterAll(async () => {
    if (uploadedPath && fs.existsSync(uploadedPath)) {
      fs.unlinkSync(uploadedPath);
    }
    if (personId) {
      await prisma.photo.deleteMany({ where: { personId } });
      await prisma.memorial.deleteMany({ where: { personId } });
      await prisma.person.deleteMany({ where: { id: personId } });
    }
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it('uploads a photo', async () => {
    const res = await request(app)
      .post(`/api/v1/photos/${personId}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', pngBuffer, { filename: 'test.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.data.url).toContain('/uploads/');
    const filename = res.body.data.url.split('/uploads/')[1];
    uploadedPath = path.join(process.cwd(), 'uploads', filename);
  });
});
