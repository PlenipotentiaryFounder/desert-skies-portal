"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, CheckCircle2, Clock, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface ACSStandardsWidgetProps {
  userRole: "student" | "instructor" | "admin"
  userId: string
  certificateType?: string
  compact?: boolean
}

interface ACSProgress {
  overall_completion: number
  areas_of_operation: {
    area_id: string
    title: string
    completion_percentage: number
    tasks_completed: number
    total_tasks: number
  }[]
}

export function ACSStandardsWidget({ 
  userRole, 
  userId, 
  certificateType = "private_pilot",
  compact = false 
}: ACSStandardsWidgetProps) {
  const [progress, setProgress] = useState<ACSProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for demonstration
    // In production, this would fetch from the ACS service
    setTimeout(() => {
      setProgress({
        overall_completion: 67,
        areas_of_operation: [
          {
            area_id: "1",
            title: "Preflight Preparation",
            completion_percentage: 85,
            tasks_completed: 3,
            total_tasks: 4
          },
          {
            area_id: "2", 
            title: "Preflight Procedures",
            completion_percentage: 75,
            tasks_completed: 3,
            total_tasks: 4
          },
          {
            area_id: "3",
            title: "Airport and Seaplane Base Operations",
            completion_percentage: 45,
            tasks_completed: 2,
            total_tasks: 4
          },
          {
            area_id: "4",
            title: "Takeoffs, Landings, and Go-Arounds",
            completion_percentage: 60,
            tasks_completed: 3,
            total_tasks: 5
          }
        ]
      })
      setLoading(false)
    }, 1000)
  }, [userId, certificateType])

  if (loading) {
    return <ACSWidgetSkeleton compact={compact} />
  }

  if (!progress) {
    return <ACSWidgetError userRole={userRole} />
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600" 
    return "text-red-600"
  }

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 80) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>
    if (percentage >= 60) return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Good</Badge>
    return <Badge variant="default" className="bg-red-100 text-red-800">Needs Work</Badge>
  }

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">ACS Progress</span>
            </div>
            {getStatusBadge(progress.overall_completion)}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Completion</span>
              <span className={`font-semibold ${getStatusColor(progress.overall_completion)}`}>
                {progress.overall_completion}%
              </span>
            </div>
            <Progress value={progress.overall_completion} className="h-2" />
          </div>
          <Button 
            asChild 
            variant="outline" 
            size="sm" 
            className="w-full mt-3"
          >
            <Link href={`/${userRole}/requirements`}>
              View Details
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          ACS Standards Progress
        </CardTitle>
        <CardDescription>
          {userRole === "student" 
            ? "Your progress through Airman Certification Standards"
            : userRole === "instructor"
            ? "Student ACS progress overview"
            : "System-wide ACS compliance tracking"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Overall Completion</span>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${getStatusColor(progress.overall_completion)}`}>
                {progress.overall_completion}%
              </span>
              {getStatusBadge(progress.overall_completion)}
            </div>
          </div>
          <Progress value={progress.overall_completion} className="h-3" />
        </div>

        {/* Areas of Operation */}
        <div className="space-y-3">
          <h4 className="font-medium">Areas of Operation</h4>
          <div className="space-y-3">
            {progress.areas_of_operation.slice(0, 4).map((area) => (
              <div key={area.area_id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{area.title}</span>
                  <span className={`text-xs ${getStatusColor(area.completion_percentage)}`}>
                    {area.tasks_completed}/{area.total_tasks} tasks
                  </span>
                </div>
                <Progress value={area.completion_percentage} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link href={`/${userRole}/requirements`}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              View Requirements
            </Link>
          </Button>
          {userRole === "admin" && (
            <Button asChild variant="outline" className="flex-1">
              <Link href="/admin/requirements">
                <Users className="h-4 w-4 mr-2" />
                Manage ACS
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ACSWidgetSkeleton({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}

function ACSWidgetError({ userRole }: { userRole: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold mb-2">ACS Data Loading</h3>
        <p className="text-sm text-muted-foreground mb-4">
          ACS standards are being synchronized with the FAA monitoring system.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href={`/${userRole}/requirements`}>
            View Requirements
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
} 