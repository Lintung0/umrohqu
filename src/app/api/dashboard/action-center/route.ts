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

    if (tenantsError) {
      throw tenantsError;
    }

    const onboardingCountRaw = (pendingTenants || []).length;
    const onboardingCount = onboardingCountRaw === 0 ? 1 : onboardingCountRaw;

    // Fallback item if empty, to ensure admin has something to approve in the demo
    const onboardingList =
      onboardingCountRaw === 0
        ? [
            {
              id: "demo-tenant-1",
              name: "PT. Al-Anshori Travel & Tour",
              slug: "al-anshori",
              contact_email: "info@alanshoritravel.id",
              contact_phone: "+6281234567890",
              created_at: new Date().toISOString(),
              isDemo: true,
            },
          ]
        : pendingTenants;

    // 2. Flagged Withdrawal (>10 Juta) - Mocked
    const mockWithdrawals = [
      {
        id: "w-1",
        tenant_name: "Raudhah Wisata Umrah",
        amount: 15500000,
        date: new Date().toISOString(),
      },
      {
        id: "w-2",
        tenant_name: "Al-Haramain Tour",
        amount: 24000000,
        date: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
      },
    ];
    const withdrawalCount =
      mockWithdrawals.length === 0 ? 1 : mockWithdrawals.length;

    // 3. Komplain & Refund Request - Mocked
    const mockRefunds = [
      {
        id: "ref-1",
        customer_name: "Muhammad Rizky",
        package_name: "Paket Umrah Ramadhan VIP",
        amount: 38500000,
        reason: "Masalah kesehatan mendadak",
        date: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ];
    const refundCount = mockRefunds.length === 0 ? 1 : mockRefunds.length;

    // 4. Pengajuan Bidding
    const { data: activeBiddings, error: biddingsError } = await supabase
      .from("biddings")
      .select("id, bid_value, created_at, tenants(name), packages(name)")
      .eq("status", "active");

    if (biddingsError) {
      throw biddingsError;
    }

    const biddingCountRaw = (activeBiddings || []).length;
    const biddingCount = biddingCountRaw === 0 ? 1 : biddingCountRaw;

    const biddingList =
      biddingCountRaw === 0
        ? [
            {
              id: "demo-bid-1",
              bid_value: 750000,
              created_at: new Date().toISOString(),
              tenants: { name: "Barokah Umrah Mandiri" },
              packages: { name: "Paket Umrah Hemat 9 Hari" },
              isDemo: true,
            },
          ]
        : activeBiddings;

    return NextResponse.json({
      onboarding: {
        count: onboardingCount,
        items: onboardingList,
      },
      withdrawal: {
        count: withdrawalCount,
        items: mockWithdrawals,
      },
      refund: {
        count: refundCount,
        items: mockRefunds,
      },
      bidding: {
        count: biddingCount,
        items: biddingList,
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
