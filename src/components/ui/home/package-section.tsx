"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Hotel, Plane, Clock, MapPin, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Package } from "@/lib/types";

export default function PackageSection() {
  const { t } = useTranslation();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [compared, setCompared] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("packages")
      .select("*")
      .eq("status", "published")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        setPackages((data as Package[]) || []);
        setLoading(false);
      });
  }, []);

  const toggleCompare = (id: string) => {
    setCompared((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-slide-up");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const animatedElements = document.querySelectorAll(".card-animate");
    animatedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [packages]);

  if (loading) {
    return (
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 space-y-2">
            <div className="h-8 w-72 bg-muted rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white border animate-shimmer-skeleton">
                <div className="h-44" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              {t.package.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Harga terbaik, fasilitas premium
            </p>
          </div>
          <Link
            href="/search"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {t.common.view_all}
          </Link>
        </div>

        {/* Compare bar */}
        {compared.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl z-40 flex items-center gap-4 bg-primary text-white shadow-2xl shadow-primary/40">
            <span className="text-sm font-medium">{compared.length} paket dipilih untuk dibandingkan</span>
            <Link href={`/compare?ids=${compared.join(",")}`} className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-gold to-gold-light text-emerald-deep">
              Bandingkan
            </Link>
            <button onClick={() => setCompared([])} className="text-xs opacity-60 hover:opacity-100">
              {t.common.delete}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {packages.map((pkg, index) => {
            const seatsLeft = pkg.available ?? pkg.quota;
            const fillPercentage = ((pkg.quota - seatsLeft) / pkg.quota) * 100;
            const isCompared = compared.includes(pkg.id);

            return (
              <div
                key={pkg.id}
                className="rounded-2xl overflow-hidden bg-white border card-hover card-animate"
                style={{
                  borderColor: isCompared ? "rgb(201,162,75)" : "rgba(0,0,0,0.07)",
                  borderWidth: isCompared ? "2px" : "1px",
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Image header */}
                <div className="h-44 relative overflow-hidden">
                  <Image
                    src={pkg.image_url || "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=600&h=300&fit=crop&auto=format"}
                    alt={pkg.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {pkg.is_promo && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                      Promo
                    </span>
                  )}
                  {pkg.type === "premium" && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-gold to-gold-light text-emerald-deep">
                      Premium
                    </span>
                  )}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div className="text-xs text-white/80">{pkg.airline} \u00b7 Hotel Bintang {pkg.hotel_makkah_stars}</div>
                    <div className="flex items-center gap-1">
                      <Star size={11} fill="#E8C97A" stroke="none" />
                      <span className="text-xs text-white font-medium">4.8</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-xs font-semibold text-primary mb-1">
                    Paket {pkg.type || "Reguler"}
                  </p>
                  <h3 className="font-bold text-sm leading-snug line-clamp-2 mb-3">
                    <Link href={`/package/${pkg.slug}`}>{pkg.name}</Link>
                  </h3>

                  <div className="flex gap-4 mb-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={12} /> {pkg.duration_days} Hari</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {pkg.departure_month || "TBA"}</span>
                  </div>

                  {/* Seat bar */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-4 bg-zinc-100 rounded-full overflow-hidden relative flex items-center">
                      <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${100 - fillPercentage}%` }} />
                      <span className="absolute right-2 z-10 text-[9px] font-bold text-zinc-600">
                        Sisa Seat {seatsLeft}
                      </span>
                    </div>
                  </div>

                  {/* Price + actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/60">
                    <div>
                      <p className="text-xs text-muted-foreground">{t.package.price_from}</p>
                      <p className="font-bold text-base text-primary">
                        Rp {(pkg.price / 1_000_000).toFixed(0)}jt
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleCompare(pkg.id)}
                        className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: isCompared ? "rgba(201,162,75,0.15)" : "rgba(0,0,0,0.05)",
                          color: isCompared ? "#8B6B20" : "#666",
                          border: isCompared ? "1px solid rgba(201,162,75,0.4)" : "none",
                        }}
                      >
                        {isCompared ? "\u2713 Dibandingkan" : "Bandingkan"}
                      </button>
                      <Link
                        href={`/package/${pkg.slug}`}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
                      >
                        Detail
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
