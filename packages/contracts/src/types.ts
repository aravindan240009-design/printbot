/**
 * Core Domain Contracts & Schemas for Xerox SaaS Platform
 */

export type ColorMode = 'bw' | 'color';
export type PaperSize = 'A4' | 'A3' | 'Legal' | 'Letter';
export type DuplexMode = 'simplex' | 'duplex_long' | 'duplex_short';
export type Orientation = 'portrait' | 'landscape';
export type BindingType = 'none' | 'staple' | 'spiral' | 'hard_bind';
export type PaperGsm = 75 | 80 | 100 | 120 | 200;

export type JobStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'QUEUED'
  | 'SPOOLING'
  | 'PRINTING'
  | 'COMPLETED'
  | 'COMPLETION_UNKNOWN'
  | 'FAILED'
  | 'CANCELLED';

export type OrderMode = 'FULL_AUTOMATIC' | 'MANUAL_APPROVAL';

export interface PrintOptions {
  copies: number;
  colorMode: ColorMode;
  paperSize: PaperSize;
  duplexMode: DuplexMode;
  orientation: Orientation;
  binding: BindingType;
  paperGsm: PaperGsm;
  pageRange?: string;
  pagesPerSheet?: number;
  notes?: string;
}

export interface PricingRule {
  basePageBw: number; // in cents (e.g. 5 = $0.05)
  basePageColor: number; // in cents (e.g. 25 = $0.25)
  duplexDiscountPercent: number; // e.g. 15 for 15% off second side
  paperSizeMultiplier: Record<PaperSize, number>;
  bindingCostCents: Record<BindingType, number>;
  gsmAddonCents: Record<PaperGsm, number>;
}

export interface PrintJobCreateRequest {
  fileName: string;
  fileSizeBytes: number;
  pageCount: number;
  options: PrintOptions;
  customerEmail: string;
  customerPhone?: string;
  idempotencyKey?: string;
}

export interface PrintJobResponse {
  id: string;
  tenantId: string;
  customerEmail: string;
  customerPhone?: string;
  fileName: string;
  fileSizeBytes: number;
  pageCount: number;
  options: PrintOptions;
  calculatedPriceCents: number;
  currency: string;
  status: JobStatus;
  paymentIntentId?: string;
  spoolerJobId?: string;
  workstationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentWebhookPayload {
  eventId: string;
  eventType: 'payment_intent.succeeded' | 'payment_intent.failed';
  tenantId: string;
  paymentIntentId: string;
  amountCents: number;
  currency: string;
  timestamp: number;
}

export interface PrinterDevice {
  id: string;
  name: string;
  isDefault: boolean;
  isOnline: boolean;
  statusText: string;
  supportedSizes: PaperSize[];
  supportsColor: boolean;
  supportsDuplex: boolean;
}

export interface WorkstationSpoolEvent {
  workstationId: string;
  tenantId: string;
  jobId: string;
  spoolerJobId: string;
  status: 'SPOOLED' | 'PRINTING' | 'COMPLETED' | 'ERROR';
  errorMessage?: string;
  timestamp: string;
}

export interface ReconciliationRequest {
  workstationId: string;
  tenantId: string;
  spooledJobIds: string[];
}

export interface ReconciliationResponse {
  confirmedJobIds: string[];
  reSpoolRequiredJobIds: string[];
  invalidJobIds: string[];
  serverTimestamp: string;
}
