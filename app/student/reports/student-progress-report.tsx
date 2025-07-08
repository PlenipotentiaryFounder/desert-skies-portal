"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { Download, GraduationCap } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface StudentProgressReportProps {
  studentId: string
}

export function StudentProgressReport({ studentId }: StudentProgressReportProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [report, setReport] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchReport() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/student/reports?type=progress`)
        if (!response.ok) {
          throw new Error(`Failed to fetch report: ${response.statusText}`)
        }
        const data = await response.json()
        setReport(data)
      } catch (error) {
        console.error("Error fetching student progress:", error)
        toast({
          title: "Error",
          description: "Failed to fetch progress report",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchReport()
  }, [studentId])

  const exportReport = () => {
    if (!report || !report.enrollments || report.enrollments.length === 0) return

    const enrollment = report.enrollments[0]

    const csvContent = [
      "Syllabus,Start Date,Instructor,Progress %,Total Lessons,Completed Lessons,Estimated Completion",
      `${enrollment.enrollment.syllabus.title},${enrollment.enrollment.start_date},${enrollment.enrollment.instructor.first_name} ${enrollment.enrollment.instructor.last_name},${enrollment.progressPercentage.toFixed(1)},${enrollment.totalLessons},${enrollment.completedLessons.length},${enrollment.estimatedCompletionDate ? formatDate(enrollment.estimatedCompletionDate) : "N/A"}`,
      "\n",
      "Lesson,Status,Order",
      ...enrollment.completedLessons.map((lesson: any) => `${lesson.title},Completed,${lesson.order_index}`),
      ...enrollment.pendingLessons.map((lesson: any) => `${lesson.title},Pending,${lesson.order_index}`),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `my-progress-report-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />
  }

  if (!report || !report.enrollments || report.enrollments.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-[300px] items-center justify-center">
          <div className="flex flex-col items-center text-center">
            <GraduationCap className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No active enrollment</h3>
            <p className="mt-2 text-sm text-muted-foreground">You are not currently enrolled in any training program</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const enrollment = report.enrollments[0]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{enrollment.enrollment.syllabus.title}</CardTitle>
          <CardDescription>
            Started on {formatDate(enrollment.enrollment.start_date)} with {enrollment.enrollment.instructor.first_name}{" "}
            {enrollment.enrollment.instructor.last_name}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={exportReport}>
          <Download className="mr-2 h-4 w-4" />
          Export Progress
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Overall Progress</p>
              <div className="text-sm text-muted-foreground">
                {enrollment.completedLessons.length} of {enrollment.totalLessons} lessons completed
              </div>
            </div>
            <div className="text-sm font-medium">{enrollment.progressPercentage.toFixed(1)}%</div>
          </div>
          <Progress value={enrollment.progressPercentage} className="h-2" />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Total Flight Hours</p>
            <p className="text-2xl font-bold">{report.totalFlightHours.toFixed(1)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Estimated Completion</p>
            <p className="text-2xl font-bold">
              {enrollment.estimatedCompletionDate ? formatDate(enrollment.estimatedCompletionDate) : "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Remaining Hours (Est.)</p>
            <p className="text-2xl font-bold">
              {enrollment.enrollment.syllabus.estimated_completion_hours
                ? Math.max(
                    0,
                    enrollment.enrollment.syllabus.estimated_completion_hours - report.totalFlightHours,
                  ).toFixed(1)
                : "N/A"}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-medium">Completed Lessons</h4>
            <div className="max-h-[200px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Lesson</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollment.completedLessons.map((lesson: any) => (
                    <TableRow key={lesson.id}>
                      <TableCell>{lesson.order_index}</TableCell>
                      <TableCell>{lesson.title}</TableCell>
                    </TableRow>
                  ))}
                  {enrollment.completedLessons.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center">
                        No lessons completed yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-medium">Upcoming Lessons</h4>
            <div className="max-h-[200px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Lesson</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollment.pendingLessons.slice(0, 5).map((lesson: any) => (
                    <TableRow key={lesson.id}>
                      <TableCell>{lesson.order_index}</TableCell>
                      <TableCell>{lesson.title}</TableCell>
                    </TableRow>
                  ))}
                  {enrollment.pendingLessons.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center">
                        All lessons completed
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
