export interface DataDiriProfile {
  gender?: string | null
  birth_date?: string | null
  birth_place?: string | null
  passport_number?: string | null
  passport_expiry?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
}

export interface DataDiriAddress {
  street?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  village?: string | null
  district?: string | null
  rt_rw?: string | null
}

const REQUIRED_FIELDS: { key: keyof DataDiriProfile | keyof DataDiriAddress; label: string }[] = [
  { key: "gender", label: "Jenis Kelamin" },
  { key: "birth_date", label: "Tanggal Lahir" },
  { key: "birth_place", label: "Tempat Lahir" },
  { key: "passport_number", label: "Nomor Paspor" },
  { key: "passport_expiry", label: "Masa Berlaku Paspor" },
  { key: "emergency_contact_name", label: "Kontak Darurat (Nama)" },
  { key: "emergency_contact_phone", label: "Kontak Darurat (Telepon)" },
  { key: "street", label: "Alamat Lengkap" },
  { key: "city", label: "Kota/Kabupaten" },
  { key: "province", label: "Provinsi" },
  { key: "postal_code", label: "Kode Pos" },
]

export function getMissingDataDiriFields(
  profile: Partial<DataDiriProfile>,
  address: Partial<DataDiriAddress>
): string[] {
  const values: Record<string, string | null | undefined> = {
    ...(profile as Record<string, string | null | undefined>),
    ...(address as Record<string, string | null | undefined>),
  }
  return REQUIRED_FIELDS.filter((f) => !values[f.key]?.trim()).map((f) => f.label)
}

export function isDataDiriComplete(
  profile: Partial<DataDiriProfile>,
  address: Partial<DataDiriAddress>
): boolean {
  return getMissingDataDiriFields(profile, address).length === 0
}