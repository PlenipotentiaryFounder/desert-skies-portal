import { Suspense } from "react"
import Link from "next/link"
import { ChevronLeft, GraduationCap } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getUserById } from "@/lib/user-service"
import { getStudentEnrollments } from "@/lib/enrollment-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SyllabusProgress } from "@/components/student/syllabus-progress"
import { formatDate, getInitials } from "@/lib/utils"
import { notFound } from "next/navigation"
import { StudentDetailsSafe } from "@/components/instructor/student-details-safe"

interface StudentDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const awaitedParams = await params
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get the logged-in instructor's profile with roles
  const instructorProfile = await getUserById(user.id)
  if (!instructorProfile) {
    return null
  }

  // Verify the logged-in user is an instructor or admin
  const isInstructorOrAdmin = instructorProfile.roles?.some(role => 
    role === "instructor" || role === "admin"
  )
  if (!isInstructorOrAdmin) {
    notFound()
  }

  // Get the student being viewed
  const student = await getUserById(awaitedParams.id)

  if (!student) {
    notFound()
  }

  // Verify the person being viewed is actually a student
  const hasStudentRole = student.roles?.includes("student")
  if (!hasStudentRole) {
    notFound()
  }

  const enrollments = await getStudentEnrollments(student.id)
  const activeEnrollment = enrollments.find((e) => e.status === "active")

  // Check if this instructor is assigned to this student (admins can bypass this check)
  const isAssigned = activeEnrollment?.instructor_id === user.id
  const isAdmin = instructorProfile.roles?.includes("admin")

  if (!isAssigned && !isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Link href="/instructor/students">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Students
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Not Authorized</CardTitle>
            <CardDescription>You are not assigned as an instructor for this student</CardDescription>
          </CardHeader>
          <CardContent>
            <p>You can only view details for students assigned to you.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/instructor/students">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
        </Link>
      </div>

      {/* Student Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <Avatar className="h-24 w-24">
              <AvatarImage 
                src={(student as any).avatar_url || undefined} 
                alt={`${student.first_name || ''} ${student.last_name || ''}`} 
              />
              <AvatarFallback className="text-2xl">
                {getInitials(student.first_name, student.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold">
                {student.first_name} {student.last_name}
              </h1>
              <p className="text-muted-foreground">{student.email}</p>
              {(student as any).phone && <p className="text-muted-foreground">{(student as any).phone}</p>}
              {activeEnrollment && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                  <GraduationCap className="h-4 w-4" />
                  <span>Enrolled in: {(activeEnrollment as any).syllabus?.name || 'Unknown Syllabus'}</span>
                </div>
              )}
              {(student as any).bio && <p className="mt-2">{(student as any).bio}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href={`/instructor/missions/new?studentId=${student.id}`}>
                  Schedule Flight
                </Link>
              </Button>
              <Button variant="outline">Message Student</Button>
              <Button asChild variant="secondary">
                <Link href={`/instructor/students/new?studentId=${student.id}`}>
                  Enroll in New Syllabus
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Comprehensive Student Details */}
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <StudentDetailsSafe
              studentId={student.id}
              activeEnrollment={activeEnrollment}
              instructorId={user.id}
            />
          </Suspense>
    </div>
  )
}
