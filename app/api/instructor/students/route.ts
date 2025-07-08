import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getStudentProgressReport } from "@/lib/report-service"

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get("action")
    const studentId = searchParams.get("studentId")
    
    if (action === "progress" && studentId) {
      // Get student progress report
      const data = await getStudentProgressReport(studentId)
      return NextResponse.json(data)
    } else {
      // Get instructor's students
      const { data: enrollments, error } = await supabase
        .from("student_enrollments")
        .select(`
          student_id,
          student:student_id(id, first_name, last_name)
        `)
        .eq("instructor_id", user.id)
        .eq("status", "active")

      if (error) {
        console.error("Error fetching students:", error)
        return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
      }

      // Get unique students
      const uniqueStudents = enrollments?.reduce((acc: any[], enrollment) => {
        if (!acc.some((s) => s.id === enrollment.student.id)) {
          acc.push(enrollment.student)
        }
        return acc
      }, []) || []

      return NextResponse.json({ students: uniqueStudents })
    }
  } catch (error: any) {
    console.error("Error in instructor students API:", error)
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 })
  }
} 