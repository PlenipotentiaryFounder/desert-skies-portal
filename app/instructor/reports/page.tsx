import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InstructorFlightHoursReport } from "./instructor-flight-hours-report"
import { InstructorStudentsReport } from "./instructor-students-report"

export const metadata = {
  title: "Reports | Desert Skies",
  description: "View and generate reports for your students and flight hours",
}

export default async function InstructorReportsPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">View and generate reports for your students and flight hours</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instructor Analytics</CardTitle>
          <CardDescription>Track your flight hours and student progress to optimize your teaching</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="flight-hours" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="flight-hours">Flight Hours</TabsTrigger>
              <TabsTrigger value="students">Student Progress</TabsTrigger>
            </TabsList>
            <TabsContent value="flight-hours" className="pt-4">
              <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
                <InstructorFlightHoursReport instructorId={session.user.id} />
              </Suspense>
            </TabsContent>
            <TabsContent value="students" className="pt-4">
              <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
                <InstructorStudentsReport instructorId={session.user.id} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
