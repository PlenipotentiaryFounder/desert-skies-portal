import { RequestSessionForm } from "./RequestSessionForm"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export default async function NewStudentSchedulePage() {
  const supabase = await createServerSupabaseClient()
  // Fetch options for selects
  const [{ data: enrollments = [] }, { data: lessons = [] }, { data: instructors = [] }, { data: aircraft = [] }, { data: locations = [] }] = await Promise.all([
    supabase.from("student_enrollments").select("id, syllabus_id, syllabus:syllabus_id (title)"),
    supabase.from("lessons").select("id, title"),
    supabase.from("profiles").select("id, first_name, last_name").eq("role", "instructor"),
    supabase.from("aircraft").select("id, tail_number, make, model"),
    supabase.from("locations").select("id, name")
  ])
  // Map enrollments to include syllabus title
  const mappedEnrollments = enrollments.map((e: any) => ({ ...e, syllabus_title: e.syllabus?.title }))
  return <RequestSessionForm enrollments={mappedEnrollments} lessons={lessons} instructors={instructors} aircraft={aircraft} locations={locations} />
} 