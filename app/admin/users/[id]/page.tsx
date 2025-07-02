import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getUserById, getUserProfileWithRoles } from "@/lib/user-service"
import { getStudentEnrollments, getInstructorEnrollments } from "@/lib/enrollment-service"
import { getStudentFlightSessions, getInstructorFlightSessions } from "@/lib/flight-session-service"
import { UserForm } from "../user-form"
import { UserPermissionsForm } from "./permissions/user-permissions-form"
import { DeleteUserDialog } from "../delete-user-dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Suspense } from "react"
import UserEnrollmentsTab from "./UserEnrollmentsTab"
import UserFlightSessionsTab from "./UserFlightSessionsTab"
import UserDocumentsTab from "./UserDocumentsTab"
import UserDangerZoneTab from "./UserDangerZoneTab"
import { RecentActivityList } from "@/components/admin/recent-activity-list"
import { StudentProgressReport } from "@/app/admin/reports/student-progress-report"
import { InstructorPerformanceReport } from "@/app/admin/reports/instructor-performance-report"
import { SchoolPerformanceReport } from "@/app/admin/reports/school-performance-report"
import { AircraftUtilizationReport } from "@/app/admin/reports/aircraft-utilization-report"
import { AdminPasswordReset } from "./AdminPasswordReset"
import UserReportsTab from "./UserReportsTab"

// Placeholder imports for components to be integrated
// import { EnrollmentsList } from "@/app/admin/enrollments/enrollments-list"
// import { FlightSessionsList } from "@/app/admin/schedule/flight-sessions-list"
// import { DocumentsList } from "@/app/admin/documents/documents-list"
// import { InstructorStudentsList } from "@/components/instructor/instructor-students-list"
// import { StudentProgressReport } from "@/app/student/reports/student-progress-report"
// import { InstructorPerformanceReport } from "@/app/admin/reports/instructor-performance-report"
// import { RecentActivityList } from "@/components/admin/recent-activity-list"

interface UserDetailPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: UserDetailPageProps): Promise<Metadata> {
  const user = await getUserById(params.id)

  if (!user) {
    return {
      title: "User Not Found | Desert Skies Aviation",
    }
  }

  return {
    title: `Manage ${user.first_name} ${user.last_name} | Desert Skies Aviation`,
    description: `Admin management for ${user.first_name} ${user.last_name}`,
  }
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const awaitedParams = await params
  const user = await getUserProfileWithRoles(awaitedParams.id)
  if (!user) notFound()

  // Fetch enrollments for student/instructor
  let studentEnrollments = []
  let instructorEnrollments = []
  if (user.role === "student") {
    studentEnrollments = await getStudentEnrollments(user.id)
  } else if (user.role === "instructor") {
    instructorEnrollments = await getInstructorEnrollments(user.id)
  }

  // Fetch flight sessions for student/instructor
  let studentFlightSessions = []
  let instructorFlightSessions = []
  if (user.role === "student") {
    studentFlightSessions = await getStudentFlightSessions(user.id)
  } else if (user.role === "instructor") {
    instructorFlightSessions = await getInstructorFlightSessions(user.id)
  }

  // TODO: Fetch documents, activity, etc.

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manage User</h1>
        <p className="text-muted-foreground">
          Admin management for {user.first_name} {user.last_name} ({user.email})
        </p>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="password">Password Reset</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="sessions">Flight Sessions</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <UserForm user={user} hidePasswordReset />
        </TabsContent>
        <TabsContent value="permissions">
          <UserPermissionsForm userId={user.id} userName={`${user.first_name} ${user.last_name}`} userRole={user.role} />
        </TabsContent>
        <TabsContent value="password">
          <AdminPasswordReset user={user} />
        </TabsContent>
        <TabsContent value="enrollments">
          <UserEnrollmentsTab
            userRole={user.role}
            studentEnrollments={studentEnrollments}
            instructorEnrollments={instructorEnrollments}
          />
        </TabsContent>
        <TabsContent value="sessions">
          <UserFlightSessionsTab
            userRole={user.role}
            userId={user.id}
            studentSessions={studentFlightSessions}
            instructorSessions={instructorFlightSessions}
          />
        </TabsContent>
        <TabsContent value="documents">
          <UserDocumentsTab userId={user.id} userRole={user.role} />
        </TabsContent>
        <TabsContent value="reports">
          <UserReportsTab user={user} />
        </TabsContent>
        <TabsContent value="activity">
          <Card>
            <CardContent className="py-8">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <Suspense fallback={<div>Loading activity...</div>}>
                <RecentActivityList userId={user.id} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="danger">
          <UserDangerZoneTab userId={user.id} userName={`${user.first_name} ${user.last_name}`} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
