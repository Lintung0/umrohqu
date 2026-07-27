import { AuthLayout } from "@/components/auth/auth-layout"

export default function AuthLayoutRoute({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthLayout>{children}</AuthLayout>
}
