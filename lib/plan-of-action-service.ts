"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// ============================================================================
// TYPES
// ============================================================================

export type POAStatus = "draft" | "shared" | "acknowledged" | "archived"

export interface PlanOfAction {
  id: string
  mission_id: string
  student_id: string
  instructor_id: string
  flight_number: number | null
  aircraft_tail_number: string | null
  departure_direction: string | null
  destination_airport: string | null
  practice_area: string | null
  instructor_briefed_at: string | null
  duration_hours: number
  mission_overview: string | null
  training_objectives: string[] | null
  student_focus_notes: string[] | null
  prior_debrief_ids: string[] | null
  prior_debrief_insights: any | null
  video_resources: VideoResource[] | null
  faa_references: FAAReference[] | null
  prep_checklist_items: string[] | null
  maneuvers_detail: ManeuverDetail[] | null
  status: POAStatus
  shared_with_student_at: string | null
  student_acknowledged_at: string | null
  ai_generated: boolean
  ai_model_used: string | null
  ai_generation_time_ms: number | null
  ai_sources: any | null
  created_at: string
  updated_at: string
  
  // Populated fields
  mission?: {
    id: string
    mission_code: string
    mission_type: string
    scheduled_date: string
    lesson_template?: {
      title: string
      description: string
    }
  }
  student?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  instructor?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export interface VideoResource {
  title: string
  url: string
  duration_minutes?: number
  verified: boolean
  verified_at?: string
  description?: string
}

export interface FAAReference {
  title: string
  reference: string // e.g., "§61.107(b)(1)(iv)"
  url?: string
  description?: string
  verified: boolean
}

export interface ManeuverDetail {
  maneuver_id: string
  maneuver_name: string
  category: string
  target_proficiency: 1 | 2 | 3 | 4
  proficiency_label: "Rote" | "Understanding" | "Application" | "Correlation"
  is_required: boolean
  emphasis_level: "introduction" | "standard" | "proficiency" | "mastery"
  success_criteria: string[]
  acs_task_codes: string[]
  instructor_notes?: string
  student_prep_notes?: string
  student_current_proficiency?: number
  student_trend?: "improving" | "stable" | "declining" | "insufficient_data"
}

export interface POAFormData {
  mission_id: string
  student_id: string
  instructor_id: string
  flight_number?: number
  aircraft_tail_number?: string
  departure_direction?: string
  destination_airport?: string
  duration_hours?: number
  mission_overview?: string
  training_objectives?: string[]
  student_focus_notes?: string[]
  video_resources?: VideoResource[]
  faa_references?: FAAReference[]
  prep_checklist_items?: string[]
}

export interface AIGenerationRequest {
  mission_id: string
  student_id: string
  instructor_id: string
  lesson_template_id?: string | null
  include_prior_debriefs?: boolean
  focus_areas?: string[]
}

export interface AIGeneratedPOA {
  mission_overview: string
  training_objectives: string[]
  student_focus_notes: string[]
  video_resources: VideoResource[]
  faa_references: FAAReference[]
  prep_checklist_items: string[]
  maneuvers_detail: ManeuverDetail[]
  prior_debrief_insights: any
  generation_metadata: {
    model: string
    generation_time_ms: number
    sources_used: string[]
    confidence_score: number
  }
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a Plan of Action
 */
export async function createPlanOfAction(
  formData: POAFormData
): Promise<{ success: boolean; data?: PlanOfAction; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    const poaData = {
      ...formData,
      duration_hours: formData.duration_hours || 2.0,
      status: "draft" as POAStatus,
      ai_generated: false,
    }

    const { data, error } = await supabase
      .from("plans_of_action")
      .insert(poaData)
      .select()
      .single()

    if (error) {
      console.error("Error creating plan of action:", error)
      return { success: false, error: error.message }
    }

    // Update mission with POA reference
    await supabase
      .from("missions")
      .update({ plan_of_action_id: data.id })
      .eq("id", formData.mission_id)

    revalidatePath(`/instructor/missions/${formData.mission_id}`)
    revalidatePath(`/student/missions/${formData.mission_id}`)

    return { success: true, data: data as PlanOfAction }
  } catch (error) {
    console.error("Error in createPlanOfAction:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Get Plan of Action by ID
 */
export async function getPlanOfActionById(
  poaId: string
): Promise<PlanOfAction | null> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from("plans_of_action")
      .select(`
        *,
        mission:mission_id (
          id,
          mission_code,
          mission_type,
          scheduled_date,
          lesson_template:lesson_template_id (
            title,
            description
          )
        ),
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
        )
      `)
      .eq("id", poaId)
      .single()

    if (error) {
      console.error("Error fetching plan of action:", error)
      return null
    }

    return data as PlanOfAction
  } catch (error) {
    console.error("Error in getPlanOfActionById:", error)
    return null
  }
}

/**
 * Get Plan of Action by Mission ID
 */
export async function getPlanOfActionByMissionId(
  missionId: string
): Promise<PlanOfAction | null> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from("plans_of_action")
      .select(`
        *,
        mission:mission_id (
          id,
          mission_code,
          mission_type,
          scheduled_date
        ),
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
        )
      `)
      .eq("mission_id", missionId)
      .single()

    if (error) {
      console.error("Error fetching plan of action:", error)
      return null
    }

    return data as PlanOfAction
  } catch (error) {
    console.error("Error in getPlanOfActionByMissionId:", error)
    return null
  }
}

/**
 * Update a Plan of Action
 */
export async function updatePlanOfAction(
  poaId: string,
  updates: Partial<PlanOfAction>
): Promise<{ success: boolean; data?: PlanOfAction; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from("plans_of_action")
      .update(updates)
      .eq("id", poaId)
      .select()
      .single()

    if (error) {
      console.error("Error updating plan of action:", error)
      return { success: false, error: error.message }
    }

    const poa = data as PlanOfAction
    revalidatePath(`/instructor/missions/${poa.mission_id}`)
    revalidatePath(`/student/missions/${poa.mission_id}`)

    return { success: true, data: poa }
  } catch (error) {
    console.error("Error in updatePlanOfAction:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Share POA with student
 */
export async function sharePlanOfActionWithStudent(
  poaId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { error } = await supabase
      .from("plans_of_action")
      .update({
        status: "shared",
        shared_with_student_at: new Date().toISOString(),
      })
      .eq("id", poaId)

    if (error) {
      console.error("Error sharing plan of action:", error)
      return { success: false, error: error.message }
    }

    // TODO: Send notification/email to student
    
    return { success: true }
  } catch (error) {
    console.error("Error in sharePlanOfActionWithStudent:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Student acknowledges POA
 */
export async function acknowledgePlanOfAction(
  poaId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { error } = await supabase
      .from("plans_of_action")
      .update({
        status: "acknowledged",
        student_acknowledged_at: new Date().toISOString(),
      })
      .eq("id", poaId)

    if (error) {
      console.error("Error acknowledging plan of action:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in acknowledgePlanOfAction:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// ============================================================================
// AI GENERATION
// ============================================================================

/**
 * Get prior debrief insights for a student
 */
async function getPriorDebriefInsights(
  studentId: string,
  limit: number = 3
): Promise<{
  debrief_ids: string[]
  insights: any
}> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Get last 3 completed debriefs
    const { data: debriefs, error } = await supabase
      .from("debriefs")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error || !debriefs || debriefs.length === 0) {
      return { debrief_ids: [], insights: null }
    }

    // Extract key insights
    const insights = {
      common_strengths: [] as string[],
      areas_for_improvement: [] as string[],
      recurring_themes: [] as string[],
      recent_focus_areas: [] as string[],
    }

    const debriefIds: string[] = []

    for (const debrief of debriefs) {
      debriefIds.push(debrief.id)

      // Extract from key takeaways
      if (debrief.key_takeaways && Array.isArray(debrief.key_takeaways)) {
        for (const takeaway of debrief.key_takeaways) {
          if (takeaway.category === "strength") {
            insights.common_strengths.push(takeaway.observation)
          } else if (takeaway.category === "improvement") {
            insights.areas_for_improvement.push(takeaway.observation)
          }
        }
      }

      // Extract from maneuver details
      if (debrief.maneuver_details && Array.isArray(debrief.maneuver_details)) {
        for (const maneuver of debrief.maneuver_details) {
          if (maneuver.notes) {
            insights.recent_focus_areas.push(
              `${maneuver.maneuver_name}: ${maneuver.notes}`
            )
          }
        }
      }
    }

    return {
      debrief_ids: debriefIds,
      insights,
    }
  } catch (error) {
    console.error("Error getting prior debrief insights:", error)
    return { debrief_ids: [], insights: null }
  }
}

/**
 * Get lesson maneuvers with full details including ACS standards and student progress
 */
async function getLessonManeuversWithDetails(
  lessonId: string,
  studentId?: string
): Promise<ManeuverDetail[]> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Query lesson_maneuvers with joins
    const { data: lessonManeuvers, error } = await supabase
      .from("lesson_maneuvers")
      .select(`
        *,
        maneuver:maneuver_id (
          id,
          name,
          category,
          description,
          acs_standard,
          performance_standards
        )
      `)
      .eq("lesson_id", lessonId)
      .order("display_order")

    if (error || !lessonManeuvers) {
      console.error("Error fetching lesson maneuvers:", error)
      return []
    }

    const maneuverDetails: ManeuverDetail[] = []

    for (const lm of lessonManeuvers) {
      if (!lm.maneuver) continue

      const maneuver = lm.maneuver as any

      // Get ACS task codes for this maneuver
      const { data: acsLinks } = await supabase
        .from("maneuver_acs_tasks")
        .select(`
          acs_task:acs_task_id (
            task_code,
            skill_elements,
            knowledge_elements
          )
        `)
        .eq("maneuver_id", maneuver.id)

      const acsTaskCodes: string[] = []
      const successCriteria: string[] = []

      if (acsLinks) {
        for (const link of acsLinks) {
          const task = link.acs_task as any
          if (task && task.task_code) {
            acsTaskCodes.push(task.task_code)
            
            // Extract success criteria from skill elements
            if (task.skill_elements && Array.isArray(task.skill_elements)) {
              successCriteria.push(...task.skill_elements)
            }
          }
        }
      }

      // If no ACS criteria, use performance standards from maneuver
      if (successCriteria.length === 0 && maneuver.performance_standards) {
        if (Array.isArray(maneuver.performance_standards)) {
          successCriteria.push(...maneuver.performance_standards)
        } else if (typeof maneuver.performance_standards === 'string') {
          successCriteria.push(maneuver.performance_standards)
        }
      }

      // Get student's current proficiency if studentId provided
      let studentCurrentProficiency: number | undefined
      let studentTrend: "improving" | "stable" | "declining" | "insufficient_data" | undefined

      if (studentId) {
        const { data: progress } = await supabase
          .from("student_maneuver_progress")
          .select("latest_score, trend")
          .eq("student_id", studentId)
          .eq("maneuver_id", maneuver.id)
          .single()

        if (progress) {
          studentCurrentProficiency = progress.latest_score
          studentTrend = progress.trend
        }
      }

      // Map proficiency level to label
      const proficiencyLabels = {
        1: "Rote" as const,
        2: "Understanding" as const,
        3: "Application" as const,
        4: "Correlation" as const,
      }

      maneuverDetails.push({
        maneuver_id: maneuver.id,
        maneuver_name: maneuver.name,
        category: maneuver.category || "General",
        target_proficiency: lm.target_proficiency || 3,
        proficiency_label: proficiencyLabels[lm.target_proficiency || 3],
        is_required: lm.is_required !== false,
        emphasis_level: lm.emphasis_level || "standard",
        success_criteria: successCriteria,
        acs_task_codes: acsTaskCodes,
        instructor_notes: lm.instructor_notes,
        student_prep_notes: lm.student_prep_notes,
        student_current_proficiency: studentCurrentProficiency,
        student_trend: studentTrend,
      })
    }

    return maneuverDetails
  } catch (error) {
    console.error("Error in getLessonManeuversWithDetails:", error)
    return []
  }
}

/**
 * Get lesson template content
 */
async function getLessonTemplateContent(
  lessonId: string
): Promise<{
  title: string
  description: string
  objectives: string[]
  maneuvers: Array<{ name: string; category: string }>
  resources: Array<{ title: string; url: string }>
}> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: lesson } = await supabase
      .from("syllabus_lessons")
      .select(`
        *,
        lesson_maneuvers (
          maneuver:maneuver_id (
            name,
            category,
            faa_reference
          )
        ),
        lesson_resources (
          resource:resource_id (
            title,
            link,
            description
          )
        )
      `)
      .eq("id", lessonId)
      .single()

    if (!lesson) {
      return {
        title: "",
        description: "",
        objectives: [],
        maneuvers: [],
        resources: [],
      }
    }

    // Parse objectives from description or objective field
    const objectives: string[] = []
    if (lesson.objective) {
      objectives.push(lesson.objective)
    }

    // Extract maneuvers
    const maneuvers = lesson.lesson_maneuvers?.map((lm: any) => ({
      name: lm.maneuver?.name || "",
      category: lm.maneuver?.category || "",
    })) || []

    // Extract resources
    const resources = lesson.lesson_resources?.map((lr: any) => ({
      title: lr.resource?.title || "",
      url: lr.resource?.link || "",
    })) || []

    return {
      title: lesson.title,
      description: lesson.description,
      objectives,
      maneuvers,
      resources,
    }
  } catch (error) {
    console.error("Error getting lesson template content:", error)
    return {
      title: "",
      description: "",
      objectives: [],
      maneuvers: [],
      resources: [],
    }
  }
}

/**
 * Alias for generatePlanOfActionWithAI (for backward compatibility)
 */
export async function generatePlanOfAction(
  request: AIGenerationRequest
): Promise<{ success: boolean; data?: AIGeneratedPOA; error?: string }> {
  return generatePlanOfActionWithAI(request)
}

/**
 * Generate POA using AI (placeholder - will be implemented with actual AI)
 */
export async function generatePlanOfActionWithAI(
  request: AIGenerationRequest
): Promise<{ success: boolean; data?: AIGeneratedPOA; error?: string }> {
  try {
    const startTime = Date.now()

    // Get mission details
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: mission } = await supabase
      .from("missions")
      .select("*")
      .eq("id", request.mission_id)
      .single()

    if (!mission) {
      return { success: false, error: "Mission not found" }
    }

    // Get prior debrief insights
    let priorDebriefs = { debrief_ids: [], insights: null }
    if (request.include_prior_debriefs !== false) {
      priorDebriefs = await getPriorDebriefInsights(request.student_id)
    }

    // Get lesson template content
    let lessonContent = {
      title: "",
      description: "",
      objectives: [] as string[],
      maneuvers: [] as Array<{ name: string; category: string }>,
      resources: [] as Array<{ title: string; url: string }>,
    }

    // Get detailed maneuver information with student progress
    let maneuversDetail: ManeuverDetail[] = []

    if (request.lesson_template_id) {
      lessonContent = await getLessonTemplateContent(request.lesson_template_id)
      maneuversDetail = await getLessonManeuversWithDetails(
        request.lesson_template_id,
        request.student_id
      )
    }

    // ========================================================================
    // AI GENERATION PLACEHOLDER
    // ========================================================================
    // In a real implementation, this would call OpenAI/Claude API with:
    // - Mission details
    // - Prior debrief insights
    // - Lesson template content
    // - Student focus areas
    // 
    // For now, we'll generate a structured template based on available data
    // ========================================================================

    const missionOverview = lessonContent.description || 
      `Flight training session focusing on ${lessonContent.title || "core aviation skills"}.`

    const trainingObjectives = lessonContent.objectives.length > 0
      ? lessonContent.objectives
      : [
          "Review pre-flight procedures and aircraft systems",
          "Practice proper communication protocols",
          "Execute maneuvers to ACS standards",
          "Demonstrate safe aircraft operation",
        ]

    // Generate student focus notes from prior debriefs
    const studentFocusNotes: string[] = []
    if (priorDebriefs.insights?.areas_for_improvement) {
      studentFocusNotes.push(
        ...priorDebriefs.insights.areas_for_improvement.slice(0, 3)
      )
    }
    if (request.focus_areas) {
      studentFocusNotes.push(...request.focus_areas)
    }

    // Generate video resources
    const videoResources: VideoResource[] = [
      {
        title: "Pre-Flight Briefing Best Practices",
        url: "https://www.youtube.com/watch?v=example",
        verified: false,
        description: "Essential pre-flight briefing techniques",
      },
    ]

    // Generate FAA references
    const faaReferences: FAAReference[] = [
      {
        title: "14 CFR §61.107 - Private Pilot Privileges and Limitations",
        reference: "§61.107",
        url: "https://www.ecfr.gov/current/title-14/chapter-I/subchapter-D/part-61",
        verified: true,
      },
    ]

    // Generate prep checklist
    const prepChecklistItems = [
      "Review weather briefing and NOTAMs",
      "Study maneuvers and ACS standards",
      "Prepare flight planning materials",
      "Review prior debrief notes",
      "Prepare questions for instructor",
    ]

    const generationTimeMs = Date.now() - startTime

    const generatedPOA: AIGeneratedPOA = {
      mission_overview: missionOverview,
      training_objectives: trainingObjectives,
      student_focus_notes: studentFocusNotes,
      video_resources: videoResources,
      faa_references: faaReferences,
      prep_checklist_items: prepChecklistItems,
      maneuvers_detail: maneuversDetail,
      prior_debrief_insights: priorDebriefs.insights,
      generation_metadata: {
        model: "template-based-v1", // Will be "gpt-4" or "claude-3-opus" in real implementation
        generation_time_ms: generationTimeMs,
        sources_used: [
          "lesson_template",
          ...(priorDebriefs.debrief_ids.length > 0 ? ["prior_debriefs"] : []),
          ...(maneuversDetail.length > 0 ? ["maneuvers_with_progress"] : []),
        ],
        confidence_score: 0.85,
      },
    }

    return { success: true, data: generatedPOA }
  } catch (error) {
    console.error("Error generating POA with AI:", error)
    return { success: false, error: "Failed to generate Plan of Action" }
  }
}

/**
 * Create POA from AI generation
 */
export async function createPlanOfActionFromAI(
  request: AIGenerationRequest
): Promise<{ success: boolean; data?: PlanOfAction; error?: string }> {
  try {
    // Generate with AI
    const generationResult = await generatePlanOfActionWithAI(request)

    if (!generationResult.success || !generationResult.data) {
      return {
        success: false,
        error: generationResult.error || "Failed to generate POA",
      }
    }

    const aiPOA = generationResult.data

    // Create POA record
    const formData: POAFormData = {
      mission_id: request.mission_id,
      student_id: request.student_id,
      instructor_id: request.instructor_id,
      mission_overview: aiPOA.mission_overview,
      training_objectives: aiPOA.training_objectives,
      student_focus_notes: aiPOA.student_focus_notes,
      video_resources: aiPOA.video_resources,
      faa_references: aiPOA.faa_references,
      prep_checklist_items: aiPOA.prep_checklist_items,
    }

    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from("plans_of_action")
      .insert({
        ...formData,
        maneuvers_detail: aiPOA.maneuvers_detail,
        status: "draft",
        ai_generated: true,
        ai_model_used: aiPOA.generation_metadata.model,
        ai_generation_time_ms: aiPOA.generation_metadata.generation_time_ms,
        ai_sources: {
          sources_used: aiPOA.generation_metadata.sources_used,
          confidence_score: aiPOA.generation_metadata.confidence_score,
        },
        prior_debrief_insights: aiPOA.prior_debrief_insights,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating AI-generated POA:", error)
      return { success: false, error: error.message }
    }

    // Update mission with POA reference
    await supabase
      .from("missions")
      .update({ plan_of_action_id: data.id })
      .eq("id", request.mission_id)

    revalidatePath(`/instructor/missions/${request.mission_id}`)
    revalidatePath(`/student/missions/${request.mission_id}`)

    return { success: true, data: data as PlanOfAction }
  } catch (error) {
    console.error("Error in createPlanOfActionFromAI:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Get student's POA history
 */
export async function getStudentPOAHistory(
  studentId: string,
  limit: number = 10
): Promise<PlanOfAction[]> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from("plans_of_action")
      .select(`
        *,
        mission:mission_id (
          id,
          mission_code,
          mission_type,
          scheduled_date
        ),
        instructor:instructor_id (
          id,
          first_name,
          last_name
        )
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching POA history:", error)
      return []
    }

    return data as PlanOfAction[]
  } catch (error) {
    console.error("Error in getStudentPOAHistory:", error)
    return []
  }
}

