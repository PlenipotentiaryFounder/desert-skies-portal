"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import type { Database } from "@/types/supabase"
type StudentEnrollmentInsert = Database["public"]["Tables"]["student_enrollments"]["Insert"]
type StudentEnrollmentUpdate = Database["public"]["Tables"]["student_enrollments"]["Update"]

export type Enrollment = {
  id: string
  created_at: string
  updated_at: string
  student_id: string
  syllabus_id: string
  instructor_id: string
  start_date: string
  target_completion_date: string | null
  completion_date: string | null
  status: "active" | "completed" | "withdrawn" | "on_hold"
  student?: {
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
  syllabus?: {
    name: string
    description: string
  }
}

export type EnrollmentFormData = {
  student_id: string
  syllabus_id: string
  instructor_id: string
  start_date: string
  target_completion_date?: string | null
  status: "active" | "completed" | "withdrawn" | "on_hold"
}

export async function getEnrollments() {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from("student_enrollments")
    .select(`
      *,
      student:student_id (
        first_name,
        last_name,
        email,
        avatar_url
      ),
      instructor:instructor_id (
        first_name,
        last_name,
        email,
        avatar_url
      ),
      syllabus:syllabus_id (
        name,
        description
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching enrollments:", error)
    return []
  }

  return data as unknown as Enrollment[]
}

export async function getEnrollmentById(id: string) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from("student_enrollments")
    .select(`
      *,
      student:student_id (
        first_name,
        last_name,
        email,
        avatar_url
      ),
      instructor:instructor_id (
        first_name,
        last_name,
        email,
        avatar_url
      ),
      syllabus:syllabus_id (
        name,
        description
      )
    `)
    .eq("id", id as Database["public"]["Tables"]["student_enrollments"]["Row"]["id"])
    .single()

  if (error) {
    console.error("Error fetching enrollment:", error)
    return null
  }

  return data as unknown as Enrollment
}

export async function getStudentEnrollments(studentId: string) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from("student_enrollments")
    .select(`
      *,
      instructor:instructor_id (
        first_name,
        last_name,
        email,
        avatar_url
      ),
      syllabus:syllabus_id (
        name,
        description
      )
    `)
    .eq("student_id", studentId as Database["public"]["Tables"]["student_enrollments"]["Row"]["student_id"])
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching student enrollments:", error)
    return []
  }

  return data as unknown as Enrollment[]
}

export async function getInstructorEnrollments(instructorId: string) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from("student_enrollments")
    .select(`
      *,
      student:student_id (
        first_name,
        last_name,
        email,
        avatar_url
      ),
      syllabus:syllabus_id (
        name,
        description
      )
    `)
    .eq("instructor_id", instructorId as Database["public"]["Tables"]["student_enrollments"]["Row"]["instructor_id"])
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching instructor enrollments:", error)
    return []
  }

  return data as unknown as Enrollment[]
}

export async function createEnrollment(formData: EnrollmentFormData) {
  const supabase = await createClient(await cookies())

  const insertData: StudentEnrollmentInsert = {
    student_id: formData.student_id,
    syllabus_id: formData.syllabus_id,
    instructor_id: formData.instructor_id,
    start_date: formData.start_date,
    target_completion_date: formData.target_completion_date ?? null,
    status: formData.status,
  }

  const { data, error } = await supabase.from("student_enrollments").insert([insertData]).select()

  if (error) {
    console.error("Error creating enrollment:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/enrollments")
  return { success: true, data: data[0] }
}

export async function updateEnrollment(id: string, formData: EnrollmentFormData) {
  const supabase = await createClient(await cookies())

  const updateData: StudentEnrollmentUpdate = { ...formData }

  const { data, error } = await supabase.from("student_enrollments").update(updateData).eq("id", id as Database["public"]["Tables"]["student_enrollments"]["Row"]["id"]).select()

  if (error) {
    console.error("Error updating enrollment:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/enrollments")
  revalidatePath(`/admin/enrollments/${id}`)
  return { success: true, data: data[0] }
}

export async function deleteEnrollment(id: string) {
  const supabase = await createClient(await cookies())

  const { error } = await supabase.from("student_enrollments").delete().eq("id", id as Database["public"]["Tables"]["student_enrollments"]["Row"]["id"])

  if (error) {
    console.error("Error deleting enrollment:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/enrollments")
  return { success: true }
}
