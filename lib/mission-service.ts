"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// ============================================================================
// TYPES
// ============================================================================

export type MissionStatus = 
  | "scheduled" 
  | "in_progress" 
  | "completed" 
  | "cancelled" 
  | "partially_completed"

export type MissionType = "F" | "G" | "S" // Flight, Ground, Simulator

export type InstructorAssessment = 
  | "satisfactory" 
  | "needs_more_practice" 
  | "outstanding"

export interface Mission {
  id: string
  enrollment_id: string
  assigned_instructor_id: string
  student_id: string
  mission_code: string
  mission_number: number
  program_code: string
  mission_type: MissionType
  lesson_template_id: string | null
  lesson_code: string | null
  template_snapshot: any | null
  customizations: any | null
  is_customized: boolean
  scheduled_date: string
  scheduled_start_time: string | null
  scheduled_aircraft_id: string | null
  actual_aircraft_id: string | null
  aircraft_changed: boolean
  aircraft_change_reason: string | null
  status: MissionStatus
  instructor_assessment: InstructorAssessment | null
  plan_of_action_id: string | null
  debrief_id: string | null
  total_cost_cents: number
  total_flight_hours: number
  total_ground_hours: number
  created_at: string
  completed_at: string | null
  cancelled_at: string | null
  updated_at: string
  created_by: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  
  // Populated fields
  student?: {
    id: string
    first_name: string
    last_name: string
    email: string
    avatar_url: string | null
  }
  instructor?: {
    id: string
    first_name: string
    last_name: string
    email: string
    avatar_url: string | null
  }
  aircraft?: {
    id: string
    tail_number: string
    make: string
    model: string
  }
  lesson_template?: {
    id: string
    title: string
    description: string
    lesson_type: string
  }
  training_events?: TrainingEvent[]
  plan_of_action?: PlanOfAction
  debrief?: Debrief
}

export interface TrainingEvent {
  id: string
  mission_id: string
  enrollment_id: string
  instructor_id: string
  student_id: string
  event_type: "prebrief" | "flight" | "ground" | "simulator" | "postbrief"
  event_sequence: number
  billing_category: "flight_instruction" | "ground_instruction" | "simulator_instruction"
  scheduled_duration_minutes: number | null
  actual_duration_minutes: number | null
  billable_hours: number | null
  student_billing_rate_dollars: number | null
  student_charge_cents: number | null
  instructor_payout_rate_cents: number | null
  instructor_payout_cents: number | null
  dsa_margin_cents: number | null
  student_payment_status: string
  instructor_payout_status: string
  ledger_journal_id: string | null
  aircraft_id: string | null
  hobbs_start: number | null
  hobbs_end: number | null
  tach_start: number | null
  tach_end: number | null
  scheduled_start_time: string | null
  actual_start_time: string | null
  actual_end_time: string | null
  objectives_covered: string[] | null
  notes: string | null
  weather_conditions: any | null
  status: string
  created_at: string
  updated_at: string
  created_by: string | null
  completed_by: string | null
}

export interface PlanOfAction {
  id: string
  mission_id: string
  student_id: string
  instructor_id: string
  flight_number: number | null
  aircraft_tail_number: string | null
  departure_direction: string | null
  destination_airport: string | null
  duration_hours: number
  mission_overview: string | null
  training_objectives: string[] | null
  student_focus_notes: string[] | null
  prior_debrief_ids: string[] | null
  prior_debrief_insights: any | null
  video_resources: any[] | null
  faa_references: any[] | null
  prep_checklist_items: string[] | null
  status: string
  shared_with_student_at: string | null
  student_acknowledged_at: string | null
  ai_generated: boolean
  ai_model_used: string | null
  ai_generation_time_ms: number | null
  ai_sources: any | null
  created_at: string
  updated_at: string
}

export interface Debrief {
  id: string
  mission_id: string
  student_id: string
  instructor_id: string
  flight_number: number | null
  maneuvers_covered: string[] | null
  maneuver_details: any[] | null
  far_references: any[] | null
  acs_tasks_covered: string[] | null
  acs_task_details: any[] | null
  general_overview: string | null
  key_takeaways: any[] | null
  next_lesson_plan: string | null
  raw_transcript: string | null
  transcript_duration_seconds: number | null
  ai_formatted: boolean
  ai_model_used: string | null
  ai_confidence_score: number | null
  ai_processing_time_ms: number | null
  created_at: string
  updated_at: string
}

export interface MissionFormData {
  enrollment_id: string
  assigned_instructor_id: string
  student_id: string
  program_code?: string // Optional - will be looked up from enrollment if not provided
  mission_type: MissionType
  lesson_template_id?: string | null
  customizations?: any
  scheduled_date: string
  scheduled_start_time?: string | null
  scheduled_aircraft_id?: string | null
  notes?: string
}

export interface MissionFilters {
  status?: MissionStatus | MissionStatus[]
  mission_type?: MissionType
  start_date?: string
  end_date?: string
  instructor_id?: string
  student_id?: string
  enrollment_id?: string
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a new mission from a lesson template
 */
export async function createMissionFromTemplate(
  formData: MissionFormData
): Promise<{ success: boolean; data?: Mission; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    // Get program code from enrollment if not provided
    let programCode = formData.program_code
    if (!programCode) {
      const { data: enrollment } = await supabase
        .from("student_enrollments")
        .select("syllabi(code)")
        .eq("id", formData.enrollment_id)
        .single()
      
      programCode = enrollment?.syllabi?.code || "PPC" // Default to PPC if not found
    }

    // Generate mission code
    const { data: missionCode, error: codeError } = await supabase
      .rpc("generate_mission_code", {
        p_program_code: programCode,
        p_mission_type: formData.mission_type,
        p_enrollment_id: formData.enrollment_id,
      })

    if (codeError) {
      console.error("Error generating mission code:", codeError)
      return { success: false, error: "Failed to generate mission code" }
    }

    // Get next mission number
    const { data: missions } = await supabase
      .from("missions")
      .select("mission_number")
      .eq("enrollment_id", formData.enrollment_id)
      .eq("mission_type", formData.mission_type)
      .order("mission_number", { ascending: false })
      .limit(1)

    const nextMissionNumber = missions && missions.length > 0 
      ? missions[0].mission_number + 1 
      : 1

    // Fetch lesson template if provided
    let templateSnapshot = null
    let lessonCode = null
    let isCustomized = false

    if (formData.lesson_template_id) {
      const { data: template } = await supabase
        .from("syllabus_lessons")
        .select("*")
        .eq("id", formData.lesson_template_id)
        .single()

      if (template) {
        templateSnapshot = template
        lessonCode = `${formData.program_code}-L${template.order_index}`
        isCustomized = !!formData.customizations
      }
    }

    // Create mission
    const missionData = {
      enrollment_id: formData.enrollment_id,
      assigned_instructor_id: formData.assigned_instructor_id,
      student_id: formData.student_id,
      mission_code: missionCode as string,
      mission_number: nextMissionNumber,
      program_code: formData.program_code,
      mission_type: formData.mission_type,
      lesson_template_id: formData.lesson_template_id || null,
      lesson_code: lessonCode,
      template_snapshot: templateSnapshot,
      customizations: formData.customizations || null,
      is_customized: isCustomized,
      scheduled_date: formData.scheduled_date,
      scheduled_start_time: formData.scheduled_start_time || null,
      scheduled_aircraft_id: formData.scheduled_aircraft_id || null,
      status: "scheduled" as MissionStatus,
      created_by: user.id,
    }

    const { data: mission, error: insertError } = await supabase
      .from("missions")
      .insert(missionData)
      .select()
      .single()

    if (insertError) {
      console.error("Error creating mission:", insertError)
      return { success: false, error: insertError.message }
    }

    revalidatePath("/instructor/missions")
    revalidatePath("/student/missions")
    
    return { success: true, data: mission as Mission }
  } catch (error) {
    console.error("Error in createMissionFromTemplate:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Get a single mission by ID with all related data
 */
export async function getMissionById(
  missionId: string
): Promise<Mission | null> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from("missions")
      .select(`
        *,
        student:student_id (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        ),
        instructor:assigned_instructor_id (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        ),
        aircraft:scheduled_aircraft_id (
          id,
          tail_number,
          make,
          model
        ),
        lesson_template:lesson_template_id (
          id,
          title,
          description,
          lesson_type
        ),
        training_events (
          *
        ),
        plan_of_action:plan_of_action_id (
          *
        ),
        debrief:debrief_id (
          *
        )
      `)
      .eq("id", missionId)
      .single()

    if (error) {
      console.error("Error fetching mission:", error)
      return null
    }

    return data as Mission
  } catch (error) {
    console.error("Error in getMissionById:", error)
    return null
  }
}

/**
 * Get missions for a student
 */
export async function getStudentMissions(
  studentId: string,
  filters?: MissionFilters
): Promise<Mission[]> {
  try {
    console.log('[mission-service] getStudentMissions called for student:', studentId)
    console.log('[mission-service] Filters:', JSON.stringify(filters))
    
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    console.log('[mission-service] Authenticated user:', user?.id)
    
    if (user?.id !== studentId) {
      console.warn('[mission-service] User ID mismatch! Auth:', user?.id, 'Requested:', studentId)
    }

    let query = supabase
      .from("missions")
      .select(`
        *,
        instructor:assigned_instructor_id (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        ),
        aircraft:scheduled_aircraft_id (
          id,
          tail_number,
          make,
          model
        ),
        lesson_template:lesson_template_id (
          id,
          title,
          description,
          lesson_type
        )
      `)
      .eq("student_id", studentId)
      .order("scheduled_date", { ascending: false })
      .order("mission_number", { ascending: false })

    // Apply filters
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in("status", filters.status)
      } else {
        query = query.eq("status", filters.status)
      }
    }

    if (filters?.mission_type) {
      query = query.eq("mission_type", filters.mission_type)
    }

    if (filters?.start_date) {
      query = query.gte("scheduled_date", filters.start_date)
    }

    if (filters?.end_date) {
      query = query.lte("scheduled_date", filters.end_date)
    }

    if (filters?.enrollment_id) {
      query = query.eq("enrollment_id", filters.enrollment_id)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching student missions:", error)
      return []
    }

    return data as Mission[]
  } catch (error) {
    console.error("Error in getStudentMissions:", error)
    return []
  }
}

/**
 * Get missions for an instructor
 */
export async function getInstructorMissions(
  instructorId: string,
  filters?: MissionFilters
): Promise<Mission[]> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    let query = supabase
      .from("missions")
      .select(`
        *,
        student:student_id (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        ),
        aircraft:scheduled_aircraft_id (
          id,
          tail_number,
          make,
          model
        ),
        lesson_template:lesson_template_id (
          id,
          title,
          description,
          lesson_type
        )
      `)
      .eq("assigned_instructor_id", instructorId)
      .order("scheduled_date", { ascending: false })
      .order("mission_number", { ascending: false })

    // Apply filters
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in("status", filters.status)
      } else {
        query = query.eq("status", filters.status)
      }
    }

    if (filters?.mission_type) {
      query = query.eq("mission_type", filters.mission_type)
    }

    if (filters?.start_date) {
      query = query.gte("scheduled_date", filters.start_date)
    }

    if (filters?.end_date) {
      query = query.lte("scheduled_date", filters.end_date)
    }

    if (filters?.student_id) {
      query = query.eq("student_id", filters.student_id)
    }

    if (filters?.enrollment_id) {
      query = query.eq("enrollment_id", filters.enrollment_id)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching instructor missions:", error)
      return []
    }

    return data as Mission[]
  } catch (error) {
    console.error("Error in getInstructorMissions:", error)
    return []
  }
}

/**
 * Update a mission
 */
export async function updateMission(
  missionId: string,
  updates: Partial<Mission>
): Promise<{ success: boolean; data?: Mission; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from("missions")
      .update(updates)
      .eq("id", missionId)
      .select()
      .single()

    if (error) {
      console.error("Error updating mission:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/instructor/missions")
    revalidatePath(`/instructor/missions/${missionId}`)
    revalidatePath("/student/missions")
    revalidatePath(`/student/missions/${missionId}`)

    return { success: true, data: data as Mission }
  } catch (error) {
    console.error("Error in updateMission:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Cancel a mission
 */
export async function cancelMission(
  missionId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    const { error } = await supabase
      .from("missions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        cancellation_reason: reason,
      })
      .eq("id", missionId)

    if (error) {
      console.error("Error cancelling mission:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/instructor/missions")
    revalidatePath(`/instructor/missions/${missionId}`)
    revalidatePath("/student/missions")
    revalidatePath(`/student/missions/${missionId}`)

    return { success: true }
  } catch (error) {
    console.error("Error in cancelMission:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Complete a mission
 */
export async function completeMission(
  missionId: string,
  assessment: InstructorAssessment
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { error } = await supabase
      .from("missions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        instructor_assessment: assessment,
      })
      .eq("id", missionId)

    if (error) {
      console.error("Error completing mission:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/instructor/missions")
    revalidatePath(`/instructor/missions/${missionId}`)
    revalidatePath("/student/missions")
    revalidatePath(`/student/missions/${missionId}`)

    return { success: true }
  } catch (error) {
    console.error("Error in completeMission:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Get mission summary with all related data
 */
export async function getMissionSummary(
  missionId: string
): Promise<{
  mission: Mission | null
  training_events: TrainingEvent[]
  plan_of_action: PlanOfAction | null
  debrief: Debrief | null
  total_flight_hours: number
  total_ground_hours: number
  total_cost: number
}> {
  try {
    const mission = await getMissionById(missionId)

    if (!mission) {
      return {
        mission: null,
        training_events: [],
        plan_of_action: null,
        debrief: null,
        total_flight_hours: 0,
        total_ground_hours: 0,
        total_cost: 0,
      }
    }

    return {
      mission,
      training_events: mission.training_events || [],
      plan_of_action: mission.plan_of_action || null,
      debrief: mission.debrief || null,
      total_flight_hours: mission.total_flight_hours,
      total_ground_hours: mission.total_ground_hours,
      total_cost: mission.total_cost_cents / 100,
    }
  } catch (error) {
    console.error("Error in getMissionSummary:", error)
    return {
      mission: null,
      training_events: [],
      plan_of_action: null,
      debrief: null,
      total_flight_hours: 0,
      total_ground_hours: 0,
      total_cost: 0,
    }
  }
}

/**
 * Get upcoming missions (next 7 days)
 */
export async function getUpcomingMissions(
  userId: string,
  userRole: "student" | "instructor"
): Promise<Mission[]> {
  try {
    const today = new Date().toISOString().split("T")[0]
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]

    const filters: MissionFilters = {
      status: ["scheduled", "in_progress"],
      start_date: today,
      end_date: nextWeek,
    }

    if (userRole === "student") {
      return getStudentMissions(userId, filters)
    } else {
      return getInstructorMissions(userId, filters)
    }
  } catch (error) {
    console.error("Error in getUpcomingMissions:", error)
    return []
  }
}

/**
 * Get mission statistics for a student
 */
export async function getStudentMissionStats(
  studentId: string,
  enrollmentId?: string
): Promise<{
  total_missions: number
  completed_missions: number
  cancelled_missions: number
  total_flight_hours: number
  total_ground_hours: number
  average_assessment_score: number | null
}> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    let query = supabase
      .from("missions")
      .select("*")
      .eq("student_id", studentId)

    if (enrollmentId) {
      query = query.eq("enrollment_id", enrollmentId)
    }

    const { data: missions, error } = await query

    if (error || !missions) {
      console.error("Error fetching mission stats:", error)
      return {
        total_missions: 0,
        completed_missions: 0,
        cancelled_missions: 0,
        total_flight_hours: 0,
        total_ground_hours: 0,
        average_assessment_score: null,
      }
    }

    const completed = missions.filter((m) => m.status === "completed")
    const cancelled = missions.filter((m) => m.status === "cancelled")

    const totalFlightHours = missions.reduce(
      (sum, m) => sum + (m.total_flight_hours || 0),
      0
    )
    const totalGroundHours = missions.reduce(
      (sum, m) => sum + (m.total_ground_hours || 0),
      0
    )

    // Calculate average assessment score
    const assessmentScores = completed
      .filter((m) => m.instructor_assessment)
      .map((m) => {
        if (m.instructor_assessment === "outstanding") return 4
        if (m.instructor_assessment === "satisfactory") return 3
        if (m.instructor_assessment === "needs_more_practice") return 2
        return 0
      })

    const avgScore =
      assessmentScores.length > 0
        ? assessmentScores.reduce((sum, score) => sum + score, 0) /
          assessmentScores.length
        : null

    return {
      total_missions: missions.length,
      completed_missions: completed.length,
      cancelled_missions: cancelled.length,
      total_flight_hours: totalFlightHours,
      total_ground_hours: totalGroundHours,
      average_assessment_score: avgScore,
    }
  } catch (error) {
    console.error("Error in getStudentMissionStats:", error)
    return {
      total_missions: 0,
      completed_missions: 0,
      cancelled_missions: 0,
      total_flight_hours: 0,
      total_ground_hours: 0,
      average_assessment_score: null,
    }
  }
}

/**
 * Complete pre-brief for a mission
 * Marks the POA as briefed and updates mission status
 */
export async function completePreBrief(
  missionId: string,
  poaId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    const now = new Date().toISOString()

    // 1. Update POA with instructor_briefed_at timestamp
    const { error: poaError } = await supabase
      .from("plans_of_action")
      .update({
        instructor_briefed_at: now,
      })
      .eq("id", poaId)

    if (poaError) {
      console.error("Error updating POA:", poaError)
      return { success: false, error: poaError.message }
    }

    // 2. Update mission with prebriefed_at timestamp (using updated_at as proxy)
    // Note: If you want a dedicated prebriefed_at column on missions table, add it to schema
    const { error: missionError } = await supabase
      .from("missions")
      .update({
        updated_at: now,
      })
      .eq("id", missionId)

    if (missionError) {
      console.error("Error updating mission:", missionError)
      return { success: false, error: missionError.message }
    }

    // 3. Revalidate paths
    revalidatePath(`/instructor/missions/${missionId}`)
    revalidatePath(`/instructor/missions/${missionId}/pre-brief`)
    revalidatePath(`/student/missions/${missionId}`)
    revalidatePath(`/student/missions/${missionId}/poa`)

    return { success: true }
  } catch (error) {
    console.error("Error in completePreBrief:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}