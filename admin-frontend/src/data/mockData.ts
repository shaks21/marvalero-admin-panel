// Mock data for Marvalero Admin Panel

export type UserType = 'business' | 'consumer' | 'influencer';
export type UserStatus = 'active' | 'disabled';
export type PaymentStatus = 'completed' | 'failed' | 'refunded' | 'disputed';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: UserType;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
  businessName?: string;
  subscription?: {
    plan: string;
    status: SubscriptionStatus;
    startDate: string;
    endDate: string;
    stripeSubscriptionId: string;
  };
}

export interface Payment {
  id: string;
  stripePaymentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description: string;
  createdAt: string;
  disputeStatus?: string;
}

export interface AdminAction {
  id: string;
  adminId: string;
  adminName: string;
  actionType: string;
  targetUserId: string;
  targetUserName: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  businessUsers: number;
  consumerUsers: number;
  influencerUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  dailyLogins: number;
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@acmecorp.com',
    phone: '+1 555-0101',
    type: 'business',
    status: 'active',
    createdAt: '2024-06-15T10:30:00Z',
    lastLoginAt: '2026-01-15T08:45:00Z',
    businessName: 'Acme Corporation',
    subscription: {
      plan: 'Professional',
      status: 'active',
      startDate: '2024-06-15',
      endDate: '2027-06-15',
      stripeSubscriptionId: 'sub_1234567890',
    },
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 555-0102',
    type: 'consumer',
    status: 'active',
    createdAt: '2024-08-20T14:20:00Z',
    lastLoginAt: '2026-01-14T16:30:00Z',
  },
  {
    id: '3',
    name: 'Mike Williams',
    email: 'mike@influencer.io',
    phone: '+1 555-0103',
    type: 'influencer',
    status: 'active',
    createdAt: '2024-09-10T09:00:00Z',
    lastLoginAt: '2026-01-15T07:15:00Z',
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.d@techstart.com',
    phone: '+1 555-0104',
    type: 'business',
    status: 'disabled',
    createdAt: '2024-05-01T11:45:00Z',
    lastLoginAt: '2025-12-01T10:00:00Z',
    businessName: 'TechStart Inc',
    subscription: {
      plan: 'Enterprise',
      status: 'cancelled',
      startDate: '2024-05-01',
      endDate: '2025-12-01',
      stripeSubscriptionId: 'sub_0987654321',
    },
  },
  {
    id: '5',
    name: 'David Brown',
    email: 'david.brown@gmail.com',
    phone: '+1 555-0105',
    type: 'consumer',
    status: 'active',
    createdAt: '2024-11-05T16:00:00Z',
    lastLoginAt: '2026-01-13T20:45:00Z',
  },
  {
    id: '6',
    name: 'Lisa Chen',
    email: 'lisa@socialstar.com',
    phone: '+1 555-0106',
    type: 'influencer',
    status: 'active',
    createdAt: '2024-07-22T08:30:00Z',
    lastLoginAt: '2026-01-15T09:00:00Z',
  },
  {
    id: '7',
    name: 'Robert Taylor',
    email: 'rob.taylor@globalinc.com',
    phone: '+1 555-0107',
    type: 'business',
    status: 'active',
    createdAt: '2024-04-10T13:15:00Z',
    lastLoginAt: '2026-01-12T14:20:00Z',
    businessName: 'Global Industries',
    subscription: {
      plan: 'Professional',
      status: 'active',
      startDate: '2024-04-10',
      endDate: '2027-04-10',
      stripeSubscriptionId: 'sub_1122334455',
    },
  },
  {
    id: '8',
    name: 'Amanda White',
    email: 'amanda.w@yahoo.com',
    phone: '+1 555-0108',
    type: 'consumer',
    status: 'disabled',
    createdAt: '2024-10-18T17:30:00Z',
    lastLoginAt: '2025-11-20T09:00:00Z',
  },
];

// Mock Payments
export const mockPayments: Payment[] = [
  {
    id: 'pay_1',
    stripePaymentId: 'pi_3N1234567890abcdef',
    userId: '1',
    userName: 'John Smith',
    userEmail: 'john.smith@acmecorp.com',
    amount: 99.00,
    currency: 'USD',
    status: 'completed',
    description: 'Professional Plan - Monthly',
    createdAt: '2026-01-01T10:00:00Z',
  },
  {
    id: 'pay_2',
    stripePaymentId: 'pi_3N2345678901bcdefg',
    userId: '7',
    userName: 'Robert Taylor',
    userEmail: 'rob.taylor@globalinc.com',
    amount: 99.00,
    currency: 'USD',
    status: 'completed',
    description: 'Professional Plan - Monthly',
    createdAt: '2026-01-02T11:30:00Z',
  },
  {
    id: 'pay_3',
    stripePaymentId: 'pi_3N3456789012cdefgh',
    userId: '4',
    userName: 'Emily Davis',
    userEmail: 'emily.d@techstart.com',
    amount: 299.00,
    currency: 'USD',
    status: 'failed',
    description: 'Enterprise Plan - Monthly',
    createdAt: '2025-12-15T14:00:00Z',
  },
  {
    id: 'pay_4',
    stripePaymentId: 'pi_3N4567890123defghi',
    userId: '1',
    userName: 'John Smith',
    userEmail: 'john.smith@acmecorp.com',
    amount: 99.00,
    currency: 'USD',
    status: 'refunded',
    description: 'Professional Plan - Monthly',
    createdAt: '2025-12-01T09:15:00Z',
  },
  {
    id: 'pay_5',
    stripePaymentId: 'pi_3N5678901234efghij',
    userId: '7',
    userName: 'Robert Taylor',
    userEmail: 'rob.taylor@globalinc.com',
    amount: 99.00,
    currency: 'USD',
    status: 'disputed',
    description: 'Professional Plan - Monthly',
    createdAt: '2025-11-28T16:45:00Z',
    disputeStatus: 'under_review',
  },
];

// Mock Admin Actions (Audit Log)
export const mockAdminActions: AdminAction[] = [
  {
    id: 'action_1',
    adminId: 'admin_1',
    adminName: 'Super Admin',
    actionType: 'password_reset',
    targetUserId: '2',
    targetUserName: 'Sarah Johnson',
    metadata: { reason: 'User request' },
    createdAt: '2026-01-14T10:30:00Z',
  },
  {
    id: 'action_2',
    adminId: 'admin_1',
    adminName: 'Super Admin',
    actionType: 'account_disabled',
    targetUserId: '8',
    targetUserName: 'Amanda White',
    metadata: { reason: 'Suspicious activity' },
    createdAt: '2026-01-13T15:00:00Z',
  },
  {
    id: 'action_3',
    adminId: 'admin_1',
    adminName: 'Super Admin',
    actionType: 'refund_issued',
    targetUserId: '1',
    targetUserName: 'John Smith',
    metadata: { paymentId: 'pay_4', amount: 99.00 },
    createdAt: '2025-12-01T09:20:00Z',
  },
];

// Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  totalUsers: 8,
  businessUsers: 3,
  consumerUsers: 3,
  influencerUsers: 2,
  activeUsers: 6,
  inactiveUsers: 2,
  dailyLogins: 4,
};
