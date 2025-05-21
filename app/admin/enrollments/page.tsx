import Link from "next/link"
import { Plus } from "lucide-react"
import { getEnrollments } from "@/lib/enrollment-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EnrollmentsList } from "./enrollments-list"

export default async function EnrollmentsPage() {
  const enrollments = await getEnrollments()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Enrollments</h1>
          <p className="text-muted-foreground">Manage student enrollments in training programs</p>
        </div>
        <Button asChild>
          <Link href="/admin/enrollments/new">
            <Plus className="mr-2 h-4 w-4" />
            New Enrollment
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Enrollments</CardTitle>
          <CardDescription>View and manage all student enrollments</CardDescription>
        </CardHeader>
        <CardContent>
          <EnrollmentsList enrollments={enrollments} />
        </CardContent>
      </Card>
    </div>
  )
}
