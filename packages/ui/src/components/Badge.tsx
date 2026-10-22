import React from 'react';
import { JobStatus } from '@xerox/contracts';

export interface BadgeProps {
  status: JobStatus;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status }) => {
  const styles: Partial<Record<JobStatus, { bg: string; label: string }>> = {
    PENDING_PAYMENT: { bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300', label: 'Payment Pending' },
    PAID: { bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300', label: 'Paid' },
    QUEUED: { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300', label: 'In Queue' },
    SPOOLING: { bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300', label: 'Spooling' },
    PRINTING: { bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300', label: 'Printing' },
    COMPLETED: { bg: 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300', label: 'Completed' },
    FAILED: { bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300', label: 'Failed' },
    CANCELLED: { bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', label: 'Cancelled' },
  };

  const fallback = { bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300', label: 'Payment Pending' };
  const current = styles[status] || fallback;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${current.bg}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse" />
      {current.label}
    </span>
  );
};
