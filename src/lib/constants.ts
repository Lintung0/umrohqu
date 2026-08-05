// Shared constants for UmrohQ

export { formatRupiah } from "@/lib/utils"

export const COST_RANGES = [
  "Semua Biaya",
  "< Rp 25 Juta",
  "Rp 25 – 30 Juta",
  "Rp 30 – 35 Juta",
  "Rp 35 – 40 Juta",
  "Rp 40 – 50 Juta",
  "> Rp 50 Juta",
] as const

export const PACKAGE_TYPES = [
  { value: "semua", label: "Semua Tipe" },
  { value: "reguler", label: "Reguler" },
  { value: "vip", label: "VIP" },
  { value: "plus", label: "Plus" },
  { value: "furoda", label: "Furoda" },
] as const

export const AIRLINES = [
  "semua",
  "Garuda Indonesia",
  "Saudi Airlines",
  "Turkish Airlines",
  "Batik Air",
  "Lion Air",
  "Royal Jordanian",
] as const

export const HOTEL_STARS = [
  { value: "semua", label: "Semua Bintang" },
  { value: "3", label: "Bintang 3+" },
  { value: "4", label: "Bintang 4+" },
  { value: "5", label: "Bintang 5" },
] as const

export const BOOKING_STATUSES = [
  { value: "semua", label: "Semua", color: "bg-gray-100 text-gray-700" },
  { value: "pending_payment", label: "Menunggu", color: "bg-yellow-100 text-yellow-700" },
  { value: "processing", label: "Diproses", color: "bg-purple-100 text-purple-700" },
  { value: "confirmed", label: "Dikonfirmasi", color: "bg-green-100 text-green-700" },
  { value: "completed", label: "Selesai", color: "bg-blue-100 text-blue-700" },
  { value: "cancelled", label: "Dibatalkan", color: "bg-red-100 text-red-700" },
] as const

export const TRAVEL_STATUSES = [
  { value: "semua", label: "Semua", color: "bg-gray-100 text-gray-700" },
  { value: "pending", label: "Menunggu", color: "bg-yellow-100 text-yellow-700" },
  { value: "verified", label: "Terverifikasi", color: "bg-green-100 text-green-700" },
  { value: "suspended", label: "Ditangguhkan", color: "bg-orange-100 text-orange-700" },
  { value: "rejected", label: "Ditolak", color: "bg-red-100 text-red-700" },
] as const

export const TICKET_STATUSES = [
  { value: "semua", label: "Semua", color: "bg-gray-100 text-gray-700" },
  { value: "open", label: "Terbuka", color: "bg-blue-100 text-blue-700" },
  { value: "in_progress", label: "Diproses", color: "bg-yellow-100 text-yellow-700" },
  { value: "resolved", label: "Selesai", color: "bg-green-100 text-green-700" },
  { value: "closed", label: "Ditutup", color: "bg-gray-100 text-gray-500" },
] as const

export const INVOICE_STATUSES = [
  { value: "semua", label: "Semua", color: "bg-gray-100 text-gray-700" },
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-500" },
  { value: "issued", label: "Diterbitkan", color: "bg-blue-100 text-blue-700" },
  { value: "paid", label: "Dibayar", color: "bg-green-100 text-green-700" },
  { value: "overdue", label: "Jatuh Tempo", color: "bg-red-100 text-red-700" },
  { value: "cancelled", label: "Dibatalkan", color: "bg-gray-100 text-gray-500" },
] as const

export const COUNTRIES = [
  { code: "af", name: "Afghanistan", emoji: "🇦🇫" },
  { code: "al", name: "Albania", emoji: "🇦🇱" },
  { code: "dz", name: "Aljazair", emoji: "🇩🇿" },
  { code: "us", name: "Amerika Serikat", emoji: "🇺🇸" },
  { code: "ad", name: "Andorra", emoji: "🇦🇩" },
  { code: "ao", name: "Angola", emoji: "🇦🇴" },
  { code: "sa", name: "Arab Saudi", emoji: "🇸🇦" },
  { code: "ar", name: "Argentina", emoji: "🇦🇷" },
  { code: "am", name: "Armenia", emoji: "🇦🇲" },
  { code: "au", name: "Australia", emoji: "🇦🇺" },
  { code: "at", name: "Austria", emoji: "🇦🇹" },
  { code: "az", name: "Azerbaijan", emoji: "🇦🇿" },
  { code: "bh", name: "Bahrain", emoji: "🇧🇭" },
  { code: "bd", name: "Bangladesh", emoji: "🇧🇩" },
  { code: "be", name: "Belgia", emoji: "🇧🇪" },
  { code: "by", name: "Belarus", emoji: "🇧🇾" },
  { code: "bz", name: "Belize", emoji: "🇧🇿" },
  { code: "bj", name: "Benin", emoji: "🇧🇯" },
  { code: "bo", name: "Bolivia", emoji: "🇧🇴" },
  { code: "ba", name: "Bosnia dan Herzegovina", emoji: "🇧🇦" },
  { code: "br", name: "Brasil", emoji: "🇧🇷" },
  { code: "bn", name: "Brunei Darussalam", emoji: "🇧🇳" },
  { code: "bg", name: "Bulgaria", emoji: "🇧🇬" },
  { code: "bf", name: "Burkina Faso", emoji: "🇧🇫" },
  { code: "td", name: "Chad", emoji: "🇹🇩" },
  { code: "cl", name: "Chile", emoji: "🇨🇱" },
  { code: "cn", name: "China", emoji: "🇨🇳" },
  { code: "co", name: "Kolombia", emoji: "🇨🇴" },
  { code: "km", name: "Komoro", emoji: "🇰🇲" },
  { code: "cg", name: "Kongo", emoji: "🇨🇬" },
  { code: "cd", name: "Kongo (DRC)", emoji: "🇨🇩" },
  { code: "kr", name: "Korea Selatan", emoji: "🇰🇷" },
  { code: "hr", name: "Kroasia", emoji: "🇭🇷" },
  { code: "cu", name: "Kuba", emoji: "🇨🇺" },
  { code: "cy", name: "Siprus", emoji: "🇨🇾" },
  { code: "cz", name: "Ceko", emoji: "🇨🇿" },
  { code: "dk", name: "Denmark", emoji: "🇩🇰" },
  { code: "dj", name: "Djibouti", emoji: "🇩🇯" },
  { code: "ec", name: "Ekuador", emoji: "🇪🇨" },
  { code: "eg", name: "Mesir", emoji: "🇪🇬" },
  { code: "sv", name: "El Salvador", emoji: "🇸🇻" },
  { code: "ae", name: "Uni Emirat Arab", emoji: "🇦🇪" },
  { code: "er", name: "Eritrea", emoji: "🇪🇷" },
  { code: "ee", name: "Estonia", emoji: "🇪🇪" },
  { code: "et", name: "Ethiopia", emoji: "🇪🇹" },
  { code: "fj", name: "Fiji", emoji: "🇫🇯" },
  { code: "ph", name: "Filipina", emoji: "🇵🇭" },
  { code: "fi", name: "Finlandia", emoji: "🇫🇮" },
  { code: "fr", name: "Prancis", emoji: "🇫🇷" },
  { code: "ga", name: "Gabon", emoji: "🇬🇦" },
  { code: "gm", name: "Gambia", emoji: "🇬🇲" },
  { code: "ge", name: "Georgia", emoji: "🇬🇪" },
  { code: "gh", name: "Ghana", emoji: "🇬🇭" },
  { code: "gi", name: "Gibraltar", emoji: "🇬🇮" },
  { code: "gr", name: "Yunani", emoji: "🇬🇷" },
  { code: "gl", name: "Greenland", emoji: "🇬🇱" },
  { code: "gt", name: "Guatemala", emoji: "🇬🇹" },
  { code: "gn", name: "Guinea", emoji: "🇬🇳" },
  { code: "gq", name: "Guinea Khatulistiwa", emoji: "🇬🇶" },
  { code: "gw", name: "Guinea-Bissau", emoji: "🇬🇼" },
  { code: "gy", name: "Guyana", emoji: "🇬🇾" },
  { code: "ht", name: "Haiti", emoji: "🇭🇹" },
  { code: "hn", name: "Honduras", emoji: "🇭🇳" },
  { code: "hk", name: "Hong Kong", emoji: "🇭🇰" },
  { code: "hu", name: "Hongaria", emoji: "🇭🇺" },
  { code: "is", name: "Islandia", emoji: "🇮🇸" },
  { code: "in", name: "India", emoji: "🇮🇳" },
  { code: "id", name: "Indonesia", emoji: "🇮🇩" },
  { code: "iq", name: "Irak", emoji: "🇮🇶" },
  { code: "ir", name: "Iran", emoji: "🇮🇷" },
  { code: "ie", name: "Irlandia", emoji: "🇮🇪" },
  { code: "il", name: "Israel", emoji: "🇮🇱" },
  { code: "it", name: "Italia", emoji: "🇮🇹" },
  { code: "jm", name: "Jamaika", emoji: "🇯🇲" },
  { code: "jp", name: "Jepang", emoji: "🇯🇵" },
  { code: "de", name: "Jerman", emoji: "🇩🇪" },
  { code: "jo", name: "Yordania", emoji: "🇯🇴" },
  { code: "kz", name: "Kazakhstan", emoji: "🇰🇿" },
  { code: "ke", name: "Kenya", emoji: "🇰🇪" },
  { code: "kg", name: "Kirgizstan", emoji: "🇰🇬" },
  { code: "kw", name: "Kuwait", emoji: "🇰🇼" },
  { code: "la", name: "Laos", emoji: "🇱🇦" },
  { code: "lv", name: "Latvia", emoji: "🇱🇻" },
  { code: "lb", name: "Lebanon", emoji: "🇱🇧" },
  { code: "ls", name: "Lesotho", emoji: "🇱🇸" },
  { code: "lr", name: "Liberia", emoji: "🇱🇷" },
  { code: "ly", name: "Libya", emoji: "🇱🇾" },
  { code: "li", name: "Liechtenstein", emoji: "🇱🇮" },
  { code: "lt", name: "Lituania", emoji: "🇱🇹" },
  { code: "lu", name: "Luksemburg", emoji: "🇱🇺" },
  { code: "mo", name: "Makau", emoji: "🇲🇴" },
  { code: "mg", name: "Madagaskar", emoji: "🇲🇬" },
  { code: "mw", name: "Malawi", emoji: "🇲🇼" },
  { code: "mv", name: "Maladewa", emoji: "🇲🇻" },
  { code: "my", name: "Malaysia", emoji: "🇲🇾" },
  { code: "ml", name: "Mali", emoji: "🇲🇱" },
  { code: "mt", name: "Malta", emoji: "🇲🇹" },
  { code: "ma", name: "Maroko", emoji: "🇲🇦" },
  { code: "mr", name: "Mauritania", emoji: "🇲🇷" },
  { code: "mu", name: "Mauritius", emoji: "🇲🇺" },
  { code: "mx", name: "Meksiko", emoji: "🇲🇽" },
  { code: "md", name: "Moldova", emoji: "🇲🇩" },
  { code: "mc", name: "Monako", emoji: "🇲🇨" },
  { code: "mn", name: "Mongolia", emoji: "🇲🇳" },
  { code: "me", name: "Montenegro", emoji: "🇲🇪" },
  { code: "mm", name: "Myanmar", emoji: "🇲🇲" },
  { code: "np", name: "Nepal", emoji: "🇳🇵" },
  { code: "nl", name: "Belanda", emoji: "🇳🇱" },
  { code: "nz", name: "Selandia Baru", emoji: "🇳🇿" },
  { code: "ni", name: "Nikaragua", emoji: "🇳🇮" },
  { code: "ne", name: "Niger", emoji: "🇳🇪" },
  { code: "ng", name: "Nigeria", emoji: "🇳🇬" },
  { code: "kp", name: "Korea Utara", emoji: "🇰🇵" },
  { code: "mk", name: "Makedonia Utara", emoji: "🇲🇰" },
  { code: "no", name: "Norwegia", emoji: "🇳🇴" },
  { code: "om", name: "Oman", emoji: "🇴🇲" },
  { code: "pk", name: "Pakistan", emoji: "🇵🇰" },
  { code: "pa", name: "Panama", emoji: "🇵🇦" },
  { code: "pg", name: "Papua Nugini", emoji: "🇵🇬" },
  { code: "py", name: "Paraguay", emoji: "🇵🇾" },
  { code: "pe", name: "Peru", emoji: "🇵🇪" },
  { code: "pl", name: "Polandia", emoji: "🇵🇱" },
  { code: "pt", name: "Portugal", emoji: "🇵🇹" },
  { code: "qa", name: "Qatar", emoji: "🇶🇦" },
  { code: "ro", name: "Rumania", emoji: "🇷🇴" },
  { code: "ru", name: "Rusia", emoji: "🇷🇺" },
  { code: "rw", name: "Rwanda", emoji: "🇷🇼" },
  { code: "sm", name: "San Marino", emoji: "🇸🇲" },
  { code: "st", name: "Sao Tome dan Principe", emoji: "🇸🇹" },
  { code: "sn", name: "Senegal", emoji: "🇸🇳" },
  { code: "rs", name: "Serbia", emoji: "🇷🇸" },
  { code: "sc", name: "Seychelles", emoji: "🇸🇨" },
  { code: "sl", name: "Sierra Leone", emoji: "🇸🇱" },
  { code: "sg", name: "Singapura", emoji: "🇸🇬" },
  { code: "sk", name: "Slowakia", emoji: "🇸🇰" },
  { code: "si", name: "Slovenia", emoji: "🇸🇮" },
  { code: "so", name: "Somalia", emoji: "🇸🇴" },
  { code: "es", name: "Spanyol", emoji: "🇪🇸" },
  { code: "lk", name: "Sri Lanka", emoji: "🇱🇰" },
  { code: "sd", name: "Sudan", emoji: "🇸🇩" },
  { code: "ss", name: "Sudan Selatan", emoji: "🇸🇸" },
  { code: "sr", name: "Suriname", emoji: "🇸🇷" },
  { code: "sz", name: "Eswatini", emoji: "🇸🇿" },
  { code: "sy", name: "Suriah", emoji: "🇸🇾" },
  { code: "tw", name: "Taiwan", emoji: "🇹🇼" },
  { code: "tj", name: "Tajikistan", emoji: "🇹🇯" },
  { code: "tz", name: "Tanzania", emoji: "🇹🇿" },
  { code: "th", name: "Thailand", emoji: "🇹🇭" },
  { code: "tl", name: "Timor Leste", emoji: "🇹🇱" },
  { code: "tg", name: "Togo", emoji: "🇹🇬" },
  { code: "tn", name: "Tunisia", emoji: "🇹🇳" },
  { code: "tr", name: "Turki", emoji: "🇹🇷" },
  { code: "tm", name: "Turkmenistan", emoji: "🇹🇲" },
  { code: "ug", name: "Uganda", emoji: "🇺🇬" },
  { code: "ua", name: "Ukraina", emoji: "🇺🇦" },
  { code: "gb", name: "Inggris (UK)", emoji: "🇬🇧" },
  { code: "uy", name: "Uruguay", emoji: "🇺🇾" },
  { code: "uz", name: "Uzbekistan", emoji: "🇺🇿" },
  { code: "ve", name: "Venezuela", emoji: "🇻🇪" },
  { code: "vn", name: "Vietnam", emoji: "🇻🇳" },
  { code: "ye", name: "Yaman", emoji: "🇾🇪" },
  { code: "zm", name: "Zambia", emoji: "🇿🇲" },
  { code: "zw", name: "Zimbabwe", emoji: "🇿🇼" },
] as const

export const COUNTRY_NAMES = COUNTRIES.map((c) => c.name)
export const COUNTRY_CODE_MAP: Record<string, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.name, c.code])
)

export const ASEAN_COUNTRIES = [
  { code: "id", name: "Indonesia", emoji: "🇮🇩" },
  { code: "my", name: "Malaysia", emoji: "🇲🇾" },
  { code: "sg", name: "Singapura", emoji: "🇸🇬" },
  { code: "th", name: "Thailand", emoji: "🇹🇭" },
  { code: "ph", name: "Filipina", emoji: "🇵🇭" },
  { code: "vn", name: "Vietnam", emoji: "🇻🇳" },
  { code: "mm", name: "Myanmar", emoji: "🇲🇲" },
  { code: "kh", name: "Kamboja", emoji: "🇰🇭" },
  { code: "la", name: "Laos", emoji: "🇱🇦" },
  { code: "bn", name: "Brunei", emoji: "🇧🇳" },
  { code: "tl", name: "Timor Leste", emoji: "🇹🇱" },
] as const

export type AseanCountryCode = typeof ASEAN_COUNTRIES[number]["code"]

export function getAseanCountryByCode(code: string) {
  return ASEAN_COUNTRIES.find((c) => c.code === code.toLowerCase()) || null
}

export function getAseanCountryByName(name: string) {
  return ASEAN_COUNTRIES.find((c) => c.name.toLowerCase() === name.toLowerCase()) || null
}

export function getStatusColor(status: string, type: "booking" | "travel" | "ticket" | "invoice"): string {
  const statusMap = {
    booking: Object.fromEntries(BOOKING_STATUSES.map((s) => [s.value, s.color])),
    travel: Object.fromEntries(TRAVEL_STATUSES.map((s) => [s.value, s.color])),
    ticket: Object.fromEntries(TICKET_STATUSES.map((s) => [s.value, s.color])),
    invoice: Object.fromEntries(INVOICE_STATUSES.map((s) => [s.value, s.color])),
  }
  return statusMap[type][status] || "bg-gray-100 text-gray-700"
}

export function getStatusLabel(status: string, type: "booking" | "travel" | "ticket" | "invoice"): string {
  const statusMap = {
    booking: Object.fromEntries(BOOKING_STATUSES.map((s) => [s.value, s.label])),
    travel: Object.fromEntries(TRAVEL_STATUSES.map((s) => [s.value, s.label])),
    ticket: Object.fromEntries(TICKET_STATUSES.map((s) => [s.value, s.label])),
    invoice: Object.fromEntries(INVOICE_STATUSES.map((s) => [s.value, s.label])),
  }
  return statusMap[type][status] || status
}
