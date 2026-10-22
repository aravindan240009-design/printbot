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

// ==============================================================================
// Phase 6: Super Admin, Licensing, Fleet, Security Hardening & Pilot Readiness
// ==============================================================================

export type SuperAdminRole = 'SUPER_ADMIN' | 'SUPPORT_OPERATOR' | 'AUDITOR';
export type ShopLifecycleStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'OFFBOARDED';
export type HardwareAssurance = 'TPM_2_0' | 'SOFTWARE_FALLBACK';
export type ReleaseChannel = 'dev_unsigned' | 'beta_tested' | 'production_signed';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface BreakGlassRequest {
  shopId: string;
  reason: string;
  durationMinutes?: number;
}

export interface BreakGlassResponse {
  id: string;
  shopId: string;
  requesterId: string;
  approverId?: string;
  reason: string;
  sessionToken: string;
  expiresAt: string;
  status: string;
  canAccessDocuments: boolean;
  notice: string;
}

export interface StepUpChallengeRequest {
  actionType: string;
}

export interface StepUpChallengeResponse {
  challengeId: string;
  actionType: string;
  expiresAt: string;
  message: string;
}

export interface StepUpVerifyRequest {
  challengeId: string;
  password?: string;
  totpCode?: string;
}

export interface ShopOnboardRequest {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerName: string;
  phone?: string;
  address?: string;
  city?: string;
  stateCode?: string;
  orderMode?: OrderMode;
  parentShopId?: string;
}

export interface ShopOnboardResponse {
  shopId: string;
  name: string;
  slug: string;
  status: ShopLifecycleStatus;
  qrLink: string;
  planId: string;
  billingInterval: string;
  trialEnd: string;
}

export interface ShopTaxInvoice {
  id: string;
  shopId: string;
  invoiceNumber: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  basePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalPaise: number;
  sacCode: string;
  hsnDescription: string;
  stateCode: string;
  status: string;
  createdAt: string;
}

export interface SuperAdminKPIs {
  activeSubscribers: number;
  mrrPaise: number;
  arrPaise: number;
  churnRatePct: number;
  totalDevices: number;
  activeDevices24h: number;
  queueAgeSecondsP50: number;
  queueAgeSecondsP95: number;
  failureRatePct: number;
  totalSheetsPrinted: number;
  processingCostPaise: number;
  storageCostPaise: number;
  openIncidents: number;
}

export interface FleetRelease {
  version: string;
  releaseChannel: ReleaseChannel;
  downloadUrl: string;
  sha256Hash: string;
  signatureVerified: boolean;
  minSupportedVersion: string;
  isCritical: boolean;
  gracePeriodHours: number;
  rolloutPercentage: number;
  releaseNotes?: string;
  createdAt: string;
}

export interface FleetTelemetryReport {
  deviceId: string;
  shopId: string;
  agentVersion: string;
  uptimeSeconds: number;
  jobsProcessed: number;
  rasterAvgMs: number;
  sheetsPrinted: number;
  spoolErrorsCount: number;
  hardwareStatus: string;
}

export interface DiagnosticBundleSubmit {
  shopId: string;
  deviceId: string;
  operatorConsented: boolean;
  redactionVerified: boolean;
  logSummary: Record<string, unknown>;
}

export interface DiagnosticBundleResponse {
  bundleRef: string;
  shopId: string;
  deviceId: string;
  receivedAt: string;
  status: string;
}

export interface ShopMicrositePreview {
  shopId: string;
  shopName: string;
  slug: string;
  orderMode: OrderMode;
  brandPrimaryColor: string;
  logoUrl?: string;
  supportedLanguages: string[];
  servicesEnabled: Record<string, boolean>;
  allowedFileTypes: string[];
  pricingSummary: Record<string, number>;
  operatingHours: Record<string, unknown>;
  retentionHours: number;
}

export interface StolenDeviceReport {
  deviceId: string;
  shopId: string;
  incidentNotes: string;
  generateReplacementPairingCode?: boolean;
}

// ==============================================================================
// Phase 7: Advanced Print Studio, Optional Hardware Adapters & Differentiation
// ==============================================================================

export interface BookletSignature {
  sheetNumber: number;
  frontLeft?: number;
  frontRight?: number;
  backLeft?: number;
  backRight?: number;
}

export interface BookletImpositionRequest {
  pageCount: number;
  paperSize?: PaperSize;
  duplexMode?: DuplexMode;
}

export interface BookletImpositionResponse {
  totalInputPages: number;
  totalSheets: number;
  signatures: BookletSignature[];
  impositionType: string;
}

export interface MixedColorPageBreakdown {
  pageNumber: number;
  isColor: boolean;
  coveragePercent?: number;
}

export interface MixedColorQuoteRequest {
  shopId: string;
  totalPages: number;
  pageBreakdown: MixedColorPageBreakdown[];
  copies?: number;
  paperSize?: PaperSize;
}

export interface MixedColorQuoteResponse {
  shopId: string;
  totalPages: number;
  copies: number;
  bwPagesPerCopy: number;
  colorPagesPerCopy: number;
  bwRatePaise: number;
  colorRatePaise: number;
  totalBwPaise: number;
  totalColorPaise: number;
  totalPaise: number;
  pricingStrategy: string;
}

export interface PosterTile {
  tileCol: number;
  tileRow: number;
  cropBoxMm: number[];
}

export interface PosterTiledLayoutRequest {
  inputAssetId: string;
  gridCols?: number;
  gridRows?: number;
  overlapBleedMm?: number;
  targetPaperSize?: PaperSize;
}

export interface PosterTiledLayoutResponse {
  totalTiles: number;
  gridCols: number;
  gridRows: number;
  overlapBleedMm: number;
  tiles: PosterTile[];
  previewUrl: string;
}

export interface IDCardLayoutRequest {
  frontAssetId: string;
  backAssetId: string;
  cardWidthMm?: number;
  cardHeightMm?: number;
  targetPaperSize?: PaperSize;
  copies?: number;
}

export interface IDCardLayoutResponse {
  compositeAssetId: string;
  previewUrl: string;
  cardWidthMm: number;
  cardHeightMm: number;
  orientation: Orientation;
  frontCoordsMm: Record<string, number>;
  backCoordsMm: Record<string, number>;
}

export interface ShopPreset {
  id: string;
  shopId: string;
  name: string;
  description: string;
  options: PrintOptions;
  isDefault?: boolean;
  createdAt: string;
}

export interface PrepaidAccount {
  id: string;
  shopId: string;
  accountName: string;
  accountCode: string;
  balancePaise: number;
  contactEmail: string;
  authorizedDomains: string[];
  isActive: boolean;
  createdAt: string;
}

export interface PrepaidChargeRequest {
  accountCode: string;
  orderId: string;
  amountPaise: number;
}

export interface ResumableUploadInit {
  fileName: string;
  fileSizeBytes: number;
  totalChunks: number;
  sha256Checksum: string;
}

export interface ResumableUploadChunk {
  uploadId: string;
  chunkIndex: number;
  chunkDataBase64: string;
}

export interface QueueEstimateResponse {
  shopId: string;
  jobsAhead: number;
  estimatedMinutesMin: number;
  estimatedMinutesMax: number;
  displayText: string;
  uncertaintyLabel: string;
}

export interface CryptographicReceipt {
  receiptNumber: string;
  shopId: string;
  orderId: string;
  timestamp: string;
  totalPaise: number;
  sheetsPrinted: number;
  customerEmail?: string;
  signatureHmac: string;
}

export interface PrinterConsumableStatus {
  printerId: string;
  shopId: string;
  printerName: string;
  tonerBlackPercent: number;
  tonerCyanPercent?: number;
  tonerMagentaPercent?: number;
  tonerYellowPercent?: number;
  drumLifePercent: number;
  maintenanceBoxPercent: number;
  alerts: string[];
}

export interface IntelligentRoutingRequest {
  shopId: string;
  requiredPaper: PaperSize;
  requiresColor: boolean;
  requiresDuplex: boolean;
  pageCount: number;
  deadline?: string;
}

export interface IntelligentRoutingResponse {
  shopId: string;
  selectedPrinterId: string;
  printerName: string;
  routingReason: string;
  estimatedDurationSeconds: number;
}

export interface ScannerTaskRequest {
  shopId: string;
  sourceType?: string;
  duplex?: boolean;
  dpi?: number;
  colorMode?: string;
}

export interface ScannerTaskResponse {
  taskId: string;
  shopId: string;
  scannerId: string;
  status: string;
  pagesScanned: number;
  outputAssetId?: string;
  hardwareStatus: string;
  disclaimer: string;
}

export interface TimedCopierSessionRequest {
  shopId: string;
  deviceId: string;
  customerIdentifier: string;
  durationMinutes: number;
  maxCopies?: number;
}

export interface TimedCopierSessionResponse {
  sessionId: string;
  shopId: string;
  deviceId: string;
  status: string;
  sessionToken: string;
  startTime: string;
  expiresAt: string;
  allocatedCopies: number;
  actualCopies: number;
  billAmountPaise: number;
  hardwareLockState: string;
  emergencyStaffOverrideAvailable: boolean;
}



