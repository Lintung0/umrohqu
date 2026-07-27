"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUpIcon, TrendingDownIcon, Loader2 } from "lucide-react";

interface StatsData {
  gmv: {
    total: number;
    changePercent: number;
    trend: "up" | "down";
  };
  revenue: {
    total: number;
    serviceFee: number;
    setupFee: number;
    bidding: number;
    changePercent: number;
    trend: "up" | "down";
  };
  transactions: {
    total: number;
    paid: number;
    pending: number;
    newSinceYesterday: number;
  };
  mitra: {
    total: number;
    pendingOnboarding: number;
    newLastWeek: number;
  };
}

export function SectionCards() {
  const [data, setData] = React.useState<StatsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) {
          throw new Error("Gagal mengambil data statistik");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 min-h-48">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="flex h-36 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-xs text-muted-foreground">
              Memuat data...
            </span>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-4 py-8 text-center text-sm text-destructive font-medium lg:px-6">
        Error: {error || "Gagal memuat data statistik"}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* 1. Total GMV */}
      <Card className="@container/card border-l-4 border-l-[#2EA56F] bg-linear-to-t from-[#2EA56F]/5 to-card dark:bg-card">
        <CardHeader>
          <CardDescription className="font-semibold text-foreground">
            Total GMV
          </CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl mt-1">
            {formatRupiah(data.gmv.total)}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={
                data.gmv.changePercent >= 0
                  ? "text-emerald-600 border-emerald-500/20 bg-emerald-50/50 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-500/20 gap-1"
                  : "text-destructive border-destructive/20 bg-destructive/10 gap-1"
              }
            >
              {data.gmv.changePercent >= 0 ? (
                <TrendingUpIcon className="size-3.5" />
              ) : (
                <TrendingDownIcon className="size-3.5" />
              )}
              {data.gmv.changePercent >= 0 ? "+" : ""}
              {data.gmv.changePercent.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 pt-0 text-muted-foreground text-sm font-medium">
          Total uang masuk
        </CardFooter>
      </Card>

      {/* 2. Revenue */}
      <Card className="@container/card border-l-4 border-l-blue-500 bg-linear-to-t from-blue-500/5 to-card dark:bg-card">
        <CardHeader>
          <CardDescription className="font-semibold text-foreground">
            Pendapatan Bersih
          </CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl mt-1">
            {formatRupiah(data.revenue.total)}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={
                data.revenue.changePercent >= 0
                  ? "text-emerald-600 border-emerald-500/20 bg-emerald-50/50 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-500/20 gap-1"
                  : "text-destructive border-destructive/20 bg-destructive/10 gap-1"
              }
            >
              {data.revenue.changePercent >= 0 ? (
                <TrendingUpIcon className="size-3.5" />
              ) : (
                <TrendingDownIcon className="size-3.5" />
              )}
              {data.revenue.changePercent >= 0 ? "+" : ""}
              {data.revenue.changePercent.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 pt-0 text-muted-foreground text-sm font-medium">
          Pendapatan bersih platform
        </CardFooter>
      </Card>

      {/* 3. Total Transaksi */}
      <Card className="@container/card border-l-4 border-l-amber-500 bg-linear-to-t from-amber-500/5 to-card dark:bg-card">
        <CardHeader>
          <CardDescription className="font-semibold text-foreground">
            Total Transaksi
          </CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl mt-1">
            {data.transactions.total}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="text-amber-600 border-amber-500/20 bg-amber-50/50 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-500/20 gap-1"
            >
              +{data.transactions.newSinceYesterday}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 pt-0 text-muted-foreground text-sm font-medium">
          Jumlah pesanan masuk
        </CardFooter>
      </Card>

      {/* 4. Jumlah Mitra */}
      <Card className="@container/card border-l-4 border-l-purple-500 bg-linear-to-t from-purple-500/5 to-card dark:bg-card">
        <CardHeader>
          <CardDescription className="font-semibold text-foreground">
            Jumlah Mitra
          </CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl mt-1">
            {data.mitra.total}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="text-purple-600 border-purple-500/20 bg-purple-50/50 dark:text-purple-400 dark:bg-purple-950/20 dark:border-purple-500/20 gap-1"
            >
              +{data.mitra.newLastWeek}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 pt-0 text-muted-foreground text-sm font-medium">
          Travel agency terdaftar
        </CardFooter>
      </Card>
    </div>
  );
}
