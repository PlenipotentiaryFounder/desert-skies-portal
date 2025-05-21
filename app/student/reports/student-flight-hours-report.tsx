"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { getFlightHoursReport } from "@/lib/report-service"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import { Download } from "lucide-react"

interface StudentFlightHoursReportProps {
  studentId: string
}

export function StudentFlightHoursReport({ studentId }: StudentFlightHoursReportProps) {
  const [timeframe, setTimeframe] = useState("month")
  const [isLoading, setIsLoading] = useState(true)
  const [report, setReport] = useState<any>(null)

  useEffect(() => {
    async function fetchReport() {
      setIsLoading(true)
      try {
        const data = await getFlightHoursReport(timeframe as any, { studentId })
        setReport(data)
      } catch (error) {
        console.error("Error fetching flight hours:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReport()
  }, [studentId, timeframe])

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value)
  }

  const exportReport = () => {
    if (!report) return

    const csvContent = ["Date,Flight Hours", ...report.chartData.map((item: any) => `${item.date},${item.hours}`)].join(
      "\n",
    )

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `my-flight-hours-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-medium">Total: {report?.totalHours.toFixed(1)} hours</p>
          <p className="text-sm text-muted-foreground">{report?.flightSessions} flight sessions</p>
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

      {report && report.chartData.length > 0 ? (
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
              <XAxis dataKey="date" tickFormatter={(value) => formatDate(value, { month: "short", day: "numeric" })} />
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
      ) : (
        <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
          <div className="flex flex-col items-center text-center">
            <h3 className="text-lg font-semibold">No flight hours recorded</h3>
            <p className="text-sm text-muted-foreground">You don't have any flight sessions in this time period</p>
          </div>
        </div>
      )}
    </div>
  )
}
