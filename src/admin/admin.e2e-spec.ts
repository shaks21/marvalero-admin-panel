import { Test } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AdminModule } from './admin.module.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';

describe('AdminModule (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AdminModule],
    })
    .overrideGuard(AdminGuard)
    .useValue({ canActivate: () => true }) // Bypass JWT for testing
    .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/admin/ping (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/admin/ping');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Admin authenticated', adminId: undefined });
  });

  it('/admin/dashboard (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/admin/dashboard');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Admin dashboard' });
  });

  it('/admin/:id (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/admin/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: '1', email: 'test@example.com', passwordHash: 'hash' });
  });

  it('/admin (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin')
      .send({ email: 'new@example.com', password: 'pass' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: '1', email: 'new@example.com', password: 'pass' });
  });
});

// ✅ Notes:

// Uses Supertest to simulate HTTP requests.

// Guard is overridden globally with .overrideGuard(AdminGuard) to avoid JWT issues.

// Tests all main routes: ping, dashboard, getAdminById, and signupAdmin.