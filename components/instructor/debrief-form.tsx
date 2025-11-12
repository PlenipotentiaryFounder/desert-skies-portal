"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Mic,
  StopCircle,
  Sparkles,
  Save,
  Target,
  FileText,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Award,
  Info
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { VoiceRecorder } from "@/components/shared/voice-recorder"

interface DebriefFormProps {
  mission: any
  maneuvers: any[]
  instructorId: string
}

interface ManeuverScore {
  maneuver_id: string
  maneuver_name: string
  score: number  // 1-4
  acs_standard_met: boolean
  notes: string
  strengths: string[]
  areas_for_improvement: string[]
}

interface KeyTakeaway {
  category: "strength" | "improvement" | "correction"
  observation: string
  evidence: string
  coaching: string
  priority: "high" | "medium" | "low"
}

export function DebriefForm({ mission, maneuvers, instructorId }: DebriefFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [submitting, setSubmitting] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [rawTranscript, setRawTranscript] = useState("")
  const [transcriptDuration, setTranscriptDuration] = useState(0)
  
  // Flight time tracking - supports both methods
  const [flightTimeMethod, setFlightTimeMethod] = useState<"hobbs" | "direct">("direct")
  const [hobbsStart, setHobbsStart] = useState<string>("")
  const [hobbsEnd, setHobbsEnd] = useState<string>("")
  const [totalFlightHours, setTotalFlightHours] = useState<string>("")
  
  const [formData, setFormData] = useState({
    general_overview: "",
    next_lesson_plan: "",
    far_references: [] as string[],
  })

  const [maneuverScores, setManeuverScores] = useState<ManeuverScore[]>(
    maneuvers.map(m => ({
      maneuver_id: m.id,
      maneuver_name: m.name,
      score: 3,
      acs_standard_met: true,
      notes: "",
      strengths: [],
      areas_for_improvement: [],
    }))
  )

  const [keyTakeaways, setKeyTakeaways] = useState<KeyTakeaway[]>([
    {
      category: "strength",
      observation: "",
      evidence: "",
      coaching: "",
      priority: "medium",
    }
  ])

  const updateManeuverScore = (index: number, field: keyof ManeuverScore, value: any) => {
    const updated = [...maneuverScores]
    updated[index] = { ...updated[index], [field]: value }
    setManeuverScores(updated)
  }

  const addKeyTakeaway = () => {
    setKeyTakeaways([
      ...keyTakeaways,
      {
        category: "improvement",
        observation: "",
        evidence: "",
        coaching: "",
        priority: "medium",
      }
    ])
  }

  const updateKeyTakeaway = (index: number, field: keyof KeyTakeaway, value: any) => {
    const updated = [...keyTakeaways]
    updated[index] = { ...updated[index], [field]: value }
    setKeyTakeaways(updated)
  }

  const removeKeyTakeaway = (index: number) => {
    setKeyTakeaways(keyTakeaways.filter((_, i) => i !== index))
  }

  const handleVoiceRecordingComplete = (transcript: string, duration: number) => {
    setRawTranscript(transcript)
    setTranscriptDuration(duration)
    
    toast({
      title: "Recording Complete",
      description: "Voice recording captured successfully",
    })
  }

  const handleGenerateWithAI = async () => {
    if (!rawTranscript) {
      toast({
        title: "No Recording",
        description: "Please record a voice debrief first",
        variant: "destructive",
      })
      return
    }

    setGeneratingAI(true)
    try {
      const response = await fetch("/api/ai/format-debrief", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw_transcript: rawTranscript,
          mission_id: mission.id,
          maneuvers_practiced: maneuvers.map(m => m.id),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate AI debrief")
      }

      // Populate form with AI-generated content
      if (result.data) {
        setFormData({
          general_overview: result.data.general_overview || "",
          next_lesson_plan: result.data.next_lesson_plan || "",
          far_references: result.data.far_references?.map((r: any) => r.reference) || [],
        })

        if (result.data.maneuver_details) {
          setManeuverScores(result.data.maneuver_details.map((detail: any) => ({
            maneuver_id: detail.maneuver_id,
            maneuver_name: detail.maneuver_name,
            score: detail.score,
            acs_standard_met: detail.acs_standard_met,
            notes: detail.notes,
            strengths: detail.strengths || [],
            areas_for_improvement: detail.areas_for_improvement || [],
          })))
        }

        if (result.data.key_takeaways) {
          setKeyTakeaways(result.data.key_takeaways)
        }

        toast({
          title: "AI Debrief Generated!",
          description: "Review and edit the AI-generated content",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Build maneuver details
      const maneuverDetails = maneuverScores.map(score => ({
        maneuver_id: score.maneuver_id,
        maneuver_name: score.maneuver_name,
        acs_task_code: null,
        score: score.score,
        performance_level: 
          score.score === 4 ? "exceptional" :
          score.score === 3 ? "proficient" :
          score.score === 2 ? "progressing" : "unsatisfactory",
        notes: score.notes,
        far_references: [],
        strengths: score.strengths,
        areas_for_improvement: score.areas_for_improvement,
        acs_standard_met: score.acs_standard_met,
      }))

      // Prepare flight time data based on method
      const flightTimeData: any = {}
      
      if (flightTimeMethod === "hobbs" && hobbsStart && hobbsEnd) {
        flightTimeData.hobbs_start = parseFloat(hobbsStart)
        flightTimeData.hobbs_end = parseFloat(hobbsEnd)
      } else if (flightTimeMethod === "direct" && totalFlightHours) {
        flightTimeData.total_flight_hours = parseFloat(totalFlightHours)
      }

      const debriefData = {
        mission_id: mission.id,
        student_id: mission.student_id,
        instructor_id: instructorId,
        general_overview: formData.general_overview,
        key_takeaways: keyTakeaways.filter(t => t.observation),
        maneuver_details: maneuverDetails,
        next_lesson_plan: formData.next_lesson_plan,
        raw_transcript: rawTranscript || null,
        transcript_duration_seconds: transcriptDuration || null,
        ...flightTimeData, // Include flight time based on method selected
      }

      const response = await fetch("/api/instructor/debriefs", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(debriefData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create debrief")
      }

      toast({
        title: "Debrief Created!",
        description: "Mission debrief has been saved successfully",
      })

      router.push(`/instructor/missions/${mission.id}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getScoreColor = (score: number) => {
    switch (score) {
      case 4: return "text-green-600"
      case 3: return "text-blue-600"
      case 2: return "text-yellow-600"
      case 1: return "text-red-600"
      default: return "text-gray-600"
    }
  }

  const getScoreLabel = (score: number) => {
    switch (score) {
      case 4: return "Exceptional"
      case 3: return "Proficient"
      case 2: return "Progressing"
      case 1: return "Unsatisfactory"
      default: return ""
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "strength": return <TrendingUp className="w-4 h-4 text-green-600" />
      case "improvement": return <Target className="w-4 h-4 text-yellow-600" />
      case "correction": return <AlertCircle className="w-4 h-4 text-red-600" />
      default: return <Info className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Voice Recorder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Voice Recording
          </CardTitle>
          <CardDescription>
            Record your verbal debrief with the student
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <VoiceRecorder 
            onRecordingComplete={handleVoiceRecordingComplete}
          />
          
          {rawTranscript && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Transcript</Label>
                <Button
                  onClick={handleGenerateWithAI}
                  disabled={generatingAI}
                  variant="outline"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
                  {generatingAI ? "Generating..." : "Generate AI Debrief"}
                </Button>
              </div>
              <Textarea
                value={rawTranscript}
                onChange={(e) => setRawTranscript(e.target.value)}
                rows={6}
                className="font-mono text-sm"
                placeholder="Voice transcript will appear here..."
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flight Time Entry */}
      {mission.mission_type === 'F' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⏱️ Flight Time
            </CardTitle>
            <CardDescription>
              Choose your preferred method for recording flight time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Method Toggle */}
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <Label className="font-semibold">Entry Method:</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={flightTimeMethod === "direct" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFlightTimeMethod("direct")}
                >
                  Direct Entry
                </Button>
                <Button
                  type="button"
                  variant={flightTimeMethod === "hobbs" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFlightTimeMethod("hobbs")}
                >
                  Hobbs Start/Stop
                </Button>
              </div>
            </div>

            {/* Direct Entry Method */}
            {flightTimeMethod === "direct" && (
              <div className="space-y-2">
                <Label htmlFor="totalFlightHours">Total Flight Time (hours)</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="totalFlightHours"
                    type="number"
                    step="0.1"
                    min="0"
                    max="24"
                    value={totalFlightHours}
                    onChange={(e) => setTotalFlightHours(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="1.5"
                  />
                  <span className="text-sm text-muted-foreground">hrs</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the total flight time as a decimal (e.g., 1.5 for 1 hour 30 minutes)
                </p>
              </div>
            )}

            {/* Hobbs Start/Stop Method */}
            {flightTimeMethod === "hobbs" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hobbsStart">Hobbs Start</Label>
                  <input
                    id="hobbsStart"
                    type="number"
                    step="0.1"
                    min="0"
                    value={hobbsStart}
                    onChange={(e) => setHobbsStart(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="1234.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hobbsEnd">Hobbs End</Label>
                  <input
                    id="hobbsEnd"
                    type="number"
                    step="0.1"
                    min="0"
                    value={hobbsEnd}
                    onChange={(e) => setHobbsEnd(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="1236.0"
                  />
                </div>
                {hobbsStart && hobbsEnd && (
                  <div className="col-span-2">
                    <Alert>
                      <Info className="w-4 h-4" />
                      <AlertDescription>
                        Flight time: <strong>{(parseFloat(hobbsEnd) - parseFloat(hobbsStart)).toFixed(1)} hours</strong>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* General Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            General Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.general_overview}
            onChange={(e) => setFormData({ ...formData, general_overview: e.target.value })}
            rows={4}
            placeholder="Overall summary of the mission..."
          />
        </CardContent>
      </Card>

      {/* Maneuver Scoring */}
      {maneuverScores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Maneuver Performance
            </CardTitle>
            <CardDescription>
              Rate each maneuver (1=Unsatisfactory, 2=Progressing, 3=Proficient, 4=Exceptional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {maneuverScores.map((score, index) => (
              <div key={score.maneuver_id} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{score.maneuver_name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={score.score.toString()}
                      onValueChange={(v) => updateManeuverScore(index, "score", parseInt(v))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4 - Exceptional</SelectItem>
                        <SelectItem value="3">3 - Proficient</SelectItem>
                        <SelectItem value="2">2 - Progressing</SelectItem>
                        <SelectItem value="1">1 - Unsatisfactory</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge variant={score.acs_standard_met ? "default" : "destructive"}>
                      {score.acs_standard_met ? "ACS Met" : "Below ACS"}
                    </Badge>
                  </div>
                </div>

                <Textarea
                  value={score.notes}
                  onChange={(e) => updateManeuverScore(index, "notes", e.target.value)}
                  rows={2}
                  placeholder="Notes on performance..."
                  className="text-sm"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Key Takeaways */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Key Takeaways
            </CardTitle>
            <Button onClick={addKeyTakeaway} variant="outline" size="sm">
              Add Takeaway
            </Button>
          </div>
          <CardDescription>
            Highlight strengths, areas for improvement, and corrections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {keyTakeaways.map((takeaway, index) => (
            <div key={index} className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(takeaway.category)}
                  <Select
                    value={takeaway.category}
                    onValueChange={(v: any) => updateKeyTakeaway(index, "category", v)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="improvement">Improvement</SelectItem>
                      <SelectItem value="correction">Correction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => removeKeyTakeaway(index)}
                  variant="ghost"
                  size="sm"
                >
                  Remove
                </Button>
              </div>

              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Observation</Label>
                  <Textarea
                    value={takeaway.observation}
                    onChange={(e) => updateKeyTakeaway(index, "observation", e.target.value)}
                    rows={2}
                    placeholder="What was observed?"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Evidence</Label>
                  <Textarea
                    value={takeaway.evidence}
                    onChange={(e) => updateKeyTakeaway(index, "evidence", e.target.value)}
                    rows={2}
                    placeholder="Specific examples..."
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Coaching</Label>
                  <Textarea
                    value={takeaway.coaching}
                    onChange={(e) => updateKeyTakeaway(index, "coaching", e.target.value)}
                    rows={2}
                    placeholder="Guidance for improvement..."
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Next Lesson Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Next Lesson Plan</CardTitle>
          <CardDescription>
            Recommendations for continued training
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.next_lesson_plan}
            onChange={(e) => setFormData({ ...formData, next_lesson_plan: e.target.value })}
            rows={4}
            placeholder="What should we focus on in the next lesson?"
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href={`/instructor/missions/${mission.id}`}>
            Cancel
          </Link>
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={submitting}
          size="lg"
        >
          <Save className="w-4 h-4 mr-2" />
          {submitting ? "Saving..." : "Save Debrief"}
        </Button>
      </div>
    </div>
  )
}

