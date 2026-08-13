import type { SupabaseClient } from "@supabase/supabase-js"
import { DEFAULT_FEE_CONFIG, type FeeConfig } from "./fees"

export async function getFeeConfig(admin: SupabaseClient): Promise<FeeConfig> {
  const { data, error } = await admin
    .from("fee_config")
    .select(
      "portal_fee_per_person, subdomain_fee_per_person, custom_domain_fee_per_person, service_fee_percent, service_fee_flat, setup_fee, tax_percent",
    )
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return DEFAULT_FEE_CONFIG
  }

  return {
    portalFeePerPerson: Number(data.portal_fee_per_person),
    subdomainFeePerPerson: Number(data.subdomain_fee_per_person),
    customDomainFeePerPerson: Number(data.custom_domain_fee_per_person),
    serviceFeePercent: Number(data.service_fee_percent),
    serviceFeeFlat: Number(data.service_fee_flat),
    setupFee: Number(data.setup_fee),
    taxPercent: Number(data.tax_percent),
  }
}
