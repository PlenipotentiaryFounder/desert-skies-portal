import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getInstructorEnrollments } from "@/lib/enrollment-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { InstructorStudentsList } from "@/components/instructor/instructor-students-list"

export default async function InstructorStudentsPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  const enrollments = await getInstructorEnrollments(session.user.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">My Students</h1>
        <p className="text-muted-foreground">Manage your assigned students</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>All students assigned to you</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <InstructorStudentsList enrollments={enrollments} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
