import { ManageSessionRequests } from "./ManageSessionRequests"
import { getInstructorFlightSessions } from "@/lib/flight-session-service"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export default async function InstructorSessionRequestsPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  // Get current instructor ID
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return <div>Unauthorized</div>
  // Fetch all sessions for this instructor
  const allSessions = await getInstructorFlightSessions(user.id)
  // Filter for pending requests
  const requests = allSessions.filter((s: any) => s.request_status === "pending")
  return <ManageSessionRequests requests={requests} />
} 