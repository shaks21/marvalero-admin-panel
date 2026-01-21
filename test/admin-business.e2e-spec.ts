import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { AuditInterceptor } from '../src/audit/audit.interceptor.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import Stripe from 'stripe';

// Define the type for our mock
// Define the type for our mock with proper Generics
type StripeMock = {
  subscriptions: {
    // jest.fn<ReturnType, ParameterTypes>
    list: jest.Mock<() => Promise<{ data: any[] }>>;
    cancel: jest.Mock<() => Promise<{ id: string; status: string }>>;
  };
  paymentIntents: {
    list: jest.Mock<() => Promise<{ data: any[] }>>;
  };
};

describe('Admin Business Features (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let businessId: string;
  let stripeMock: StripeMock; // ✅ Type annotation added
  let prisma: PrismaService;

  beforeAll(async () => {
    stripeMock = {
      subscriptions: {
        // TypeScript now knows this returns a Promise with a 'data' array
        list: jest.fn<() => Promise<{ data: any[] }>>().mockResolvedValue({
          data: [
            {
              id: 'sub_test_123',
              status: 'active',
              plan: { product: { name: 'Mock Product' } },
            },
          ],
        }),
        cancel: jest
          .fn<() => Promise<{ id: string; status: string }>>()
          .mockResolvedValue({
            id: 'sub_test_123',
            status: 'canceled',
          }),
      },
      paymentIntents: {
        list: jest.fn<() => Promise<{ data: any[] }>>().mockResolvedValue({
          data: [
            {
              id: 'pi_test_123',
              amount: 1000,
              currency: 'usd',
              status: 'succeeded',
            },
          ],
        }),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('STRIPE_CLIENT')
      .useValue(stripeMock)
      .compile();

    app = moduleFixture.createNestApplication();

    // apply global interceptors same as other tests
    const auditInterceptor = app.get(AuditInterceptor);
    app.useGlobalInterceptors(auditInterceptor);

    await app.init();

    // 💡 GET PRISMA SERVICE INSTANCE
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    /**
     * Login as admin
     */
    const loginRes = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({
        email: 'admin@marvalero.com',
        password: 'admin123',
      });

    adminToken = loginRes.body.accessToken;
    if (!adminToken) {
      throw new Error('Admin login failed, no token received');
    }

    /**
     * Find a business to operate on
     */
    const res = await request(app.getHttpServer())
      .get('/admin/business/businesses')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200); // ✅ Add this

    expect(Array.isArray(res.body)).toBe(true); // ✅ Service returns array
    expect(res.body.length).toBeGreaterThan(0); // ✅ Check array length
    businessId = res.body[0].id; // ✅ Get business ID from array item

    console.log(`Using business ID for tests: ${businessId}`);
  });

  /**
   * 1️⃣ Get business profile
   */
  it('fetches business profile', async () => {
    const res = await request(app.getHttpServer())
      .get(`/admin/business/${businessId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email');
  });

  /**
   * 2️⃣ Get subscription list
   */
  it('returns subscription list', async () => {
    const res = await request(app.getHttpServer())
      .get(`/admin/business/${businessId}/subscription`)
      .set('Authorization', `Bearer ${adminToken}`);

    // If no Stripe data, might 404 — assert shape accordingly
    if (res.status === 404) {
      expect(res.body.message).toMatch(/Stripe customer not linked/);
    } else {
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  /**
   * 3️⃣ Get payments list
   */
  it('returns payments list', async () => {
    const res = await request(app.getHttpServer())
      .get(`/admin/business/${businessId}/payments`)
      .set('Authorization', `Bearer ${adminToken}`);

    if (res.status === 404) {
      expect(res.body.message).toMatch(/Stripe customer not linked/);
    } else {
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  /**
   * 4️⃣ Cancel subscription — if exists
   */
  it('cancels a subscription if present and updates DB', async () => {
    const cancelRes = await request(app.getHttpServer())
      .patch(`/admin/business/${businessId}/cancel-subscription`)
      .set('Authorization', `Bearer ${adminToken}`);

    // If no subscription ID stored — expect NOT_FOUND
    if (cancelRes.status === 404) {
      expect(cancelRes.body.message).toMatch(/not linked/);
    } else {
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body).toHaveProperty('success', true);
      expect(cancelRes.body).toHaveProperty('status');

      // After cancellation, DB field should be null
      const updatedBiz = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!updatedBiz) throw new Error('Business not found after cancellation');

      expect(updatedBiz.stripeSubscriptionId).toBeNull();
    }
  });

  /**
   * 5️⃣ Unauthorized access should be rejected
   */
  it('rejects without authentication', async () => {
    await request(app.getHttpServer())
      .get(`/admin/business/${businessId}`)
      .expect(401);
  });

  /**
   * 6️⃣ Invalid business ID should 404
   */
  it('handles invalid business IDs gracefully', async () => {
    await request(app.getHttpServer())
      .get('/admin/business/invalid-id')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  /**
   * 7️⃣ Verify Stripe mock was called
   */
  it('should call stripe API for subscription list', async () => {
    const res = await request(app.getHttpServer())
      .get(`/admin/business/${businessId}/subscription`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Since we're mocking, this should return 200 with mock data
    expect(res.status).toBe(200);
    expect(stripeMock.subscriptions.list).toHaveBeenCalled();
  });

  afterAll(async () => {
    await app.close();
  });
});
