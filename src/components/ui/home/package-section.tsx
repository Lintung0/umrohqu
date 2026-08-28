"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, Loader2, Search } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatRupiah, decodeUnicodeEscapes } from "@/lib/utils";
import { enrichPackagesWithDetail } from "@/lib/package-detail-fields";
import PackageCard from "@/components/shared/package-card";
import type { Package } from "@/lib/types";

const PAGE_SIZE = 6;

function packagesEqual(a: Package[], b: Package[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || (a[i] as any).image_url !== (b[i] as any).image_url) return false;
  }
  return true;
}

export default function PackageSection() {
  const { t } = useTranslation();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [compared, setCompared] = useState<string[]>([]);
  const packagesRef = useRef<Package[]>([]);
  const initialLoadDone = useRef(false);

  const fetchPackages = useCallback(async (pageNum: number, showLoading = false) => {
    const isInitial = pageNum === 1 && showLoading;
    if (isInitial) setLoading(true);
    else if (pageNum > 1) setLoadingMore(true);

    try {
      const from = 0;
      const to = pageNum * PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .in("status", ["active", "ongoing"])
        .neq("type", "haji")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error || !data) return;

      const pkgs = (await enrichPackagesWithDetail(supabase, (data as Package[]) || [])) || [];
      if (pkgs.length > 0) {
        const ids = pkgs.map((p) => p.id);
        const { data: bookings } = await supabase
          .from("bookings")
          .select("id, package_id")
          .in("package_id", ids);
        const bookingIds = (bookings || []).map((b: any) => b.id);
        const bookingPkgMap = new Map<string, string>();
        (bookings || []).forEach((b: any) => { bookingPkgMap.set(b.id, b.package_id); });

        const { data: reviews } = bookingIds.length > 0
          ? await supabase.from("reviews").select("rating, booking_id").in("booking_id", bookingIds)
          : { data: null };

        const ratingMap = new Map<string, { sum: number; count: number }>();
        (reviews || []).forEach((r: any) => {
          const pkgId = bookingPkgMap.get(r.booking_id);
          if (pkgId) {
            const existing = ratingMap.get(pkgId) || { sum: 0, count: 0 };
            existing.sum += r.rating;
            existing.count += 1;
            ratingMap.set(pkgId, existing);
          }
        });

        (pkgs as any).forEach((p: any) => {
          const r = ratingMap.get(p.id);
          p.avg_rating = r ? Math.round((r.sum / r.count) * 10) / 10 : null;
          p.review_count = r ? r.count : 0;
        });
      }

      if (!packagesEqual(packagesRef.current, pkgs)) {
        packagesRef.current = pkgs;
        setPackages(pkgs);
        setHasMore(pkgs.length > pageNum * PAGE_SIZE);
      }
    } catch {
      // silently ignore network / enrich errors
    } finally {
      if (isInitial) setLoading(false);
      if (pageNum > 1) setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchPackages(1, true);
    }
  }, [fetchPackages]);

  useEffect(() => {
    const channel = supabase
      .channel("packages-home")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "packages" },
        () => fetchPackages(1)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPackages]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchPackages(next);
  }

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

    document.querySelectorAll(".card-animate").forEach((el) => observer.observe(el));
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {t.common.view_all}
          </Link>
        </div>

        {compared.length > 0 && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl z-40 flex items-center gap-4 bg-primary text-white shadow-2xl shadow-primary/40">
            <span className="text-sm font-medium">{compared.length} paket dipilih untuk dibandingkan</span>
            <Link href={`/compare?ids=${compared.join(",")}`} className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-gold to-gold-light text-emerald-deep">
              Bandingkan
            </Link>
            <button onClick={() => setCompared([])} className="text-xs opacity-60 hover:opacity-100">
              {t.common.delete}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg, index) => (
            <div
              key={pkg.id}
              className="card-animate"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <PackageCard pkg={pkg} showTravel={false} />
            </div>
          ))}
        </div>

        {packages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Search className="w-7 h-7 text-primary/40" />
            </div>
            <p className="text-muted-foreground font-medium">Belum ada paket tersedia</p>
          </div>
        )}

          {hasMore && packages.length > 0 && (
            <div className="mt-10 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memuat...
                  </>
                ) : (
                  <>
                    Muat Lebih Banyak
                    <span className="text-xs text-muted-foreground">({packages.length} paket)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>
    );
}
