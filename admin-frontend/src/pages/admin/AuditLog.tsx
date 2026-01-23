import { useState, useMemo } from 'react';
import { ClipboardList, User, Key, UserX, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SearchInput } from '@/components/admin/SearchInput';
import { mockAdminActions } from '@/data/mockData';
import { format, formatDistanceToNow } from 'date-fns';

const actionIcons: Record<string, typeof User> = {
  password_reset: Key,
  account_disabled: UserX,
  account_enabled: User,
  refund_issued: RefreshCw,
  email_changed: User,
  phone_changed: User,
};

const actionLabels: Record<string, string> = {
  password_reset: 'Password Reset',
  account_disabled: 'Account Disabled',
  account_enabled: 'Account Enabled',
  refund_issued: 'Refund Issued',
  email_changed: 'Email Changed',
  phone_changed: 'Phone Changed',
};

export default function AuditLog() {
  const [search, setSearch] = useState('');

  const filteredActions = useMemo(() => {
    if (!search) return mockAdminActions;

    const searchLower = search.toLowerCase();
    return mockAdminActions.filter(
      (action) =>
        action.targetUserName.toLowerCase().includes(searchLower) ||
        action.adminName.toLowerCase().includes(searchLower) ||
        action.actionType.toLowerCase().includes(searchLower)
    );
  }, [search]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
            <p className="text-sm text-muted-foreground">
              Track all admin actions for accountability
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="admin-card">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by user name, admin, or action type..."
            className="max-w-md"
          />
        </div>

        {/* Log Entries */}
        <div className="space-y-3">
          {filteredActions.length === 0 ? (
            <div className="admin-card py-12 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No audit log entries found</p>
            </div>
          ) : (
            filteredActions.map((action) => {
              const Icon = actionIcons[action.actionType] || User;
              return (
                <div key={action.id} className="admin-card">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground">
                            {actionLabels[action.actionType] || action.actionType}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Target: <span className="font-medium">{action.targetUserName}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(action.createdAt), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          By: <span className="font-medium text-foreground">{action.adminName}</span>
                        </span>
                        {Object.keys(action.metadata).length > 0 && (
                          <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                            {JSON.stringify(action.metadata)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary */}
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredActions.length} of {mockAdminActions.length} audit log entries
        </div>
      </div>
    </AdminLayout>
  );
}
