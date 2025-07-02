import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { InstructorApprovalList } from "./instructor-approval-list"

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

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/")
  }

  // Get pending instructors
  const { data: pendingInstructors } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "instructor")
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
