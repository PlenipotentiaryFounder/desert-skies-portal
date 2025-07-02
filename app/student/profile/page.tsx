import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/shared/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { getUserProfileWithRoles } from "@/lib/user-service"
import ProfileForm from "./ProfileForm"

export default async function StudentProfilePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const profile = await getUserProfileWithRoles(user.id)

  return (
    <DashboardShell navItems={[]} userRole="student" profile={profile}>
      <div className="flex flex-col gap-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>View and update your profile details</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading...</div>}>
              <ProfileForm profile={profile} />
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/reset-password">
              <button className="btn btn-outline">Change Password</button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
} 