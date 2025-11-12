"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ACSArea {
  id: string
  area_code: string
  title: string
  description: string | null
  tasks: ACSTask[]
  completion_percentage: number
  tasks_completed: number
  total_tasks: number
}

interface ACSTask {
  id: string
  task_code: string
  title: string
  description: string | null
  proficiency_level: number
  last_evaluated: string | null
  meets_standard: boolean
}

interface ACSProgressResponse {
  certificate_type: string
  overall_completion: number
  checkride_ready: boolean
  total_tasks: number
  completed_tasks: number
  areas_of_operation: ACSArea[]
}

interface ACSStandardsWidgetProps {
  userRole: "student" | "instructor" | "admin"
  userId: string
  certificateType: string
}

export function ACSStandardsWidget({ userRole, userId, certificateType }: ACSStandardsWidgetProps) {
  const [areas, setAreas] = useState<ACSArea[]>([])
  const [overallProgress, setOverallProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchACSProgress() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/student/acs-progress?certificateType=${certificateType}`, {
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data: ACSProgressResponse = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }

        setAreas(data.areas_of_operation || [])
        setOverallProgress(data.overall_completion || 0)
        
      } catch (error) {
        console.error("Error fetching ACS progress:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch ACS progress")
        setAreas([])
        setOverallProgress(0)
      } finally {
        setLoading(false)
      }
    }

    fetchACSProgress()
  }, [certificateType, userId])

  const getTaskStatusIcon = (task: ACSTask) => {
    if (task.proficiency_level >= 3 && task.meets_standard) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else if (task.proficiency_level >= 2) {
      return <Clock className="h-4 w-4 text-yellow-500" />
    } else if (task.proficiency_level >= 1) {
      return <AlertCircle className="h-4 w-4 text-orange-500" />
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getTaskStatusBadge = (task: ACSTask) => {
    if (task.proficiency_level >= 3 && task.meets_standard) {
      return <Badge variant="default" className="bg-green-500">Proficient</Badge>
    } else if (task.proficiency_level >= 2) {
      return <Badge variant="secondary">Developing</Badge>
    } else if (task.proficiency_level >= 1) {
      return <Badge variant="outline">Introduced</Badge>
    } else {
      return <Badge variant="destructive">Not Started</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ACS Standards Progress</CardTitle>
          <CardDescription>Loading your progress...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ACS Standards Progress</CardTitle>
          <CardDescription>Error loading progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ACS Standards Progress</CardTitle>
        <CardDescription>
          Your progress toward Private Pilot certification standards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Areas of Operation */}
        <div className="space-y-4">
          {areas.map((area) => (
            <div key={area.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium">{area.area_code} - {area.title}</h4>
                  {area.description && (
                    <p className="text-sm text-muted-foreground mt-1">{area.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{area.completion_percentage.toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">
                    {area.tasks_completed}/{area.total_tasks} tasks
                  </div>
                </div>
              </div>
              
              <Progress value={area.completion_percentage} className="h-1 mb-3" />
              
              {/* Tasks */}
              <div className="space-y-2">
                {area.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      {getTaskStatusIcon(task)}
                      <div>
                        <div className="text-sm font-medium">{task.task_code} - {task.title}</div>
                        {task.last_evaluated && (
                          <div className="text-xs text-muted-foreground">
                            Last evaluated: {new Date(task.last_evaluated).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    {getTaskStatusBadge(task)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {areas.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No ACS areas found for {certificateType}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 