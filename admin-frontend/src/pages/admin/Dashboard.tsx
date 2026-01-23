import { Users, Building2, User, Star, UserCheck, UserX, LogIn } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { mockDashboardStats, mockUsers } from '@/data/mockData';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const recentLogins = mockUsers
    .filter((user) => user.lastLoginAt)
    .sort((a, b) => new Date(b.lastLoginAt!).getTime() - new Date(a.lastLoginAt!).getTime())
    .slice(0, 5);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor platform usage and user activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={mockDashboardStats.totalUsers}
            icon={<Users className="h-6 w-6 text-primary" />}
          />
          <StatCard
            title="Business Users"
            value={mockDashboardStats.businessUsers}
            icon={<Building2 className="h-6 w-6 text-chart-1" />}
          />
          <StatCard
            title="Consumers"
            value={mockDashboardStats.consumerUsers}
            icon={<User className="h-6 w-6 text-chart-2" />}
          />
          <StatCard
            title="Influencers"
            value={mockDashboardStats.influencerUsers}
            icon={<Star className="h-6 w-6 text-chart-4" />}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Active Users"
            value={mockDashboardStats.activeUsers}
            icon={<UserCheck className="h-6 w-6 text-status-active" />}
            subtitle={`${Math.round((mockDashboardStats.activeUsers / mockDashboardStats.totalUsers) * 100)}% of total`}
          />
          <StatCard
            title="Inactive Users"
            value={mockDashboardStats.inactiveUsers}
            icon={<UserX className="h-6 w-6 text-status-inactive" />}
            subtitle={`${Math.round((mockDashboardStats.inactiveUsers / mockDashboardStats.totalUsers) * 100)}% of total`}
          />
          <StatCard
            title="Daily Logins"
            value={mockDashboardStats.dailyLogins}
            icon={<LogIn className="h-6 w-6 text-chart-3" />}
            subtitle="Users logged in today"
          />
        </div>

        {/* Recent Activity */}
        <div className="admin-card">
          <h2 className="text-lg font-semibold text-foreground">Recent Logins</h2>
          <p className="text-sm text-muted-foreground">Users who logged in recently</p>
          <div className="mt-4 overflow-hidden rounded-lg border">
            <table className="admin-table">
              <thead className="bg-muted/50">
                <tr>
                  <th>User</th>
                  <th>Type</th>
                  <th>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {recentLogins.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </td>
                    <td className="capitalize">{user.type}</td>
                    <td className="text-muted-foreground">
                      {formatDistanceToNow(new Date(user.lastLoginAt!), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
