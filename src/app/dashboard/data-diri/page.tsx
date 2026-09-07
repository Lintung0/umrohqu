"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { User, PostgrestError } from "@supabase/supabase-js"
import { UserRound, Loader2, Check, ChevronRight, ShieldCheck, MapPin, IdCard, PhoneCall } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getMissingDataDiriFields } from "@/lib/data-diri"

interface ProfileData {
  nik?: string
  passport_number?: string
  passport_expiry?: string
  passport_place?: string
  passport_issue_date?: string
  birth_date?: string
  birth_place?: string
  gender?: string
  mother_name?: string
  marital_status?: string
  occupation?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
}

interface AddressData {
  street?: string
  city?: string
  province?: string
  postal_code?: string
  village?: string
  district?: string
  rt_rw?: string
}

const GENDER_OPTIONS = [
  { value: "laki-laki", label: "Laki-laki" },
  { value: "perempuan", label: "Perempuan" },
]

const MARITAL_OPTIONS = [
  { value: "belum-menikah", label: "Belum Menikah" },
  { value: "menikah", label: "Menikah" },
  { value: "cerai-hidup", label: "Cerai Hidup" },
  { value: "cerai-mati", label: "Cerai Mati" },
]

export default function DataDiriPage() {
  const supabase = createClient()
  const router = useRouter()
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [nik, setNik] = useState("")
  const [passportNumber, setPassportNumber] = useState("")
  const [passportExpiry, setPassportExpiry] = useState("")
  const [passportPlace, setPassportPlace] = useState("")
  const [passportIssueDate, setPassportIssueDate] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [birthPlace, setBirthPlace] = useState("")
  const [gender, setGender] = useState("")
  const [motherName, setMotherName] = useState("")
  const [maritalStatus, setMaritalStatus] = useState("")
  const [occupation, setOccupation] = useState("")
  const [emergencyName, setEmergencyName] = useState("")
  const [emergencyPhone, setEmergencyPhone] = useState("")

  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [province, setProvince] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [village, setVillage] = useState("")
  const [district, setDistrict] = useState("")
  const [rtRw, setRtRw] = useState("")
  const [addressId, setAddressId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setAuthUser(user)
      if (user) {
        setFullName(user.user_metadata?.full_name || "")
        setPhone(user.user_metadata?.phone || "")
      }

      const [{ data: userRow }, { data: addrRows }] = await Promise.all([
        supabase.from("users").select("profile, full_name, phone").eq("id", user?.id || "").maybeSingle(),
        supabase.from("user_addresses").select("*").eq("user_id", user?.id || "").maybeSingle(),
      ])

      const profile = (userRow?.profile as ProfileData) || {}
      setNik(profile.nik || "")
      setPassportNumber(profile.passport_number || "")
      setPassportExpiry(profile.passport_expiry || "")
      setPassportPlace(profile.passport_place || "")
      setPassportIssueDate(profile.passport_issue_date || "")
      setBirthDate(profile.birth_date || "")
      setBirthPlace(profile.birth_place || "")
      setGender(profile.gender || "")
      setMotherName(profile.mother_name || "")
      setMaritalStatus(profile.marital_status || "")
      setOccupation(profile.occupation || "")
      setEmergencyName(profile.emergency_contact_name || "")
      setEmergencyPhone(profile.emergency_contact_phone || "")

      setAddressId(addrRows?.id || null)
      setStreet(addrRows?.street || "")
      setCity(addrRows?.city || "")
      setProvince(addrRows?.province || "")
      setPostalCode(addrRows?.postal_code || "")
      setVillage(addrRows?.village || "")
      setDistrict(addrRows?.district || "")
      setRtRw(addrRows?.rt_rw || "")
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!authUser) return
    setSaving(true)

    const profile: ProfileData = {
      nik,
      passport_number: passportNumber,
      passport_expiry: passportExpiry,
      passport_place: passportPlace,
      passport_issue_date: passportIssueDate,
      birth_date: birthDate,
      birth_place: birthPlace,
      gender,
      mother_name: motherName,
      marital_status: maritalStatus,
      occupation,
      emergency_contact_name: emergencyName,
      emergency_contact_phone: emergencyPhone,
    }

    const [{ error: authErr }, { error: userErr }] = await Promise.all([
      supabase.auth.updateUser({
        data: { full_name: fullName, phone },
      }),
      supabase
        .from("users")
        .update({ full_name: fullName, phone, profile })
        .eq("id", authUser.id),
    ])

    const addrPayload: AddressData = {
      street,
      city,
      province,
      postal_code: postalCode,
      village,
      district,
      rt_rw: rtRw,
    }
    let addrErr: PostgrestError | null = null
    if (addressId) {
      ;({ error: addrErr } = await supabase
        .from("user_addresses")
        .update(addrPayload)
        .eq("id", addressId))
    } else {
      ;({ error: addrErr } = await supabase
        .from("user_addresses")
        .insert({ user_id: authUser.id, ...addrPayload }))
    }

    if (authErr || userErr || addrErr) {
      toast.error("Gagal menyimpan data diri")
    } else {
      setSaved(true)
      toast.success("Data diri berhasil disimpan")
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-96 bg-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  const inputClass = "mt-1.5"

  const missingFields = getMissingDataDiriFields(
    {
      nik,
      gender,
      birth_date: birthDate,
      birth_place: birthPlace,
      mother_name: motherName,
      passport_number: passportNumber,
      passport_expiry: passportExpiry,
      passport_place: passportPlace,
      passport_issue_date: passportIssueDate,
      emergency_contact_name: emergencyName,
      emergency_contact_phone: emergencyPhone,
    },
    { street, city, province, postal_code: postalCode, village, district, rt_rw: rtRw }
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Diri</h1>
        <p className="text-muted-foreground mt-1">Lengkapi informasi diri secara lengkap agar proses pemesanan lebih cepat</p>
      </div>

      {/* Kelengkapan */}
      <div className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-2 ${
        missingFields.length === 0
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-amber-50 border-amber-200 text-amber-700"
      }`}>
        {missingFields.length === 0 ? (
          <>
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Data diri Anda <b>lengkap</b>. Travel dapat melihat data Anda setelah konfirmasi pemesanan.</span>
          </>
        ) : (
          <>
            <span className="w-4 h-4 shrink-0 mt-0.5 flex items-center justify-center text-amber-700">⚠</span>
            <span>
              <b>{missingFields.length} data belum diisi</b> agar data diri lengkap:
              <span className="block mt-1 text-xs text-amber-700/80">{missingFields.join(", ")}</span>
            </span>
          </>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identitas */}
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-br from-emerald-50/60 to-white">
            <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <UserRound className="w-4 h-4 text-white" />
            </span>
            <div>
              <h2 className="font-semibold text-sm">Identitas</h2>
              <p className="text-xs text-muted-foreground">Data pribadi & dokumen perjalanan</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Nama Lengkap</Label>
                <Input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Telepon</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxx" className={inputClass} />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">NIK</Label>
                <Input type="text" value={nik} onChange={(e) => setNik(e.target.value)} placeholder="16 digit" className={inputClass} />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Jenis Kelamin</Label>
                <Select
                  value={gender || undefined}
                  onValueChange={(v: string | null) => setGender(v || "")}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Tanggal Lahir</Label>
                <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Tempat Lahir</Label>
                <Input type="text" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} placeholder="Mis. Malang" className={inputClass} />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Nama Ibu Kandung</Label>
                <Input type="text" value={motherName} onChange={(e) => setMotherName(e.target.value)} placeholder="Sesuai akta/KK" className={inputClass} />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Status Kawin</Label>
                <Select
                  value={maritalStatus || undefined}
                  onValueChange={(v: string | null) => setMaritalStatus(v || "")}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARITAL_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Pekerjaan</Label>
                <Input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Mis. Wiraswasta" className={inputClass} />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-muted-foreground px-1">
              <IdCard className="w-3.5 h-3.5" />
              Gunakan data yang sesuai dengan KTP / paspor Anda
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-sm">Data Paspor</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Nomor Paspor</Label>
                  <Input type="text" value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} placeholder="A1234567" className={inputClass} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Masa Berlaku Paspor</Label>
                  <Input type="date" value={passportExpiry} onChange={(e) => setPassportExpiry(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Tempat Terbit Paspor</Label>
                  <Input type="text" value={passportPlace} onChange={(e) => setPassportPlace(e.target.value)} placeholder="Mis. Kantor Imigrasi Malang" className={inputClass} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Tanggal Terbit Paspor</Label>
                  <Input type="date" value={passportIssueDate} onChange={(e) => setPassportIssueDate(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alamat */}
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-br from-emerald-50/60 to-white">
            <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </span>
            <div>
              <h2 className="font-semibold text-sm">Alamat</h2>
              <p className="text-xs text-muted-foreground">Alamat tempat tinggal saat ini</p>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className="text-xs font-medium text-muted-foreground">Alamat Lengkap</Label>
              <Input type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Jalan, RT/RW, kelurahan" className={inputClass} />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">RT/RW</Label>
              <Input type="text" value={rtRw} onChange={(e) => setRtRw(e.target.value)} placeholder="002/005" className={inputClass} />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Kelurahan/Desa</Label>
              <Input type="text" value={village} onChange={(e) => setVillage(e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Kecamatan</Label>
              <Input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Kota/Kabupaten</Label>
              <Input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Provinsi</Label>
              <Input type="text" value={province} onChange={(e) => setProvince(e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Kode Pos</Label>
              <Input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Kontak Darurat */}
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-br from-emerald-50/60 to-white">
            <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <PhoneCall className="w-4 h-4 text-white" />
            </span>
            <div>
              <h2 className="font-semibold text-sm">Kontak Darurat</h2>
              <p className="text-xs text-muted-foreground">Keluarga yang bisa dihubungi saat keberangkatan</p>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Nama Keluarga</Label>
              <Input type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} placeholder="Nama keluarga / kerabat" className={inputClass} />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Nomor Telepon</Label>
              <Input type="tel" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} placeholder="08xxx" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between bg-white border border-border rounded-xl px-5 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            {saved && (
              <span className="inline-flex items-center gap-1 text-sm text-emerald-600 font-medium">
                <Check className="w-4 h-4" /> Tersimpan
              </span>
            )}
            <span className="hidden sm:inline text-xs text-muted-foreground">Data ini aman & terenkripsi</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-5 py-2 rounded-lg font-medium hover:from-emerald-700 hover:to-emerald-600 transition-colors disabled:opacity-50 text-sm shadow-md shadow-emerald-600/25"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? "Menyimpan..." : "Simpan Data Diri"}
              {!saving && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
