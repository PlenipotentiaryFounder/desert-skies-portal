"use client"

import { useEffect, useState } from "react"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { getStudentProgressReport } from "@/lib/report-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Download, GraduationCap } from "lucide-react"

export function StudentProgressReport() {
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [report, setReport] = useState<any>(null)
  const supabase = createClientComponentClient()

  // Fetch students on component mount
  useEffect(() => {
    async function fetchStudents() {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("role", "student")
        .order("last_name", { ascending: true })

      if (data && data.length > 0) {
        setStudents(data)
        setSelectedStudent(data[0].id)
      }
    }

    fetchStudents()
  }, [supabase])

  const generateReport = async () => {
    if (!selectedStudent) return

    setIsLoading(true)
    try {
      const data = await getStudentProgressReport(selectedStudent)
      setReport(data)
    } catch (error) {
      console.error("Error generating report:", error)
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
      "Syllabus,Start Date,Instructor,Progress %,Total Lessons,Completed Lessons,Estimated Completion",
      `${enrollment.enrollment.syllabus.title},${enrollment.enrollment.start_date},${enrollment.enrollment.instructor.first_name} ${enrollment.enrollment.instructor.last_name},${enrollment.progressPercentage.toFixed(1)},${enrollment.totalLessons},${enrollment.completedLessons},${enrollment.estimatedCompletionDate ? formatDate(enrollment.estimatedCompletionDate) : "N/A"}`,
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

  // Prepare flight hours data for chart
  const prepareFlightHoursData = () => {
    if (!report || !report.flightSessions || report.flightSessions.length === 0) {
      return []
    }

    // Group by day
    const hoursByDay = report.flightSessions.reduce((acc: Record<string, number>, session: any) => {
      const day = session.date.split("T")[0]
      acc[day] = (acc[day] || 0) + (session.duration || 0)
      return acc
    }, {})

    // Convert to array and sort by date
    return Object.entries(hoursByDay)
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Student Progress Report</h2>
          <p className="text-muted-foreground">Track student progress and performance</p>
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

      {report && report.enrollments && report.enrollments.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Flight Hours</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.totalFlightHours.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Across {report.flightSessions.length} flight sessions</p>
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
                <div className="flex items-center gap-2">
                  <Progress value={report.enrollments[0].progressPercentage} className="h-2" />
                  <span className="text-sm font-medium">{report.enrollments[0].progressPercentage.toFixed(1)}%</span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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
                    <h4 className="mb-2 font-medium">Pending Lessons</h4>
                    <div className="max-h-[200px] overflow-y-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Lesson</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.enrollments[0].pendingLessons.map((lesson: any) => (
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

          <Card>
            <CardHeader>
              <CardTitle>Flight Hours</CardTitle>
              <CardDescription>Flight hours over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={prepareFlightHoursData()}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => formatDate(value, { month: "short", day: "numeric" })}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(1)} hours`, "Flight Hours"]}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="hours" name="Flight Hours" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Flight Sessions</CardTitle>
              <CardDescription>Last 10 flight sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Aircraft</TableHead>
                    <TableHead>Instructor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.flightSessions.slice(0, 10).map((session: any) => (
                    <TableRow key={session.id}>
                      <TableCell>{formatDate(session.date)}</TableCell>
                      <TableCell>{session.duration.toFixed(1)} hours</TableCell>
                      <TableCell>{session.aircraft?.registration || "N/A"}</TableCell>
                      <TableCell>
                        {session.instructor?.first_name} {session.instructor?.last_name}
                      </TableCell>
                    </TableRow>
                  ))}
                  {report.flightSessions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No flight sessions recorded
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
          <div className="flex flex-col items-center text-center">
            <h3 className="text-lg font-semibold">No enrollment data available</h3>
            <p className="text-sm text-muted-foreground">
              {selectedStudent
                ? `${getStudentName(selectedStudent)} is not currently enrolled in any syllabus`
                : "Select a student to view their progress"}
            </p>
            {selectedStudent && (
              <Button className="mt-4" onClick={generateReport}>
                Refresh Data
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
