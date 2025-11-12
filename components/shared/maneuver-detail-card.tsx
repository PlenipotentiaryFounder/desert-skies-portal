"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react"
import { FOI_PROFICIENCY_LEVELS } from "@/lib/foi-levels"
import type { ManeuverDetail } from "@/lib/plan-of-action-service"

interface ManeuverDetailCardProps {
  maneuver: ManeuverDetail
  viewType: "instructor" | "student"
  className?: string
}

export function ManeuverDetailCard({ maneuver, viewType, className = "" }: ManeuverDetailCardProps) {
  const proficiency = FOI_PROFICIENCY_LEVELS[maneuver.target_proficiency]
  
  // Determine trend icon and color
  const getTrendDisplay = () => {
    if (!maneuver.student_trend || maneuver.student_trend === "insufficient_data") {
      return { icon: Minus, color: "text-gray-400", label: "Not enough data" }
    }
    
    switch (maneuver.student_trend) {
      case "improving":
        return { icon: TrendingUp, color: "text-green-600", label: "Improving" }
      case "declining":
        return { icon: TrendingDown, color: "text-red-600", label: "Declining" }
      case "stable":
        return { icon: Minus, color: "text-blue-600", label: "Stable" }
      default:
        return { icon: Minus, color: "text-gray-400", label: "Unknown" }
    }
  }

  const trend = getTrendDisplay()
  const TrendIcon = trend.icon

  // Determine emphasis level color
  const getEmphasisColor = () => {
    switch (maneuver.emphasis_level) {
      case "introduction":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
      case "proficiency":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "mastery":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-base">{maneuver.maneuver_name}</h4>
            <p className="text-sm text-muted-foreground">{maneuver.category}</p>
          </div>
          <div className="flex items-center gap-2">
            {maneuver.is_required && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
            <Badge variant="outline" className={`text-xs ${getEmphasisColor()}`}>
              {maneuver.emphasis_level}
            </Badge>
          </div>
        </div>

        {/* Proficiency Levels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 pb-3 border-b">
          {/* Target Proficiency */}
          <div>
            <div className="text-xs text-muted-foreground mb-1">Target Proficiency</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{proficiency.icon}</span>
              <div>
                <div className="font-medium text-sm">
                  Level {maneuver.target_proficiency} - {maneuver.proficiency_label}
                </div>
                <div className="text-xs text-muted-foreground">{proficiency.shortDesc}</div>
              </div>
            </div>
          </div>

          {/* Student's Current Level (if available) */}
          {maneuver.student_current_proficiency !== undefined && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                {viewType === "student" ? "Your Current Level" : "Student's Current Level"}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {FOI_PROFICIENCY_LEVELS[maneuver.student_current_proficiency as 1 | 2 | 3 | 4].icon}
                </span>
                <div>
                  <div className="font-medium text-sm">
                    Level {maneuver.student_current_proficiency} - {FOI_PROFICIENCY_LEVELS[maneuver.student_current_proficiency as 1 | 2 | 3 | 4].name}
                  </div>
                  {maneuver.student_trend && maneuver.student_trend !== "insufficient_data" && (
                    <div className={`text-xs flex items-center gap-1 ${trend.color}`}>
                      <TrendIcon className="w-3 h-3" />
                      <span>{trend.label}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Progress Indicator if both current and target are available */}
          {maneuver.student_current_proficiency !== undefined && (
            <div className="md:col-span-2">
              <div className="text-xs text-muted-foreground mb-2">Progress to Target</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      maneuver.student_current_proficiency >= maneuver.target_proficiency
                        ? "bg-green-500"
                        : "bg-blue-500"
                    }`}
                    style={{ 
                      width: `${(maneuver.student_current_proficiency / maneuver.target_proficiency) * 100}%` 
                    }}
                  />
                </div>
                <span className="text-xs font-medium">
                  {maneuver.student_current_proficiency >= maneuver.target_proficiency ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Target Met
                    </span>
                  ) : (
                    <span className="text-blue-600">
                      {Math.round((maneuver.student_current_proficiency / maneuver.target_proficiency) * 100)}%
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Success Criteria */}
        {maneuver.success_criteria && maneuver.success_criteria.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Success Criteria (ACS Standards)
            </div>
            <ul className="space-y-1">
              {maneuver.success_criteria.slice(0, 5).map((criteria, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{criteria}</span>
                </li>
              ))}
              {maneuver.success_criteria.length > 5 && (
                <li className="text-xs text-muted-foreground ml-6">
                  + {maneuver.success_criteria.length - 5} more criteria...
                </li>
              )}
            </ul>
          </div>
        )}

        {/* ACS Task Codes */}
        {maneuver.acs_task_codes && maneuver.acs_task_codes.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground">ACS Tasks:</span>
            <div className="flex flex-wrap gap-1">
              {maneuver.acs_task_codes.map((code) => (
                <Badge key={code} variant="outline" className="text-xs font-mono">
                  {code}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Instructor Notes (instructor view only) */}
        {viewType === "instructor" && maneuver.instructor_notes && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded border border-blue-200 dark:border-blue-800 mb-3">
            <div className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
              Teaching Notes
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {maneuver.instructor_notes}
            </p>
          </div>
        )}

        {/* Student Prep Notes (both views) */}
        {maneuver.student_prep_notes && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
            <div className="text-xs font-medium text-yellow-900 dark:text-yellow-100 mb-1">
              {viewType === "student" ? "Preparation Notes" : "Student Prep Notes"}
            </div>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {maneuver.student_prep_notes}
            </p>
          </div>
        )}

        {/* Alert if student needs improvement */}
        {maneuver.student_current_proficiency !== undefined && 
         maneuver.student_current_proficiency < maneuver.target_proficiency && (
          <div className="mt-3 flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded border border-orange-200 dark:border-orange-800">
            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-orange-800 dark:text-orange-200">
              {viewType === "student" 
                ? `You're currently at Level ${maneuver.student_current_proficiency}. Focus on reaching Level ${maneuver.target_proficiency} (${maneuver.proficiency_label}).`
                : `Student needs ${maneuver.target_proficiency - maneuver.student_current_proficiency} level(s) to reach target proficiency.`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

