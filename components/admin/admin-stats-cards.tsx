"use client"

import { useEffect, useState } from "react"
import { FileText, Plane, Users } from "lucide-react"
import type { Database } from "@/types/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AdminStatsCards() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalInstructors: 0,
    activeEnrollments: 0,
    totalAircraft: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get total students count
        const { count: totalStudents } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "student")

        // Get total instructors count
        const { count: totalInstructors } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "instructor")

        // Get active enrollments count
        const { count: activeEnrollments } = await supabase
          .from("student_enrollments")
          .select("*", { count: "exact", head: true })
          .eq("status", "active")

        // Get total aircraft count
        const { count: totalAircraft } = await supabase
          .from("aircraft")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true)

        setStats({
          totalStudents: totalStudents || 0,
          totalInstructors: totalInstructors || 0,
          activeEnrollments: activeEnrollments || 0,
          totalAircraft: totalAircraft || 0,
        })
      } catch (error) {
        console.error("Error fetching admin stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <div className="h-4 w-4 animate-pulse bg-muted rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold animate-pulse bg-muted h-8 w-16 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalStudents}</div>
          <p className="text-xs text-muted-foreground">Registered student pilots</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Instructors</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalInstructors}</div>
          <p className="text-xs text-muted-foreground">Certified flight instructors</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeEnrollments}</div>
          <p className="text-xs text-muted-foreground">Current training programs</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Aircraft</CardTitle>
          <Plane className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAircraft}</div>
          <p className="text-xs text-muted-foreground">Available aircraft for training</p>
        </CardContent>
      </Card>
    </div>
  )
}
