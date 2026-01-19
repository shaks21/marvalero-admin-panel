import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { ExecutionContext } from '@nestjs/common';

describe('AdminController (Unit)', () => {
  let controller: AdminController;
  let adminService: Partial<AdminService>;

  beforeEach(async () => {
    // Mock AdminService
    adminService = {
      admin: jest.fn().mockImplementation(({ id }) => ({ id, email: 'test@example.com', passwordHash: 'hash' })),
      createAdmin: jest.fn().mockImplementation((data) => ({ id: '1', ...data })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: adminService }],
    })
    // Override guard to bypass JWT
    .overrideGuard(AdminGuard)
    .useValue({
      canActivate: (context: ExecutionContext) => true,
    })
    .compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('ping should return admin info', () => {
    const req = { user: { adminId: '123' } };
    const result = controller.ping(req as any);
    expect(result).toEqual({ message: 'Admin authenticated', adminId: '123' });
  });

  it('getAdminById should return admin', async () => {
    const result = await controller.getAdminById('1');
    expect(result).toEqual({ id: '1', email: 'test@example.com', passwordHash: 'hash' });
  });

  it('signupAdmin should create admin', async () => {
    const data = { email: 'new@example.com', password: 'pass' };
    const result = await controller.signupAdmin(data);
    expect(result).toEqual({ id: '1', ...data });
  });
});

// ✅ Notes:

// AdminService is fully mocked.

// AdminGuard is overridden to always allow access.

// Tests controller methods directly without starting the server