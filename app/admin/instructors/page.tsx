import { AdminInstructorsPageClient } from "./instructors-page-client"
import { getAdminInstructors } from "@/lib/admin-instructor-service"

export const metadata = {
  title: "Instructors | Admin | Desert Skies Aviation",
  description: "Manage and monitor all instructors in the flight training program"
}

export default async function AdminInstructorsPage() {
  // Fetch actual instructor data
  let instructors: any[] = []
  
  try {
    console.log('[AdminInstructorsPage] Fetching instructors...')
    instructors = await getAdminInstructors()
    console.log('[AdminInstructorsPage] Fetched', instructors.length, 'instructors')
  } catch (error) {
    console.error('[AdminInstructorsPage] Error fetching instructors:', error)
    // Return empty array on error - page will show "No instructors found"
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Instructors</h1>
        <p className="text-muted-foreground">
          Manage and monitor all instructors in the flight training program
        </p>
      </div>
      <AdminInstructorsPageClient initialInstructors={instructors} />
    </div>
  )
}
