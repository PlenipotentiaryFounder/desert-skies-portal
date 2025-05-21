import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SchoolPerformanceReport } from "./school-performance-report"
import { AircraftUtilizationReport } from "./aircraft-utilization-report"
import { InstructorPerformanceReport } from "./instructor-performance-report"
import { StudentProgressReport } from "./student-progress-report"

export const metadata = {
  title: "Reports | Desert Skies",
  description: "View and generate reports for Desert Skies Flight School",
}

export default function AdminReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">View and generate reports for your flight school</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flight School Analytics</CardTitle>
          <CardDescription>
            Comprehensive reports and analytics to track performance and make data-driven decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="school" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="school">School Performance</TabsTrigger>
              <TabsTrigger value="aircraft">Aircraft Utilization</TabsTrigger>
              <TabsTrigger value="instructors">Instructor Performance</TabsTrigger>
              <TabsTrigger value="students">Student Progress</TabsTrigger>
            </TabsList>
            <TabsContent value="school" className="pt-4">
              <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
                <SchoolPerformanceReport />
              </Suspense>
            </TabsContent>
            <TabsContent value="aircraft" className="pt-4">
              <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
                <AircraftUtilizationReport />
              </Suspense>
            </TabsContent>
            <TabsContent value="instructors" className="pt-4">
              <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
                <InstructorPerformanceReport />
              </Suspense>
            </TabsContent>
            <TabsContent value="students" className="pt-4">
              <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
                <StudentProgressReport />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
