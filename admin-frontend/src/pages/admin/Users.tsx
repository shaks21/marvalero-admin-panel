import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SearchInput } from '@/components/admin/SearchInput';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { UserTypeBadge } from '@/components/admin/UserTypeBadge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockUsers, type UserType, type UserStatus } from '@/data/mockData';
import { formatDistanceToNow } from 'date-fns';

export default function Users() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<UserType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');

  const filteredUsers = useMemo(() => {
    return mockUsers.filter((user) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.phone.includes(search) ||
        (user.businessName && user.businessName.toLowerCase().includes(searchLower));

      // Type filter
      const matchesType = typeFilter === 'all' || user.type === typeFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [search, typeFilter, statusFilter]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search and manage platform users
          </p>
        </div>

        {/* Filters */}
        <div className="admin-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name, email, phone, or business name..."
              className="flex-1"
            />
            <div className="flex gap-3">
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as UserType | 'all')}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="consumer">Consumer</SelectItem>
                  <SelectItem value="influencer">Influencer</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as UserStatus | 'all')}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="admin-card p-0">
          <div className="overflow-hidden rounded-lg">
            <table className="admin-table">
              <thead className="bg-muted/50">
                <tr>
                  <th>User</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No users found matching your search criteria
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          {user.businessName && (
                            <p className="text-xs text-muted-foreground">{user.businessName}</p>
                          )}
                        </div>
                      </td>
                      <td>
                        <UserTypeBadge type={user.type} />
                      </td>
                      <td>
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="text-muted-foreground">
                        {user.lastLoginAt
                          ? formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })
                          : 'Never'}
                      </td>
                      <td className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/admin/users/${user.id}`}>
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t p-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {mockUsers.length} users
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
