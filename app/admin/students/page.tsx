import { AdminStudentsPageClient } from "./students-page-client"
import { getAdminStudents } from "@/lib/admin-student-service"

export const metadata = {
  title: "Students | Admin | Desert Skies Aviation",
  description: "Manage and monitor all students in the flight training program"
}

export default async function AdminStudentsPage() {
  // Fetch actual student data
  let students: any[] = []
  
  try {
    console.log('[AdminStudentsPage] Fetching students...')
    students = await getAdminStudents()
    console.log('[AdminStudentsPage] Fetched', students.length, 'students')
  } catch (error) {
    console.error('[AdminStudentsPage] Error fetching students:', error)
    // Return empty array on error - page will show "No students found"
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Students</h1>
        <p className="text-muted-foreground">
          Manage and monitor all students in the flight training program
        </p>
      </div>
      <AdminStudentsPageClient initialStudents={students} />
    </div>
  )
}
