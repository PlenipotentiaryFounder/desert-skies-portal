"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
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
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from("syllabi").select("*").order("created_at", { ascending: false })

  if (error || !Array.isArray(data)) {
    console.error("Error fetching syllabi:", error)
    return []
  }

  // Get lesson counts for each syllabus
  const syllabusIds = data.map((syllabus: any) => syllabus.id)
  const { data: lessonCounts, error: lessonError } = await supabase
    .from("syllabus_lessons")
    .select("syllabus_id, count")
    .in("syllabus_id", syllabusIds)
    // @ts-expect-error Supabase type system does not type .group but it works
    .group("syllabus_id")

  if (lessonError) {
    console.error("Error fetching lesson counts:", lessonError)
  } else if (lessonCounts) {
    // @ts-expect-error Map false positive
    const countsMap = new Map((lessonCounts as any[]).map((item: any) => [item.syllabus_id, Number.parseInt(item.count)]))
    (data as any[]).forEach((syllabus: any) => {
      syllabus.lesson_count = countsMap.get(syllabus.id) || 0
    })
  }

  return data as unknown as Syllabus[]
}

export async function getSyllabusById(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from("syllabi").select("*").eq("id", id as any).single()

  if (error) {
    console.error("Error fetching syllabus:", error)
    return null
  }

  return data as unknown as Syllabus
}

export async function createSyllabus(formData: SyllabusFormData) {
  const supabase = await createServerSupabaseClient()

  // @ts-expect-error Supabase type system is too strict for insert
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
  const supabase = await createServerSupabaseClient()

  // @ts-expect-error Supabase type system is too strict for update
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
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from("syllabi").delete().eq("id", id as any)

  if (error) {
    console.error("Error deleting syllabus:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/syllabi")
  return { success: true }
}

export async function getSyllabusLessons(syllabusId: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("syllabus_lessons")
    .select("*")
    .eq("syllabus_id", syllabusId as any)
    .order("order_index", { ascending: true })

  if (error) {
    console.error("Error fetching syllabus lessons:", error)
    return []
  }

  return data as unknown as SyllabusLesson[]
}

export async function getSyllabusLessonById(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from("syllabus_lessons").select("*").eq("id", id as any).single()

  if (error) {
    console.error("Error fetching syllabus lesson:", error)
    return null
  }

  return data as unknown as SyllabusLesson
}

export async function createSyllabusLesson(formData: SyllabusLessonFormData) {
  const supabase = await createServerSupabaseClient()

  // @ts-expect-error Supabase type system is too strict for insert
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

export async function updateSyllabusLesson(id: string, formData: SyllabusLessonFormData) {
  const supabase = await createServerSupabaseClient()

  // @ts-expect-error Supabase type system is too strict for update
  const { data, error } = await supabase.from("syllabus_lessons")
    .update(formData as import("@/types/supabase").Database["public"]["Tables"]["syllabus_lessons"]["Update"])
    .eq("id", id as any)
    .select()

  if (error) {
    console.error("Error updating syllabus lesson:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/syllabi/${formData.syllabus_id}`)
  return { success: true, data: data?.[0] }
}

export async function deleteSyllabusLesson(id: string, syllabusId: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from("syllabus_lessons").delete().eq("id", id as any)

  if (error) {
    console.error("Error deleting syllabus lesson:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/syllabi/${syllabusId}`)
  return { success: true }
}
