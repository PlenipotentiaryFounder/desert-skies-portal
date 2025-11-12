"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// =====================================================================
// TYPE DEFINITIONS
// =====================================================================

export interface EnhancedSyllabus {
  id: string
  name: string
  description: string | null
  total_hours: number
  requirements: any
  faa_type: string | null
  version: string
  acs_document_id: string | null
  target_certificate: string | null
  far_references: FARReference[]
  experience_requirements: ExperienceRequirements
  knowledge_requirements: KnowledgeRequirement[]
  proficiency_requirements: ProficiencyRequirement[]
  is_active: boolean
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  
  // Computed fields
  lesson_count?: number
  enrollment_count?: number
  active_enrollments?: number
  total_estimated_hours?: number
  acs_document?: ACSDocument
}

export interface FARReference {
  part: string // '61', '91', etc.
  subpart?: string // 'E', 'F', etc.
  sections: string[] // ['61.103', '61.105', '61.107']
  description?: string
}

export interface ExperienceRequirements {
  flight_hours: number
  dual_received: number
  solo: number
  cross_country: number
  night: number
  instrument: number
  [key: string]: number
}

export interface KnowledgeRequirement {
  area: string
  topics: string[]
  minimum_score?: number
}

export interface ProficiencyRequirement {
  acs_task_id: string
  minimum_level: number // 1-4
  description: string
}

export interface EnhancedLesson {
  id: string
  syllabus_id: string
  title: string
  description: string
  order_index: number
  lesson_type: 'Ground' | 'Flight' | 'Simulator' | 'Solo' | 'Checkride'
  estimated_hours: number
  objective: string | null
  performance_standards: string | null
  completion_standards: CompletionStandard[]
  pre_flight_briefing: string | null
  post_flight_briefing: string | null
  notes: string | null
  instructor_notes: string | null
  student_prep_materials: PrepMaterial[]
  email_subject: string | null
  email_body: string | null
  is_required: boolean
  prerequisite_lesson_ids: string[] | null
  minimum_proficiency_required: number
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  
  // Related data
  maneuvers?: Maneuver[]
  acs_standards?: ACSStandard[]
  far_references?: LessonFARReference[]
  resources?: LessonResource[]
  maneuver_count?: number
  acs_task_count?: number
  resource_count?: number
}

export interface CompletionStandard {
  type: 'maneuver_proficiency' | 'knowledge_check' | 'instructor_sign_off' | 'time_requirement'
  description: string
  required_value?: number | string
}

export interface PrepMaterial {
  type: 'video' | 'document' | 'reading' | 'practice'
  title: string
  url?: string
  description?: string
  estimated_time?: number // minutes
}

export interface Maneuver {
  id: string
  name: string
  description: string | null
  category: string
  faa_reference: string | null
  is_required: boolean
}

export interface ACSStandard {
  id: string
  acs_task_id: string
  is_primary_focus: boolean
  proficiency_target: number
  instructor_notes: string | null
  // From acs_tasks join
  task_code?: string
  task_title?: string
  task_objective?: string
  knowledge_elements?: string[]
  risk_management_elements?: string[]
  skill_elements?: string[]
  area_code?: string
  area_title?: string
}

export interface LessonFARReference {
  id: string
  far_part: string
  far_section: string
  far_subsection: string | null
  description: string | null
  relevance: string | null
}

export interface LessonResource {
  id: string
  lesson_id: string
  title: string
  description: string | null
  resource_type: 'video' | 'document' | 'faa_reference' | 'external_link' | 'pdf' | 'chart' | 'checklist'
  url: string
  is_required: boolean
  order_index: number
  estimated_study_time: number | null
  is_verified: boolean
  verified_at: string | null
  verified_by: string | null
  category: string | null
}

export interface StudentLessonProgress {
  id: string
  student_id: string
  enrollment_id: string
  lesson_id: string
  status: 'not_started' | 'scheduled' | 'in_progress' | 'completed' | 'mastered'
  attempts: number
  completed_sessions: number
  total_flight_hours: number
  average_maneuver_score: number | null
  proficiency_level: number | null
  first_attempted_at: string | null
  completed_at: string | null
  mastered_at: string | null
  instructor_notes: string | null
  student_notes: string | null
  created_at: string
  updated_at: string
}

export interface ACSDocument {
  id: string
  title: string
  certificate_type: string
  category_class: string
  faa_document_number: string | null
  effective_date: string | null
  version: string | null
  pdf_url: string | null
  is_current: boolean
}

// =====================================================================
// SYLLABUS CRUD OPERATIONS
// =====================================================================

/**
 * Get all syllabi with enhanced details
 */
export async function getEnhancedSyllabi(includeInactive = false): Promise<EnhancedSyllabus[]> {
  const supabase = await createClient(await cookies())
  
  let query = supabase
    .from('syllabi')
    .select(`
      *,
      acs_documents (
        id,
        title,
        certificate_type,
        category_class,
        faa_document_number,
        version
      )
    `)
    .order('created_at', { ascending: false })
  
  if (!includeInactive) {
    query = query.eq('is_active', true)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching syllabi:', error)
    return []
  }
  
  // Get lesson counts and enrollment stats
  const syllabusIds = data.map(s => s.id)
  
  const { data: lessons } = await supabase
    .from('syllabus_lessons')
    .select('syllabus_id, estimated_hours')
    .in('syllabus_id', syllabusIds)
    .eq('is_active', true)
  
  const { data: enrollments } = await supabase
    .from('student_enrollments')
    .select('syllabus_id, status')
    .in('syllabus_id', syllabusIds)
  
  // Build counts map
  const countsMap = new Map<string, {
    lesson_count: number
    total_estimated_hours: number
    enrollment_count: number
    active_enrollments: number
  }>()
  
  syllabusIds.forEach(id => {
    countsMap.set(id, {
      lesson_count: 0,
      total_estimated_hours: 0,
      enrollment_count: 0,
      active_enrollments: 0
    })
  })
  
  lessons?.forEach(lesson => {
    const counts = countsMap.get(lesson.syllabus_id)
    if (counts) {
      counts.lesson_count++
      counts.total_estimated_hours += lesson.estimated_hours || 0
    }
  })
  
  enrollments?.forEach(enrollment => {
    const counts = countsMap.get(enrollment.syllabus_id)
    if (counts) {
      counts.enrollment_count++
      if (enrollment.status === 'active') {
        counts.active_enrollments++
      }
    }
  })
  
  // Merge counts into syllabus data
  return data.map(syllabus => ({
    ...syllabus,
    ...countsMap.get(syllabus.id),
    acs_document: syllabus.acs_documents ? syllabus.acs_documents : undefined
  })) as EnhancedSyllabus[]
}

/**
 * Get a single syllabus by ID with full details
 */
export async function getEnhancedSyllabusById(id: string): Promise<EnhancedSyllabus | null> {
  const supabase = await createClient(await cookies())
  
  const { data, error } = await supabase
    .from('syllabi')
    .select(`
      *,
      acs_documents (
        id,
        title,
        certificate_type,
        category_class,
        faa_document_number,
        version,
        pdf_url
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching syllabus:', error)
    return null
  }
  
  // Get lesson count and stats
  const { data: lessons } = await supabase
    .from('syllabus_lessons')
    .select('estimated_hours')
    .eq('syllabus_id', id)
    .eq('is_active', true)
  
  const { data: enrollments } = await supabase
    .from('student_enrollments')
    .select('status')
    .eq('syllabus_id', id)
  
  return {
    ...data,
    lesson_count: lessons?.length || 0,
    total_estimated_hours: lessons?.reduce((sum, l) => sum + (l.estimated_hours || 0), 0) || 0,
    enrollment_count: enrollments?.length || 0,
    active_enrollments: enrollments?.filter(e => e.status === 'active').length || 0,
    acs_document: data.acs_documents
  } as EnhancedSyllabus
}

/**
 * Create a new syllabus
 */
export async function createEnhancedSyllabus(formData: Partial<EnhancedSyllabus>) {
  const supabase = await createClient(await cookies())
  
  const { data, error } = await supabase
    .from('syllabi')
    .insert([{
      name: formData.name,
      description: formData.description,
      total_hours: formData.total_hours || 40,
      faa_type: formData.faa_type,
      version: formData.version || '1.0',
      acs_document_id: formData.acs_document_id,
      target_certificate: formData.target_certificate,
      far_references: formData.far_references || [],
      experience_requirements: formData.experience_requirements || {},
      knowledge_requirements: formData.knowledge_requirements || [],
      proficiency_requirements: formData.proficiency_requirements || [],
      is_active: formData.is_active ?? true,
      created_by: (await supabase.auth.getUser()).data.user?.id
    }])
    .select()
  
  if (error) {
    console.error('Error creating syllabus:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/admin/syllabi')
  return { success: true, data: data[0] }
}

/**
 * Update an existing syllabus
 */
export async function updateEnhancedSyllabus(id: string, formData: Partial<EnhancedSyllabus>) {
  const supabase = await createClient(await cookies())
  
  const { data, error } = await supabase
    .from('syllabi')
    .update({
      name: formData.name,
      description: formData.description,
      total_hours: formData.total_hours,
      faa_type: formData.faa_type,
      version: formData.version,
      acs_document_id: formData.acs_document_id,
      target_certificate: formData.target_certificate,
      far_references: formData.far_references,
      experience_requirements: formData.experience_requirements,
      knowledge_requirements: formData.knowledge_requirements,
      proficiency_requirements: formData.proficiency_requirements,
      is_active: formData.is_active,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
  
  if (error) {
    console.error('Error updating syllabus:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/admin/syllabi')
  revalidatePath(`/admin/syllabi/${id}`)
  return { success: true, data: data[0] }
}

// =====================================================================
// LESSON CRUD OPERATIONS
// =====================================================================

/**
 * Get all lessons for a syllabus with full details
 */
export async function getEnhancedLessons(syllabusId: string): Promise<EnhancedLesson[]> {
  const supabase = await createClient(await cookies())
  
  const { data: lessons, error } = await supabase
    .from('syllabus_lessons')
    .select('*')
    .eq('syllabus_id', syllabusId)
    .eq('is_active', true)
    .order('order_index', { ascending: true })
  
  if (error || !lessons) {
    console.error('Error fetching lessons:', error)
    return []
  }
  
  // Get related data for all lessons
  const lessonIds = lessons.map(l => l.id)
  
  // Get maneuvers
  const { data: lessonManeuvers } = await supabase
    .from('lesson_maneuvers')
    .select(`
      lesson_id,
      is_required,
      maneuvers (
        id,
        name,
        description,
        category,
        faa_reference
      )
    `)
    .in('lesson_id', lessonIds)
  
  // Get ACS standards
  const { data: acsStandards } = await supabase
    .from('lesson_acs_standards')
    .select(`
      *,
      acs_tasks (
        code,
        full_code,
        title,
        objective,
        knowledge_elements,
        risk_management_elements,
        skill_elements,
        acs_areas (
          code,
          title
        )
      )
    `)
    .in('lesson_id', lessonIds)
  
  // Get FAR references
  const { data: farRefs } = await supabase
    .from('lesson_far_references')
    .select('*')
    .in('lesson_id', lessonIds)
  
  // Get resources
  const { data: resources } = await supabase
    .from('lesson_resources')
    .select('*')
    .in('lesson_id', lessonIds)
    .order('order_index', { ascending: true })
  
  // Build lookup maps
  const maneuversMap = new Map<string, Maneuver[]>()
  const acsMap = new Map<string, ACSStandard[]>()
  const farMap = new Map<string, LessonFARReference[]>()
  const resourcesMap = new Map<string, LessonResource[]>()
  
  lessonManeuvers?.forEach((lm: any) => {
    if (!maneuversMap.has(lm.lesson_id)) {
      maneuversMap.set(lm.lesson_id, [])
    }
    if (lm.maneuvers) {
      maneuversMap.get(lm.lesson_id)!.push({
        ...lm.maneuvers,
        is_required: lm.is_required
      })
    }
  })
  
  acsStandards?.forEach((acs: any) => {
    if (!acsMap.has(acs.lesson_id)) {
      acsMap.set(acs.lesson_id, [])
    }
    acsMap.get(acs.lesson_id)!.push({
      ...acs,
      task_code: acs.acs_tasks?.full_code,
      task_title: acs.acs_tasks?.title,
      task_objective: acs.acs_tasks?.objective,
      knowledge_elements: acs.acs_tasks?.knowledge_elements,
      risk_management_elements: acs.acs_tasks?.risk_management_elements,
      skill_elements: acs.acs_tasks?.skill_elements,
      area_code: acs.acs_tasks?.acs_areas?.code,
      area_title: acs.acs_tasks?.acs_areas?.title
    })
  })
  
  farRefs?.forEach(far => {
    if (!farMap.has(far.lesson_id)) {
      farMap.set(far.lesson_id, [])
    }
    farMap.get(far.lesson_id)!.push(far)
  })
  
  resources?.forEach(resource => {
    if (!resourcesMap.has(resource.lesson_id)) {
      resourcesMap.set(resource.lesson_id, [])
    }
    resourcesMap.get(resource.lesson_id)!.push(resource)
  })
  
  // Merge all data
  return lessons.map(lesson => ({
    ...lesson,
    maneuvers: maneuversMap.get(lesson.id) || [],
    acs_standards: acsMap.get(lesson.id) || [],
    far_references: farMap.get(lesson.id) || [],
    resources: resourcesMap.get(lesson.id) || [],
    maneuver_count: maneuversMap.get(lesson.id)?.length || 0,
    acs_task_count: acsMap.get(lesson.id)?.length || 0,
    resource_count: resourcesMap.get(lesson.id)?.length || 0
  })) as EnhancedLesson[]
}

/**
 * Get a single lesson by ID with full details
 */
export async function getEnhancedLessonById(id: string): Promise<EnhancedLesson | null> {
  const supabase = await createClient(await cookies())
  
  const { data: lesson, error } = await supabase
    .from('syllabus_lessons')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error || !lesson) {
    console.error('Error fetching lesson:', error)
    return null
  }
  
  // Get all related data
  const [maneuvers, acsStandards, farRefs, resources] = await Promise.all([
    // Maneuvers
    supabase
      .from('lesson_maneuvers')
      .select('is_required, maneuvers (*)')
      .eq('lesson_id', id)
      .then(({ data }) => data || []),
    
    // ACS Standards
    supabase
      .from('lesson_acs_standards')
      .select(`
        *,
        acs_tasks (
          code,
          full_code,
          title,
          objective,
          knowledge_elements,
          risk_management_elements,
          skill_elements,
          acs_areas (code, title)
        )
      `)
      .eq('lesson_id', id)
      .then(({ data }) => data || []),
    
    // FAR References
    supabase
      .from('lesson_far_references')
      .select('*')
      .eq('lesson_id', id)
      .then(({ data }) => data || []),
    
    // Resources
    supabase
      .from('lesson_resources')
      .select('*')
      .eq('lesson_id', id)
      .order('order_index', { ascending: true })
      .then(({ data }) => data || [])
  ])
  
  return {
    ...lesson,
    maneuvers: maneuvers.map((m: any) => ({ ...m.maneuvers, is_required: m.is_required })),
    acs_standards: acsStandards.map((acs: any) => ({
      ...acs,
      task_code: acs.acs_tasks?.full_code,
      task_title: acs.acs_tasks?.title,
      task_objective: acs.acs_tasks?.objective,
      knowledge_elements: acs.acs_tasks?.knowledge_elements,
      risk_management_elements: acs.acs_tasks?.risk_management_elements,
      skill_elements: acs.acs_tasks?.skill_elements,
      area_code: acs.acs_tasks?.acs_areas?.code,
      area_title: acs.acs_tasks?.acs_areas?.title
    })),
    far_references: farRefs,
    resources: resources,
    maneuver_count: maneuvers.length,
    acs_task_count: acsStandards.length,
    resource_count: resources.length
  } as EnhancedLesson
}

/**
 * Create a new lesson
 */
export async function createEnhancedLesson(formData: Partial<EnhancedLesson>) {
  const supabase = await createClient(await cookies())
  
  const { data, error } = await supabase
    .from('syllabus_lessons')
    .insert([{
      syllabus_id: formData.syllabus_id,
      title: formData.title,
      description: formData.description,
      order_index: formData.order_index || 0,
      lesson_type: formData.lesson_type,
      estimated_hours: formData.estimated_hours || 1.0,
      objective: formData.objective,
      performance_standards: formData.performance_standards,
      completion_standards: formData.completion_standards || [],
      pre_flight_briefing: formData.pre_flight_briefing,
      post_flight_briefing: formData.post_flight_briefing,
      notes: formData.notes,
      instructor_notes: formData.instructor_notes,
      student_prep_materials: formData.student_prep_materials || [],
      email_subject: formData.email_subject,
      email_body: formData.email_body,
      is_required: formData.is_required ?? true,
      prerequisite_lesson_ids: formData.prerequisite_lesson_ids || [],
      minimum_proficiency_required: formData.minimum_proficiency_required || 3,
      is_active: formData.is_active ?? true,
      created_by: (await supabase.auth.getUser()).data.user?.id
    }])
    .select()
  
  if (error) {
    console.error('Error creating lesson:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath(`/admin/syllabi/${formData.syllabus_id}`)
  return { success: true, data: data[0] }
}

/**
 * Update an existing lesson
 */
export async function updateEnhancedLesson(id: string, formData: Partial<EnhancedLesson>) {
  const supabase = await createClient(await cookies())
  
  const { data, error } = await supabase
    .from('syllabus_lessons')
    .update({
      title: formData.title,
      description: formData.description,
      order_index: formData.order_index,
      lesson_type: formData.lesson_type,
      estimated_hours: formData.estimated_hours,
      objective: formData.objective,
      performance_standards: formData.performance_standards,
      completion_standards: formData.completion_standards,
      pre_flight_briefing: formData.pre_flight_briefing,
      post_flight_briefing: formData.post_flight_briefing,
      notes: formData.notes,
      instructor_notes: formData.instructor_notes,
      student_prep_materials: formData.student_prep_materials,
      email_subject: formData.email_subject,
      email_body: formData.email_body,
      is_required: formData.is_required,
      prerequisite_lesson_ids: formData.prerequisite_lesson_ids,
      minimum_proficiency_required: formData.minimum_proficiency_required,
      is_active: formData.is_active,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
  
  if (error) {
    console.error('Error updating lesson:', error)
    return { success: false, error: error.message }
  }
  
  // Get the lesson's syllabus_id for revalidation
  const { data: lesson } = await supabase
    .from('syllabus_lessons')
    .select('syllabus_id')
    .eq('id', id)
    .single()
  
  if (lesson) {
    revalidatePath(`/admin/syllabi/${lesson.syllabus_id}`)
  }
  
  return { success: true, data: data[0] }
}

// =====================================================================
// LESSON RESOURCE OPERATIONS
// =====================================================================

/**
 * Add a resource to a lesson
 */
export async function addLessonResource(lessonId: string, resource: Partial<LessonResource>) {
  const supabase = await createClient(await cookies())
  
  const { data, error } = await supabase
    .from('lesson_resources')
    .insert([{
      lesson_id: lessonId,
      title: resource.title,
      description: resource.description,
      resource_type: resource.resource_type,
      url: resource.url,
      is_required: resource.is_required || false,
      order_index: resource.order_index || 0,
      estimated_study_time: resource.estimated_study_time,
      category: resource.category
    }])
    .select()
  
  if (error) {
    console.error('Error adding resource:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true, data: data[0] }
}

/**
 * Delete a lesson resource
 */
export async function deleteLessonResource(resourceId: string) {
  const supabase = await createClient(await cookies())
  
  const { error } = await supabase
    .from('lesson_resources')
    .delete()
    .eq('id', resourceId)
  
  if (error) {
    console.error('Error deleting resource:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

// =====================================================================
// ACS STANDARDS OPERATIONS
// =====================================================================

/**
 * Link an ACS standard to a lesson
 */
export async function linkACSStandardToLesson(
  lessonId: string,
  acsTaskId: string,
  isPrimaryFocus = false,
  proficiencyTarget = 3,
  instructorNotes?: string
) {
  const supabase = await createClient(await cookies())
  
  const { data, error } = await supabase
    .from('lesson_acs_standards')
    .insert([{
      lesson_id: lessonId,
      acs_task_id: acsTaskId,
      is_primary_focus: isPrimaryFocus,
      proficiency_target: proficiencyTarget,
      instructor_notes: instructorNotes
    }])
    .select()
  
  if (error) {
    console.error('Error linking ACS standard:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true, data: data[0] }
}

/**
 * Remove an ACS standard from a lesson
 */
export async function unlinkACSStandardFromLesson(lessonId: string, acsTaskId: string) {
  const supabase = await createClient(await cookies())
  
  const { error } = await supabase
    .from('lesson_acs_standards')
    .delete()
    .eq('lesson_id', lessonId)
    .eq('acs_task_id', acsTaskId)
  
  if (error) {
    console.error('Error unlinking ACS standard:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

// =====================================================================
// FAR REFERENCE OPERATIONS
// =====================================================================

/**
 * Add a FAR reference to a lesson
 */
export async function addFARReferenceToLesson(
  lessonId: string,
  farPart: string,
  farSection: string,
  farSubsection?: string,
  description?: string,
  relevance?: string
) {
  const supabase = await createClient(await cookies())
  
  const { data, error } = await supabase
    .from('lesson_far_references')
    .insert([{
      lesson_id: lessonId,
      far_part: farPart,
      far_section: farSection,
      far_subsection: farSubsection,
      description,
      relevance
    }])
    .select()
  
  if (error) {
    console.error('Error adding FAR reference:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true, data: data[0] }
}

/**
 * Remove a FAR reference from a lesson
 */
export async function removeFARReferenceFromLesson(referenceId: string) {
  const supabase = await createClient(await cookies())
  
  const { error } = await supabase
    .from('lesson_far_references')
    .delete()
    .eq('id', referenceId)
  
  if (error) {
    console.error('Error removing FAR reference:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

// =====================================================================
// STUDENT PROGRESS OPERATIONS
// =====================================================================

/**
 * Get student progress for a specific lesson
 */
export async function getStudentLessonProgress(
  studentId: string,
  lessonId: string,
  enrollmentId: string
): Promise<StudentLessonProgress | null> {
  const supabase = await createClient(await cookies())
  
  const { data, error } = await supabase
    .from('student_lesson_progress')
    .select('*')
    .eq('student_id', studentId)
    .eq('lesson_id', lessonId)
    .eq('enrollment_id', enrollmentId)
    .single()
  
  if (error) {
    // Not found is okay, return null
    return null
  }
  
  return data as StudentLessonProgress
}

/**
 * Update or create student progress for a lesson
 */
export async function updateStudentLessonProgress(
  studentId: string,
  lessonId: string,
  enrollmentId: string,
  progress: Partial<StudentLessonProgress>
) {
  const supabase = await createClient(await cookies())
  
  const { data, error } = await supabase
    .from('student_lesson_progress')
    .upsert({
      student_id: studentId,
      lesson_id: lessonId,
      enrollment_id: enrollmentId,
      ...progress,
      updated_at: new Date().toISOString()
    })
    .select()
  
  if (error) {
    console.error('Error updating student progress:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true, data: data[0] }
}

/**
 * Get all lesson progress for a student enrollment
 */
export async function getStudentSyllabusProgress(
  studentId: string,
  enrollmentId: string
): Promise<StudentLessonProgress[]> {
  const supabase = await createClient(await cookies())
  
  const { data, error } = await supabase
    .from('student_lesson_progress')
    .select('*')
    .eq('student_id', studentId)
    .eq('enrollment_id', enrollmentId)
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching student progress:', error)
    return []
  }
  
  return data as StudentLessonProgress[]
}

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Reorder lessons in a syllabus
 */
export async function reorderLessons(syllabusId: string, lessonOrders: { id: string; order_index: number }[]) {
  const supabase = await createClient(await cookies())
  
  const updates = lessonOrders.map(({ id, order_index }) =>
    supabase
      .from('syllabus_lessons')
      .update({ order_index, updated_at: new Date().toISOString() })
      .eq('id', id)
  )
  
  const results = await Promise.all(updates)
  const errors = results.filter(r => r.error)
  
  if (errors.length > 0) {
    console.error('Error reordering lessons:', errors)
    return { success: false, error: 'Failed to reorder lessons' }
  }
  
  revalidatePath(`/admin/syllabi/${syllabusId}`)
  return { success: true }
}

/**
 * Duplicate a lesson
 */
export async function duplicateLesson(lessonId: string) {
  const lesson = await getEnhancedLessonById(lessonId)
  if (!lesson) {
    return { success: false, error: 'Lesson not found' }
  }
  
  // Create new lesson with "(Copy)" suffix
  const newLessonResult = await createEnhancedLesson({
    ...lesson,
    title: `${lesson.title} (Copy)`,
    order_index: lesson.order_index + 1
  })
  
  if (!newLessonResult.success || !newLessonResult.data) {
    return newLessonResult
  }
  
  const newLessonId = newLessonResult.data.id
  
  // Copy resources, ACS standards, and FAR references
  const supabase = await createClient(await cookies())
  
  await Promise.all([
    // Copy resources
    ...lesson.resources!.map(r => 
      addLessonResource(newLessonId, r)
    ),
    // Copy ACS standards
    ...lesson.acs_standards!.map(acs =>
      linkACSStandardToLesson(
        newLessonId,
        acs.acs_task_id,
        acs.is_primary_focus,
        acs.proficiency_target,
        acs.instructor_notes || undefined
      )
    ),
    // Copy FAR references
    ...lesson.far_references!.map(far =>
      addFARReferenceToLesson(
        newLessonId,
        far.far_part,
        far.far_section,
        far.far_subsection || undefined,
        far.description || undefined,
        far.relevance || undefined
      )
    )
  ])
  
  revalidatePath(`/admin/syllabi/${lesson.syllabus_id}`)
  return { success: true, data: newLessonResult.data }
}

/**
 * Get ACS documents for selection
 */
export async function getACSDocuments(): Promise<ACSDocument[]> {
  const supabase = await createClient(await cookies())
  
  const { data, error } = await supabase
    .from('acs_documents')
    .select('*')
    .eq('is_current', true)
    .order('certificate_type', { ascending: true })
  
  if (error) {
    console.error('Error fetching ACS documents:', error)
    return []
  }
  
  return data as ACSDocument[]
}

/**
 * Search ACS tasks for linking to lessons
 */
export async function searchACSTasks(query: string, documentId?: string): Promise<any[]> {
  const supabase = await createClient(await cookies())
  
  let dbQuery = supabase
    .from('acs_tasks')
    .select(`
      *,
      acs_areas (
        id,
        code,
        title,
        document_id
      )
    `)
  
  if (documentId) {
    dbQuery = dbQuery.eq('acs_areas.document_id', documentId)
  }
  
  // Simple text search on title and code
  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,full_code.ilike.%${query}%`)
  }
  
  const { data, error } = await dbQuery.limit(20)
  
  if (error) {
    console.error('Error searching ACS tasks:', error)
    return []
  }
  
  return data || []
}

