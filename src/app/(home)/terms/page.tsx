import { FileText } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-600 text-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <FileText className="w-12 h-12 mx-auto opacity-80" />
          <h1 className="text-3xl font-bold">Syarat &amp; Ketentuan</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 -mt-8">
        <div className="bg-white rounded-2xl border border-border p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-semibold text-foreground mb-2">1. Penerimaan Syarat</h2>
            <p>Dengan mengakses dan menggunakan platform UmrahQu, Anda menyetujui syarat dan ketentuan yang berlaku. Jika Anda tidak setuju dengan syarat ini, mohon untuk tidak menggunakan layanan kami.</p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">2. Pendaftaran Akun</h2>
            <p>Untuk melakukan pemesanan, Anda wajib membuat akun dengan data yang valid dan akurat. Anda bertanggung jawab untuk menjaga kerahasiaan akun dan kata sandi Anda.</p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">3. Pemesanan &amp; Pembayaran</h2>
            <p>Pemesanan akan diproses setelah pembayaran diterima secara lengkap. Harga yang tercantum sudah termasuk biaya layanan sesuai ketentuan yang berlaku. Biaya layanan bersifat non-refundable.</p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">4. Pembatalan &amp; Pengembalian Dana</h2>
            <p>Kebijakan pembatalan bervariasi tergantung travel penyelenggara. Secara umum: pembatalan 60+ hari sebelum keberangkatan: refund 80%, 30-59 hari: refund 50%, 14-29 hari: refund 25%, di bawah 14 hari: tidak ada refund.</p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">5. Tanggung Jawab Travel</h2>
            <p>UmrahQu bertindak sebagai marketplace yang menghubungkan jamaah dengan travel. Travel penyelenggara bertanggung jawab penuh atas pelaksanaan perjalanan umroh.</p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">6. Ulasan &amp; Konten</h2>
            <p>Ulasan yang Anda berikan harus jujur dan tidak melanggar hukum. UmrahQu berhak menghapus ulasan yang mengandung konten tidak pantas atau palsu.</p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">7. Perubahan Ketentuan</h2>
            <p>UmrahQu berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diberitahukan melalui platform atau email.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
