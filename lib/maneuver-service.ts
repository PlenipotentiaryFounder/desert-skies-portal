"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export type Maneuver = {
  id: string
  created_at: string
  updated_at: string
  name: string
  description: string
  faa_reference: string
  category: string
}

export type ManeuverFormData = {
  name: string
  description: string
  faa_reference: string
  category: string
}

export async function getManeuvers() {
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

export async function getManeuverById(id: string) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase.from("maneuvers").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching maneuver:", error)
    return null
  }

  return data as Maneuver
}

export async function createManeuver(formData: ManeuverFormData) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase.from("maneuvers").insert([formData]).select()

  if (error) {
    console.error("Error creating maneuver:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/maneuvers")
  return { success: true, data: data[0] }
}

export async function updateManeuver(id: string, formData: ManeuverFormData) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase.from("maneuvers").update(formData).eq("id", id).select()

  if (error) {
    console.error("Error updating maneuver:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/maneuvers")
  revalidatePath(`/admin/maneuvers/${id}`)
  return { success: true, data: data[0] }
}

export async function deleteManeuver(id: string) {
  const supabase = await createClient(await cookies())

  // Check if the maneuver is used in any lesson
  const { data: lessonManeuvers, error: checkError } = await supabase
    .from("lesson_maneuvers")
    .select("id")
    .eq("maneuver_id", id)
    .limit(1)

  if (checkError) {
    console.error("Error checking maneuver usage:", checkError)
    return { success: false, error: checkError.message }
  }

  if (lessonManeuvers.length > 0) {
    return {
      success: false,
      error: "This maneuver is used in one or more lessons and cannot be deleted.",
    }
  }

  // Check if the maneuver has any scores
  const { data: maneuverScores, error: scoresCheckError } = await supabase
    .from("maneuver_scores")
    .select("id")
    .eq("maneuver_id", id)
    .limit(1)

  if (scoresCheckError) {
    console.error("Error checking maneuver scores:", scoresCheckError)
    return { success: false, error: scoresCheckError.message }
  }

  if (maneuverScores.length > 0) {
    return {
      success: false,
      error: "This maneuver has scores recorded and cannot be deleted.",
    }
  }

  // If not used, delete the maneuver
  const { error } = await supabase.from("maneuvers").delete().eq("id", id)

  if (error) {
    console.error("Error deleting maneuver:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/maneuvers")
  return { success: true }
}

export async function assignManeuverToLesson(lessonId: string, maneuverIds: string[], isRequired = true) {
  const supabase = await createClient(await cookies())

  const maneuversToInsert = maneuverIds.map((maneuver_id) => ({
    lesson_id: lessonId,
    maneuver_id,
    is_required: isRequired,
  }))

  const { error } = await supabase.from("lesson_maneuvers").insert(maneuversToInsert)

  if (error) {
    console.error("Error assigning maneuvers to lesson:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/syllabi/${lessonId}`)
  return { success: true }
}

export async function removeManeuverFromLesson(lessonId: string, maneuverIds: string[]) {
  const supabase = await createClient(await cookies())

  const { error } = await supabase
    .from("lesson_maneuvers")
    .delete()
    .eq("lesson_id", lessonId)
    .in("maneuver_id", maneuverIds)

  if (error) {
    console.error("Error removing maneuvers from lesson:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/syllabi/${lessonId}`)
  return { success: true }
}

export async function getManeuversForLesson(lessonId: string) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from("lesson_maneuvers")
    .select(`
      id,
      is_required,
      maneuver:maneuver_id (
        id,
        name,
        description,
        category,
        faa_reference
      )
    `)
    .eq("lesson_id", lessonId)
    .order("maneuver(category)", { ascending: true })
    .order("maneuver(name)", { ascending: true })

  if (error) {
    console.error("Error fetching maneuvers for lesson:", error)
    return []
  }

  // Format the data
  const maneuvers = data.map((lm) => ({
    ...lm.maneuver,
    lesson_maneuver_id: lm.id, // Keep the lesson_maneuver ID for uniqueness
    is_required: lm.is_required,
  }))

  return maneuvers
}
