/**
 * Core Domain Contracts & Schemas for Xerox SaaS Platform
 */

export type ColorMode = 'bw' | 'color';
export type PaperSize = 'A4' | 'A3' | 'A5' | 'Legal' | 'Letter';
export type DuplexMode = 'simplex' | 'duplex_long' | 'duplex_short';
export type Orientation = 'portrait' | 'landscape' | 'auto';
export type BindingType = 'none' | 'staple' | 'spiral' | 'hard_bind';
export type PaperGsm = 75 | 80 | 100 | 120 | 200;
export type PhotoLayoutPreset = 'standard' | 'passport_8up' | 'id_front_back';

export type SupportedFormat =
  | 'pdf'
  | 'jpeg'
  | 'png'
  | 'webp'
  | 'tiff'
  | 'bmp'
  | 'svg'
  | 'docx'
  | 'odt'
  | 'rtf'
  | 'xlsx'
  | 'ods'
  | 'csv'
  | 'pptx'
  | 'odp'
  | 'txt'
  | 'unsupported';

export type JobStatus =
  | 'DRAFT'
  | 'VALIDATING'
  | 'READY_TO_QUOTE'
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_VERIFYING'
  | 'PAID_HELD'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'QUEUED'
  | 'LEASED'
  | 'SPOOL_SUBMITTED'
  | 'COMPLETION_UNKNOWN'
  | 'PRINT_CONFIRMED'
  | 'READY_FOR_PICKUP'
  | 'COLLECTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'EXPIRED'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'SPOOLING'
  | 'PRINTING'
  | 'COMPLETED'
  | 'FAILED';

export type BookingState =
  | 'NONE'
  | 'SCHEDULED_PRINT'
  | 'RESERVED_PICKUP_SLOT'
  | 'ASSISTED_COUNTER_XEROX';

export type PaymentMethod = 'UPI' | 'CASH' | 'CARD' | 'NETBANKING';
export type PaymentProviderType = 'MOCK' | 'RAZORPAY' | 'CASH';

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
  photoLayout?: PhotoLayoutPreset;
  scaling?: string;
  reverseOrder?: boolean;
  notes?: string;
}

export interface FileScanResult {
  isValid: boolean;
  format: SupportedFormat;
  mimeType: string;
  fileSizeBytes: number;
  pageCount: number;
  isEncrypted: boolean;
  needsPassword: boolean;
  widthPts?: number;
  heightPts?: number;
  hasMacros?: boolean;
  errorMessage?: string;
  detectedPages?: number[];
}

export interface FileQuoteItemRequest {
  fileId: string;
  fileName: string;
  pageCount: number;
  options: PrintOptions;
}

export interface FileQuoteItemResponse {
  fileId: string;
  fileName: string;
  pageCount: number;
  logicalPages: number;
  renderedSides: number;
  physicalSheets: number;
  costPaise: number;
  costRupees: number;
  costCents: number;
  options: PrintOptions;
}

export interface MultiFileQuoteRequest {
  shopId: string;
  items: FileQuoteItemRequest[];
  applyToAllOptions?: PrintOptions;
}

export interface MultiFileQuoteResponse {
  quoteId: string;
  quoteHash: string;
  expiresAt: string;
  shopId: string;
  pricingVersion: number;
  totalPaise: number;
  totalRupees: number;
  totalCents: number;
  currency: string;
  totalLogicalPages: number;
  totalRenderedSides: number;
  totalPhysicalSheets: number;
  items: FileQuoteItemResponse[];
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
  orderMode?: OrderMode;
  bookingState?: BookingState;
  quoteHash?: string;
  paymentMethod?: string;
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
  totalPaise?: number;
  currency: string;
  status: JobStatus;
  orderMode?: OrderMode;
  bookingState?: BookingState;
  version?: number;
  paymentIntentId?: string;
  spoolerJobId?: string;
  workstationId?: string;
  holdReason?: string;
  rejectionReason?: string;
  refundId?: string;
  leaseExpiresAt?: string;
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

export type ServiceType =
  | 'SCHEDULE_PRINT'
  | 'READY_BY_SLOT'
  | 'PHYSICAL_XEROX_BOOKING'
  | 'TIMED_SELF_SERVICE_COPIER';

export type BookingStatus =
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'MISSED_SLOT';

export interface AvailableSlot {
  slotId: string;
  slotStart: string;
  slotEnd: string;
  capacityTotal: number;
  capacityAvailable: number;
  isRush: boolean;
  rushSurchargePaise: number;
}

export interface ShopServiceCatalogue {
  shopId: string;
  timeZone: string;
  servicesEnabled: Record<string, boolean>;
  slotDurationMinutes: number;
  capacityPerSlot: number;
  leadTimeMinutes: number;
  lastBookingCutoffMinutes: number;
  operatingHours: Record<string, { open: string; close: string }>;
  closedDates: string[];
  rushSurchargePaise: number;
  minimumBillPaise: number;
  cancellationCutoffMinutes: number;
  counterCheckinMethod: string;
}

export interface BookingCreateRequest {
  shopId: string;
  serviceType: ServiceType;
  slotStart: string;
  customerEmail: string;
  customerPhone?: string;
  orderId?: string;
  estimatedPages?: number;
  copies?: number;
  options?: PrintOptions;
  notes?: string;
}

export interface BookingResponse {
  id: string;
  bookingReference: string;
  shopId: string;
  serviceType: ServiceType;
  status: BookingStatus;
  customerEmail: string;
  customerPhone?: string;
  orderId?: string;
  slotStart: string;
  slotEnd: string;
  pickupCode: string;
  estimatedPages: number;
  revisedPages?: number;
  quotedPaise: number;
  revisedPaise?: number;
  isPhysicalOriginalsRequired: boolean;
  humanInstruction: string;
  staffAssignedId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviseEstimateRequest {
  revisedPages: number;
  staffId?: string;
  reason: string;
}

export interface PhoneCaptureRequest {
  shopId: string;
  imagesBase64: string[];
  rotateDegrees?: number;
  targetDpi?: number;
}

export interface PhoneCaptureResponse {
  assetId: string;
  pageCount: number;
  pdfUrl: string;
  fileSizeBytes: number;
  legibilityConfirmed: boolean;
}

