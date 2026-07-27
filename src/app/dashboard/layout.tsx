import DashboardSidebar from "@/components/dashboard/DashboardSidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
