import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, subMonths, subDays } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createAdminClient();

    // 1. Fetch Bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("total, fee, status, created_at");

    if (bookingsError) {
      throw bookingsError;
    }

    // 2. Fetch Tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("status, created_at");

    if (tenantsError) {
      throw tenantsError;
    }

    // 3. Fetch Biddings
    const { data: biddings, error: biddingsError } = await supabase
      .from("biddings")
      .select("bid_value, status, created_at");

    if (biddingsError) {
      throw biddingsError;
    }

    const today = new Date();
    const startOfThisMonth = startOfMonth(today);
    const endOfThisMonth = endOfMonth(today);
    const startOfLastMonth = startOfMonth(subMonths(today, 1));
    const endOfLastMonth = endOfMonth(subMonths(today, 1));

    // --- GMV calculations ---
    // Paid bookings are 'confirmed' or 'completed'
    const paidBookings = (bookings || []).filter(
      (b) => b.status === "confirmed" || b.status === "completed",
    );

    const totalGmvRaw = paidBookings.reduce(
      (sum, b) => sum + Number(b.total || 0),
      0,
    );
    const totalGmv = totalGmvRaw === 0 ? 1 : totalGmvRaw;

    // GMV this month
    const gmvThisMonthRaw = paidBookings
      .filter((b) => {
        const date = new Date(b.created_at);
        return date >= startOfThisMonth && date <= endOfThisMonth;
      })
      .reduce((sum, b) => sum + Number(b.total || 0), 0);
    const gmvThisMonth = gmvThisMonthRaw === 0 ? 1 : gmvThisMonthRaw;

    // GMV last month
    const gmvLastMonthRaw = paidBookings
      .filter((b) => {
        const date = new Date(b.created_at);
        return date >= startOfLastMonth && date <= endOfLastMonth;
      })
      .reduce((sum, b) => sum + Number(b.total || 0), 0);
    const gmvLastMonth = gmvLastMonthRaw === 0 ? 1 : gmvLastMonthRaw;

    const gmvChangePercent =
      ((gmvThisMonth - gmvLastMonth) / gmvLastMonth) * 100;

    // --- Revenue calculations ---
    // Net income = Service Fee + Setup Fee + Bidding
    // Service Fee = sum of fee from paid bookings
    const serviceFeeRaw = paidBookings.reduce(
      (sum, b) => sum + Number(b.fee || 0),
      0,
    );
    const serviceFee = serviceFeeRaw === 0 ? 1 : serviceFeeRaw;

    // Setup Fee = verified tenants * 1,000,000 IDR (constant)
    const verifiedTenantsCount = (tenants || []).filter(
      (t) => t.status === "active",
    ).length;
    const setupFeeRaw = verifiedTenantsCount * 1000000;
    const setupFee = setupFeeRaw === 0 ? 1 : setupFeeRaw;

    // Bidding = sum of bid_value from biddings where status != 'cancelled'
    const biddingRaw = (biddings || [])
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + Number(b.bid_value || 0), 0);
    const bidding = biddingRaw === 0 ? 1 : biddingRaw;

    const totalRevenueRaw = serviceFeeRaw + setupFeeRaw + biddingRaw;
    const totalRevenue = totalRevenueRaw === 0 ? 1 : totalRevenueRaw;

    // Revenue this month
    const serviceFeeThisMonth = paidBookings
      .filter((b) => {
        const d = new Date(b.created_at);
        return d >= startOfThisMonth && d <= endOfThisMonth;
      })
      .reduce((sum, b) => sum + Number(b.fee || 0), 0);

    const setupFeeThisMonth =
      (tenants || []).filter((t) => {
        const d = new Date(t.created_at);
        return (
          t.status === "active" &&
          d >= startOfThisMonth &&
          d <= endOfThisMonth
        );
      }).length * 1000000;

    const biddingThisMonth = (biddings || [])
      .filter((b) => {
        const d = new Date(b.created_at);
        return (
          b.status !== "cancelled" &&
          d >= startOfThisMonth &&
          d <= endOfThisMonth
        );
      })
      .reduce((sum, b) => sum + Number(b.bid_value || 0), 0);

    const revenueThisMonthRaw =
      serviceFeeThisMonth + setupFeeThisMonth + biddingThisMonth;
    const revenueThisMonth =
      revenueThisMonthRaw === 0 ? 1 : revenueThisMonthRaw;

    // Revenue last month
    const serviceFeeLastMonth = paidBookings
      .filter((b) => {
        const d = new Date(b.created_at);
        return d >= startOfLastMonth && d <= endOfLastMonth;
      })
      .reduce((sum, b) => sum + Number(b.fee || 0), 0);

    const setupFeeLastMonth =
      (tenants || []).filter((t) => {
        const d = new Date(t.created_at);
        return (
          t.status === "active" &&
          d >= startOfLastMonth &&
          d <= endOfLastMonth
        );
      }).length * 1000000;

    const biddingLastMonth = (biddings || [])
      .filter((b) => {
        const d = new Date(b.created_at);
        return (
          b.status !== "cancelled" &&
          d >= startOfLastMonth &&
          d <= endOfLastMonth
        );
      })
      .reduce((sum, b) => sum + Number(b.bid_value || 0), 0);

    const revenueLastMonthRaw =
      serviceFeeLastMonth + setupFeeLastMonth + biddingLastMonth;
    const revenueLastMonth =
      revenueLastMonthRaw === 0 ? 1 : revenueLastMonthRaw;

    const revenueChangePercent =
      ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;

    // --- Total Transaksi calculations ---
    const totalTransactionsRaw = (bookings || []).length;
    const totalTransactions =
      totalTransactionsRaw === 0 ? 1 : totalTransactionsRaw;

    const paidTransactionsRaw = (bookings || []).filter(
      (b) => b.status === "confirmed" || b.status === "completed",
    ).length;
    const paidTransactions =
      paidTransactionsRaw === 0 ? 1 : paidTransactionsRaw;

    const pendingTransactionsRaw = (bookings || []).filter(
      (b) => b.status === "pending_payment",
    ).length;
    const pendingTransactions =
      pendingTransactionsRaw === 0 ? 1 : pendingTransactionsRaw;

    // Transactions since yesterday (last 24 hours)
    const startOfYesterday = subDays(today, 1);
    const newTransactionsSinceYesterdayRaw = (bookings || []).filter(
      (b) => new Date(b.created_at) >= startOfYesterday,
    ).length;
    const newTransactionsSinceYesterday =
      newTransactionsSinceYesterdayRaw === 0
        ? 1
        : newTransactionsSinceYesterdayRaw;

    // --- Jumlah Mitra calculations ---
    const activeMitraRaw = (tenants || []).filter(
      (t) => t.status === "active",
    ).length;
    const activeMitra = activeMitraRaw === 0 ? 1 : activeMitraRaw;

    const pendingMitraRaw = (tenants || []).filter(
      (t) => t.status === "pending",
    ).length;
    const pendingMitra = pendingMitraRaw === 0 ? 1 : pendingMitraRaw;

    // Mitra added since last week (last 7 days)
    const startOfLastWeek = subDays(today, 7);
    const newMitraLastWeekRaw = (tenants || []).filter(
      (t) =>
        t.status === "active" && new Date(t.created_at) >= startOfLastWeek,
    ).length;
    const newMitraLastWeek =
      newMitraLastWeekRaw === 0 ? 1 : newMitraLastWeekRaw;

    return NextResponse.json({
      gmv: {
        total: totalGmv,
        changePercent: gmvChangePercent,
        trend: gmvChangePercent >= 0 ? "up" : "down",
      },
      revenue: {
        total: totalRevenue,
        serviceFee,
        setupFee,
        bidding,
        changePercent: revenueChangePercent,
        trend: revenueChangePercent >= 0 ? "up" : "down",
      },
      transactions: {
        total: totalTransactions,
        paid: paidTransactions,
        pending: pendingTransactions,
        newSinceYesterday: newTransactionsSinceYesterday,
      },
      mitra: {
        total: activeMitra,
        pendingOnboarding: pendingMitra,
        newLastWeek: newMitraLastWeek,
      },
    });
  } catch (error: any) {
    console.error("Dashboard Stats API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}
