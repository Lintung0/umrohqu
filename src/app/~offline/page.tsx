import Link from "next/link";
import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-gray-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Anda sedang offline</h1>
        <p className="mt-2 text-sm text-gray-500">
          Periksa koneksi internet Anda, lalu muat ulang halaman untuk melanjutkan.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}