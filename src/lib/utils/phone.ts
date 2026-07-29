export function normalizePhone(phone: string): string {
  // Hapus semua non-digit
  const digits = phone.replace(/\D/g, '');
  
  // Kalau berawalan 0, hapus 0
  if (digits.startsWith('0')) return digits.slice(1);
  
  // Kalau berawalan 62, hapus 62
  if (digits.startsWith('62')) return digits.slice(2);
  
  return digits; // Sudah bersih (contoh: 83121067667)
}

export function formatPhoneWA(phone: string): string {
  // Untuk WhatsApp API: 6283121067667
  const normalized = normalizePhone(phone);
  return normalized.startsWith('62') ? normalized : `62${normalized}`;
}

export function formatPhoneDisplay(phone: string): string {
  // Untuk tampilan: 0831-2106-7667
  const normalized = normalizePhone(phone);
  if (normalized.length >= 10) {
    return `0${normalized.slice(0,4)}-${normalized.slice(4,8)}-${normalized.slice(8)}`;
  }
  return phone;
}