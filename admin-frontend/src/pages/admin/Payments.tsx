import { useState, useMemo } from 'react';
import { RefreshCw, DollarSign } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SearchInput } from '@/components/admin/SearchInput';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { mockPayments, type PaymentStatus, type Payment } from '@/data/mockData';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Payments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null);

  const filteredPayments = useMemo(() => {
    return mockPayments.filter((payment) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        payment.userName.toLowerCase().includes(searchLower) ||
        payment.userEmail.toLowerCase().includes(searchLower) ||
        payment.stripePaymentId.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const handleRefund = () => {
    if (refundPayment) {
      toast.success(`Refund initiated for ${refundPayment.stripePaymentId}`);
      setRefundPayment(null);
    }
  };

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const completedAmount = filteredPayments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage payment transactions
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="admin-stat-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{filteredPayments.length}</p>
              </div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-active/10">
                <DollarSign className="h-5 w-5 text-status-active" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Revenue</p>
                <p className="text-2xl font-bold">${completedAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                <DollarSign className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name, email, or Stripe ID..."
              className="flex-1"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as PaymentStatus | 'all')}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Payments Table */}
        <div className="admin-card p-0">
          <div className="overflow-x-auto rounded-lg">
            <table className="admin-table">
              <thead className="bg-muted/50">
                <tr>
                  <th>Stripe Payment ID</th>
                  <th>User</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="font-mono text-xs">{payment.stripePaymentId}</td>
                      <td>
                        <div>
                          <p className="font-medium">{payment.userName}</p>
                          <p className="text-xs text-muted-foreground">{payment.userEmail}</p>
                        </div>
                      </td>
                      <td>{payment.description}</td>
                      <td className="font-semibold">
                        ${payment.amount.toFixed(2)} {payment.currency}
                      </td>
                      <td>
                        <div>
                          <StatusBadge status={payment.status} />
                          {payment.disputeStatus && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Dispute: {payment.disputeStatus}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="text-muted-foreground">
                        {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="text-right">
                        {payment.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRefundPayment(payment)}
                          >
                            <RefreshCw className="mr-1 h-4 w-4" />
                            Refund
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Refund Dialog */}
      <AlertDialog open={!!refundPayment} onOpenChange={() => setRefundPayment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Issue Refund</AlertDialogTitle>
            <AlertDialogDescription>
              {refundPayment && (
                <>
                  Are you sure you want to refund ${refundPayment.amount.toFixed(2)}{' '}
                  {refundPayment.currency} to {refundPayment.userName}?
                  <br />
                  <br />
                  <span className="font-mono text-xs">
                    Payment ID: {refundPayment.stripePaymentId}
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefund}>Issue Refund</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
