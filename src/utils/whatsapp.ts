/**
 * WhatsApp helpers (pure, no React).
 * The number is public by design (NEXT_PUBLIC_WHATSAPP_NUMBER), with a fallback
 * to the restaurant's number so the button always renders.
 */

export const WHATSAPP_FALLBACK_NUMBER = '66819585945'

function toDigits(value: string): string {
  return value.replace(/\D/g, '').replace(/^0+/, '')
}

export function getWhatsAppNumber(): string {
  const digits = toDigits(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '')
  return digits || WHATSAPP_FALLBACK_NUMBER
}

export function buildWhatsAppUrl(number: string, message: string): string {
  return `https://wa.me/${toDigits(number)}?text=${encodeURIComponent(message)}`
}
