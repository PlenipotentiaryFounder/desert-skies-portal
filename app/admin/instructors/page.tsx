import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { InstructorApprovalList } from "./instructor-approval-list"
import { getUserProfileWithRoles } from "@/lib/user-service"

export default async function InstructorApprovalPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // Check if user is authenticated and is an admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const profile = await getUserProfileWithRoles(user.id)
  const roles = Array.isArray(profile?.roles)
    ? profile.roles.map((r: any) => typeof r === "string" ? r : r.role_name)
    : []
  if (!roles.includes("admin")) {
    redirect("/")
  }

  // Get pending instructors using user_roles join
  const { data: pendingInstructors } = await supabase
    .from("profiles")
    .select("*, user_roles!inner(roles!inner(name))")
    .eq("user_roles.roles.name", "instructor")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Instructor Approval</h2>
        <p className="text-muted-foreground">Review and approve instructor accounts</p>
      </div>

      <InstructorApprovalList initialInstructors={pendingInstructors || []} />
    </div>
  )
}
