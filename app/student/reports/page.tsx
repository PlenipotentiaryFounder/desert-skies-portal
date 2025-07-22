import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StudentProgressReport } from "./student-progress-report"
import { StudentFlightHoursReport } from "./student-flight-hours-report"

export const metadata = {
  title: "My Progress | Desert Skies",
  description: "Track your flight training progress and hours",
}

export default async function StudentReportsPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Progress</h1>
        <p className="text-muted-foreground">Track your flight training progress and hours</p>
      </div>

      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <StudentProgressReport studentId={user.id} />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Flight Hours</CardTitle>
          <CardDescription>Track your accumulated flight hours</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
            <StudentFlightHoursReport studentId={user.id} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
