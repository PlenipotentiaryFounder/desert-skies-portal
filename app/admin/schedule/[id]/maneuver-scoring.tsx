"use client"

import { useState } from "react"
import { saveManeuverScores } from "@/lib/flight-session-service"
import { getScoreLabel } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

interface ManeuverScoringProps {
  sessionId: string
  maneuvers: Array<{
    id: string
    name: string
    category: string
    is_required: boolean
    acs_tasks?: Array<{
      id: string
      task_code: string
      title: string
    }>
    standards?: {
      altitude_tolerance?: string
      airspeed_tolerance?: string
      heading_tolerance?: string
      performance_criteria?: string[]
      common_errors?: string[]
    }
  }>
  existingScores: Array<{
    id: string
    maneuver_id: string
    score: number
    notes: string | null
    acs_task_id?: string | null
    meets_acs_standard?: boolean | null
    areas_for_improvement?: string | null
  }>
}

export function ManeuverScoring({ sessionId, maneuvers, existingScores }: ManeuverScoringProps) {
  // Initialize scores from existing data or defaults
  const initialScores = maneuvers.map((maneuver) => {
    const existingScore = existingScores.find((s) => s.maneuver_id === maneuver.id)
    return {
      maneuver_id: maneuver.id,
      score: existingScore ? existingScore.score : 0,
      notes: existingScore ? existingScore.notes || "" : "",
      acs_task_id: existingScore ? existingScore.acs_task_id || null : null,
      meets_acs_standard: existingScore ? existingScore.meets_acs_standard || false : false,
      areas_for_improvement: existingScore ? existingScore.areas_for_improvement || "" : "",
    }
  })

  const [scores, setScores] = useState(initialScores)
  const [saving, setSaving] = useState(false)

  // Group maneuvers by category
  const maneuversByCategory = maneuvers.reduce(
    (acc, maneuver) => {
      if (!acc[maneuver.category]) {
        acc[maneuver.category] = []
      }
      acc[maneuver.category].push(maneuver)
      return acc
    },
    {} as Record<string, typeof maneuvers>,
  )

  const handleScoreChange = (maneuver_id: string, score: number) => {
    setScores(scores.map((s) => (s.maneuver_id === maneuver_id ? { ...s, score } : s)))
  }

  const handleNotesChange = (maneuver_id: string, notes: string) => {
    setScores(scores.map((s) => (s.maneuver_id === maneuver_id ? { ...s, notes } : s)))
  }

  const handleACSTaskChange = (maneuver_id: string, acs_task_id: string | null) => {
    setScores(scores.map((s) => (s.maneuver_id === maneuver_id ? { ...s, acs_task_id } : s)))
  }

  const handleStandardChange = (maneuver_id: string, meets_acs_standard: boolean) => {
    setScores(scores.map((s) => (s.maneuver_id === maneuver_id ? { ...s, meets_acs_standard } : s)))
  }

  const handleAreasForImprovementChange = (maneuver_id: string, areas_for_improvement: string) => {
    setScores(scores.map((s) => (s.maneuver_id === maneuver_id ? { ...s, areas_for_improvement } : s)))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await saveManeuverScores(sessionId, scores)
      if (result.success) {
        toast({
          title: "Scores saved",
          description: "Maneuver scores have been saved successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save scores. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving scores:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {Object.entries(maneuversByCategory).map(([category, categoryManeuvers]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-md font-medium capitalize">{category}</h3>
          <div className="space-y-4">
            {categoryManeuvers.map((maneuver) => {
              const scoreData = scores.find((s) => s.maneuver_id === maneuver.id)
              const scoreLabel = getScoreLabel(scoreData?.score || 0)

              return (
                <div key={maneuver.id} className="rounded-lg border p-4">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1 md:flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{maneuver.name}</div>
                          {maneuver.is_required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        {maneuver.standards && (
                          <div className="text-sm text-muted-foreground">
                            {maneuver.standards.altitude_tolerance && (
                              <div>Altitude: {maneuver.standards.altitude_tolerance}</div>
                            )}
                            {maneuver.standards.airspeed_tolerance && (
                              <div>Airspeed: {maneuver.standards.airspeed_tolerance}</div>
                            )}
                            {maneuver.standards.heading_tolerance && (
                              <div>Heading: {maneuver.standards.heading_tolerance}</div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Score Selection */}
                      <div className="flex flex-col gap-2 md:w-[180px]">
                        <div className="text-sm font-medium">Score</div>
                        <Select
                          value={scoreData?.score?.toString() || "0"}
                          onValueChange={(value) => handleScoreChange(maneuver.id, Number.parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a score" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Not Evaluated</SelectItem>
                            <SelectItem value="1">1 - Unsatisfactory</SelectItem>
                            <SelectItem value="2">2 - Developing</SelectItem>
                            <SelectItem value="3">3 - Proficient</SelectItem>
                            <SelectItem value="4">4 - Excellent</SelectItem>
                            <SelectItem value="5">5 - Exemplary</SelectItem>
                          </SelectContent>
                        </Select>
                        {scoreData?.score > 0 && <div className={`text-xs ${scoreLabel.color}`}>{scoreLabel.label}</div>}
                      </div>
                    </div>

                    {/* ACS Task Selection */}
                    {maneuver.acs_tasks && maneuver.acs_tasks.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">ACS Task</div>
                        <Select
                          value={scoreData?.acs_task_id || ""}
                          onValueChange={(value) => handleACSTaskChange(maneuver.id, value || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select ACS task (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No specific task</SelectItem>
                            {maneuver.acs_tasks.map((task) => (
                              <SelectItem key={task.id} value={task.id}>
                                {task.task_code}: {task.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* ACS Standard Checkbox */}
                    {scoreData?.score > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`meets-standard-${maneuver.id}`}
                            checked={scoreData.meets_acs_standard || false}
                            onCheckedChange={(checked) => 
                              handleStandardChange(maneuver.id, checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`meets-standard-${maneuver.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Meets ACS Standard
                          </label>
                        </div>

                        {/* Performance Standards */}
                        {maneuver.standards?.performance_criteria && (
                          <div className="text-sm">
                            <div className="font-medium">Performance Criteria:</div>
                            <ul className="list-disc list-inside text-muted-foreground">
                              {maneuver.standards.performance_criteria.map((criteria, index) => (
                                <li key={index}>{criteria}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Common Errors */}
                        {maneuver.standards?.common_errors && (
                          <div className="text-sm">
                            <div className="font-medium">Common Errors:</div>
                            <ul className="list-disc list-inside text-muted-foreground">
                              {maneuver.standards.common_errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Notes */}
                        <div>
                          <div className="text-sm font-medium mb-1">Instructor Notes</div>
                          <Textarea
                            value={scoreData?.notes || ""}
                            onChange={(e) => handleNotesChange(maneuver.id, e.target.value)}
                            placeholder="Add notes about this maneuver performance..."
                            className="min-h-[60px]"
                          />
                        </div>

                        {/* Areas for Improvement */}
                        <div>
                          <div className="text-sm font-medium mb-1">Areas for Improvement</div>
                          <Textarea
                            value={scoreData?.areas_for_improvement || ""}
                            onChange={(e) => handleAreasForImprovementChange(maneuver.id, e.target.value)}
                            placeholder="Specific areas where the student can improve..."
                            className="min-h-[60px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <Separator />
        </div>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Scores"}
        </Button>
      </div>
    </div>
  )
}
