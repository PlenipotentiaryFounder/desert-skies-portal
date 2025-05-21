"use client"

import { useState } from "react"
import { saveManeuverScores } from "@/lib/flight-session-service"
import { getScoreLabel } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"

interface ManeuverScoringProps {
  sessionId: string
  maneuvers: Array<{
    id: string
    name: string
    category: string
    is_required: boolean
  }>
  existingScores: Array<{
    id: string
    maneuver_id: string
    score: number
    notes: string | null
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
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1 md:flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{maneuver.name}</div>
                        {maneuver.is_required && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
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
                  {scoreData?.score > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium">Notes</div>
                      <Input
                        value={scoreData?.notes || ""}
                        onChange={(e) => handleNotesChange(maneuver.id, e.target.value)}
                        placeholder="Add notes about this maneuver performance..."
                        className="mt-1"
                      />
                    </div>
                  )}
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
