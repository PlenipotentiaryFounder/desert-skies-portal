import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getEnrollments } from "@/lib/enrollment-service"
import { FlightSessionForm } from "../flight-session-form"

export const metadata = {
  title: "New Flight Session | Desert Skies Aviation",
  description: "Schedule a new flight session",
}

export default async function NewFlightSessionPage() {
  const supabase = createServerSupabaseClient()

  // Get all active enrollments with student and syllabus info
  const enrollments = await getEnrollments()
  const activeEnrollments = enrollments.filter((e) => e.status === "active")

  // Get all instructors
  const { data: instructors } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("role", "instructor")
    .order("last_name", { ascending: true })

  // Get all active aircraft
  const { data: aircraft } = await supabase
    .from("aircraft")
    .select("id, tail_number, make, model")
    .eq("is_active", true)
    .order("tail_number", { ascending: true })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schedule New Flight Session</h1>
        <p className="text-muted-foreground">Create a new flight session for a student</p>
      </div>

      <FlightSessionForm enrollments={activeEnrollments} instructors={instructors || []} aircraft={aircraft || []} />
    </div>
  )
}
