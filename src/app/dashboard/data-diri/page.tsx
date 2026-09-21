import { redirect } from "next/navigation"

export default function DataDiriRedirect() {
  redirect("/dashboard/bookings")
}