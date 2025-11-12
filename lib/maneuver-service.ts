"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { FOI_PROFICIENCY_LEVELS } from "./foi-levels"

// =====================================================================
// TYPES
// =====================================================================

export type Maneuver = {
  id: string
  name: string
  description: string
  category: string
  faa_reference: string
  primary_acs_task_code?: string
  related_acs_task_codes?: string[]
  tolerances?: string
  common_errors?: string[]
  created_at: string
  updated_at: string
}

export type LessonManeuver = {
  id: string
  lesson_id: string
  maneuver_id: string
  is_required: boolean
  is_introduction: boolean
  target_proficiency: 1 | 2 | 3 | 4 // FOI Levels
  display_order: number
  emphasis_level: 'introduction' | 'standard' | 'proficiency' | 'mastery'
  instructor_notes?: string
  student_prep_notes?: string
  created_at: string
  updated_at: string
  maneuver?: Maneuver
}

// Export FOI levels (re-exported from shared file for backward compatibility)
export { FOI_PROFICIENCY_LEVELS } from "./foi-levels"

// =====================================================================
// MANEUVER CRUD OPERATIONS
// =====================================================================

/**
 * Get all maneuvers (for selection/browsing)
 */
export async function getAllManeuvers() {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from("maneuvers")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching maneuvers:", error)
    return []
  }

  return data as Maneuver[]
}

/**
 * Get a specific maneuver by ID
 */
export async function getManeuverById(id: string) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from("maneuvers")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching maneuver:", error)
    return null
  }

  return data as Maneuver
}

/**
 * Search maneuvers by name, category, or description
 */
export async function searchManeuvers(query: string) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from("maneuvers")
    .select("*")
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
    .order("name")

  if (error) {
    console.error("Error searching maneuvers:", error)
    return []
  }

  return data as Maneuver[]
}

// =====================================================================
// LESSON MANEUVER OPERATIONS
// =====================================================================

/**
 * Get all maneuvers for a specific lesson
 */
export async function getLessonManeuvers(lessonId: string) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from("lesson_maneuvers")
    .select(`
      *,
      maneuver:maneuvers (
        id,
        name,
        description,
        category,
        faa_reference,
        primary_acs_task_code,
        related_acs_task_codes,
        tolerances
      )
    `)
    .eq("lesson_id", lessonId)
    .order("display_order")

  if (error) {
    console.error("Error fetching lesson maneuvers:", error)
    return []
  }

  return data as LessonManeuver[]
}

/**
 * Add a maneuver to a lesson
 */
export async function addManeuverToLesson(
  lessonId: string,
  maneuverId: string,
  options: {
    isRequired?: boolean
    isIntroduction?: boolean
    targetProficiency?: 1 | 2 | 3 | 4
    emphasisLevel?: 'introduction' | 'standard' | 'proficiency' | 'mastery'
    instructorNotes?: string
    studentPrepNotes?: string
    displayOrder?: number
  } = {}
) {
  const supabase = await createClient(await cookies())

  const { data: user } = await supabase.auth.getUser()

  const lessonManeuver = {
    lesson_id: lessonId,
    maneuver_id: maneuverId,
    is_required: options.isRequired ?? true,
    is_introduction: options.isIntroduction ?? false,
    target_proficiency: options.targetProficiency ?? 3,
    emphasis_level: options.emphasisLevel ?? 'standard',
    instructor_notes: options.instructorNotes,
    student_prep_notes: options.studentPrepNotes,
    display_order: options.displayOrder ?? 0,
    created_by: user.user?.id
  }

  const { data, error } = await supabase
    .from("lesson_maneuvers")
    .insert([lessonManeuver])
    .select()
    .single()

  if (error) {
    console.error("Error adding maneuver to lesson:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Update a lesson maneuver relationship
 */
export async function updateLessonManeuver(
  id: string,
  updates: Partial<Omit<LessonManeuver, 'id' | 'lesson_id' | 'maneuver_id' | 'created_at' | 'updated_at'>>
) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from("lesson_maneuvers")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating lesson maneuver:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Remove a maneuver from a lesson
 */
export async function removeManeuverFromLesson(lessonId: string, maneuverId: string) {
  const supabase = await createClient(await cookies())

  const { error } = await supabase
    .from("lesson_maneuvers")
    .delete()
    .eq("lesson_id", lessonId)
    .eq("maneuver_id", maneuverId)

  if (error) {
    console.error("Error removing maneuver from lesson:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Bulk update lesson maneuvers (for drag-and-drop reordering)
 */
export async function updateLessonManeuversOrder(
  lessonId: string,
  maneuverIds: string[]
) {
  const supabase = await createClient(await cookies())

  // Update each maneuver's display_order
  const updates = maneuverIds.map((maneuverId, index) =>
    supabase
      .from("lesson_maneuvers")
      .update({ display_order: index })
      .eq("lesson_id", lessonId)
      .eq("maneuver_id", maneuverId)
  )

  const results = await Promise.all(updates)

  const hasError = results.some(result => result.error)
  if (hasError) {
    console.error("Error updating maneuver order")
    return { success: false, error: "Failed to update order" }
  }

  revalidatePath(`/admin/syllabi`)
  return { success: true }
}

/**
 * Bulk replace all maneuvers for a lesson
 */
export async function replaceLessonManeuvers(
  lessonId: string,
  maneuvers: Array<{
    maneuver_id: string
    is_required: boolean
    is_introduction: boolean
    target_proficiency: 1 | 2 | 3 | 4
    emphasis_level: 'introduction' | 'standard' | 'proficiency' | 'mastery'
    instructor_notes?: string
    student_prep_notes?: string
    display_order: number
  }>
) {
  const supabase = await createClient(await cookies())
  const { data: user } = await supabase.auth.getUser()

  // Delete existing maneuvers for this lesson
  const { error: deleteError } = await supabase
    .from("lesson_maneuvers")
    .delete()
    .eq("lesson_id", lessonId)

  if (deleteError) {
    console.error("Error deleting existing maneuvers:", deleteError)
    return { success: false, error: deleteError.message }
  }

  // Insert new maneuvers
  if (maneuvers.length > 0) {
    const insertData = maneuvers.map(m => ({
      ...m,
      lesson_id: lessonId,
      created_by: user.user?.id
    }))

    const { data, error: insertError } = await supabase
      .from("lesson_maneuvers")
      .insert(insertData)
      .select()

    if (insertError) {
      console.error("Error inserting maneuvers:", insertError)
      return { success: false, error: insertError.message }
    }

    return { success: true, data }
  }

  return { success: true, data: [] }
}

/**
 * Get maneuver statistics for a lesson
 */
export async function getLessonManeuverStats(lessonId: string) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from("lesson_maneuvers")
    .select("is_required, target_proficiency, emphasis_level")
    .eq("lesson_id", lessonId)

  if (error) {
    console.error("Error fetching maneuver stats:", error)
    return null
  }

  const stats = {
    total: data.length,
    required: data.filter(m => m.is_required).length,
    optional: data.filter(m => !m.is_required).length,
    byProficiency: {
      rote: data.filter(m => m.target_proficiency === 1).length,
      understanding: data.filter(m => m.target_proficiency === 2).length,
      application: data.filter(m => m.target_proficiency === 3).length,
      correlation: data.filter(m => m.target_proficiency === 4).length
    },
    byEmphasis: {
      introduction: data.filter(m => m.emphasis_level === 'introduction').length,
      standard: data.filter(m => m.emphasis_level === 'standard').length,
      proficiency: data.filter(m => m.emphasis_level === 'proficiency').length,
      mastery: data.filter(m => m.emphasis_level === 'mastery').length
    }
  }

  return stats
}
