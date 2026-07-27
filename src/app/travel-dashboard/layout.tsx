import TravelDashboardSidebar from "@/components/dashboard/TravelDashboardSidebar"

export default function TravelDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <TravelDashboardSidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
