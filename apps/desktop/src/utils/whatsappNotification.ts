export interface WhatsAppOrderDetails {
  orderId: string;
  customerName?: string;
  customerPhone?: string;
  pickupPin: string;
  totalRupees: number;
  totalSheets: number;
  colorMode: string;
  shopName: string;
  shopLocation?: string;
}

export function formatWhatsAppPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.substring(1)}`;
  }
  return digits;
}

export function buildWhatsAppPickupMessage(details: WhatsAppOrderDetails): string {
  const customerGreeting = details.customerName ? `Hello *${details.customerName}*` : 'Hello Customer';
  const locationText = details.shopLocation ? `\n📍 *Counter:* ${details.shopLocation}` : '';

  return (
    `📄 *Print Order Ready for Pickup!* ⚡\n\n` +
    `${customerGreeting}, your print order at *${details.shopName}* is printed and ready for pickup!\n\n` +
    `🔑 *Pickup PIN:* *${details.pickupPin}*\n` +
    `📋 *Order ID:* #${details.orderId}\n` +
    `📑 *Specs:* ${details.totalSheets} sheets • ${details.colorMode}\n` +
    `💰 *Amount:* ₹${details.totalRupees.toFixed(2)}\n` +
    `${locationText}\n\n` +
    `Please show your 4-digit PIN at the counter to collect your documents. Thank you for printing with *${details.shopName}*!`
  );
}

export function getWhatsAppDispatchUrl(details: WhatsAppOrderDetails): string | null {
  if (!details.customerPhone) return null;
  const cleanPhone = formatWhatsAppPhoneNumber(details.customerPhone);
  if (!cleanPhone || cleanPhone.length < 10) return null;

  const message = buildWhatsAppPickupMessage(details);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppForOrder(details: WhatsAppOrderDetails): boolean {
  const url = getWhatsAppDispatchUrl(details);
  if (!url) return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
