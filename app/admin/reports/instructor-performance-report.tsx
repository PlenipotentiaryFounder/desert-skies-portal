"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Download, Users } from "lucide-react"
import type { ReportTimeframe } from "@/lib/report-service"

interface InstructorPerformanceReportProps {
  userId?: string
}

export async function InstructorPerformanceReport({ userId }: InstructorPerformanceReportProps) {
  const [timeframe, setTimeframe] = useState<ReportTimeframe>("month")
  const [selectedInstructor, setSelectedInstructor] = useState<string>(userId || "")
  const [instructors, setInstructors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [report, setReport] = useState<any>(null)
  const supabase = await createClient()

  // Fetch instructors on component mount
  useEffect(() => {
    async function fetchInstructors() {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("role", "instructor")
        .eq("is_active", true)
        .order("last_name", { ascending: true })

      if (data && data.length > 0) {
        setInstructors(data)
        if (!userId) setSelectedInstructor(data[0].id)
      }
    }

    fetchInstructors()
  }, [supabase, userId])

  const generateReport = async (instructorId: string, tf: ReportTimeframe) => {
    if (!instructorId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/reports/instructor-performance?instructorId=${instructorId}&timeframe=${tf}`)
      const data = await res.json()
      setReport(data)
    } catch (error) {
      console.error("Error generating report:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate report when instructor or timeframe changes
  useEffect(() => {
    if (selectedInstructor) {
      generateReport(selectedInstructor, timeframe)
    }
  }, [selectedInstructor, timeframe])

  const handleInstructorChange = (value: string) => {
    setSelectedInstructor(value)
  }

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value as ReportTimeframe)
  }

  const exportReport = () => {
    if (!report) return

    const csvContent = [
      "Date,Flight Hours",
      ...report.chartData.map((item: any) => `${item.date},${item.hours}`),
      "\n",
      "Student,Syllabus,Progress %,Flight Hours,Completed Lessons,Total Lessons",
      ...report.studentProgress.map(
        (student: any) =>
          `${student.studentName},${student.syllabusTitle},${student.progressPercentage.toFixed(1)},${student.flightHours},${student.completedLessons},${student.totalLessons}`,
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `instructor-performance-report-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return <Skeleton className="h-[500px] w-full" />
  }

  const getInstructorName = (id: string) => {
    const instructor = instructors.find((i) => i.id === id)
    return instructor ? `${instructor.first_name} ${instructor.last_name}` : "Unknown Instructor"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Instructor Performance Report</h2>
          <p className="text-muted-foreground">Track instructor activity and student progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedInstructor} onValueChange={handleInstructorChange}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select instructor" />
            </SelectTrigger>
            <SelectContent>
              {instructors.map((instructor) => (
                <SelectItem key={instructor.id} value={instructor.id}>
                  {instructor.first_name} {instructor.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="quarter">Last 90 Days</SelectItem>
              <SelectItem value="year">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={exportReport} disabled={!report}>
            <Download className="h-4 w-4" />
            <span className="sr-only">Export report</span>
          </Button>
        </div>
      </div>

      {report ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Flight Hours</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.totalFlightHours.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Across {report.flightSessions} flight sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.activeStudents}</div>
                <p className="text-xs text-muted-foreground">
                  Currently assigned to {getInstructorName(selectedInstructor)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Hours Per Student</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.activeStudents > 0 ? (report.totalFlightHours / report.activeStudents).toFixed(1) : "0.0"}
                </div>
                <p className="text-xs text-muted-foreground">Average flight hours per student</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Flight Hours</CardTitle>
              <CardDescription>Total flight hours by day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={report.chartData}
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
                    <Bar dataKey="hours" name="Flight Hours" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Progress</CardTitle>
              <CardDescription>Progress of students assigned to this instructor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {report.studentProgress.map((student: any) => (
                  <div key={student.studentId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{student.studentName}</h4>
                        <p className="text-sm text-muted-foreground">{student.syllabusTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{student.flightHours.toFixed(1)} hours</p>
                        <p className="text-sm text-muted-foreground">
                          {student.completedLessons} of {student.totalLessons} lessons
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={student.progressPercentage} className="h-2" />
                      <span className="text-sm font-medium">{student.progressPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}

                {report.studentProgress.length === 0 && (
                  <div className="flex h-20 items-center justify-center rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground">No active students assigned to this instructor</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Details</CardTitle>
              <CardDescription>Detailed information for each student</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Syllabus</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Flight Hours</TableHead>
                    <TableHead>Completed Lessons</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.studentProgress.map((student: any) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="font-medium">{student.studentName}</TableCell>
                      <TableCell>{student.syllabusTitle}</TableCell>
                      <TableCell>{student.progressPercentage.toFixed(1)}%</TableCell>
                      <TableCell>{student.flightHours.toFixed(1)}</TableCell>
                      <TableCell>
                        {student.completedLessons} of {student.totalLessons}
                      </TableCell>
                    </TableRow>
                  ))}

                  {report.studentProgress.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No active students assigned to this instructor
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
            <h3 className="text-lg font-semibold">No report data available</h3>
            <p className="text-sm text-muted-foreground">Select an instructor and timeframe to generate a report</p>
            <Button className="mt-4" onClick={() => generateReport(selectedInstructor, timeframe)}>
              Generate Report
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
