import { Building2, Target, Eye, Users, Shield, Award } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-emerald-600 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-3xl font-bold">Tentang UmrahQu</h1>
          <p className="text-emerald-100 max-w-2xl mx-auto">
            Platform marketplace Haji &amp; umrah yang menghubungkan travel terpercaya dengan jamaah di seluruh Indonesia
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 -mt-8 space-y-8">
        {/* Visi */}
        <div className="bg-white rounded-2xl border border-border p-8">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold">Visi</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Menjadi platform marketplace Haji &amp; umrah terdepan di Indonesia yang menghubungkan travel, jamaah, dan mitra dalam satu ekosistem digital terintegrasi, sekaligus menjadi sumber pendapatan melalui model bisnis berbasis setup fee, service fee, dan bidding promosi.
          </p>
        </div>

        {/* Misi */}
        <div className="bg-white rounded-2xl border border-border p-8">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold">Misi</h2>
          </div>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
              Membangun ekosistem digital yang memudahkan jamaah menemukan paket umrah terbaik
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
              Memberdayakan travel dengan platform SaaS untuk mengelola bisnis mereka secara digital
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
              Menyediakan layanan transparan, aman, dan terpercaya bagi seluruh pemangku kepentingan
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
              Mendukung program pemberangkatan ibadah umrah bagi masyarakat Indonesia
            </li>
          </ul>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: "Terpercaya", desc: "Setiap travel diverifikasi dan diawasi untuk menjamin kualitas layanan" },
            { icon: Users, title: "Terjangkau", desc: "Berbagai pilihan paket untuk semua kalangan dengan harga transparan" },
            { icon: Award, title: "Berkualitas", desc: "Muthawwif berpengalaman, hotel bintang 5, dan pelayanan terbaik" },
          ].map((v) => (
            <div key={v.title} className="bg-white rounded-2xl border border-border p-6 text-center">
              <v.icon className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">{v.title}</h3>
              <p className="text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Company */}
        <div className="bg-white rounded-2xl border border-border p-8">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold">Perusahaan</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>UmrahQu adalah produk dari <strong>PT. Universal Big Data</strong>.</p>
            <p>Platform ini dibangun dengan visi menjadi ekosistem digital terpadu untuk industri haji dan umrah di Indonesia.</p>
            <p className="pt-2">Email: <strong>info@umrohq.com</strong></p>
            <p>WhatsApp: <strong>{process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "+62 812-3456-7890"}</strong></p>
          </div>
        </div>
      </div>
    </div>
  )
}
