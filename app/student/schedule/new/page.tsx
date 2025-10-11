import { RequestSessionForm } from "./RequestSessionForm"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { DashboardShell } from "@/components/shared/dashboard-shell"

export default async function NewStudentSchedulePage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  // Get current user for filtering enrollments
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <div>Please log in to access this page.</div>
  }
  
  // Get student's active enrollment with instructor and syllabus details
  const { data: enrollment } = await supabase
    .from("student_enrollments")
    .select(`
      id, 
      syllabus_id, 
      instructor_id,
      syllabi:syllabus_id (title),
      profiles:instructor_id (id, first_name, last_name)
    `)
    .eq("student_id", user.id)
    .eq("status", "active")
    .single()
  
  if (!enrollment) {
    return (
      <DashboardShell 
        title="Request Flight Session"
        description="Schedule your next training session with your instructor"
        userRole="student"
      >
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-aviation-sky-900 mb-4">No Active Enrollment</h2>
          <p className="text-aviation-sky-600 mb-6">
            You need to be enrolled in a course to request flight sessions.
          </p>
          <a 
            href="/student/dashboard" 
            className="inline-flex items-center px-6 py-3 bg-aviation-sky-600 text-white rounded-xl hover:bg-aviation-sky-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </DashboardShell>
    )
  }
  
  // Get lessons for the student's enrolled syllabus, ordered by sequence
  const { data: lessons = [] } = await supabase
    .from("syllabus_lessons")
    .select("id, title, order_index, lesson_type")
    .eq("syllabus_id", enrollment.syllabus_id)
    .order("order_index")
  
  // Get completed lessons for this enrollment
  const { data: completedSessions = [] } = await supabase
    .from("flight_sessions")
    .select("lesson_id, status")
    .eq("enrollment_id", enrollment.id)
    .in("status", ["completed"])
  
  const completedLessonIds = completedSessions.map(s => s.lesson_id)
  
  // Find the next lesson (first lesson that hasn't been completed)
  const nextLesson = lessons.find(lesson => !completedLessonIds.includes(lesson.id))
  
  // Get other options
  const [{ data: aircraft = [] }, { data: locations = [] }] = await Promise.all([
    supabase.from("aircraft").select("id, tail_number, make, model").eq("is_active", true),
    supabase.from("locations").select("id, name")
  ])
  
  return (
    <DashboardShell 
      title="Request Flight Session"
      description="Schedule your next training session with your instructor"
      userRole="student"
    >
      <RequestSessionForm 
        enrollment={enrollment}
        lessons={lessons}
        nextLesson={nextLesson}
        aircraft={aircraft} 
        locations={locations} 
      />
    </DashboardShell>
  )
} 