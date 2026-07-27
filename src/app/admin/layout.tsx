"use client"

import { useState } from "react"
import AdminSidebar from "@/components/dashboard/AdminSidebar"
import type { AdminRole } from "@/lib/types"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<AdminRole>("marketplace_admin")

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar currentRole={role} onRoleChange={setRole} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
