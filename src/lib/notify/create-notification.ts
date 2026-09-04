import { createAdminClient } from "@/lib/supabase/server"

export interface CreateNotificationInput {
  userId: string
  tenantId?: string | null
  title: string
  body?: string | null
  templateKey: string
  linkUrl?: string | null
  payload?: Record<string, unknown>
}

export async function createNotification(input: CreateNotificationInput) {
  const admin = createAdminClient()
  const { error } = await admin.from("notifications").insert({
    user_id: input.userId,
    tenant_id: input.tenantId || null,
    title: input.title,
    body: input.body || null,
    template_key: input.templateKey,
    channel: "in_app",
    status: "sent",
    sent_at: new Date().toISOString(),
    is_read: false,
    link_url: input.linkUrl || null,
    payload: input.payload || {},
  })
  if (error) {
    console.error("[createNotification]", error.message)
  }
  return { error }
}
