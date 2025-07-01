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
          <UserForm user={user} />
        </TabsContent>
        <TabsContent value="permissions">
          <UserPermissionsForm userId={user.id} userName={`${user.first_name} ${user.last_name}`} userRole={user.role} />
        </TabsContent>
        <TabsContent value="password">
          {/* Password reset is integrated in UserForm, but can be moved here if needed */}
          <Card><CardContent className="py-8">Password reset functionality is available in the profile form.</CardContent></Card>
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
          {/* {user.role === "student" ? <StudentProgressReport studentId={user.id} /> : null}
          {user.role === "instructor" ? <InstructorPerformanceReport instructorId={user.id} /> : null} */}
          <Card><CardContent className="py-8">Reports tab coming soon.</CardContent></Card>
        </TabsContent>
        <TabsContent value="activity">
          {/* <RecentActivityList userId={user.id} /> */}
          <Card><CardContent className="py-8">Activity tab coming soon.</CardContent></Card>
        </TabsContent>
        <TabsContent value="danger">
          <Card>
            <CardContent className="py-8">
              <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>
              <p className="mb-4">Delete this user and all associated data. This action cannot be undone.</p>
              <Suspense fallback={<div>Loading...</div>}>
                <DeleteUserDialog isOpen={false} userId={user.id} onComplete={() => {}} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
