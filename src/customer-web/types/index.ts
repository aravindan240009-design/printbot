export type Language = 'en' | 'ta' | 'hi';

export type ColorMode = 'bw' | 'color' | 'grayscale';
export type DuplexMode = 'simplex' | 'duplex_long' | 'duplex_short';
export type PaperSize = 'A4' | 'A3' | 'A5' | 'Legal' | 'Letter';
export type PaperGsm = '75' | '100' | '220';
export type FinishingOption = 'none' | 'staple' | 'spiral' | 'hard_bind';
export type PhotoPreset = 'standard' | 'passport_8up' | 'id_card' | 'photo_4x6';
export type OrientationOption = 'portrait' | 'landscape' | 'auto';

export interface PrintOptions {
  copies: number;
  colorMode: ColorMode;
  paperSize: PaperSize;
  paperGsm: PaperGsm;
  duplex: DuplexMode;
  pageRange: string;
  nup: number;
  finishing: FinishingOption;
  photoPreset: PhotoPreset;
  orientation: OrientationOption;
}

export interface DocumentItem {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  format: string;
  options: PrintOptions;
  source: File;
  assetId?: string;
  pageCount?: number;
  isPasswordProtected?: boolean;
  unlockedPassword?: string;
}

export interface TimedBooking {
  id: string;
  serviceType: 'assisted_xerox' | 'self_service_copier' | 'priority_rush';
  slotDate: string;
  slotTime: string;
  estimatedPages: number;
  counterNotes?: string;
  bookingCode: string;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'ORDER_RECEIVED'
  | 'SPOOLING'
  | 'PRINTING'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED';

export interface PlacedOrderItem {
  name: string;
  copies: number;
  colorMode: string;
  sheets: number;
  paperSize: string;
  finishing: string;
}

export interface PlacedOrder {
  orderId: string;
  pickupPin: string;
  shopId: string;
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  totalRupees: number;
  totalSheets: number;
  totalLogicalPages: number;
  paymentMethod: 'upi' | 'cash';
  paymentStatus: 'paid' | 'pending_cash';
  status: OrderStatus;
  placedAt: string;
  items: PlacedOrderItem[];
  qrToken: string;
  timedBooking?: TimedBooking;
}

export interface ShopRates {
  bwPerSideRupees: number;
  colorPerSideRupees: number;
  duplexDiscountPercent?: number;
}

export interface ShopSession {
  session_token: string;
  shop_id: string;
  shop_name: string;
  shop_slug: string;
  shop_address?: string;
  shop_phone?: string;
  operating_hours?: string;
  rates?: ShopRates;
  orderMode?: 'MANUAL_APPROVAL' | 'FULL_AUTOMATIC';
  expires_at: string;
}

export interface ServerQuote {
  total_paise: number;
  total_rupees: number;
  total_logical_pages: number;
  total_rendered_sides: number;
  total_physical_sheets: number;
  expires_at: string;
  quote_hash: string;
}

export type ActiveView =
  | 'home'
  | 'print'
  | 'services'
  | 'timed_booking'
  | 'cart'
  | 'checkout'
  | 'tracking'
  | 'dashboard';
