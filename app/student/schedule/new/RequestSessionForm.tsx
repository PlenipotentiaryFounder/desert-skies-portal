"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  Plane,
  User,
  MapPin,
  BookOpen,
  FileText,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Loader2,
  GraduationCap,
  Target,
  Monitor,
  Settings
} from "lucide-react"
import { cn } from "@/lib/utils"

export function RequestSessionForm({
  enrollment,
  lessons = [],
  nextLesson,
  aircraft = [],
  locations = []
}: {
  enrollment: any
  lessons: any[]
  nextLesson: any
  aircraft: any[]
  locations: any[]
}) {
  const [form, setForm] = useState({
    enrollment_id: enrollment?.id || "",
    lesson_id: nextLesson?.id || "",
    instructor_id: enrollment?.instructor_id || "",
    aircraft_id: "",
    date: "",
    start_time: "",
    end_time: "",
    session_type: "mission",
    prebrief_minutes: 30,
    postbrief_minutes: 30,
    location_id: "",
    recurrence_rule: "",
    notes: "",
    hobbs_start: 0,
    hobbs_end: 0,
    weather_conditions: null as any
  })

  // Handle URL parameters for pre-filled data from calendar selection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const date = urlParams.get('date')
      const startTime = urlParams.get('start_time')
      const endTime = urlParams.get('end_time')
      const instructorId = urlParams.get('instructor_id')

      if (date || startTime || endTime || instructorId) {
        setForm(prev => ({
          ...prev,
          ...(date && { date }),
          ...(startTime && { start_time: startTime }),
          ...(endTime && { end_time: endTime }),
          ...(instructorId && { instructor_id: instructorId })
        }))

        // If we have pre-filled data, skip to step 2
        if (date && startTime && endTime) {
          setCurrentStep(2)
        }
      }
    }
  }, [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const totalSteps = 3

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function handleSelectChange(name: string, value: string) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    
    try {
      const res = await fetch("/api/instructor/schedule/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      
      if (res.ok) {
        setSuccess(true)
        setForm({
          enrollment_id: "",
          lesson_id: "",
          instructor_id: "",
          aircraft_id: "",
          date: "",
          start_time: "",
          end_time: "",
          session_type: "mission",
          prebrief_minutes: 30,
          postbrief_minutes: 30,
          location_id: "",
          recurrence_rule: "",
          notes: "",
          hobbs_start: 0,
          hobbs_end: 0,
          weather_conditions: null
        })
        setCurrentStep(1)
      } else {
        const data = await res.json()
        setError(data.error || "Failed to submit session request")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const sessionTypeOptions = [
    { value: "flight", label: "Flight Training", icon: Plane, color: "bg-aviation-sky-500" },
    { value: "ground", label: "Ground School", icon: BookOpen, color: "bg-aviation-sunset-500" },
    { value: "simulator", label: "Simulator Training", icon: Monitor, color: "bg-aviation-warning-500" }
  ]

  const isStep1Complete = form.lesson_id
  const isStep2Complete = form.aircraft_id && form.date && form.start_time && form.end_time && form.location_id
  const isStep3Complete = form.session_type

  const canProceedToStep2 = isStep1Complete
  const canProceedToStep3 = isStep2Complete
  const canSubmit = isStep1Complete && isStep2Complete && isStep3Complete

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <Card variant="aviation" className="text-center">
          <CardContent className="pt-8 pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-aviation-success-500 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-aviation-sky-900 mb-2">
              Session Request Submitted!
            </h2>
            <p className="text-aviation-sky-600 mb-6">
              Your flight session request has been sent to your instructor for approval.
            </p>
            <Button 
              onClick={() => setSuccess(false)}
              variant="aviation"
              className="px-8"
            >
              Request Another Session
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-center space-x-4 mb-8"
      >
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
              step <= currentStep
                ? "bg-aviation-sky-500 text-white shadow-sky"
                : "bg-aviation-sky-100 text-aviation-sky-400"
            )}>
              {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
            </div>
            {step < 3 && (
              <div className={cn(
                "w-16 h-1 mx-2 transition-all duration-300",
                step < currentStep ? "bg-aviation-sky-500" : "bg-aviation-sky-200"
              )} />
            )}
          </div>
        ))}
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Lesson Selection */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card variant="aviation">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-aviation-sky-600" />
                    Lesson Selection
                  </CardTitle>
                  <CardDescription>
                    Choose the lesson for your next training session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Pre-populated Course and Instructor Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-aviation-sky-50 rounded-xl border border-aviation-sky-200">
                    <div>
                      <label className="text-sm font-semibold text-aviation-sky-900 flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4" />
                        Course
                      </label>
                      <div className="text-aviation-sky-700 font-medium">
                        {enrollment?.syllabi?.title || "PPC ASEL Syllabus"}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-aviation-sky-900 flex items-center gap-2 mb-2">
                        <User className="w-4 h-4" />
                        Instructor
                      </label>
                      <div className="text-aviation-sky-700 font-medium">
                        {enrollment?.profiles?.first_name} {enrollment?.profiles?.last_name}
                      </div>
                    </div>
                  </div>

                  {/* Lesson Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-aviation-sky-900 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Lesson
                    </label>
                    <Select value={form.lesson_id} onValueChange={(value) => handleSelectChange("lesson_id", value)}>
                      <SelectTrigger variant="aviation">
                        <SelectValue placeholder="Select lesson..." />
                      </SelectTrigger>
                      <SelectContent>
                        {lessons?.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{l.title}</span>
                              <span className="text-xs text-aviation-sky-400">
                                ({l.lesson_type === 'flight' ? 'Flight' : l.lesson_type === 'sim' ? 'Simulator' : 'Ground'})
                              </span>
                            </div>
                          </SelectItem>
                        )) || <SelectItem disabled>No lessons available</SelectItem>}
                      </SelectContent>
                    </Select>
                    {nextLesson && (
                      <p className="text-sm text-aviation-sky-600 mt-2">
                        💡 <strong>Recommended:</strong> {nextLesson.title} (Next in sequence)
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      disabled={!canProceedToStep2}
                      variant="aviation"
                      className="px-8"
                    >
                      Next: Schedule Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 2: Schedule Details */}
        <AnimatePresence mode="wait">
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card variant="aviation">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-aviation-sky-600" />
                    Schedule Details
                  </CardTitle>
                  <CardDescription>
                    Choose your preferred date, time, aircraft, and location
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-aviation-sky-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Date
                      </label>
                      <Input
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={handleChange}
                        variant="aviation"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-aviation-sky-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                      </label>
                      <Select value={form.location_id} onValueChange={(value) => handleSelectChange("location_id", value)}>
                        <SelectTrigger variant="aviation">
                          <SelectValue placeholder="Select location..." />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-aviation-sky-900 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Start Time
                      </label>
                      <Input
                        type="time"
                        name="start_time"
                        value={form.start_time}
                        onChange={handleChange}
                        variant="aviation"
                        required
                        step="60"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-aviation-sky-900 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        End Time
                      </label>
                      <Input
                        type="time"
                        name="end_time"
                        value={form.end_time}
                        onChange={handleChange}
                        variant="aviation"
                        required
                        step="60"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-aviation-sky-900 flex items-center gap-2">
                      <Plane className="w-4 h-4" />
                      Aircraft
                    </label>
                    <Select value={form.aircraft_id} onValueChange={(value) => handleSelectChange("aircraft_id", value)}>
                      <SelectTrigger variant="aviation">
                        <SelectValue placeholder="Select aircraft..." />
                      </SelectTrigger>
                      <SelectContent>
                        {aircraft?.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            <div className="flex items-center gap-2">
                              <Plane className="w-4 h-4 text-aviation-sky-500" />
                              <span>{a.tail_number}</span>
                              <span className="text-aviation-sky-400">({a.make} {a.model})</span>
                            </div>
                          </SelectItem>
                        )) || <SelectItem key="no-aircraft" disabled>No aircraft available</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      variant="outline"
                      className="px-8"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      disabled={!canProceedToStep3}
                      variant="aviation"
                      className="px-8"
                    >
                      Next: Session Type
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Session Type & Additional Details */}
        <AnimatePresence mode="wait">
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card variant="aviation">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-aviation-sky-600" />
                    Session Type & Details
                  </CardTitle>
                  <CardDescription>
                    Choose session type and add any additional information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-aviation-sky-900">
                      Session Type
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sessionTypeOptions.map((option) => {
                        const Icon = option.icon
                        return (
                          <motion.div
                            key={option.value}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <label className={cn(
                              "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                              form.session_type === option.value
                                ? "border-aviation-sky-500 bg-aviation-sky-50"
                                : "border-aviation-sky-200 hover:border-aviation-sky-300"
                            )}>
                              <input
                                type="radio"
                                name="session_type"
                                value={option.value}
                                checked={form.session_type === option.value}
                                onChange={handleChange}
                                className="sr-only"
                              />
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", option.color)}>
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <span className="font-medium text-aviation-sky-900">
                                {option.label}
                              </span>
                            </label>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-aviation-sky-900">
                        Prebrief Time (minutes)
                      </label>
                      <Input
                        type="number"
                        name="prebrief_minutes"
                        value={form.prebrief_minutes}
                        onChange={handleChange}
                        variant="aviation"
                        min={0}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-aviation-sky-900">
                        Postbrief Time (minutes)
                      </label>
                      <Input
                        type="number"
                        name="postbrief_minutes"
                        value={form.postbrief_minutes}
                        onChange={handleChange}
                        variant="aviation"
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-aviation-sky-900 flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Recurrence (Optional)
                    </label>
                    <Input
                      type="text"
                      name="recurrence_rule"
                      value={form.recurrence_rule}
                      onChange={handleChange}
                      variant="aviation"
                      placeholder="e.g. FREQ=WEEKLY;BYDAY=MO,WE,FR"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-aviation-sky-900">
                      Additional Notes
                    </label>
                    <Textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      variant="aviation"
                      placeholder="Any special requests or notes for your instructor..."
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      variant="outline"
                      className="px-8"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={!canSubmit || loading}
                      variant="aviation"
                      className="px-8"
                      loading={loading}
                      loadingText="Submitting Request..."
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting Request...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Submit Session Request
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center gap-3 p-4 bg-aviation-danger-50 border border-aviation-danger-200 rounded-xl"
            >
              <AlertCircle className="w-5 h-5 text-aviation-danger-500" />
              <span className="text-aviation-danger-700 font-medium">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  )
} 