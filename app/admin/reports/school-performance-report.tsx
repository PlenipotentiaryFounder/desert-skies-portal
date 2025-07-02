"use client"

import { useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import { Calendar, Download, Users } from "lucide-react"
import type { ReportTimeframe } from "@/lib/report-service"

export function SchoolPerformanceReport() {
  const [timeframe, setTimeframe] = useState<ReportTimeframe>("month")
  const [isLoading, setIsLoading] = useState(false)
  const [report, setReport] = useState<any>(null)

  const generateReport = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/reports/school-performance?timeframe=${timeframe}`)
      const data = await res.json()
      setReport(data)
    } catch (error) {
      console.error("Error generating report:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate report on initial load and when timeframe changes
  useState(() => {
    generateReport()
  })

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value as ReportTimeframe)
    generateReport()
  }

  const exportReport = () => {
    if (!report) return

    const csvContent = [
      "Date,Flight Hours,New Enrollments",
      ...report.flightHoursChart.map((item: any) => {
        const enrollmentItem = report.enrollmentsChart.find((e: any) => e.date === item.date)
        return `${item.date},${item.hours},${enrollmentItem ? enrollmentItem.count : 0}`
      }),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `school-performance-report-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return <Skeleton className="h-[500px] w-full" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">School Performance Report</h2>
          <p className="text-muted-foreground">Overview of flight school operations and performance</p>
        </div>
        <div className="flex items-center gap-2">
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Flight Hours</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.totalFlightHours.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Across {report.totalFlightSessions} flight sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Enrollments</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.newEnrollments}</div>
                <p className="text-xs text-muted-foreground">{report.completedEnrollments} completed in this period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.activeStudents}</div>
                <p className="text-xs text-muted-foreground">Currently enrolled in programs</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Instructors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.activeInstructors}</div>
                <p className="text-xs text-muted-foreground">Certified flight instructors</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Flight Hours Trend</CardTitle>
                <CardDescription>Total flight hours over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={report.flightHoursChart}
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
                <CardTitle>New Enrollments</CardTitle>
                <CardDescription>Student enrollments over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={report.enrollmentsChart}
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
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        formatter={(value: number) => [`${value} enrollments`, "New Enrollments"]}
                        labelFormatter={(label) => formatDate(label)}
                      />
                      <Legend />
                      <Bar dataKey="count" name="New Enrollments" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
          <div className="flex flex-col items-center text-center">
            <h3 className="text-lg font-semibold">No report data available</h3>
            <p className="text-sm text-muted-foreground">Select a timeframe and generate a report</p>
            <Button className="mt-4" onClick={generateReport}>
              Generate Report
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
