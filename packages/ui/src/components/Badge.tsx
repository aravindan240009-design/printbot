import React from 'react';
import { JobStatus } from '@xerox/contracts';
import { Clock3, Check, CircleDashed, AlertCircle } from 'lucide-react';
export interface BadgeProps { status: JobStatus; }
const labels: Record<JobStatus,string> = {
 DRAFT:'Draft',VALIDATING:'Checking file',READY_TO_QUOTE:'Ready for quote',AWAITING_PAYMENT:'Awaiting payment',PAYMENT_VERIFYING:'Verifying payment',PAID_HELD:'Paid · on hold',AWAITING_APPROVAL:'Awaiting approval',APPROVED:'Approved',QUEUED:'Queued',LEASED:'Assigned to workstation',SPOOL_SUBMITTED:'Sent to spooler',COMPLETION_UNKNOWN:'Outcome unknown · review required',PRINT_CONFIRMED:'Print confirmed',READY_FOR_PICKUP:'Ready for pickup',COLLECTED:'Collected',REJECTED:'Rejected',CANCELLED:'Cancelled',REFUND_PENDING:'Refund pending',REFUNDED:'Refunded',EXPIRED:'Expired',PENDING_PAYMENT:'Awaiting payment',PAID:'Payment verified',SPOOLING:'Preparing print',PRINTING:'Printing',COMPLETED:'Completed',FAILED:'Needs attention'
};
export const StatusBadge:React.FC<BadgeProps> = ({status}) => {
 const success=['PAID','APPROVED','PRINT_CONFIRMED','READY_FOR_PICKUP','COLLECTED','COMPLETED','REFUNDED'].includes(status);
 const warning=['COMPLETION_UNKNOWN','PAID_HELD','AWAITING_APPROVAL','PAYMENT_VERIFYING','REFUND_PENDING'].includes(status);
 const danger=['FAILED','REJECTED'].includes(status);
 const Icon=success?Check:warning||danger?AlertCircle:status.includes('PAYMENT')?Clock3:CircleDashed;
 return <span className={`pb-badge ${success?'pb-badge-success':danger?'pb-badge-danger':warning?'pb-badge-warning':''}`}><Icon size={13} aria-hidden="true"/>{labels[status] ?? String(status).replace(/_/g,' ').toLowerCase()}</span>;
};
