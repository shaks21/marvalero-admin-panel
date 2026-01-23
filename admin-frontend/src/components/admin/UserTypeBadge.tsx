import { cn } from '@/lib/utils';
import { Building2, User, Star } from 'lucide-react';
import type { UserType } from '@/data/mockData';

interface UserTypeBadgeProps {
  type: UserType;
  className?: string;
}

const typeConfig: Record<UserType, { label: string; icon: typeof Building2; className: string }> = {
  business: {
    label: 'Business',
    icon: Building2,
    className: 'bg-chart-1/10 text-chart-1',
  },
  consumer: {
    label: 'Consumer',
    icon: User,
    className: 'bg-chart-2/10 text-chart-2',
  },
  influencer: {
    label: 'Influencer',
    icon: Star,
    className: 'bg-chart-4/10 text-chart-4',
  },
};

export function UserTypeBadge({ type, className }: UserTypeBadgeProps) {
  const config = typeConfig[type];
  const Icon = config.icon;
  
  return (
    <span className={cn('status-badge gap-1', config.className, className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
