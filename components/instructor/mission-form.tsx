"use client"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// Props: enrollments (student list), lessons (for selected syllabus), maneuvers (all), onSubmit (handler)
export function MissionForm({ enrollments, lessons, maneuvers, onSubmit, initialValues }: {
  enrollments: any[],
  lessons: any[],
  maneuvers: any[],
  onSubmit: (data: any) => void,
  initialValues?: any
}) {
  // Step state
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialValues || {
    enrollmentId: "",
    mode: "precreated", // or 'custom'
    lessonId: "",
    custom: {
      title: "",
      objective: "",
      schedule: "",
      topics: "",
      standards: "",
      prep: "",
      skills: "",
      errors: "",
      role: "",
      whatToBring: "",
      notes: "",
      maneuvers: [] as string[],
    },
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aircraftOptions, setAircraftOptions] = useState<any[]>([])
  const [aircraftLoading, setAircraftLoading] = useState(false)
  const [aircraftError, setAircraftError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAircraft() {
      setAircraftLoading(true)
      setAircraftError(null)
      try {
        const res = await fetch("/api/instructor/schedule/aircraft")
        const data = await res.json()
        setAircraftOptions(data.aircraft || [])
      } catch (e) {
        setAircraftError("Failed to load aircraft options")
        setAircraftOptions([])
      }
      setAircraftLoading(false)
    }
    fetchAircraft()
  }, [])

  // Handlers
  function handleChange(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }
  function handleCustomChange(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, custom: { ...prev.custom, [field]: value } }))
  }
  function handleNext() { setStep((s) => s + 1) }
  function handleBack() { setStep((s) => s - 1) }
  async function handleSubmit(e: any) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(form)
    } catch (err: any) {
      setError(err.message || "Failed to schedule mission")
    } finally {
      setSubmitting(false)
    }
  }

  // Step 1: Select student/enrollment
  if (step === 1) {
    return (
      <form onSubmit={handleNext} className="space-y-4">
        <Select value={form.enrollmentId} onValueChange={(v) => handleChange("enrollmentId", v)} required>
          <SelectTrigger>
            <SelectValue placeholder="Select student/enrollment" />
          </SelectTrigger>
          <SelectContent>
            {enrollments.map((enr) => (
              <SelectItem key={enr.id} value={enr.id}>
                {enr.student?.first_name} {enr.student?.last_name} ({enr.syllabus?.title})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" onClick={handleNext} disabled={!form.enrollmentId}>Next</Button>
      </form>
    )
  }

  // Step 2: Select lesson or custom
  if (step === 2) {
    return (
      <form onSubmit={handleNext} className="space-y-4">
        <Select value={form.mode} onValueChange={(v) => handleChange("mode", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select mission type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="precreated">Pre-created Lesson</SelectItem>
            <SelectItem value="custom">Custom Mission</SelectItem>
          </SelectContent>
        </Select>
        {form.mode === "precreated" && (
          <Select value={form.lessonId} onValueChange={(v) => handleChange("lessonId", v)} required>
            <SelectTrigger>
              <SelectValue placeholder="Select lesson" />
            </SelectTrigger>
            <SelectContent>
              {lessons.map((lesson) => (
                <SelectItem key={lesson.id} value={lesson.id}>{lesson.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div>
          <label>Aircraft</label>
          <Select
            value={form.aircraftId || ""}
            onValueChange={v => handleChange("aircraftId", v)}
            disabled={aircraftLoading}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder={aircraftLoading ? "Loading..." : "Select aircraft"} />
            </SelectTrigger>
            <SelectContent>
              {aircraftOptions.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.tail_number} ({a.make} {a.model})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {aircraftError && <div className="text-red-500 text-sm">{aircraftError}</div>}
        </div>
        <div className="flex gap-2">
          <Input type="date" value={form.date || ""} onChange={e => handleChange("date", e.target.value)} required />
          <Input type="time" value={form.startTime || ""} onChange={e => handleChange("startTime", e.target.value)} required />
          <Input type="time" value={form.endTime || ""} onChange={e => handleChange("endTime", e.target.value)} required />
        </div>
        <Textarea placeholder="Notes (optional)" value={form.notes || ""} onChange={e => handleChange("notes", e.target.value)} />
        <div className="flex gap-2">
          <Button type="button" onClick={handleBack}>Back</Button>
          <Button type="button" onClick={handleNext} disabled={form.mode === "precreated" && !form.lessonId}>Next</Button>
        </div>
      </form>
    )
  }

  // Step 3: Custom mission details (if applicable)
  if (step === 3 && form.mode === "custom") {
    return (
      <form onSubmit={handleNext} className="space-y-4">
        <Input placeholder="Title" value={form.custom.title} onChange={(e) => handleCustomChange("title", e.target.value)} required />
        <Textarea placeholder="Objective" value={form.custom.objective} onChange={(e) => handleCustomChange("objective", e.target.value)} />
        <Textarea placeholder="Schedule" value={form.custom.schedule} onChange={(e) => handleCustomChange("schedule", e.target.value)} />
        <Textarea placeholder="Topics" value={form.custom.topics} onChange={(e) => handleCustomChange("topics", e.target.value)} />
        <Textarea placeholder="Standards" value={form.custom.standards} onChange={(e) => handleCustomChange("standards", e.target.value)} />
        <Textarea placeholder="Prep" value={form.custom.prep} onChange={(e) => handleCustomChange("prep", e.target.value)} />
        <Textarea placeholder="Skills" value={form.custom.skills} onChange={(e) => handleCustomChange("skills", e.target.value)} />
        <Textarea placeholder="Errors" value={form.custom.errors} onChange={(e) => handleCustomChange("errors", e.target.value)} />
        <Textarea placeholder="Role" value={form.custom.role} onChange={(e) => handleCustomChange("role", e.target.value)} />
        <Textarea placeholder="What to Bring" value={form.custom.whatToBring} onChange={(e) => handleCustomChange("whatToBring", e.target.value)} />
        <Textarea placeholder="Notes" value={form.custom.notes} onChange={(e) => handleCustomChange("notes", e.target.value)} />
        <div>
          <label>Aircraft</label>
          <Select
            value={form.aircraftId || ""}
            onValueChange={v => handleChange("aircraftId", v)}
            disabled={aircraftLoading}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder={aircraftLoading ? "Loading..." : "Select aircraft"} />
            </SelectTrigger>
            <SelectContent>
              {aircraftOptions.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.tail_number} ({a.make} {a.model})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {aircraftError && <div className="text-red-500 text-sm">{aircraftError}</div>}
        </div>
        <div className="flex gap-2">
          <Input type="date" value={form.date || ""} onChange={e => handleChange("date", e.target.value)} required />
          <Input type="time" value={form.startTime || ""} onChange={e => handleChange("startTime", e.target.value)} required />
          <Input type="time" value={form.endTime || ""} onChange={e => handleChange("endTime", e.target.value)} required />
        </div>
        <Textarea placeholder="Notes (optional)" value={form.notes || ""} onChange={e => handleChange("notes", e.target.value)} />
        <div>
          <label className="block font-medium mb-1">Select Maneuvers</label>
          <div className="flex flex-col gap-2">
            {maneuvers.map((m) => (
              <label key={m.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.custom.maneuvers.includes(m.id)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    handleCustomChange(
                      "maneuvers",
                      checked
                        ? [...form.custom.maneuvers, m.id]
                        : form.custom.maneuvers.filter((id: string) => id !== m.id)
                    );
                  }}
                />
                {m.name}
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={handleBack}>Back</Button>
          <Button type="button" onClick={handleNext} disabled={!form.custom.title}>Next</Button>
        </div>
      </form>
    )
  }

  // Step 4: Confirm and submit
  if ((step === 3 && form.mode === "precreated") || (step === 4 && form.mode === "custom")) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>Review all details and confirm scheduling the mission.</div>
        {error && <div className="text-red-600">{error}</div>}
        <div className="flex gap-2">
          <Button type="button" onClick={handleBack}>Back</Button>
          <Button type="submit" disabled={submitting}>{submitting ? "Scheduling..." : "Schedule Mission"}</Button>
        </div>
      </form>
    )
  }

  return null
} 