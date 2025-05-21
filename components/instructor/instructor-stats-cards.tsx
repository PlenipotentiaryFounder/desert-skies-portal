"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, Clock, Award } from "lucide-react"

interface InstructorStatsCardsProps {
  instructorId: string
}

export function InstructorStatsCards({ instructorId }: InstructorStatsCardsProps) {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSessions: 0,
    totalEndorsements: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/instructor/stats?instructorId=${instructorId}`)
        const data = await res.json()
        setStats({
          totalStudents: data.totalStudents || 0,
          totalSessions: data.totalSessions || 0,
          totalEndorsements: data.totalEndorsements || 0,
        })
      } catch (error) {
        console.error("Error fetching instructor stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [instructorId])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <div className="h-4 w-4 animate-pulse bg-muted rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Loading data...</p>
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
          <p className="text-xs text-muted-foreground">Students currently assigned to you</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSessions}</div>
          <p className="text-xs text-muted-foreground">Scheduled flight sessions</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Endorsements</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalEndorsements}</div>
          <p className="text-xs text-muted-foreground">Endorsements given</p>
        </CardContent>
      </Card>
    </div>
  )
}
