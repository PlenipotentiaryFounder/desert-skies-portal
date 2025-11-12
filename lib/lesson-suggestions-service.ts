/**
 * Lesson Edit Suggestions Service
 * Handles instructor suggestions for lesson edits and admin approval workflow
 */

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export interface LessonEditSuggestion {
  id: string
  lesson_id: string
  instructor_id: string
  field_name: string
  current_value: any
  suggested_value: any
  reason?: string
  status: 'pending' | 'approved' | 'rejected' | 'implemented'
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  created_at: string
  updated_at: string
  instructor?: {
    id: string
    full_name: string
    email: string
  }
  lesson?: {
    id: string
    title: string
    syllabus_id: string
  }
}

export interface PerformanceStandard {
  id: string
  lesson_id: string
  standard_text: string
  order_index: number
  acs_reference?: string
  is_required: boolean
  created_at: string
}

export interface ManeuverExpectation {
  id: string
  lesson_id: string
  maneuver_id: string
  expected_proficiency: number // 1-4
  is_required: boolean
  emphasis_level?: 'introduction' | 'practice' | 'review' | 'mastery'
  instructor_notes?: string
  order_index: number
  maneuver?: {
    id: string
    name: string
    description?: string
    category?: string
    primary_acs_task_code?: string
  }
}

export interface LessonResource {
  id: string
  lesson_id: string
  resource_type: 'video' | 'web_link' | 'faa_resource' | 'lesson_plan' | 'pdf' | 'powerpoint' | 'markdown'
  title: string
  description?: string
  url?: string
  file_path?: string
  file_name?: string
  content?: string
  faa_chapter?: string
  duration_minutes?: number
  is_required: boolean
  order_index: number
  created_at: string
}

/**
 * Create a new edit suggestion
 */
export async function createEditSuggestion(data: {
  lesson_id: string
  field_name: string
  current_value: any
  suggested_value: any
  reason?: string
}) {
  const supabase = await createClient(await cookies())
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: suggestion, error } = await supabase
    .from('lesson_edit_suggestions')
    .insert({
      ...data,
      instructor_id: user.id
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating edit suggestion:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data: suggestion }
}

/**
 * Get all pending suggestions for a lesson
 */
export async function getLessonSuggestions(lessonId: string) {
  try {
    const supabase = await createClient(await cookies())
    
    const { data, error } = await supabase
      .from('lesson_edit_suggestions')
      .select(`
        *,
        instructor:profiles!instructor_id (
          id,
          full_name,
          email
        )
      `)
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false })

    if (error) {
      // Table might not exist yet - return empty array
      return []
    }

    return (data as LessonEditSuggestion[]) || []
  } catch (error) {
    // Table doesn't exist yet
    return []
  }
}

/**
 * Get all pending suggestions (for admin review)
 */
export async function getAllPendingSuggestions() {
  const supabase = await createClient(await cookies())
  
  const { data, error } = await supabase
    .from('lesson_edit_suggestions')
    .select(`
      *,
      instructor:profiles!instructor_id (
        id,
        full_name,
        email
      ),
      lesson:syllabus_lessons (
        id,
        title,
        syllabus_id
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching pending suggestions:", error)
    return []
  }

  return data as LessonEditSuggestion[]
}

/**
 * Approve and implement a suggestion
 */
export async function approveSuggestion(suggestionId: string, reviewNotes?: string) {
  const supabase = await createClient(await cookies())
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get the suggestion
  const { data: suggestion, error: fetchError } = await supabase
    .from('lesson_edit_suggestions')
    .select('*')
    .eq('id', suggestionId)
    .single()

  if (fetchError || !suggestion) {
    return { success: false, error: "Suggestion not found" }
  }

  // Update the actual lesson field
  const updateData: any = {}
  updateData[suggestion.field_name] = suggestion.suggested_value

  const { error: updateError } = await supabase
    .from('syllabus_lessons')
    .update(updateData)
    .eq('id', suggestion.lesson_id)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // Mark suggestion as implemented
  const { error: statusError } = await supabase
    .from('lesson_edit_suggestions')
    .update({
      status: 'implemented',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes
    })
    .eq('id', suggestionId)

  if (statusError) {
    return { success: false, error: statusError.message }
  }

  return { success: true }
}

/**
 * Reject a suggestion
 */
export async function rejectSuggestion(suggestionId: string, reviewNotes?: string) {
  const supabase = await createClient(await cookies())
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from('lesson_edit_suggestions')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes
    })
    .eq('id', suggestionId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get performance standards for a lesson
 */
export async function getPerformanceStandards(lessonId: string) {
  try {
    const supabase = await createClient(await cookies())
    
    const { data, error } = await supabase
      .from('lesson_performance_standards')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index')

    if (error) {
      // Table might not exist yet - return empty array
      return []
    }

    return (data as PerformanceStandard[]) || []
  } catch (error) {
    // Table doesn't exist yet
    return []
  }
}

/**
 * Get maneuver expectations for a lesson
 */
export async function getManeuverExpectations(lessonId: string) {
  try {
    const supabase = await createClient(await cookies())
    
    const { data, error } = await supabase
      .from('lesson_maneuver_expectations')
      .select(`
        *,
        maneuver:maneuvers (
          id,
          name,
          description,
          category,
          primary_acs_task_code
        )
      `)
      .eq('lesson_id', lessonId)
      .order('order_index')

    if (error) {
      // Table might not exist yet - return empty array
      return []
    }

    return (data as ManeuverExpectation[]) || []
  } catch (error) {
    // Table doesn't exist yet
    return []
  }
}

/**
 * Get lesson resources
 */
export async function getLessonResources(lessonId: string) {
  try {
    const supabase = await createClient(await cookies())
    
    const { data, error } = await supabase
      .from('lesson_resources')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index')

    if (error) {
      // Table might not exist yet - return empty array
      return []
    }

    return (data as LessonResource[]) || []
  } catch (error) {
    // Table doesn't exist yet
    return []
  }
}

