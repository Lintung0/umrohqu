import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createAdminClient();

    // 1. Onboarding Travel Baru
    const { data: pendingTenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("id, name, slug, created_at")
      .eq("status", "pending");

    if (tenantsError) throw tenantsError;

    // 2. Komplain & Refund Request - bookings cancelled/refunded + alasan
    const { data: refundBookings } = await supabase
      .from("bookings")
      .select("id, total, status, cancel_reason, notes, created_at, customer:users(full_name), package:packages(name)")
      .in("status", ["cancelled", "refunded"])
      .or("cancel_reason.is.not.null,notes.is.not.null");

    const refundList = (refundBookings || []).map((r: any) => ({
      id: r.id,
      customer_name: r.customer?.full_name || "-",
      package_name: r.package?.name || "-",
      amount: r.total || 0,
      reason: r.cancel_reason || r.notes || "-",
      date: r.created_at,
    }));

    return NextResponse.json({
      onboarding: {
        count: (pendingTenants || []).length,
        items: pendingTenants || [],
      },
      withdrawal: {
        count: 0,
        items: [],
      },
      refund: {
        count: refundList.length,
        items: refundList,
      },
      bidding: {
        count: 0,
        items: [],
      },
    });
  } catch (error: any) {
    console.error("Action Center API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memuat statistik pusat tindakan" },
      { status: 500 },
    );
  }
}
