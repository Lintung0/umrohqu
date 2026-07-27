"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Hotel, Plane, Clock, MapPin, CreditCard, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Package } from "@/lib/types";

export default function PackageSection() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("packages")
      .select("*")
      .eq("status", "published")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(9)
      .then(({ data }) => {
        setPackages((data as Package[]) || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <section className="py-20 px-6 md:px-12 bg-zinc-50/50 dark:bg-zinc-950/10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-left space-y-2">
            <div className="h-8 w-72 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-border rounded-xl p-4 space-y-3">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-muted rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                </div>
                <div className="h-16 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-6 md:px-12 bg-zinc-50/50 dark:bg-zinc-950/10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-left space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight capitalize">
            Jadwal Keberangkatan Terdekat
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const seatsLeft = pkg.available ?? pkg.quota;
            const fillPercentage = ((pkg.quota - seatsLeft) / pkg.quota) * 100;
            return (
              <div
                key={pkg.id}
                className="bg-white dark:bg-card border border-border rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col h-full"
              >
                <div className="p-4 flex gap-4 items-start">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-border">
                    <Image
                      src={pkg.image_url || "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80"}
                      alt={pkg.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2 hover:text-primary transition-colors">
                      <Link href={`/package/${pkg.slug}`}>{pkg.name}</Link>
                    </h3>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative flex items-center">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${100 - fillPercentage}%` }}
                        />
                        <span className="absolute right-2.5 z-10 text-[9px] font-bold text-zinc-600 dark:text-zinc-300">
                          Sisa Seat {seatsLeft}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2 border-t border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/30 dark:bg-zinc-900/10">
                  <span className="text-xs text-muted-foreground font-medium">
                    {pkg.type || "Reguler"}
                  </span>
                  <span className="text-sm md:text-base font-bold text-amber-600 dark:text-amber-500">
                    Rp {(pkg.price / 1_000_000).toFixed(1)}jt
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground/80" />
                        <span>{pkg.departure_month || "TBA"}</span>
                      </div>
                      <div className="flex items-center gap-2 font-medium">
                        <Plane className="w-3.5 h-3.5 text-muted-foreground/80" />
                        <span>{pkg.airline}</span>
                      </div>
                      <div className="flex items-center gap-2 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground/80" />
                        <span className="truncate">{(pkg.departure_cities || [pkg.departure_city]).join(", ")}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 font-medium">
                        <Hotel className="w-3.5 h-3.5 text-muted-foreground/80" />
                        <span>Hotel ★ {pkg.hotel_makkah_stars}</span>
                      </div>
                      <div className="flex items-center gap-2 font-medium">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/80" />
                        <span>{pkg.duration_days} Hari</span>
                      </div>
                    </div>
                  </div>

                  {pkg.is_promo && (
                    <div className="mt-auto pt-2 flex justify-end">
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-green-500/10 text-green-600 dark:text-green-500 text-[10px] font-bold uppercase tracking-wider">
                        <CreditCard className="w-3 h-3" />
                        <span>Promo</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
