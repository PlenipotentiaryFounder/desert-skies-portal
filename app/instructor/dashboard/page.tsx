// NOTE: We use getUserFromSession() everywhere in server components to encapsulate Supabase's session-based user retrieval.
// Always await createServerSupabaseClient() to get a usable Supabase client instance.
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { InstructorStudentsList } from "@/components/instructor/instructor-students-list"
import { UpcomingInstructorSessions } from "@/components/instructor/upcoming-instructor-sessions"
import { InstructorStatsCards } from "@/components/instructor/instructor-stats-cards"
import { PendingEndorsements } from "@/components/instructor/pending-endorsements"
import { ApprovalStatusBanner } from "@/components/instructor/approval-status-banner"
import { RoleSwitcher } from "@/components/shared/role-switcher"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getUserProfileWithRoles } from '@/lib/user-service'
import { getInstructorFlightSessions } from '@/lib/flight-session-service'
import { getInstructorEnrollments } from '@/lib/enrollment-service'
import { InstructorQuickLinks } from "@/components/instructor/instructor-quick-links"
import { InstructorProgressWidget } from "@/components/instructor/instructor-progress-widget"
import { ACSStandardsWidget } from "@/components/shared/acs-standards-widget"

export default async function InstructorDashboardPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get instructor profile
  const instructor = await getUserProfileWithRoles(user.id)
  if (!instructor) {
    console.error('No instructor profile found for user:', user.id)
    return <div>Not authorized. You must have role 'instructor', 'admin', or 'instructor' in additional_roles.</div>
  }

  // Defensive: ensure roles is always an array of strings
  const roles = Array.isArray(instructor.roles)
    ? instructor.roles.map((r: any) => typeof r === 'string' ? r : (r?.role_name ?? ''))
    : [];

  // Get all enrollments for this instructor
  let enrollments: any[] = [];
  try {
    enrollments = await getInstructorEnrollments(instructor.id) ?? [];
  } catch (e) {
    console.error('Error fetching enrollments:', e)
    enrollments = [];
  }

  // Get all sessions for this instructor
  let sessions: any[] = [];
  try {
    sessions = await getInstructorFlightSessions(instructor.id) ?? [];
  } catch (e) {
    console.error('Error fetching sessions:', e)
    sessions = [];
  }

  // Get pending endorsements for this instructor
  let endorsements: any[] = [];
  try {
    const { data } = await supabase
      .from('endorsements')
      .select('id, created_at, type, status, student_id, students:student_id (first_name, last_name)')
      .eq('instructor_id', instructor.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    endorsements = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Error fetching endorsements:', e)
    endorsements = [];
  }

  // Compute stats
  let stats = { totalStudents: 0, totalSessions: 0, totalEndorsements: 0 };
  try {
    stats = {
      totalStudents: enrollments.length,
      totalSessions: sessions.length,
      totalEndorsements: (await supabase
        .from('endorsements')
        .select('id', { count: 'exact', head: true })
        .eq('instructor_id', instructor.id)
        .eq('status', 'approved')
      ).count || 0,
    }
  } catch (e) {
    console.error('Error computing stats:', e)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Instructor Dashboard</h1>
        <div className="w-48">
          <RoleSwitcher roles={roles} />
        </div>
      </div>
      <InstructorQuickLinks />
      <InstructorProgressWidget enrollments={enrollments} />
      <InstructorStatsCards stats={stats} />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <UpcomingInstructorSessions sessions={sessions} />
          <PendingEndorsements endorsements={endorsements} instructorStatus={(instructor as any).status ?? ''} instructorId={instructor.id} />
        </div>
        <ACSStandardsWidget 
          userRole="instructor" 
          userId={instructor.id} 
          certificateType="private_pilot"
        />
      </div>
      <InstructorStudentsList enrollments={enrollments} />
    </div>
  )
}
