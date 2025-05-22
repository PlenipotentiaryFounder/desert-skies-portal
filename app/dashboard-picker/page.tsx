import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function DashboardPickerPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("first_name, last_name, email, role, metadata").eq("id", session.user.id).single()
  const additionalRoles = profile?.metadata?.additional_roles || []
  const hasAdmin = profile?.role === "admin" || additionalRoles.includes("admin")
  const hasInstructor = profile?.role === "instructor" || additionalRoles.includes("instructor")
  const hasStudent = profile?.role === "student" || additionalRoles.includes("student") || hasAdmin

  if (!hasAdmin && !hasInstructor) redirect("/")
  if (hasAdmin && !hasInstructor) redirect("/admin/dashboard")
  if (hasInstructor && !hasAdmin) redirect("/instructor/dashboard")

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted">
      <Card className="p-8 max-w-md w-full text-center space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Welcome, {profile?.first_name} {profile?.last_name}</h1>
          <div className="text-muted-foreground text-sm mb-4">{profile?.email}</div>
          <div className="mb-4">Which dashboard would you like to use?</div>
        </div>
        <div className="flex flex-col gap-4">
          <form action="/admin/dashboard">
            <Button type="submit" size="lg" className="w-full">Go to Admin Dashboard</Button>
          </form>
          <form action="/instructor/dashboard">
            <Button type="submit" size="lg" variant="secondary" className="w-full">Go to Instructor Dashboard</Button>
          </form>
          {hasStudent && (
            <form action="/student/dashboard">
              <Button type="submit" size="lg" variant="outline" className="w-full">Go to Student Dashboard</Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  )
} 