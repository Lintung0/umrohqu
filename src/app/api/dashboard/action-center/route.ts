import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createAdminClient();

    // 1. Onboarding Travel Baru
    const { data: pendingTenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("id, name, slug, contact_email, contact_phone, created_at")
      .eq("status", "pending");

    if (tenantsError) throw tenantsError;

    // 2. Flagged Withdrawal (>10 Juta) - from payouts table
    const { data: flaggedWithdrawals } = await supabase
      .from("payouts")
      .select("id, amount, status, created_at, tenant_id, tenants(name)")
      .gt("amount", 10000000)
      .eq("status", "pending");

    const withdrawalList = (flaggedWithdrawals || []).map((w: any) => ({
      ...w,
      tenant_name: w.tenants?.name || "-",
    }));

    // 3. Komplain & Refund Request - from bookings with cancelled status + notes
    const { data: refundBookings } = await supabase
      .from("bookings")
      .select("id, total, status, notes, created_at, customer:users(full_name), package:packages(name)")
      .eq("status", "cancelled")
      .not("notes", "is", null);

    const refundList = (refundBookings || []).map((r: any) => ({
      id: r.id,
      customer_name: r.customer?.full_name || "-",
      package_name: r.package?.name || "-",
      amount: r.total || 0,
      reason: r.notes || "-",
      date: r.created_at,
    }));

    // 4. Pengajuan Bidding
    const { data: activeBiddings, error: biddingsError } = await supabase
      .from("biddings")
      .select("id, bid_value, created_at, tenants(name), packages(name)")
      .eq("status", "active");

    if (biddingsError) throw biddingsError;

    return NextResponse.json({
      onboarding: {
        count: (pendingTenants || []).length,
        items: pendingTenants || [],
      },
      withdrawal: {
        count: withdrawalList.length,
        items: withdrawalList,
      },
      refund: {
        count: refundList.length,
        items: refundList,
      },
      bidding: {
        count: (activeBiddings || []).length,
        items: activeBiddings || [],
      },
    });
  } catch (error: any) {
    console.error("Action Center API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch action center stats" },
      { status: 500 },
    );
  }
}
