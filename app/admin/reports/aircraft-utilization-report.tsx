"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { getAircraftUtilizationReport, type ReportTimeframe } from "@/lib/report-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { Download, Plane } from "lucide-react"

export function AircraftUtilizationReport() {
  const [timeframe, setTimeframe] = useState<ReportTimeframe>("month")
  const [isLoading, setIsLoading] = useState(false)
  const [report, setReport] = useState<any>(null)

  const generateReport = async () => {
    setIsLoading(true)
    try {
      const data = await getAircraftUtilizationReport(timeframe)
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
      "Aircraft,Registration,Model,Total Hours,Flight Sessions,Utilization %,Maintenance Status",
      ...report.aircraftUtilization.map((item: any) => {
        return `${item.registration},${item.registration},${item.model},${item.totalHours},${item.flightSessions},${item.utilizationPercentage.toFixed(2)},${item.maintenanceStatus}`
      }),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `aircraft-utilization-report-${new Date().toISOString().split("T")[0]}.csv`)
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
          <h2 className="text-2xl font-bold">Aircraft Utilization Report</h2>
          <p className="text-muted-foreground">Track aircraft usage and efficiency</p>
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
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Flight Hours</CardTitle>
                <Plane className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.totalHours.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Across {report.totalAircraft} active aircraft</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Utilization</CardTitle>
                <Plane className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(
                    report.aircraftUtilization.reduce((sum: number, ac: any) => sum + ac.utilizationPercentage, 0) /
                    report.totalAircraft
                  ).toFixed(1)}
                  %
                </div>
                <p className="text-xs text-muted-foreground">Average utilization across all aircraft</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Aircraft Utilization</CardTitle>
              <CardDescription>Hours flown and utilization by aircraft</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {report.aircraftUtilization.map((aircraft: any) => (
                  <div key={aircraft.aircraftId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{aircraft.registration}</h4>
                        <p className="text-sm text-muted-foreground">{aircraft.model}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{aircraft.totalHours.toFixed(1)} hours</p>
                        <p className="text-sm text-muted-foreground">{aircraft.flightSessions} sessions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={aircraft.utilizationPercentage} className="h-2" />
                      <span className="text-sm font-medium">{aircraft.utilizationPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Flight Hours</CardTitle>
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
              <CardTitle>Aircraft Details</CardTitle>
              <CardDescription>Detailed information for each aircraft</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registration</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Maintenance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.aircraftUtilization.map((aircraft: any) => (
                    <TableRow key={aircraft.aircraftId}>
                      <TableCell className="font-medium">{aircraft.registration}</TableCell>
                      <TableCell>{aircraft.model}</TableCell>
                      <TableCell>{aircraft.totalHours.toFixed(1)}</TableCell>
                      <TableCell>{aircraft.flightSessions}</TableCell>
                      <TableCell>{aircraft.utilizationPercentage.toFixed(1)}%</TableCell>
                      <TableCell>{aircraft.maintenanceStatus}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
