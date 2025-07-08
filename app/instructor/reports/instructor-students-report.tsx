"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { Download, GraduationCap } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface InstructorStudentsReportProps {
  instructorId: string
}

export function InstructorStudentsReport({ instructorId }: InstructorStudentsReportProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [report, setReport] = useState<any>(null)
  const { toast } = useToast()

  // Fetch instructor's students on component mount
  useEffect(() => {
    async function fetchStudents() {
      try {
        const response = await fetch("/api/instructor/students")
        if (!response.ok) {
          throw new Error(`Failed to fetch students: ${response.statusText}`)
        }
        const data = await response.json()
        
        if (data.students && data.students.length > 0) {
          setStudents(data.students)
          setSelectedStudent(data.students[0].id)
        }
      } catch (error) {
        console.error("Error fetching students:", error)
        toast({
          title: "Error",
          description: "Failed to fetch students",
          variant: "destructive",
        })
      }
    }

    fetchStudents()
  }, [instructorId])

  const generateReport = async () => {
    if (!selectedStudent) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/instructor/students?action=progress&studentId=${selectedStudent}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch report: ${response.statusText}`)
      }
      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Failed to generate student progress report",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Generate report when student changes
  useEffect(() => {
    if (selectedStudent) {
      generateReport()
    }
  }, [selectedStudent])

  const handleStudentChange = (value: string) => {
    setSelectedStudent(value)
  }

  const exportReport = () => {
    if (!report || !report.enrollments || report.enrollments.length === 0) return

    const enrollment = report.enrollments[0]

    const csvContent = [
      "Syllabus,Start Date,Progress %,Total Lessons,Completed Lessons,Estimated Completion",
      `${enrollment.enrollment.syllabus.title},${enrollment.enrollment.start_date},${enrollment.progressPercentage.toFixed(1)},${enrollment.totalLessons},${enrollment.completedLessons.length},${enrollment.estimatedCompletionDate ? formatDate(enrollment.estimatedCompletionDate) : "N/A"}`,
      "\n",
      "Lesson,Status,Order",
      ...enrollment.completedLessons.map((lesson: any) => `${lesson.title},Completed,${lesson.order_index}`),
      ...enrollment.pendingLessons.map((lesson: any) => `${lesson.title},Pending,${lesson.order_index}`),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `student-progress-report-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return <Skeleton className="h-[500px] w-full" />
  }

  const getStudentName = (id: string) => {
    const student = students.find((s) => s.id === id)
    return student ? `${student.first_name} ${student.last_name}` : "Unknown Student"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Student Progress Report</h2>
          <p className="text-muted-foreground">Track your students' progress and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedStudent} onValueChange={handleStudentChange}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.first_name} {student.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={exportReport}
            disabled={!report || !report.enrollments || report.enrollments.length === 0}
          >
            <Download className="h-4 w-4" />
            <span className="sr-only">Export report</span>
          </Button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
          <div className="flex flex-col items-center text-center">
            <h3 className="text-lg font-semibold">No students assigned</h3>
            <p className="text-sm text-muted-foreground">You don't have any students assigned to you yet</p>
          </div>
        </div>
      ) : report && report.enrollments && report.enrollments.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Flight Hours</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.totalFlightHours.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Across all flight sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Progress</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.enrollments[0].progressPercentage.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {report.enrollments[0].completedLessons.length} of {report.enrollments[0].totalLessons} lessons
                  completed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimated Completion</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.enrollments[0].estimatedCompletionDate
                    ? formatDate(report.enrollments[0].estimatedCompletionDate)
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">Based on current progress rate</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Syllabus Progress</CardTitle>
              <CardDescription>
                {report.enrollments[0].enrollment.syllabus.title} - Started on{" "}
                {formatDate(report.enrollments[0].enrollment.start_date)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {report.enrollments[0].progressPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={report.enrollments[0].progressPercentage} className="h-2" />
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
                          {report.enrollments[0].completedLessons.map((lesson: any) => (
                            <TableRow key={lesson.id}>
                              <TableCell>{lesson.order_index}</TableCell>
                              <TableCell>{lesson.title}</TableCell>
                            </TableRow>
                          ))}
                          {report.enrollments[0].completedLessons.length === 0 && (
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
                          {report.enrollments[0].pendingLessons.slice(0, 5).map((lesson: any) => (
                            <TableRow key={lesson.id}>
                              <TableCell>{lesson.order_index}</TableCell>
                              <TableCell>{lesson.title}</TableCell>
                            </TableRow>
                          ))}
                          {report.enrollments[0].pendingLessons.length === 0 && (
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
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground">No report data available for selected student</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
