"use client"

import { useState, useEffect } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { type ReportTimeframe } from "@/lib/report-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { Calendar, Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface InstructorFlightHoursReportProps {
  instructorId: string
}

export function InstructorFlightHoursReport({ instructorId }: InstructorFlightHoursReportProps) {
  const [timeframe, setTimeframe] = useState<ReportTimeframe>("month")
  const [isLoading, setIsLoading] = useState(false)
  const [report, setReport] = useState<any>(null)
  const { toast } = useToast()

  const generateReport = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/instructor/reports?timeframe=${timeframe}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch report: ${response.statusText}`)
      }
      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Failed to generate flight hours report",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Generate report on initial load and when timeframe changes
  useEffect(() => {
    generateReport()
  }, [timeframe])

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value as ReportTimeframe)
  }

  const exportReport = () => {
    if (!report) return

    const csvContent = [
      "Date,Flight Hours",
      ...report.chartData.map((item: any) => `${item.date},${item.hours}`),
      "\n",
      "Student,Aircraft,Date,Duration",
      ...report.rawData.map(
        (session: any) =>
          `${session.student.first_name} ${session.student.last_name},${session.aircraft.registration},${session.date},${session.duration}`,
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `flight-hours-report-${new Date().toISOString().split("T")[0]}.csv`)
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
          <h2 className="text-2xl font-bold">Flight Hours Report</h2>
          <p className="text-muted-foreground">Track your flight instruction hours</p>
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
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Flight Hours</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.totalFlightHours.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Across {report.flightSessions} flight sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.activeStudents}</div>
                <p className="text-xs text-muted-foreground">Currently assigned to you</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Hours Per Session</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.flightSessions > 0 ? (report.totalFlightHours / report.flightSessions).toFixed(1) : "0.0"}
                </div>
                <p className="text-xs text-muted-foreground">Average duration per flight session</p>
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
              <CardTitle>Recent Flight Sessions</CardTitle>
              <CardDescription>Your most recent flight instruction sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Aircraft</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.rawData.slice(0, 10).map((session: any) => (
                    <TableRow key={session.id}>
                      <TableCell>{formatDate(session.date)}</TableCell>
                      <TableCell>
                        {session.student.first_name} {session.student.last_name}
                      </TableCell>
                      <TableCell>
                        {session.aircraft.registration} ({session.aircraft.model})
                      </TableCell>
                      <TableCell>{session.duration.toFixed(1)} hours</TableCell>
                    </TableRow>
                  ))}
                  {report.rawData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No flight sessions found for the selected timeframe.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground">No report data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
