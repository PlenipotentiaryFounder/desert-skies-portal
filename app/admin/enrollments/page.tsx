import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EnrollmentDashboard } from "./enrollment-dashboard"

export default async function AdminEnrollmentsPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // Get all enrollments with related data
  const { data: enrollments, error } = await supabase
    .from('student_enrollments')
    .select(`
      id,
      status,
      start_date,
      completion_date,
      created_at,
      approved_at,
      approval_notes,
      student:student_id (
        id,
        first_name,
        last_name,
        email
      ),
      instructor:instructor_id (
        id,
        first_name,
        last_name,
        email
      ),
      syllabus:syllabus_id (
        id,
        title,
        faa_type,
        target_certificate,
        code
      ),
      approved_by_profile:approved_by (
        first_name,
        last_name
      )
    `)
    .order('created_at', { ascending: false })

  // Get syllabi for counts
  const { data: syllabi } = await supabase
    .from('syllabi')
    .select('id, title, faa_type, target_certificate, code')
    .eq('is_active', true)
    .order('faa_type')

  // Get student onboarding data for pending enrollments
  const pendingEnrollments = enrollments?.filter(e => e.status === 'pending_approval') || []
  const pendingStudentIds = pendingEnrollments.map(e => e.student?.id).filter(Boolean)
  
  const { data: onboardingData } = await supabase
    .from('student_onboarding')
    .select('*')
    .in('user_id', pendingStudentIds)

  // Get document uploads for pending students
  const { data: documentData } = await supabase
    .from('document_uploads')
    .select('*')
    .in('student_id', pendingStudentIds)

  if (error) {
    console.error('Error fetching enrollments:', error)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Enrollments</h1>
        <p className="text-muted-foreground">Manage student enrollments and approval workflow</p>
      </div>

      <Suspense fallback={<EnrollmentDashboardSkeleton />}>
        <EnrollmentDashboard 
          enrollments={enrollments || []} 
          syllabi={syllabi || []}
          onboardingData={onboardingData || []}
          documentData={documentData || []}
        />
      </Suspense>
    </div>
  )
}

function EnrollmentDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <Skeleton className="h-[600px] w-full" />
    </div>
  )
}
