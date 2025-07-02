"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { CalendarClock, GraduationCap, Plane, User } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Activity {
  id: string
  type: "enrollment" | "flight_session" | "user_registration" | "document"
  description: string
  date: string
  icon: React.ReactNode
}

interface RecentActivityListProps {
  userId?: string
}

export function RecentActivityList({ userId }: RecentActivityListProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchActivity() {
      try {
        // Get recent enrollments
        let enrollmentsQuery = supabase
          .from("student_enrollments")
          .select(`
            id,
            created_at,
            student:student_id (
              first_name,
              last_name
            ),
            syllabus:syllabus_id (
              title
            )
          `)
          .order("created_at", { ascending: false })
          .limit(3)
        if (userId) {
          enrollmentsQuery = enrollmentsQuery.eq("student_id", userId)
        }
        const { data: enrollments } = await enrollmentsQuery

        // Get recent flight sessions
        let sessionsQuery = supabase
          .from("flight_sessions")
          .select(`
            id,
            created_at,
            student:enrollment_id (
              students:student_id (
                first_name,
                last_name
              )
            ),
            lesson:lesson_id (
              title
            )
          `)
          .order("created_at", { ascending: false })
          .limit(3)
        if (userId) {
          // Need to join through enrollment to student_id
          sessionsQuery = sessionsQuery.in("enrollment_id", (
            await supabase
              .from("student_enrollments")
              .select("id")
              .eq("student_id", userId)
          ).data?.map((e: any) => e.id) || [""])
        }
        const { data: sessions } = await sessionsQuery

        // Get recent user registrations
        let usersQuery = supabase
          .from("profiles")
          .select(`
            id,
            created_at,
            first_name,
            last_name,
            role
          `)
          .order("created_at", { ascending: false })
          .limit(3)
        if (userId) {
          usersQuery = usersQuery.eq("id", userId)
        }
        const { data: users } = await usersQuery

        // Transform data into activities
        const enrollmentActivities =
          enrollments?.map((enrollment) => ({
            id: `enrollment-${enrollment.id}`,
            type: "enrollment" as const,
            description: `${enrollment.student.first_name} ${enrollment.student.last_name} enrolled in ${enrollment.syllabus.title}`,
            date: enrollment.created_at,
            icon: <GraduationCap className="h-5 w-5 text-blue-500" />,
          })) || []

        const sessionActivities =
          sessions?.map((session) => ({
            id: `session-${session.id}`,
            type: "flight_session" as const,
            description: `Flight session for ${session.student.students.first_name} ${session.student.students.last_name}: ${session.lesson.title}`,
            date: session.created_at,
            icon: <Plane className="h-5 w-5 text-green-500" />,
          })) || []

        const userActivities =
          users?.map((user) => ({
            id: `user-${user.id}`,
            type: "user_registration" as const,
            description: `${user.first_name} ${user.last_name} registered as a ${user.role}`,
            date: user.created_at,
            icon: <User className="h-5 w-5 text-purple-500" />,
          })) || []

        // Combine and sort activities
        const allActivities = [...enrollmentActivities, ...sessionActivities, ...userActivities].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )

        setActivities(allActivities.slice(0, 10))
      } catch (error) {
        console.error("Error fetching activity:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [supabase, userId])

  if (loading) {
    return <div className="flex items-center justify-center h-[300px]">Loading activity data...</div>
  }

  if (activities.length === 0) {
    return <div className="flex items-center justify-center h-[300px]">No recent activity</div>
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg border">
          <div className="mt-0.5">{activity.icon}</div>
          <div className="flex-1">
            <p>{activity.description}</p>
            <div className="flex items-center mt-1 text-sm text-muted-foreground">
              <CalendarClock className="mr-1 h-3 w-3" />
              {formatDate(activity.date)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
