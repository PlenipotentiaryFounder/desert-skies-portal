// NOTE: We use getUserFromSession() everywhere in server components to encapsulate Supabase's session-based user retrieval.
// Always await createServerSupabaseClient() to get a usable Supabase client instance.
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createServerSupabaseClient, hasAdditionalRole, getUserFromSession } from "@/lib/supabase/server"
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
import { getCurrentInstructor } from '@/lib/user-service'
import { getInstructorFlightSessions } from '@/lib/flight-session-service'
import { getInstructorEnrollments } from '@/lib/enrollment-service'

export default async function InstructorDashboardPage() {
  // Get instructor profile
  const instructor = await getCurrentInstructor()
  if (!instructor) return <div>Not authorized. You must have role 'instructor', 'admin', or 'instructor' in additional_roles.</div>

  // Get all enrollments for this instructor
  const enrollments = await getInstructorEnrollments(instructor.id)

  // Get all sessions for this instructor
  const sessions = await getInstructorFlightSessions(instructor.id)

  // Get pending endorsements for this instructor
  const supabase = await createServerSupabaseClient()
  const { data: endorsements = [] } = await supabase
    .from('endorsements')
    .select('id, created_at, type, status, student_id, students:student_id (first_name, last_name)')
    .eq('instructor_id', instructor.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Compute stats
  const stats = {
    totalStudents: enrollments.length,
    totalSessions: sessions.length,
    totalEndorsements: (await supabase
      .from('endorsements')
      .select('id', { count: 'exact', head: true })
      .eq('instructor_id', instructor.id)
      .eq('status', 'approved')
    ).count || 0,
  }

  return (
    <div className="space-y-8">
      <InstructorStatsCards stats={stats} />
      <UpcomingInstructorSessions sessions={sessions} />
      <PendingEndorsements endorsements={endorsements} instructorStatus={instructor.status} instructorId={instructor.id} />
      <InstructorStudentsList enrollments={enrollments} />
    </div>
  )
}
