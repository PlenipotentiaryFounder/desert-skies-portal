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
    id: string
    first_name: string
    last_name: string
    email: string
    avatar_url: string | null
    status?: string
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

  // First get all enrollments
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("student_enrollments")
    .select("*")
    .order("created_at", { ascending: false })

  if (enrollmentsError) {
    console.error("Error fetching enrollments:", enrollmentsError)
    return []
  }

  if (!enrollments || enrollments.length === 0) {
    return []
  }

  // Get all unique user IDs and syllabus IDs
  const userIds = [...new Set(enrollments.flatMap(e => [e.student_id, e.instructor_id]))]
  const syllabusIds = [...new Set(enrollments.map(e => e.syllabus_id))]

  // Get all profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .in("id", userIds)

  // Get all syllabi
  const { data: syllabi } = await supabase
    .from("syllabi")
    .select("id, name, description")
    .in("id", syllabusIds)

  // Create lookup maps
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
  const syllabusMap = new Map(syllabi?.map(s => [s.id, s]) || [])

  // Transform the data to match the expected Enrollment type
  return enrollments.map(enrollment => {
    const student = profileMap.get(enrollment.student_id)
    const instructor = profileMap.get(enrollment.instructor_id)
    const syllabus = syllabusMap.get(enrollment.syllabus_id)

    return {
      id: enrollment.id,
      created_at: enrollment.created_at,
      updated_at: enrollment.updated_at,
      student_id: enrollment.student_id,
      syllabus_id: enrollment.syllabus_id,
      instructor_id: enrollment.instructor_id,
      start_date: enrollment.start_date,
      target_completion_date: null, // Not in current schema
      completion_date: null, // Not in current schema
      status: enrollment.status,
      student: student ? {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        avatar_url: null // Not in current schema
      } : {
        id: "unknown",
        first_name: "Unknown",
        last_name: "Student",
        email: "unknown@example.com",
        avatar_url: null
      },
      instructor: instructor ? {
        first_name: instructor.first_name,
        last_name: instructor.last_name,
        email: instructor.email,
        avatar_url: null // Not in current schema
      } : {
        first_name: "Unknown",
        last_name: "Instructor",
        email: "unknown@example.com",
        avatar_url: null
      },
      syllabus: syllabus ? {
        name: syllabus.title,
        description: syllabus.description
      } : {
        name: "Unknown Syllabus",
        description: "Syllabus not found"
      }
    }
  }) as Enrollment[]
}

export async function getEnrollmentById(id: string) {
  const supabase = await createClient(await cookies())

  // Get the enrollment
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("student_enrollments")
    .select("*")
    .eq("id", id)
    .single()

  if (enrollmentError) {
    console.error("Error fetching enrollment:", enrollmentError)
    return null
  }

  if (!enrollment) {
    return null
  }

  // Get student profile
  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .eq("id", enrollment.student_id)
    .single()

  // Get instructor profile
  const { data: instructorProfile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .eq("id", enrollment.instructor_id)
    .single()

  // Get syllabus
  const { data: syllabus } = await supabase
    .from("syllabi")
    .select("id, name, description")
    .eq("id", enrollment.syllabus_id)
    .single()

  // Transform the data to match the expected Enrollment type
  return {
    id: enrollment.id,
    created_at: enrollment.created_at,
    updated_at: enrollment.updated_at,
    student_id: enrollment.student_id,
    syllabus_id: enrollment.syllabus_id,
    instructor_id: enrollment.instructor_id,
    start_date: enrollment.start_date,
    target_completion_date: null, // Not in current schema
    completion_date: null, // Not in current schema
    status: enrollment.status,
    student: studentProfile ? {
      id: studentProfile.id,
      first_name: studentProfile.first_name,
      last_name: studentProfile.last_name,
      email: studentProfile.email,
      avatar_url: null // Not in current schema
    } : {
      id: "unknown",
      first_name: "Unknown",
      last_name: "Student",
      email: "unknown@example.com",
      avatar_url: null
    },
    instructor: instructorProfile ? {
      first_name: instructorProfile.first_name,
      last_name: instructorProfile.last_name,
      email: instructorProfile.email,
      avatar_url: null // Not in current schema
    } : {
      first_name: "Unknown",
      last_name: "Instructor",
      email: "unknown@example.com",
      avatar_url: null
    },
    syllabus: syllabus ? {
      name: syllabus.title,
      description: syllabus.description
    } : {
      name: "Unknown Syllabus",
      description: "Syllabus not found"
    }
  } as Enrollment
}

export async function getStudentEnrollments(studentId: string) {
  const supabase = await createClient(await cookies())

  // First get the enrollments
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("student_enrollments")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })

  if (enrollmentsError) {
    console.error("Error fetching student enrollments:", enrollmentsError)
    return []
  }

  if (!enrollments || enrollments.length === 0) {
    return []
  }

  // Get instructor profiles
  const instructorIds = enrollments.map(e => e.instructor_id)
  const { data: instructorProfiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .in("id", instructorIds)

  // Get syllabi
  const syllabusIds = enrollments.map(e => e.syllabus_id)
  const { data: syllabi } = await supabase
    .from("syllabi")
    .select("id, title, description")
    .in("id", syllabusIds)

  // Create lookup maps
  const instructorMap = new Map(instructorProfiles?.map(p => [p.id, p]) || [])
  const syllabusMap = new Map(syllabi?.map(s => [s.id, s]) || [])

  // Transform the data to match the expected Enrollment type
  return enrollments.map(enrollment => {
    const instructor = instructorMap.get(enrollment.instructor_id)
    const syllabus = syllabusMap.get(enrollment.syllabus_id)

    return {
      id: enrollment.id,
      created_at: enrollment.created_at,
      updated_at: enrollment.updated_at,
      student_id: enrollment.student_id,
      syllabus_id: enrollment.syllabus_id,
      instructor_id: enrollment.instructor_id,
      start_date: enrollment.start_date,
      target_completion_date: null, // Not in current schema
      completion_date: null, // Not in current schema
      status: enrollment.status,
      student: {
        id: enrollment.student_id, // This is the current student
        first_name: "Current",
        last_name: "Student",
        email: "current@student.com",
        avatar_url: null // Not in current schema
      },
      instructor: instructor ? {
        first_name: instructor.first_name,
        last_name: instructor.last_name,
        email: instructor.email,
        avatar_url: null // Not in current schema
      } : {
        first_name: "Unknown",
        last_name: "Instructor",
        email: "unknown@example.com",
        avatar_url: null
      },
      syllabus: syllabus ? {
        name: syllabus.title,
        description: syllabus.description
      } : {
        name: "Unknown Syllabus",
        description: "Syllabus not found"
      }
    }
  }) as Enrollment[]
}

export async function getInstructorEnrollments(instructorId: string) {
  const supabase = await createClient(await cookies())

  // First get the enrollments
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("student_enrollments")
    .select("*")
    .eq("instructor_id", instructorId)
    .order("created_at", { ascending: false })

  if (enrollmentsError) {
    console.error("Error fetching instructor enrollments:", enrollmentsError)
    return []
  }

  if (!enrollments || enrollments.length === 0) {
    return []
  }

  // Get student profiles
  const studentIds = enrollments.map(e => e.student_id)
  const { data: studentProfiles, error: studentProfilesError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, status")
    .in("id", studentIds)
  
  if (studentProfilesError) {
    console.error("Error fetching student profiles:", studentProfilesError)
  }

  // Get instructor profile
  const { data: instructorProfile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .eq("id", instructorId)
    .single()

  // Get syllabi
  const syllabusIds = enrollments.map(e => e.syllabus_id)
  const { data: syllabi } = await supabase
    .from("syllabi")
    .select("id, title, description")
    .in("id", syllabusIds)

  // Create lookup maps
  const studentMap = new Map(studentProfiles?.map(p => [p.id, p]) || [])
  const syllabusMap = new Map(syllabi?.map(s => [s.id, s]) || [])

  // Transform the data to match the expected Enrollment type
  return enrollments.map(enrollment => {
    const student = studentMap.get(enrollment.student_id)
    const syllabus = syllabusMap.get(enrollment.syllabus_id)

    return {
      id: enrollment.id,
      created_at: enrollment.created_at,
      updated_at: enrollment.updated_at,
      student_id: enrollment.student_id,
      syllabus_id: enrollment.syllabus_id,
      instructor_id: enrollment.instructor_id,
      start_date: enrollment.start_date,
      target_completion_date: null, // Not in current schema
      completion_date: null, // Not in current schema
      status: enrollment.status,
      student: student ? {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        avatar_url: null, // Not in current schema
        status: student.status || "unknown"
      } : {
        id: "unknown",
        first_name: "Unknown",
        last_name: "Student",
        email: "unknown@example.com",
        avatar_url: null,
        status: "unknown"
      },
      instructor: instructorProfile ? {
        first_name: instructorProfile.first_name,
        last_name: instructorProfile.last_name,
        email: instructorProfile.email,
        avatar_url: null // Not in current schema
      } : {
        first_name: "Unknown",
        last_name: "Instructor",
        email: "unknown@example.com",
        avatar_url: null
      },
      syllabus: syllabus ? {
        name: syllabus.title,
        description: syllabus.description
      } : {
        name: "Unknown Syllabus",
        description: "Syllabus not found"
      }
    }
  }) as Enrollment[]
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
