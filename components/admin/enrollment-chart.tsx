"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface MonthlyData {
  name: string
  count: number
}

export function EnrollmentChart() {
  const [data, setData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchEnrollmentData() {
      try {
        // Get all enrollments from the past 12 months
        const endDate = new Date()
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 11)

        const { data: enrollments } = await supabase
          .from("student_enrollments")
          .select("created_at")
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())

        if (!enrollments) {
          setLoading(false)
          return
        }

        // Initialize monthly data
        const monthlyData: Record<string, number> = {}
        const months = []

        // Create array of last 12 months
        for (let i = 0; i < 12; i++) {
          const date = new Date()
          date.setMonth(date.getMonth() - i)
          const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`
          months.unshift(monthYear)
          monthlyData[monthYear] = 0
        }

        // Count enrollments by month
        enrollments.forEach((enrollment) => {
          const date = new Date(enrollment.created_at)
          const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`
          if (monthlyData[monthYear] !== undefined) {
            monthlyData[monthYear]++
          }
        })

        // Convert to array format for chart
        const chartData = months.map((month) => ({
          name: month,
          count: monthlyData[month],
        }))

        setData(chartData)
      } catch (error) {
        console.error("Error fetching enrollment data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEnrollmentData()
  }, [supabase])

  if (loading) {
    return <div className="flex items-center justify-center h-[300px]">Loading enrollment data...</div>
  }

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-[300px]">No enrollment data available</div>
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 25,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" name="New Enrollments" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
