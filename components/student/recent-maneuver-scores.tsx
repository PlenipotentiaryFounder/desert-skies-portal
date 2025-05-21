"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getScoreLabel } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

interface RecentManeuverScoresProps {
  studentId: string
}

interface ManeuverScore {
  id: string
  score: number
  maneuver: {
    name: string
    category: string
  }
  flight_session: {
    date: string
  }
}

export function RecentManeuverScores({ studentId }: RecentManeuverScoresProps) {
  const [scores, setScores] = useState<ManeuverScore[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchScores() {
      try {
        // Get active enrollment
        const { data: enrollments } = await supabase
          .from("student_enrollments")
          .select("id")
          .eq("student_id", studentId)
          .eq("status", "active")

        if (!enrollments || enrollments.length === 0) {
          setLoading(false)
          return
        }

        const enrollmentIds = enrollments.map((e) => e.id)

        // Get recent flight sessions
        const { data: sessions } = await supabase
          .from("flight_sessions")
          .select("id, date")
          .in("enrollment_id", enrollmentIds)
          .eq("status", "completed")
          .order("date", { ascending: false })
          .limit(5)

        if (!sessions || sessions.length === 0) {
          setLoading(false)
          return
        }

        const sessionIds = sessions.map((s) => s.id)

        // Get maneuver scores for these sessions
        const { data } = await supabase
          .from("maneuver_scores")
          .select(`
            id,
            score,
            maneuver:maneuver_id (
              name,
              category
            ),
            flight_session:flight_session_id (
              date
            )
          `)
          .in("flight_session_id", sessionIds)
          .order("created_at", { ascending: false })
          .limit(10)

        setScores((data as unknown as ManeuverScore[]) || [])
      } catch (error) {
        console.error("Error fetching maneuver scores:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchScores()
  }, [supabase, studentId])

  if (loading) {
    return <div className="flex items-center justify-center h-[300px]">Loading maneuver scores...</div>
  }

  if (scores.length === 0) {
    return <div className="flex items-center justify-center h-[300px]">No recent maneuver scores available</div>
  }

  return (
    <div className="space-y-4">
      {scores.map((score) => {
        const { label, color } = getScoreLabel(score.score)
        const progressValue = (score.score / 5) * 100

        return (
          <div key={score.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="font-medium">{score.maneuver.name}</div>
              <div className={`text-sm font-medium ${color}`}>{label}</div>
            </div>
            <Progress value={progressValue} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <div>{score.maneuver.category}</div>
              <div>{new Date(score.flight_session.date).toLocaleDateString()}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
