"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export type Syllabus = {
  id: string
  title: string
  description: string
  faa_type: string
  version: string
  is_active: boolean
  created_at: string
  updated_at: string
  lesson_count?: number
}

export type SyllabusLesson = {
  id: string
  syllabus_id: string
  title: string
  description: string
  order_index: number
  lesson_type: string
  estimated_hours: number
  created_at: string
  updated_at: string
  maneuvers?: Array<{
    id: string
    name: string
    description: string
    category: string
    faa_reference: string
    is_required: boolean
  }>
}

export type SyllabusFormData = {
  title: string
  description: string
  faa_type: string
  version: string
  is_active: boolean
}

export type SyllabusLessonFormData = {
  title: string
  description: string
  order_index: number
  lesson_type: string
  estimated_hours: number
  syllabus_id: string
}

export async function getSyllabi() {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase.from("syllabi").select("*").order("created_at", { ascending: false })

  if (error || !Array.isArray(data)) {
    console.error("Error fetching syllabi:", error)
    return []
  }

  // Get lesson counts for each syllabus
  const syllabusIds = data.map((syllabus: any) => syllabus.id)
  const { data: lessons, error: lessonError } = await supabase
    .from("syllabus_lessons")
    .select("syllabus_id")
    .in("syllabus_id", syllabusIds)

  if (lessonError) {
    console.error("Error fetching lessons:", lessonError)
  } else if (lessons) {
    // Count lessons per syllabus_id
    const countsMap = new Map<string, number>()
    for (const lesson of lessons as any[]) {
      countsMap.set(lesson.syllabus_id, (countsMap.get(lesson.syllabus_id) || 0) + 1)
    }
    (data as any[]).forEach((syllabus: any) => {
      syllabus.lesson_count = countsMap.get(syllabus.id) || 0
    })
  }

  return data as unknown as Syllabus[]
}

export async function getSyllabusById(id: string) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase.from("syllabi").select("*").eq("id", id as any).single()

  if (error) {
    console.error("Error fetching syllabus:", error)
    return null
  }

  return data as unknown as Syllabus
}

export async function createSyllabus(formData: SyllabusFormData) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase.from("syllabi").insert([
    formData as import("@/types/supabase").Database["public"]["Tables"]["syllabi"]["Insert"]
  ]).select()

  if (error) {
    console.error("Error creating syllabus:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/syllabi")
  return { success: true, data: data?.[0] }
}

export async function updateSyllabus(id: string, formData: SyllabusFormData) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase.from("syllabi")
    .update(formData as import("@/types/supabase").Database["public"]["Tables"]["syllabi"]["Update"])
    .eq("id", id as any)
    .select()

  if (error) {
    console.error("Error updating syllabus:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/syllabi")
  revalidatePath(`/admin/syllabi/${id}`)
  return { success: true, data: data?.[0] }
}

export async function deleteSyllabus(id: string) {
  const supabase = await createClient(await cookies())

  const { error } = await supabase.from("syllabi").delete().eq("id", id as any)

  if (error) {
    console.error("Error deleting syllabus:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/syllabi")
  return { success: true }
}

export async function getSyllabusLessons(syllabusId: string) {
  const supabase = await createClient(await cookies())

  // First get the lessons
  const { data: lessons, error } = await supabase
    .from("syllabus_lessons")
    .select("*")
    .eq("syllabus_id", syllabusId as any)
    .order("order_index", { ascending: true })

  if (error) {
    console.error("Error fetching syllabus lessons:", error)
    return []
  }

  if (!lessons || lessons.length === 0) {
    return []
  }

  // Get lesson IDs for maneuver lookup
  const lessonIds = lessons.map(lesson => lesson.id)

  // Fetch lesson-maneuver relationships
  const { data: lessonManeuverData, error: maneuverError } = await supabase
    .from("lesson_maneuvers")
    .select("lesson_id, is_required, maneuver_id")
    .in("lesson_id", lessonIds)

  if (maneuverError) {
    console.error("Error fetching lesson maneuvers:", maneuverError)
    // Return lessons without maneuvers rather than failing completely
    return lessons.map(lesson => ({
      ...lesson,
      maneuvers: []
    })) as SyllabusLesson[]
  }

  // Get all unique maneuver IDs
  const maneuverIds = lessonManeuverData?.map(lm => lm.maneuver_id) || []
  const uniqueManeuverIds = [...new Set(maneuverIds)]

  // Fetch maneuver details
  const { data: maneuverData, error: maneuverDetailsError } = await supabase
    .from("maneuvers")
    .select("id, name, description, category, faa_reference")
    .in("id", uniqueManeuverIds)

  if (maneuverDetailsError) {
    console.error("Error fetching maneuver details:", maneuverDetailsError)
    return lessons.map(lesson => ({
      ...lesson,
      maneuvers: []
    })) as SyllabusLesson[]
  }

  // Create maneuver lookup map
  const maneuverMap = new Map()
  maneuverData?.forEach(maneuver => {
    maneuverMap.set(maneuver.id, maneuver)
  })

  // Group lesson-maneuver relationships by lesson_id
  const maneuversByLesson = new Map()
  lessonManeuverData?.forEach(lm => {
    if (!maneuversByLesson.has(lm.lesson_id)) {
      maneuversByLesson.set(lm.lesson_id, [])
    }
    
    const maneuverDetails = maneuverMap.get(lm.maneuver_id)
    if (maneuverDetails) {
      maneuversByLesson.get(lm.lesson_id).push({
        ...maneuverDetails,
        is_required: lm.is_required
      })
    }
  })

  // Combine lessons with their maneuvers
  const lessonsWithManeuvers = lessons.map(lesson => ({
    ...lesson,
    maneuvers: maneuversByLesson.get(lesson.id) || []
  }))

  return lessonsWithManeuvers as SyllabusLesson[]
}

export async function getSyllabusLessonById(id: string) {
  const supabase = await createClient(await cookies())

  // Fetch the lesson
  const { data: lesson, error } = await supabase.from("syllabus_lessons").select("*").eq("id", id as any).single()

  if (error || !lesson) {
    console.error("Error fetching syllabus lesson:", error)
    return null
  }

  // Fetch maneuvers for this lesson
  const { data: lessonManeuvers, error: lessonManeuversError } = await supabase
    .from("lesson_maneuvers")
    .select(`
      is_required,
      maneuver:maneuver_id (
        id,
        name,
        description,
        category,
        faa_reference
      )
    `)
    .eq("lesson_id", id)

  let maneuvers: any[] = []
  if (!lessonManeuversError && Array.isArray(lessonManeuvers)) {
    maneuvers = lessonManeuvers
      .filter((lm: any) => lm.maneuver)
      .map((lm: any) => ({ ...lm.maneuver, is_required: lm.is_required }))
  }

  return { ...lesson, maneuvers } as SyllabusLesson
}

export async function createSyllabusLesson(formData: SyllabusLessonFormData) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase.from("syllabus_lessons").insert([
    formData as import("@/types/supabase").Database["public"]["Tables"]["syllabus_lessons"]["Insert"]
  ]).select()

  if (error) {
    console.error("Error creating syllabus lesson:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/syllabi/${formData.syllabus_id}`)
  return { success: true, data: data?.[0] }
}

export async function updateSyllabusLesson(id: string, updates: Partial<SyllabusLessonFormData>) {
  const supabase = await createClient(await cookies());

  // Fetch current lesson
  const { data: current, error: fetchError } = await supabase
    .from("syllabus_lessons")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !current) {
    return { success: false, error: "Lesson not found" };
  }

  // Merge updates with current
  const merged = { ...current, ...updates };

  // Validate required fields (use as any for dynamic access)
  const required = ["title", "description", "order_index", "lesson_type", "estimated_hours", "syllabus_id"];
  for (const field of required) {
    if ((merged as any)[field] == null || (merged as any)[field] === "") {
      return { success: false, error: `Missing required field: ${field}` };
    }
  }

  // Update
  const { data, error } = await supabase
    .from("syllabus_lessons")
    .update(merged)
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating syllabus lesson:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/syllabi/${(merged as any).syllabus_id}`);
  return { success: true, data: data?.[0] };
}

export async function deleteSyllabusLesson(id: string, syllabusId: string) {
  const supabase = await createClient(await cookies())

  const { error } = await supabase.from("syllabus_lessons").delete().eq("id", id as any)

  if (error) {
    console.error("Error deleting syllabus lesson:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/syllabi/${syllabusId}`)
  return { success: true }
}

// Enhanced statistics and analytics functions
export interface SyllabusStatistics {
  totalFlightHours: number
  totalGroundHours: number
  totalLessons: number
  enrolledStudents: number
  completedStudents: number
  activeStudents: number
  averageCompletionTime: number | null
  faaCompliance: {
    requiredFlightHours: number
    actualFlightHours: number
    requiredGroundHours: number
    actualGroundHours: number
    compliancePercentage: number
  }
  lessonDistribution: {
    flight: number
    ground: number
    simulator: number
    checkride: number
  }
  enrollmentTrends: {
    thisMonth: number
    lastMonth: number
    thisYear: number
  }
}

export async function getSyllabusStatistics(syllabusId: string): Promise<SyllabusStatistics> {
  const supabase = await createClient(await cookies())

  // Get syllabus details
  const { data: syllabus } = await supabase
    .from("syllabi")
    .select("*")
    .eq("id", syllabusId as any)
    .single()

  // Get all lessons for this syllabus
  const { data: lessons } = await supabase
    .from("syllabus_lessons")
    .select("*")
    .eq("syllabus_id", syllabusId as any)

  // Get enrollments for this syllabus
  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select(`
      *,
      student:student_id(first_name, last_name)
    `)
    .eq("syllabus_id", syllabusId as any)

  // Calculate lesson statistics
  const totalLessons = lessons?.length || 0
  const totalFlightHours = lessons?.reduce((sum, lesson) => {
    return sum + (lesson.lesson_type === 'Flight' ? lesson.estimated_hours : 0)
  }, 0) || 0
  
  const totalGroundHours = lessons?.reduce((sum, lesson) => {
    return sum + (lesson.lesson_type === 'Ground' ? lesson.estimated_hours : 0)
  }, 0) || 0

  // Calculate enrollment statistics
  const enrolledStudents = enrollments?.length || 0
  const completedStudents = enrollments?.filter(e => e.status === 'completed').length || 0
  const activeStudents = enrollments?.filter(e => e.status === 'active').length || 0

  // Calculate average completion time
  const completedEnrollments = enrollments?.filter(e => e.status === 'completed' && e.completion_date) || []
  let averageCompletionTime: number | null = null
  
  if (completedEnrollments.length > 0) {
    const totalDays = completedEnrollments.reduce((sum, enrollment) => {
      if (enrollment.start_date && enrollment.completion_date) {
        const startDate = new Date(enrollment.start_date)
        const endDate = new Date(enrollment.completion_date)
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return sum + diffDays
      }
      return sum
    }, 0)
    averageCompletionTime = Math.round(totalDays / completedEnrollments.length)
  }

  // Calculate lesson distribution
  const lessonDistribution = {
    flight: lessons?.filter(l => l.lesson_type === 'Flight').length || 0,
    ground: lessons?.filter(l => l.lesson_type === 'Ground').length || 0,
    simulator: lessons?.filter(l => l.lesson_type === 'Simulator').length || 0,
    checkride: lessons?.filter(l => l.lesson_type === 'Checkride').length || 0,
  }

  // Calculate enrollment trends
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thisYear = new Date(now.getFullYear(), 0, 1)

  const enrollmentTrends = {
    thisMonth: enrollments?.filter(e => e.created_at && new Date(e.created_at) >= thisMonth).length || 0,
    lastMonth: enrollments?.filter(e => {
      if (!e.created_at) return false;
      const created = new Date(e.created_at)
      return created >= lastMonth && created < thisMonth
    }).length || 0,
    thisYear: enrollments?.filter(e => e.created_at && new Date(e.created_at) >= thisYear).length || 0,
  }

  // FAA compliance (basic calculation - can be enhanced based on specific requirements)
  const faaCompliance = {
    requiredFlightHours: getFAARequiredHours(syllabus?.faa_type || ''),
    actualFlightHours: totalFlightHours,
    requiredGroundHours: getFAARequiredGroundHours(syllabus?.faa_type || ''),
    actualGroundHours: totalGroundHours,
    compliancePercentage: 0
  }
  
  const totalRequired = faaCompliance.requiredFlightHours + faaCompliance.requiredGroundHours
  const totalActual = faaCompliance.actualFlightHours + faaCompliance.actualGroundHours
  faaCompliance.compliancePercentage = totalRequired > 0 ? Math.round((totalActual / totalRequired) * 100) : 100

  return {
    totalFlightHours,
    totalGroundHours,
    totalLessons,
    enrolledStudents,
    completedStudents,
    activeStudents,
    averageCompletionTime,
    faaCompliance,
    lessonDistribution,
    enrollmentTrends
  }
}

// Helper function to get FAA required hours based on certificate type
function getFAARequiredHours(faaType: string): number {
  const typeMap: Record<string, number> = {
    'Private Pilot (PPL)': 40,
    'Commercial Pilot (CPL)': 250,
    'Instrument Rating (IRA)': 40,
    'Flight Instructor (CFI)': 25,
    'Multi-Engine': 10,
    'ATP': 1500
  }
  return typeMap[faaType] || 40
}

// Helper function to get FAA required ground hours
function getFAARequiredGroundHours(faaType: string): number {
  const typeMap: Record<string, number> = {
    'Private Pilot (PPL)': 25,
    'Commercial Pilot (CPL)': 35,
    'Instrument Rating (IRA)': 15,
    'Flight Instructor (CFI)': 40,
    'Multi-Engine': 5,
    'ATP': 50
  }
  return typeMap[faaType] || 25
}

export async function updateLessonOrder(syllabusId: string, lessonUpdates: { id: string; order_index: number }[]) {
  const supabase = await createClient(await cookies())

  // Update each lesson's order_index
  const updates = lessonUpdates.map(update => 
    supabase
      .from("syllabus_lessons")
      .update({ order_index: update.order_index })
      .eq("id", update.id as any)
  )

  const results = await Promise.all(updates)
  
  // Check for errors
  const errors = results.filter(result => result.error)
  if (errors.length > 0) {
    console.error("Error updating lesson order:", errors)
    return { success: false, error: "Failed to update lesson order" }
  }

  revalidatePath(`/admin/syllabi/${syllabusId}`)
  return { success: true }
}

export async function duplicateLesson(lessonId: string, syllabusId: string) {
  const supabase = await createClient(await cookies())

  // Get the original lesson
  const { data: originalLesson, error: fetchError } = await supabase
    .from("syllabus_lessons")
    .select("*")
    .eq("id", lessonId as any)
    .single()

  if (fetchError || !originalLesson) {
    return { success: false, error: "Lesson not found" }
  }

  // Get the highest order_index for this syllabus
  const { data: lessons } = await supabase
    .from("syllabus_lessons")
    .select("order_index")
    .eq("syllabus_id", syllabusId as any)
    .order("order_index", { ascending: false })
    .limit(1)

  const newOrderIndex = (lessons?.[0]?.order_index || 0) + 1

  // Create the duplicate lesson (omit id, created_at, updated_at)
  const { id, created_at, updated_at, ...rest } = originalLesson;
  const duplicateData = {
    ...rest,
    title: `${originalLesson.title} (Copy)`,
    order_index: newOrderIndex,
    syllabus_id: syllabusId
  }

  const { data: newLesson, error: createError } = await supabase
    .from("syllabus_lessons")
    .insert([duplicateData as any])
    .select()
    .single()

  if (createError) {
    return { success: false, error: createError.message }
  }

  // Copy lesson maneuvers if they exist
  const { data: lessonManeuvers } = await supabase
    .from("lesson_maneuvers")
    .select("*")
    .eq("lesson_id", lessonId as any)

  if (lessonManeuvers && lessonManeuvers.length > 0) {
    const maneuverCopies = lessonManeuvers.map(lm => ({
      lesson_id: newLesson.id,
      maneuver_id: lm.maneuver_id,
      is_required: lm.is_required,
      instructor_notes: (lm as any).instructor_notes // type assertion for property not in type
    }))

    await supabase.from("lesson_maneuvers").insert(maneuverCopies as any)
  }

  revalidatePath(`/admin/syllabi/${syllabusId}`)
  return { success: true, data: newLesson }
}

export async function toggleLessonActive(lessonId: string, syllabusId: string, isActive: boolean) {
  const supabase = await createClient(await cookies())

  const { error } = await supabase
    .from("syllabus_lessons")
    .update({ is_active: isActive } as any)
    .eq("id", lessonId as any)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/syllabi/${syllabusId}`)
  return { success: true }
}
