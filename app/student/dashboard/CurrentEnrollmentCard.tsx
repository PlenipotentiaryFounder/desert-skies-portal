import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"

export async function CurrentEnrollmentCard({ studentId }: { studentId: string }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select(`
      *,
      syllabi:syllabus_id (title, faa_type),
      instructors:instructor_id (
        first_name,
        last_name
      )
    `)
    .eq("student_id", studentId)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  const currentEnrollment = enrollments?.[0]

  if (!currentEnrollment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Training Program</CardTitle>
          <CardDescription>You are not currently enrolled in any training program</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Training Program</CardTitle>
        <CardDescription>
          {currentEnrollment.syllabi.title} ({currentEnrollment.syllabi.faa_type})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium">Instructor</p>
            <p className="text-sm text-muted-foreground">
              {currentEnrollment.instructors.first_name} {currentEnrollment.instructors.last_name}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Started</p>
            <p className="text-sm text-muted-foreground">{formatDate(currentEnrollment.start_date)}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Target Completion</p>
            <p className="text-sm text-muted-foreground">
              {currentEnrollment.target_completion_date
                ? formatDate(currentEnrollment.target_completion_date)
                : "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Status</p>
            <p className="text-sm text-muted-foreground capitalize">{currentEnrollment.status}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 