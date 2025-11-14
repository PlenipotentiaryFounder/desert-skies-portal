import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get all active enrollments for this instructor's students
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("student_enrollments")
      .select(`
        id,
        student_id,
        status,
        students:student_id (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .eq("assigned_instructor_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (enrollmentsError) {
      console.error("Error fetching enrollments:", enrollmentsError)
      return NextResponse.json(
        { success: false, error: enrollmentsError.message },
        { status: 500 }
      )
    }

    // For each enrollment, get the next recommended lesson
    const studentsWithLessons = await Promise.all(
      (enrollments || []).map(async (enrollment: any) => {
        if (!enrollment.students) return null

        try {
          // Fetch lesson suggestions for this enrollment
          const suggestionsRes = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/enrollments/${enrollment.id}/lesson-suggestions`,
            {
              headers: {
                'Cookie': cookieStore.toString()
              }
            }
          )

          let nextLesson = null
          if (suggestionsRes.ok) {
            const suggestionsData = await suggestionsRes.json()
            const nextSuggestion = suggestionsData.suggestions?.find((s: any) => s.type === 'next')
            if (nextSuggestion?.lesson) {
              nextLesson = nextSuggestion.lesson
            }
          }

          return {
            id: enrollment.students.id,
            first_name: enrollment.students.first_name,
            last_name: enrollment.students.last_name,
            email: enrollment.students.email,
            avatar_url: enrollment.students.avatar_url,
            enrollment_id: enrollment.id,
            next_lesson: nextLesson
          }
        } catch (error) {
          console.error(`Error fetching lesson for enrollment ${enrollment.id}:`, error)
          return {
            id: enrollment.students.id,
            first_name: enrollment.students.first_name,
            last_name: enrollment.students.last_name,
            email: enrollment.students.email,
            avatar_url: enrollment.students.avatar_url,
            enrollment_id: enrollment.id,
            next_lesson: null
          }
        }
      })
    )

    // Filter out null entries and duplicates (student might have multiple enrollments)
    const uniqueStudents = studentsWithLessons
      .filter(Boolean)
      .reduce((acc: any[], student: any) => {
        if (!acc.find(s => s.id === student.id)) {
          acc.push(student)
        }
        return acc
      }, [])

    return NextResponse.json({
      success: true,
      students: uniqueStudents
    })
  } catch (error: any) {
    console.error("Error in GET /api/instructor/students/active:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

