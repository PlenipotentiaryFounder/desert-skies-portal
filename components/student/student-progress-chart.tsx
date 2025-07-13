"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface StudentProgressChartProps {
  studentId: string
}

export function StudentProgressChart({ studentId }: StudentProgressChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      try {
        // Get active enrollment
        const { data: enrollment } = await supabase
          .from("student_enrollments")
          .select("id, syllabus_id")
          .eq("student_id", studentId)
          .eq("status", "active")
          .single()

        if (!enrollment) {
          setLoading(false)
          return
        }

        // Get syllabus lessons
        const { data: lessons } = await supabase
          .from("syllabus_lessons")
          .select("id, title, order_index")
          .eq("syllabus_id", enrollment.syllabus_id)
          .order("order_index", { ascending: true })

        if (!lessons || lessons.length === 0) {
          setLoading(false)
          return
        }

        // Get flight sessions for this enrollment
        const { data: sessions } = await supabase
          .from("flight_sessions")
          .select("id, lesson_id, status")
          .eq("enrollment_id", enrollment.id)

        // Create chart data
        const chartData = lessons.map((lesson) => {
          const sessionsForLesson = sessions?.filter((s) => s.lesson_id === lesson.id) || []
          const completed = sessionsForLesson.some((s) => s.status === "completed")
          const inProgress = sessionsForLesson.some((s) => s.status === "scheduled" || s.status === "in_progress")

          return {
            name: `Lesson ${lesson.order_index + 1}`,
            value: completed ? 100 : inProgress ? 50 : 0,
            status: completed ? "completed" : inProgress ? "in_progress" : "not_started",
          }
        })

        setData(chartData)
      } catch (error) {
        console.error("Error fetching progress data:", error)
        setError("Failed to load progress data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, studentId])

  if (loading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  if (error) {
    return <div className="flex items-center justify-center h-[300px] text-destructive">{error}</div>
  }

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-[300px]">No progress data available</div>
  }

  return (
    <div className="h-[300px] w-full" role="img" aria-label="Student training progress bar chart">
      <span className="sr-only">Bar chart showing progress through syllabus lessons. Each bar represents a lesson and its completion status.</span>
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
          <YAxis domain={[0, 100]} />
          <Tooltip
            formatter={(value, name) => {
              if (value === 100) return ["Completed", ""]
              if (value === 50) return ["In Progress", ""]
              return ["Not Started", ""]
            }}
          />
          <Bar dataKey="value" name="Status">
            {data.map((entry, index) => {
              let fill = "#d1d5db" // gray for not started
              if (entry.status === "completed") {
                fill = "#10b981" // green for completed
              } else if (entry.status === "in_progress") {
                fill = "#f59e0b" // amber for in progress
              }
              return <Cell key={`cell-${index}`} fill={fill} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ul className="sr-only">
        {data.map((entry, idx) => (
          <li key={idx}>{entry.name}: {entry.status.replace('_', ' ')}</li>
        ))}
      </ul>
    </div>
  )
}
