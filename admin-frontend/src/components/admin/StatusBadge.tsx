import { cn } from '@/lib/utils';

type StatusType = 'active' | 'disabled' | 'completed' | 'failed' | 'refunded' | 'disputed' | 'pending' | 'cancelled' | 'expired';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active: { label: 'Active', className: 'status-active' },
  disabled: { label: 'Disabled', className: 'status-inactive' },
  completed: { label: 'Completed', className: 'status-active' },
  failed: { label: 'Failed', className: 'status-inactive' },
  refunded: { label: 'Refunded', className: 'status-pending' },
  disputed: { label: 'Disputed', className: 'status-inactive' },
  pending: { label: 'Pending', className: 'status-pending' },
  cancelled: { label: 'Cancelled', className: 'status-inactive' },
  expired: { label: 'Expired', className: 'status-inactive' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn('status-badge', config.className, className)}>
      {config.label}
    </span>
  );
}
