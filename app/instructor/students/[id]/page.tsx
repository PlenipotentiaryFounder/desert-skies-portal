import { Suspense } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
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
import { usePathname } from "next/navigation"

interface StudentDetailPageProps {
  params: {
    id: string
  }
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

  const student = await getUserById(awaitedParams.id)

  if (!student) {
    notFound()
  }

  // Check if user has student role
  const hasStudentRole = student.roles?.some((role: any) => role.role_name === "student")
  if (!hasStudentRole) {
    notFound()
  }

  const enrollments = await getStudentEnrollments(student.id)
  const activeEnrollment = enrollments.find((e) => e.status === "active")

  // Check if this instructor is assigned to this student
  const isAssigned = activeEnrollment?.instructor_id === user.id

  if (!isAssigned) {
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

  // Get flight sessions for this enrollment
  const { data: sessions } = await supabase
    .from("flight_sessions")
    .select(`
      id,
      date,
      start_time,
      end_time,
      status,
      lesson:lesson_id (
        title,
        lesson_type
      )
    `)
    .eq("enrollment_id", activeEnrollment.id)
    .order("date", { ascending: false })
    .limit(5)

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

      <div className="grid gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <Avatar className="h-24 w-24">
                <AvatarImage src={student.avatar_url || undefined} alt={`${student.first_name} ${student.last_name}`} />
                <AvatarFallback className="text-2xl">
                  {getInitials(student.first_name, student.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold">
                  {student.first_name} {student.last_name}
                </h1>
                <p className="text-muted-foreground">{student.email}</p>
                {student.phone && <p className="text-muted-foreground">{student.phone}</p>}
                {student.bio && <p className="mt-2">{student.bio}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Button>Schedule Flight</Button>
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

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Program</CardTitle>
              <CardDescription>Student's active training program</CardDescription>
            </CardHeader>
            <CardContent>
              {activeEnrollment ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">{activeEnrollment.syllabus?.title}</h3>
                    <p className="text-sm text-muted-foreground">{activeEnrollment.syllabus?.faa_type}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Started</p>
                      <p className="text-sm text-muted-foreground">{formatDate(activeEnrollment.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Target Completion</p>
                      <p className="text-sm text-muted-foreground">
                        {activeEnrollment.target_completion_date
                          ? formatDate(activeEnrollment.target_completion_date)
                          : "Not set"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p>No active training program</p>
              )}
            </CardContent>
          </Card>

          {activeEnrollment && (
            <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
              <SyllabusProgress enrollmentId={activeEnrollment.id} />
            </Suspense>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Flight Sessions</CardTitle>
            <CardDescription>Student's recent flight sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions && sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session) => {
                  let lessonTitle = "No lesson info";
                  let lessonType = "";
                  if (session.lesson) {
                    if (Array.isArray(session.lesson) && session.lesson.length > 0) {
                      const firstLesson = session.lesson[0];
                      if (firstLesson && typeof firstLesson === 'object' && 'title' in firstLesson && 'lesson_type' in firstLesson) {
                        lessonTitle = firstLesson.title;
                        lessonType = firstLesson.lesson_type;
                      }
                    } else if (!Array.isArray(session.lesson) && session.lesson?.title && session.lesson?.lesson_type) {
                      lessonTitle = session.lesson.title;
                      lessonType = session.lesson.lesson_type;
                    }
                  }
                  return (
                    <div key={session.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{lessonTitle}</div>
                        <div className="text-sm text-muted-foreground">{lessonType}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{formatDate(session.date)}</div>
                        <div className="text-sm text-muted-foreground capitalize">{session.status}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No flight sessions recorded yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
