import { Shield } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-600 text-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <Shield className="w-12 h-12 mx-auto opacity-80" />
          <h1 className="text-3xl font-bold">Kebijakan Privasi</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 -mt-8">
        <div className="bg-white rounded-2xl border border-border p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-semibold text-foreground mb-2">1. Pengumpulan Data</h2>
            <p>Kami mengumpulkan data pribadi yang Anda berikan saat pendaftaran, pemesanan, dan penggunaan layanan, termasuk: nama, email, nomor telepon, NIK, nomor paspor, dan data pembayaran.</p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">2. Penggunaan Data</h2>
            <p>Data Anda digunakan untuk: memproses pemesanan, komunikasi terkait booking, peningkatan layanan, dan keperluan hukum sesuai ketentuan yang berlaku.</p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">3. Perlindungan Data</h2>
            <p>Kami menggunakan enkripsi SSL dan protokol keamanan standar industri untuk melindungi data pribadi Anda dari akses yang tidak sah.</p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">4. Berbagi Data</h2>
            <p>Data Anda akan dibagikan kepada travel terkait untuk keperluan pemrosesan booking. Kami tidak menjual atau membagikan data Anda kepada pihak ketiga untuk tujuan pemasaran tanpa persetujuan Anda.</p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">5. Hak Anda</h2>
            <p>Anda berhak mengakses, memperbarui, atau menghapus data pribadi Anda kapan saja melalui dashboard pengaturan akun atau dengan menghubungi kami.</p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">6. Cookie</h2>
            <p>Platform kami menggunakan cookie untuk meningkatkan pengalaman pengguna. Anda dapat mengatur preferensi cookie melalui browser Anda.</p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">7. Hubungi Kami</h2>
            <p>Untuk pertanyaan terkait privasi, hubungi kami di <strong>privacy@umrohq.com</strong> atau WhatsApp <strong>+62 82232169960</strong>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
