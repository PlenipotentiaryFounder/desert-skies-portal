"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"
import { revalidatePath } from "next/cache"

type FlightSessionInsert = Database["public"]["Tables"]["flight_sessions"]["Insert"]
type FlightSessionUpdate = Database["public"]["Tables"]["flight_sessions"]["Update"]

export type FlightSession = {
  id: string
  created_at: string
  updated_at: string
  enrollment_id: string
  lesson_id: string | null
  custom_lesson_id: string | null
  instructor_id: string
  aircraft_id: string
  date: string
  start_time: string
  end_time: string
  hobbs_start: number
  hobbs_end: number
  status: "scheduled" | "completed" | "canceled" | "no_show"
  notes: string | null
  weather_conditions: {
    wind?: string
    visibility?: string
    ceiling?: string
    temperature?: string
    altimeter?: string
    conditions?: string
  } | null
  session_type: "mission" | "ground" | "mock_oral" | "mock_check_ride"
  prebrief_minutes: number
  postbrief_minutes: number
  location_id: string | null
  recurrence_rule: string | null
  requested_by: string | null
  request_status: "pending" | "approved" | "denied" | "cancelled"
  student?: {
    id: string
    first_name: string
    last_name: string
    email: string
    avatar_url: string | null
  }
  instructor?: {
    first_name: string
    last_name: string
    email: string
    avatar_url: string | null
  }
  aircraft?: {
    tail_number: string
    make: string
    model: string
  }
  lesson?: {
    title: string
    description: string
    lesson_type: string
  }
  custom_lesson?: {
    title: string
    description: string
    lesson_type: string
  }
  enrollment?: {
    student_id: string
    syllabus_id: string
  }
  maneuver_scores?: Array<{
    id: string
    maneuver_id: string
    score: number
    notes: string | null
    acs_task_id: string | null
    meets_acs_standard: boolean | null
    areas_for_improvement: string | null
    maneuver: {
      name: string
      category: string
    }
  }>
}

export type FlightSessionFormData = {
  enrollment_id: string
  lesson_id?: string | null
  custom_lesson_id?: string | null
  instructor_id: string
  aircraft_id: string
  date: string
  start_time: string
  end_time: string
  hobbs_start: number
  hobbs_end: number
  status: "scheduled" | "completed" | "canceled" | "no_show"
  notes?: string | null
  weather_conditions?: {
    wind?: string
    visibility?: string
    ceiling?: string
    temperature?: string
    altimeter?: string
    conditions?: string
  } | null
  session_type?: "mission" | "ground" | "mock_oral" | "mock_check_ride"
  prebrief_minutes?: number
  postbrief_minutes?: number
  location_id?: string | null
  recurrence_rule?: string | null
  requested_by?: string | null
  request_status?: "pending" | "approved" | "denied" | "cancelled"
}

export async function getFlightSessions() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data, error } = await supabase
    .from("flight_sessions")
    .select(`
      *,
      enrollment:enrollment_id (
        student_id,
        syllabus_id,
        student:student_id (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      ),
      instructor:instructor_id (
        first_name,
        last_name,
        email,
        avatar_url
      ),
      aircraft:aircraft_id (
        tail_number,
        make,
        model
      ),
      lesson:lesson_id (
        title,
        description,
        lesson_type
      ),
      custom_lesson:custom_lesson_id (
        title,
        description,
        lesson_type
      )
    `)
    .order("date", { ascending: false })
    .order("start_time", { ascending: false })

  if (error) {
    console.error("Error fetching flight sessions:", error)
    return []
  }

  // Filter out error objects and add type guards
  const sessions = (data as any[]).filter(
    (s) => s && typeof s === "object" && !("error" in s) && s.enrollment && s.enrollment.student
  ).map((session) => ({
    ...session,
    student: session.enrollment.student,
    enrollment: {
      student_id: session.enrollment.student_id,
      syllabus_id: session.enrollment.syllabus_id,
    },
  }))

  return sessions as unknown as FlightSession[]
}

export async function getFlightSessionById(id: string) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data, error } = await supabase
    .from("flight_sessions")
    .select(`
      *,
      enrollment:enrollment_id (
        student_id,
        syllabus_id,
        student:student_id (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      ),
      instructor:instructor_id (
        first_name,
        last_name,
        email,
        avatar_url
      ),
      aircraft:aircraft_id (
        tail_number,
        make,
        model
      ),
      lesson:lesson_id (
        title,
        description,
        lesson_type
      ),
      custom_lesson:custom_lesson_id (
        title,
        description,
        lesson_type
      ),
      maneuver_scores:maneuver_scores (
        id,
        maneuver_id,
        score,
        notes,
        acs_task_id,
        meets_acs_standard,
        areas_for_improvement,
        maneuver:maneuver_id (
          name,
          category
        )
      )
    `)
    .eq("id", id as Database["public"]["Tables"]["flight_sessions"]["Row"]["id"])
    .single()

  if (error || !data || typeof data !== "object" || !('enrollment' in data) || !data.enrollment) {
    console.error("Error fetching flight session:", error)
    return null
  }

  const session = {
    ...(data as any),
    student: (data as any).enrollment.student,
    enrollment: {
      student_id: (data as any).enrollment.student_id,
      syllabus_id: (data as any).enrollment.syllabus_id,
    },
  }

  return session as unknown as FlightSession
}

export async function getStudentFlightSessions(studentId: string) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // First get the student's enrollments
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("student_enrollments")
    .select("id")
    .eq("student_id", studentId as Database["public"]["Tables"]["student_enrollments"]["Row"]["student_id"])

  if (enrollmentsError || !enrollments || !Array.isArray(enrollments) || enrollments.length === 0) {
    console.error("Error fetching student enrollments:", enrollmentsError)
    return []
  }

  // Filter out error objects
  const enrollmentIds = (enrollments as any[]).filter((e) => e && typeof e === "object" && !("error" in e) && e.id).map((e) => e.id)

  // Then get the flight sessions for those enrollments
  const { data, error } = await supabase
    .from("flight_sessions")
    .select(`
      *,
      instructor:instructor_id (
        first_name,
        last_name,
        email,
        avatar_url
      ),
      aircraft:aircraft_id (
        tail_number,
        make,
        model
      ),
      lesson:lesson_id (
        title,
        description,
        lesson_type
      ),
      custom_lesson:custom_lesson_id (
        title,
        description,
        lesson_type
      )
    `)
    .in("enrollment_id", enrollmentIds as Database["public"]["Tables"]["flight_sessions"]["Row"]["enrollment_id"][])
    .order("date", { ascending: false })
    .order("start_time", { ascending: false })

  if (error) {
    console.error("Error fetching student flight sessions:", error)
    return []
  }

  // Filter out error objects
  const sessions = (data as any[]).filter((s) => s && typeof s === "object" && !("error" in s))

  return sessions as unknown as FlightSession[]
}

export async function getInstructorFlightSessions(instructorId: string) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data, error } = await supabase
    .from("flight_sessions")
    .select(`
      *,
      enrollment:enrollment_id (
        student_id,
        syllabus_id,
        student:student_id (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      ),
      aircraft:aircraft_id (
        tail_number,
        make,
        model
      ),
      lesson:lesson_id (
        title,
        description,
        lesson_type
      ),
      custom_lesson:custom_lesson_id (
        title,
        description,
        lesson_type
      )
    `)
    .eq("instructor_id", instructorId as Database["public"]["Tables"]["flight_sessions"]["Row"]["instructor_id"])
    .order("date", { ascending: false })
    .order("start_time", { ascending: false })

  if (error) {
    console.error("Error fetching instructor flight sessions:", error)
    return []
  }

  // Filter out error objects and add type guards
  const sessions = (data as any[]).filter(
    (s) => s && typeof s === "object" && !("error" in s) && s.enrollment && s.enrollment.student
  ).map((session) => ({
    ...session,
    student: session.enrollment.student,
    enrollment: {
      student_id: session.enrollment.student_id,
      syllabus_id: session.enrollment.syllabus_id,
    },
  }))

  return sessions as unknown as FlightSession[]
}

export async function createFlightSession(formData: FlightSessionFormData) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  if (!formData.lesson_id || typeof formData.lesson_id !== 'string') {
    throw new Error("lesson_id is required for flight_sessions and must be a string")
  }

  const insertData: FlightSessionInsert = {
    ...formData,
    lesson_id: formData.lesson_id,
    custom_lesson_id: formData.custom_lesson_id ?? null,
    start_time: formData.start_time ?? null,
    end_time: formData.end_time ?? null,
    session_type: formData.session_type ?? "mission",
    prebrief_minutes: formData.prebrief_minutes ?? 30,
    postbrief_minutes: formData.postbrief_minutes ?? 30,
    location_id: formData.location_id ?? null,
    recurrence_rule: formData.recurrence_rule ?? null,
    requested_by: formData.requested_by ?? null,
    request_status: formData.request_status ?? "pending",
    notes: formData.notes ?? null,
    weather_conditions: formData.weather_conditions ?? null,
  }

  const { data, error } = await supabase.from("flight_sessions").insert([insertData]).select()

  if (error) {
    console.error("Error creating flight session:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/schedule")
  revalidatePath("/instructor/schedule")
  revalidatePath("/student/schedule")
  return { success: true, data: data[0] }
}

export async function updateFlightSession(id: string, formData: Partial<FlightSessionFormData>) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // Only include fields that are defined and valid for the DB
  const updateData: FlightSessionUpdate = {
    ...formData,
    lesson_id: typeof formData.lesson_id === 'string' ? formData.lesson_id : undefined,
    custom_lesson_id: formData.custom_lesson_id ?? null,
    start_time: formData.start_time ?? null,
    end_time: formData.end_time ?? null,
    session_type: formData.session_type ?? undefined,
    prebrief_minutes: formData.prebrief_minutes ?? undefined,
    postbrief_minutes: formData.postbrief_minutes ?? undefined,
    location_id: formData.location_id ?? null,
    recurrence_rule: formData.recurrence_rule ?? null,
    requested_by: formData.requested_by ?? null,
    request_status: formData.request_status ?? undefined,
    notes: formData.notes ?? null,
    weather_conditions: formData.weather_conditions ?? null,
  }

  const { data, error } = await supabase.from("flight_sessions").update(updateData).eq("id", id).select()

  if (error) {
    console.error("Error updating flight session:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/schedule")
  revalidatePath(`/admin/schedule/${id}`)
  revalidatePath("/instructor/schedule")
  revalidatePath(`/instructor/schedule/${id}`)
  revalidatePath("/student/schedule")
  revalidatePath(`/student/schedule/${id}`)
  return { success: true, data: data[0] }
}

export async function deleteFlightSession(id: string) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // First delete any maneuver scores associated with this session
  const { error: scoresError } = await supabase.from("maneuver_scores").delete().eq("flight_session_id", id as Database["public"]["Tables"]["maneuver_scores"]["Row"]["flight_session_id"])

  if (scoresError) {
    console.error("Error deleting maneuver scores:", scoresError)
    return { success: false, error: scoresError.message }
  }

  // Then delete the flight session
  const { error } = await supabase.from("flight_sessions").delete().eq("id", id as Database["public"]["Tables"]["flight_sessions"]["Row"]["id"])

  if (error) {
    console.error("Error deleting flight session:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/schedule")
  revalidatePath("/instructor/schedule")
  revalidatePath("/student/schedule")
  return { success: true }
}

export async function getAvailableManeuversForLesson(lessonId: string) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // Get maneuvers associated with this lesson
  const { data: lessonManeuvers, error: lessonManeuversError } = await supabase
    .from("lesson_maneuvers")
    .select(`
      maneuver_id,
      is_required,
      maneuver:maneuver_id (
        id,
        name,
        description,
        category,
        faa_reference
      )
    `)
    .eq("lesson_id", lessonId as Database["public"]["Tables"]["lesson_maneuvers"]["Row"]["lesson_id"])

  if (lessonManeuversError) {
    console.error("Error fetching lesson maneuvers:", lessonManeuversError)
    return []
  }

  // Format the data
  const maneuvers = (lessonManeuvers as any[]).filter((lm) => lm && typeof lm === "object" && !("error" in lm) && lm.maneuver && typeof lm.maneuver === "object").map((lm) => ({
    ...lm.maneuver,
    lesson_maneuver_id: lm.id,
    is_required: lm.is_required,
  }))

  return maneuvers
}

export async function saveManeuverScores(
  flightSessionId: string,
  scores: Array<{
    maneuver_id: string
    score: number
    notes?: string | null
    acs_task_id?: string | null
    meets_acs_standard?: boolean | null
    areas_for_improvement?: string | null
  }>,
) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // First delete any existing scores for this session
  const { error: deleteError } = await supabase.from("maneuver_scores").delete().eq("flight_session_id", flightSessionId as Database["public"]["Tables"]["maneuver_scores"]["Row"]["flight_session_id"])

  if (deleteError) {
    console.error("Error deleting existing maneuver scores:", deleteError)
    return { success: false, error: deleteError.message }
  }

  // Then insert the new scores
  const scoresToInsert = scores.map((score) => ({
    flight_session_id: flightSessionId,
    maneuver_id: score.maneuver_id,
    score: score.score,
    notes: score.notes || null,
    acs_task_id: score.acs_task_id || null,
    meets_acs_standard: score.meets_acs_standard || null,
    areas_for_improvement: score.areas_for_improvement || null,
  }))

  const { data, error: insertError } = await supabase.from("maneuver_scores").insert(scoresToInsert as Database["public"]["Tables"]["maneuver_scores"]["Insert"][])

  if (insertError) {
    console.error("Error inserting maneuver scores:", insertError)
    return { success: false, error: insertError.message }
  }

  revalidatePath(`/admin/schedule/${flightSessionId}`)
  revalidatePath(`/instructor/schedule/${flightSessionId}`)
  revalidatePath(`/student/schedule/${flightSessionId}`)
  return { success: true, data: data }
}

// Helper function to get lesson details (either template or custom)
export async function getLessonDetails(lessonId: string | null, customLessonId: string | null) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  if (lessonId) {
    const { data, error } = await supabase
      .from("syllabus_lessons")
      .select("*")
      .eq("id", lessonId)
      .single()
    
    if (error) {
      console.error("Error fetching lesson details:", error)
      return null
    }
    
    return { ...data, lesson_source: "template" as const }
  }
  
  if (customLessonId) {
    const { data, error } = await supabase
      .from("custom_lessons")
      .select("*")
      .eq("id", customLessonId)
      .single()
    
    if (error) {
      console.error("Error fetching custom lesson details:", error)
      return null
    }
    
    return { ...data, lesson_source: "custom" as const }
  }
  
  return null
}