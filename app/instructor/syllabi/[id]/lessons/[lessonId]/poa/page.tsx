"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Mic, MicOff, Sparkles, Loader2, Save, 
  Plane, MapPin, Clock, Target, FileText, Video
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

export default function CreatePOAPage() {
  const params = useParams()
  const router = useRouter()
  const [isRecording, setIsRecording] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [poa, setPoa] = useState({
    flightNumber: "",
    tailNumber: "",
    departureDirection: "",
    destination: "",
    missionOverview: "",
    objectives: [] as string[],
    studentFocusNotes: "",
    videoResources: [] as { title: string; url: string }[],
    farReferences: [] as { section: string; description: string }[],
    checklistItems: [] as string[]
  })

  const handleVoiceInput = async () => {
    if (!isRecording) {
      // Start recording
      setIsRecording(true)
      // In production, this would use Web Speech API or similar
      // For now, simulate recording
      setTimeout(() => {
        setTranscript("For flight 13, we'll be heading out to the East Practice Area to work on steep turns, slow flight, and power-off stalls. We'll depart to the east, staying south of the highway, and work in the area between Coolidge and Florence. The focus will be on altitude and airspeed control during the maneuvers. After completing the maneuvers, we'll return to Falcon via the southern route.")
        setIsRecording(false)
      }, 3000)
    } else {
      // Stop recording
      setIsRecording(false)
    }
  }

  const handleGenerateWithAI = async () => {
    setIsGenerating(true)
    
    // Simulate AI generation
    setTimeout(() => {
      setPoa({
        ...poa,
        flightNumber: "13",
        tailNumber: "N12345",
        departureDirection: "East",
        destination: "East Practice Area (Coolidge/Florence)",
        missionOverview: transcript,
        objectives: [
          "Execute steep turns to ACS standards (±100ft, ±10kts, ±10°)",
          "Demonstrate slow flight at minimum controllable airspeed",
          "Perform power-off stalls with proper recovery technique",
          "Maintain situational awareness and proper clearing procedures"
        ],
        studentFocusNotes: "Student has been struggling with altitude control during steep turns. Focus on outside visual references and smooth power management. Review slow flight entry procedures and emphasis on coordinated flight.",
        videoResources: [
          { title: "Steep Turns Technique", url: "https://youtube.com/example1" },
          { title: "Slow Flight Mastery", url: "https://youtube.com/example2" }
        ],
        farReferences: [
          { section: "61.87(d)", description: "Pre-solo flight training requirements for student pilots" },
          { section: "91.119", description: "Minimum safe altitudes for training operations" }
        ],
        checklistItems: [
          "Review weather and NOTAMs",
          "Pre-brief airspace boundaries and emergency procedures",
          "Verify student has current medical and endorsements",
          "Brief steep turn entry and recovery procedures",
          "Review stall recognition and recovery techniques"
        ]
      })
      setIsGenerating(false)
    }, 2000)
  }

  const handleSave = async () => {
    // Save POA to database
    console.log("Saving POA:", poa)
    // In production, call API route
    router.push(`/instructor/syllabi/${params.id}/lessons/${params.lessonId}`)
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link 
          href={`/instructor/syllabi/${params.id}/lessons/${params.lessonId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Lesson
        </Link>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Create Plan of Action</h1>
          <p className="text-muted-foreground mt-2">
            Use voice input or manual entry to create a comprehensive plan for this lesson
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Voice Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Voice Input
              </CardTitle>
              <CardDescription>
                Click to record your plan of action
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                size="lg" 
                className="w-full" 
                variant={isRecording ? "destructive" : "default"}
                onClick={handleVoiceInput}
                disabled={isGenerating}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2 animate-pulse" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>

              {transcript && (
                <div className="space-y-2">
                  <Label>Transcript</Label>
                  <Textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="min-h-[200px]"
                    placeholder="Your voice input will appear here..."
                  />
                </div>
              )}

              <Button 
                size="lg" 
                className="w-full" 
                variant="secondary"
                onClick={handleGenerateWithAI}
                disabled={!transcript || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate POA with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>• Mention the flight number and aircraft</p>
              <p>• Describe the departure direction and destination</p>
              <p>• Outline the main maneuvers or topics</p>
              <p>• Note any specific focus areas for the student</p>
              <p>• Include any special considerations (weather, airspace, etc.)</p>
            </CardContent>
          </Card>
        </div>

        {/* POA Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Flight Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Flight Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="flightNumber">Flight Number</Label>
                  <Input
                    id="flightNumber"
                    value={poa.flightNumber}
                    onChange={(e) => setPoa({ ...poa, flightNumber: e.target.value })}
                    placeholder="13"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tailNumber">Aircraft Tail Number</Label>
                  <Input
                    id="tailNumber"
                    value={poa.tailNumber}
                    onChange={(e) => setPoa({ ...poa, tailNumber: e.target.value })}
                    placeholder="N12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departureDirection">Departure Direction</Label>
                  <Input
                    id="departureDirection"
                    value={poa.departureDirection}
                    onChange={(e) => setPoa({ ...poa, departureDirection: e.target.value })}
                    placeholder="East"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination / Practice Area</Label>
                <Input
                  id="destination"
                  value={poa.destination}
                  onChange={(e) => setPoa({ ...poa, destination: e.target.value })}
                  placeholder="East Practice Area (Coolidge/Florence)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Mission Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Mission Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={poa.missionOverview}
                onChange={(e) => setPoa({ ...poa, missionOverview: e.target.value })}
                className="min-h-[150px]"
                placeholder="Describe the overall flow and plan for this mission..."
              />
            </CardContent>
          </Card>

          {/* Training Objectives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Training Objectives
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {poa.objectives.map((obj, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">{idx + 1}</Badge>
                  <p className="text-sm flex-1">{obj}</p>
                </div>
              ))}
              {poa.objectives.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Objectives will be generated from AI or add them manually
                </p>
              )}
            </CardContent>
          </Card>

          {/* Student Focus Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Student Focus Notes</CardTitle>
              <CardDescription>
                Areas to emphasize based on student's progress and previous performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={poa.studentFocusNotes}
                onChange={(e) => setPoa({ ...poa, studentFocusNotes: e.target.value })}
                className="min-h-[100px]"
                placeholder="Note specific areas where the student needs extra attention..."
              />
            </CardContent>
          </Card>

          {/* Video Resources */}
          {poa.videoResources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {poa.videoResources.map((video, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm font-medium">{video.title}</span>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={video.url} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Pre-Flight Checklist */}
          {poa.checklistItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pre-Flight Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {poa.checklistItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded border mt-0.5" />
                    <p className="text-sm flex-1">{item}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button size="lg" onClick={handleSave} disabled={!poa.missionOverview}>
              <Save className="h-4 w-4 mr-2" />
              Save Plan of Action
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={`/instructor/syllabi/${params.id}/lessons/${params.lessonId}`}>
                Cancel
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

