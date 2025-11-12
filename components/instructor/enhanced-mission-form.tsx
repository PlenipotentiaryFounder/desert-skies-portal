"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Plane, 
  BookOpen, 
  Users, 
  Calendar, 
  Clock, 
  FileText,
  Sparkles,
  DollarSign,
  Info,
  Rocket
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EnhancedMissionFormProps {
  enrollments: any[]
  lessons: any[]
  maneuvers: any[]
  onSubmit: (data: any) => Promise<void>
  initialValues?: any
}

export function EnhancedMissionForm({ 
  enrollments, 
  lessons, 
  maneuvers, 
  onSubmit, 
  initialValues 
}: EnhancedMissionFormProps) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialValues || {
    enrollmentId: "",
    studentId: "",
    mode: "precreated",
    lessonId: "",
    missionType: "F", // F = Flight, G = Ground, S = Simulator
    date: "",
    startTime: "",
    endTime: "",
    aircraftId: "",
    generatePOA: true, // Auto-generate Plan of Action
    notes: "",
    custom: {
      title: "",
      objective: "",
      maneuvers: [] as string[],
      topics: "",
      standards: "",
      prep: "",
    },
  })
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aircraftOptions, setAircraftOptions] = useState<any[]>([])
  const [aircraftLoading, setAircraftLoading] = useState(false)
  const [missionCodePreview, setMissionCodePreview] = useState<string | null>(null)
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null)
  const [selectedLesson, setSelectedLesson] = useState<any>(null)

  // Fetch aircraft on mount
  useEffect(() => {
    async function fetchAircraft() {
      setAircraftLoading(true)
      try {
        const res = await fetch("/api/aircraft", {
          credentials: 'include' // Required to send cookies with the request
        })
        if (res.ok) {
          const data = await res.json()
          setAircraftOptions(data.aircraft || [])
        } else {
          const errorText = await res.text()
          console.error("Aircraft API error response:", errorText)
        }
      } catch (err) {
        console.error("Failed to fetch aircraft:", err)
      } finally {
        setAircraftLoading(false)
      }
    }
    fetchAircraft()
  }, [])

  // Set selected enrollment on mount if enrollmentId is provided in initialValues
  useEffect(() => {
    if (form.enrollmentId && !selectedEnrollment) {
      const enrollment = enrollments.find(e => e.id === form.enrollmentId)
      if (enrollment) {
        setSelectedEnrollment(enrollment)
      }
    }
  }, [form.enrollmentId, enrollments, selectedEnrollment])

  // Generate mission code preview when enrollment changes
  useEffect(() => {
    if (form.enrollmentId) {
      generateMissionCodePreview()
    }
  }, [form.enrollmentId, form.missionType])

  async function generateMissionCodePreview() {
    try {
      const enrollment = enrollments.find(e => e.id === form.enrollmentId)
      if (!enrollment) return

      // Fetch next mission number for this enrollment
      const res = await fetch(`/api/enrollments/${form.enrollmentId}/next-mission-number`, {
        credentials: 'include'
      })
      const data = await res.json()
      
      const missionNumber = data.nextNumber || 1
      const programCode = enrollment.syllabus?.code || "PPC"
      const missionType = form.missionType
      
      // Generate: DSA-PPC-F14
      const code = `DSA-${programCode}-${missionType}${missionNumber}`
      setMissionCodePreview(code)
    } catch (err) {
      console.error("Failed to generate mission code:", err)
      setMissionCodePreview(null)
    }
  }

  const handleChange = (field: string, value: any) => {
    if (field.startsWith("custom.")) {
      const customField = field.split(".")[1]
      setForm(prev => ({
        ...prev,
        custom: { ...prev.custom, [customField]: value }
      }))
    } else {
      setForm(prev => ({ ...prev, [field]: value }))
      
      // Set student ID when enrollment changes
      if (field === "enrollmentId") {
        const enrollment = enrollments.find(e => e.id === value)
        setSelectedEnrollment(enrollment)
        if (enrollment) {
          setForm(prev => ({ ...prev, studentId: enrollment.student_id }))
        }
      }
      
      // Set selected lesson
      if (field === "lessonId") {
        const lesson = lessons.find(l => l.id === value)
        setSelectedLesson(lesson)
      }
    }
  }

  const handleManeuverToggle = (maneuverId: string) => {
    setForm(prev => ({
      ...prev,
      custom: {
        ...prev.custom,
        maneuvers: prev.custom.maneuvers.includes(maneuverId)
          ? prev.custom.maneuvers.filter((m: string) => m !== maneuverId)
          : [...prev.custom.maneuvers, maneuverId]
      }
    }))
  }

  const handleNext = () => {
    // Validation
    if (step === 1 && !form.enrollmentId) {
      setError("Please select a student enrollment")
      return
    }
    if (step === 2 && form.mode === "precreated" && !form.lessonId) {
      setError("Please select a lesson")
      return
    }
    if (step === 3 && !form.date) {
      setError("Please select a date")
      return
    }
    if (step === 3 && !form.aircraftId && form.missionType === "F") {
      setError("Please select an aircraft for flight missions")
      return
    }
    
    setError(null)
    setStep(prev => prev + 1)
  }

  const handleBack = () => {
    setError(null)
    setStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    
    try {
      await onSubmit(form)
    } catch (err: any) {
      setError(err.message || "Failed to create mission")
      setSubmitting(false)
    }
  }

  // Mission type options
  const missionTypes = [
    { value: "F", label: "Flight", icon: Plane, description: "Full flight training with aircraft" },
    { value: "G", label: "Ground", icon: BookOpen, description: "Ground instruction only" },
    { value: "S", label: "Simulator", icon: Rocket, description: "Simulator training session" },
  ]

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </div>
            {s < 4 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  step > s ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Titles */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">
          {step === 1 && "Select Student"}
          {step === 2 && "Mission Details"}
          {step === 3 && "Schedule & Aircraft"}
          {step === 4 && "Review & Create"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {step === 1 && "Choose the student and enrollment for this mission"}
          {step === 2 && "Select lesson template or create custom mission"}
          {step === 3 && "Set date, time, and aircraft assignment"}
          {step === 4 && "Review all details and create mission"}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Student Selection */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Student & Enrollment
            </CardTitle>
            <CardDescription>Select which student and training program</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Student Enrollment</Label>
              <Select value={form.enrollmentId} onValueChange={(v) => handleChange("enrollmentId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student enrollment" />
                </SelectTrigger>
                <SelectContent>
                  {enrollments.map((enrollment) => (
                    <SelectItem key={enrollment.id} value={enrollment.id}>
                      {enrollment.student?.first_name} {enrollment.student?.last_name} - {enrollment.syllabus?.title || "Program"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEnrollment && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Student:</span>
                      <span className="font-medium">
                        {selectedEnrollment.student?.first_name} {selectedEnrollment.student?.last_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Program:</span>
                      <span className="font-medium">{selectedEnrollment.syllabus?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline">{selectedEnrollment.status}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button onClick={handleNext}>
                Next: Mission Details →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Mission Details */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Mission Type Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                Mission Type
              </CardTitle>
              <CardDescription>Choose the type of training mission</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {missionTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleChange("missionType", type.value)}
                      className={`p-4 border-2 rounded-lg text-left transition-all hover:border-primary ${
                        form.missionType === type.value
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="w-6 h-6 mt-1" />
                        <div>
                          <div className="font-semibold">{type.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {type.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {missionCodePreview && (
                <Alert className="mt-4">
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    Mission Code: <strong>{missionCodePreview}</strong>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Lesson Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Lesson Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select value={form.mode} onValueChange={(v) => handleChange("mode", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="precreated">Pre-created Lesson Template</SelectItem>
                    <SelectItem value="custom">Custom Mission</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.mode === "precreated" && (
                <div className="space-y-2">
                  <Label>Lesson Template</Label>
                  <Select value={form.lessonId} onValueChange={(v) => handleChange("lessonId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lesson" />
                    </SelectTrigger>
                    <SelectContent>
                      {lessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          {lesson.lesson_code || ""} - {lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedLesson && (
                    <Card className="bg-muted/50 mt-2">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="font-medium">{selectedLesson.title}</div>
                          {selectedLesson.description && (
                            <p className="text-sm text-muted-foreground">
                              {selectedLesson.description}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {form.mode === "custom" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mission Title</Label>
                    <Input
                      value={form.custom.title}
                      onChange={(e) => handleChange("custom.title", e.target.value)}
                      placeholder="e.g., Advanced Crosswind Landings"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Objective</Label>
                    <Textarea
                      value={form.custom.objective}
                      onChange={(e) => handleChange("custom.objective", e.target.value)}
                      placeholder="What will the student learn and accomplish?"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Select Maneuvers</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                      {maneuvers.map((maneuver) => (
                        <div key={maneuver.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`maneuver-${maneuver.id}`}
                            checked={form.custom.maneuvers.includes(maneuver.id)}
                            onCheckedChange={() => handleManeuverToggle(maneuver.id)}
                          />
                          <label
                            htmlFor={`maneuver-${maneuver.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {maneuver.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Aircraft Selection (for flight missions) */}
              {form.missionType === "F" && (
                <div className="space-y-2">
                  <Label>Aircraft</Label>
                  <Select
                    value={form.aircraftId}
                    onValueChange={(v) => handleChange("aircraftId", v)}
                    disabled={aircraftLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={aircraftLoading ? "Loading..." : "Select aircraft"} />
                    </SelectTrigger>
                    <SelectContent>
                      {aircraftOptions.length > 0 ? (
                        aircraftOptions.map((aircraft) => (
                          <SelectItem key={aircraft.id} value={aircraft.id}>
                            {aircraft.tail_number} ({aircraft.make} {aircraft.model})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-aircraft" disabled>
                          No aircraft available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              ← Back
            </Button>
            <Button onClick={handleNext}>
              Next: Schedule →
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Schedule */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule
            </CardTitle>
            <CardDescription>Set the date and time for this mission</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => handleChange("startTime", e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Plan of Action Option */}
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <Checkbox
                id="generatePOA"
                checked={form.generatePOA}
                onCheckedChange={(checked) => handleChange("generatePOA", checked)}
              />
              <div className="space-y-1">
                <label
                  htmlFor="generatePOA"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  Generate Plan of Action with AI
                </label>
                <p className="text-sm text-muted-foreground">
                  Automatically create a detailed pre-mission briefing document for the student
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Any additional notes for this mission..."
                rows={3}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                ← Back
              </Button>
              <Button onClick={handleNext}>
                Next: Review →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mission Summary</CardTitle>
              <CardDescription>Review all details before creating</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {missionCodePreview && (
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-sm text-muted-foreground">Mission Code</div>
                  <div className="text-2xl font-bold">{missionCodePreview}</div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Student</div>
                  <div className="font-medium">
                    {selectedEnrollment?.student?.first_name} {selectedEnrollment?.student?.last_name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Mission Type</div>
                  <div className="font-medium">
                    {missionTypes.find(t => t.value === form.missionType)?.label}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="font-medium">
                    {form.date ? new Date(form.date).toLocaleDateString() : "Not set"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Start Time</div>
                  <div className="font-medium">{form.startTime || "Not set"}</div>
                </div>
                {form.missionType === "F" && form.aircraftId && (
                  <div>
                    <div className="text-sm text-muted-foreground">Aircraft</div>
                    <div className="font-medium">
                      {aircraftOptions.find(a => a.id === form.aircraftId)?.tail_number}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted-foreground">Lesson</div>
                  <div className="font-medium">
                    {form.mode === "precreated" 
                      ? selectedLesson?.title 
                      : form.custom.title || "Custom Mission"}
                  </div>
                </div>
              </div>

              {form.generatePOA && (
                <Alert>
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <AlertDescription>
                    A Plan of Action will be automatically generated for this mission
                  </AlertDescription>
                </Alert>
              )}

              {/* Training Events Preview */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">Training Events</CardTitle>
                  <CardDescription className="text-sm">
                    This mission will include the following billable events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {form.missionType !== "G" && (
                      <div className="flex items-center justify-between text-sm">
                        <span>Pre-Brief</span>
                        <Badge variant="outline">30 min</Badge>
                      </div>
                    )}
                    {form.missionType === "F" && (
                      <div className="flex items-center justify-between text-sm">
                        <span>Flight Training</span>
                        <Badge variant="outline">TBD</Badge>
                      </div>
                    )}
                    {form.missionType === "G" && (
                      <div className="flex items-center justify-between text-sm">
                        <span>Ground Instruction</span>
                        <Badge variant="outline">TBD</Badge>
                      </div>
                    )}
                    {form.missionType === "S" && (
                      <div className="flex items-center justify-between text-sm">
                        <span>Simulator Session</span>
                        <Badge variant="outline">TBD</Badge>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span>Post-Brief / Debrief</span>
                      <Badge variant="outline">30 min</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              ← Back
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              size="lg"
            >
              {submitting ? "Creating Mission..." : "Create Mission"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

