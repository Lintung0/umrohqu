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

    // 2. Komplain & Refund Request - bookings cancelled + notes
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
      { error: error.message || "Failed to fetch action center stats" },
      { status: 500 },
    );
  }
}
