"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Target, TrendingUp, Award } from "lucide-react"

interface SyllabusRequirementsOverviewProps {
  enrollmentId: string
  studentId: string
}

interface RequirementProgress {
  id: string
  name: string
  category: string
  current_value: number
  minimum_value: number
  unit: string
  is_complete: boolean
  progress_percentage: number
}

interface OverviewData {
  syllabusProgress: number
  requirementsProgress: number
  totalFlightHours: number
  completedLessons: number
  totalLessons: number
  requirements: RequirementProgress[]
  estimatedCompletion: string | null
}

export function SyllabusRequirementsOverview({ enrollmentId, studentId }: SyllabusRequirementsOverviewProps) {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchOverviewData() {
      try {
        // Get enrollment details
        const { data: enrollment } = await supabase
          .from("student_enrollments")
          .select(`
            syllabus_id,
            target_completion_date,
            syllabus:syllabus_id (
              title,
              faa_type
            )
          `)
          .eq("id", enrollmentId)
          .single()

        if (!enrollment) {
          setLoading(false)
          return
        }

        // Get syllabus progress
        const { count: totalLessons } = await supabase
          .from("syllabus_lessons")
          .select("*", { count: "exact", head: true })
          .eq("syllabus_id", enrollment.syllabus_id)

        const { data: sessions } = await supabase
          .from("flight_sessions")
          .select(`
            id,
            lesson_id,
            status,
            hobbs_start,
            hobbs_end,
            maneuver_scores (
              score,
              maneuver_id
            )
          `)
          .eq("enrollment_id", enrollmentId)

        // Calculate syllabus completion
        const completedSessions = sessions?.filter(s => s.status === "completed") || []
        const uniqueCompletedLessons = new Set(completedSessions.map(s => s.lesson_id)).size
        const syllabusProgress = totalLessons ? (uniqueCompletedLessons / totalLessons) * 100 : 0

        // Calculate total flight hours
        const totalFlightHours = completedSessions.reduce((total, session) => {
          const hobbsTime = (session.hobbs_end || 0) - (session.hobbs_start || 0)
          return total + Math.max(0, hobbsTime)
        }, 0)

        // Get student requirements
        const { data: requirements } = await supabase
          .from("student_requirements")
          .select(`
            id,
            current_value,
            is_complete,
            requirement:requirement_id (
              id,
              name,
              category,
              minimum_value,
              unit,
              certificate_type
            )
          `)
          .eq("student_id", studentId)

        // Process requirements data
        const processedRequirements: RequirementProgress[] = (requirements || [])
          .filter(req => req.requirement && enrollment.syllabus?.faa_type === req.requirement.certificate_type)
          .map(req => ({
            id: req.id,
            name: req.requirement.name,
            category: req.requirement.category,
            current_value: req.current_value,
            minimum_value: req.requirement.minimum_value,
            unit: req.requirement.unit,
            is_complete: req.is_complete,
            progress_percentage: Math.min(100, (req.current_value / req.requirement.minimum_value) * 100)
          }))

        const completedRequirements = processedRequirements.filter(r => r.is_complete).length
        const requirementsProgress = processedRequirements.length > 0 
          ? (completedRequirements / processedRequirements.length) * 100 
          : 0

        setData({
          syllabusProgress,
          requirementsProgress,
          totalFlightHours,
          completedLessons: uniqueCompletedLessons,
          totalLessons: totalLessons || 0,
          requirements: processedRequirements,
          estimatedCompletion: enrollment.target_completion_date
        })

      } catch (error) {
        console.error("Error fetching overview data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOverviewData()
  }, [supabase, enrollmentId, studentId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Training Overview</CardTitle>
          <CardDescription>Loading your training progress...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Training Overview</CardTitle>
          <CardDescription>Unable to load training progress</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const overallProgress = (data.syllabusProgress + data.requirementsProgress) / 2

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Training Overview
        </CardTitle>
        <CardDescription>
          Your comprehensive progress toward certification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Overall Training Progress</p>
                <p className="text-sm text-muted-foreground">
                  Combining syllabus completion and FAA requirements
                </p>
              </div>
              <span className="text-2xl font-bold">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold">{data.totalFlightHours.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Flight Hours</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold">{data.completedLessons}</div>
              <div className="text-xs text-muted-foreground">Lessons Complete</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold">{Math.round(data.syllabusProgress)}%</div>
              <div className="text-xs text-muted-foreground">Syllabus Progress</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold">{Math.round(data.requirementsProgress)}%</div>
              <div className="text-xs text-muted-foreground">FAA Requirements</div>
            </div>
          </div>

          {/* Progress Breakdown */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="font-medium">Syllabus Progress</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Lessons Completed</span>
                  <span>{data.completedLessons} / {data.totalLessons}</span>
                </div>
                <Progress value={data.syllabusProgress} className="h-2" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">FAA Requirements</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Requirements Met</span>
                  <span>{data.requirements.filter(r => r.is_complete).length} / {data.requirements.length}</span>
                </div>
                <Progress value={data.requirementsProgress} className="h-2" />
              </div>
            </div>
          </div>

          {/* Critical Requirements */}
          {data.requirements.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Key Requirements Progress</span>
              </div>
              <div className="space-y-2">
                {data.requirements
                  .filter(req => req.category === "total_time" || req.category === "solo" || req.category === "cross_country")
                  .slice(0, 3)
                  .map(req => (
                    <div key={req.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{req.name}</span>
                        {req.is_complete && <CheckCircle className="h-3 w-3 text-green-600" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {req.current_value.toFixed(1)} / {req.minimum_value} {req.unit}
                        </span>
                        <div className="w-16">
                          <Progress value={req.progress_percentage} className="h-1" />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Estimated Completion */}
          {data.estimatedCompletion && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-sm font-medium">Target Completion: </span>
                <span className="text-sm text-muted-foreground">
                  {new Date(data.estimatedCompletion).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 