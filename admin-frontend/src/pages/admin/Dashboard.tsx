import {
  Users,
  Building2,
  User,
  Star,
  UserCheck,
  UserX,
  LogIn,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatCard } from "@/components/admin/StatCard";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useRecentUsers } from "@/hooks/useUsers";
import { formatDistanceToNow, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { UserTypeBadge } from "@/components/admin/UserTypeBadge";

export default function Dashboard() {
  const {
    stats,
    loading: statsLoading,
    error: statsError,
  } = useDashboardStats();
  const {
    users: recentLogins,
    loading: usersLoading,
    error: usersError,
  } = useRecentUsers(3);

  // Show loading or error states
  if (statsLoading || usersLoading)
    return <div className="p-4">Loading dashboard...</div>;
  if (statsError)
    return (
      <div className="p-4 text-red-500">Error loading stats: {statsError}</div>
    );
  if (usersError)
    return (
      <div className="p-4 text-red-500">Error loading users: {usersError}</div>
    );
  if (!stats) return <div className="p-4">No stats available</div>;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor platform usage and user activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<Users className="h-6 w-6 text-primary" />}
          />
          <StatCard
            title="Business Users"
            value={stats.businessUsers}
            icon={<Building2 className="h-6 w-6 text-chart-1" />}
          />
          <StatCard
            title="Consumers"
            value={stats.consumerUsers}
            icon={<User className="h-6 w-6 text-chart-2" />}
          />
          <StatCard
            title="Influencers"
            value={stats.influencerUsers}
            icon={<Star className="h-6 w-6 text-chart-4" />}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            icon={<UserCheck className="h-6 w-6 text-status-active" />}
            subtitle={`${Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total`}
          />
          <StatCard
            title="Inactive Users"
            value={stats.inactiveUsers}
            icon={<UserX className="h-6 w-6 text-status-inactive" />}
            subtitle={`${Math.round((stats.inactiveUsers / stats.totalUsers) * 100)}% of total`}
          />
          <StatCard
            title="Daily Logins"
            value={stats.dailyLogins}
            icon={<LogIn className="h-6 w-6 text-chart-3" />}
            subtitle="Users logged in today"
          />
        </div>

        {/* Recent Activity */}
        <div className="admin-card">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Logins
          </h2>
          <p className="text-sm text-muted-foreground">
            Users who logged in recently
          </p>
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
                        <p className="font-medium text-foreground">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </td>
                    <td>
                      {<UserTypeBadge type={user.userType} />}
                    </td>
                    <td className="text-muted-foreground">
                      {user.lastLoginAt
                        ? formatDistanceToNow(
                            toZonedTime(user.lastLoginAt, "UTC"), // Convert UTC to local time
                            { addSuffix: true },
                          )
                        : "Never"}
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
