import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusType = 'pendiente' | 'vinculada' | 'archivada' | 'error' | string;

export interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  showDot?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; badgeClasses: string; dotClasses: string }> = {
  pendiente: {
    label: 'Pendiente',
    badgeClasses: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20',
    dotClasses: 'bg-amber-500',
  },
  vinculada: {
    label: 'Vinculada',
    badgeClasses: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
    dotClasses: 'bg-emerald-500',
  },
  archivada: {
    label: 'Archivada',
    badgeClasses: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 hover:bg-slate-500/20',
    dotClasses: 'bg-slate-400',
  },
  error: {
    label: 'Error',
    badgeClasses: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20',
    dotClasses: 'bg-rose-500',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  showDot = true,
}) => {
  const normalizedStatus = (status || 'pendiente').toLowerCase();
  const config = STATUS_CONFIG[normalizedStatus] || {
    label: status || 'Desconocido',
    badgeClasses: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 hover:bg-slate-500/20',
    dotClasses: 'bg-slate-400',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors font-sans',
        config.badgeClasses,
        className
      )}
      data-testid="status-badge"
    >
      {showDot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dotClasses)}
          aria-hidden="true"
        />
      )}
      <span className="capitalize">{config.label}</span>
    </Badge>
  );
};

export default StatusBadge;
