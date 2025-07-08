import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getFlightSessionById } from "@/lib/flight-session-service"
import { getEnrollments } from "@/lib/enrollment-service"
import { FlightSessionForm } from "../../flight-session-form"

export const metadata = {
  title: "Edit Flight Session | Desert Skies Aviation",
  description: "Edit flight session details",
}

export default async function EditFlightSessionPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getFlightSessionById(params.id)

  if (!session) {
    notFound()
  }

  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // Get all active enrollments with student and syllabus info
  const enrollments = await getEnrollments()

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
    .order("tail_number", { ascending: true })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Flight Session</h1>
        <p className="text-muted-foreground">Update the details for this flight session</p>
      </div>

      <FlightSessionForm
        enrollments={enrollments}
        instructors={instructors || []}
        aircraft={aircraft || []}
        initialData={session}
      />
    </div>
  )
}
