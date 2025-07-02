"use client"

import { useState } from "react"

export function RequestSessionForm({
  enrollments = [],
  lessons = [],
  instructors = [],
  aircraft = [],
  locations = []
}: {
  enrollments: any[]
  lessons: any[]
  instructors: any[]
  aircraft: any[]
  locations: any[]
}) {
  const [form, setForm] = useState({
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
    weather_conditions: null as any
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    const res = await fetch("/api/instructor/schedule/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      setSuccess(true)
      setForm((f) => ({ ...f, notes: "" }))
    } else {
      const data = await res.json()
      setError(data.error || "Unknown error")
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Enrollment</label>
        <select name="enrollment_id" value={form.enrollment_id} onChange={handleChange} required>
          <option value="">Select...</option>
          {enrollments.map((e) => (
            <option key={e.id} value={e.id}>{e.syllabus_title || e.id}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Lesson</label>
        <select name="lesson_id" value={form.lesson_id} onChange={handleChange} required>
          <option value="">Select...</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Instructor</label>
        <select name="instructor_id" value={form.instructor_id} onChange={handleChange} required>
          <option value="">Select...</option>
          {instructors.map((i) => (
            <option key={i.id} value={i.id}>{i.first_name} {i.last_name}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Aircraft</label>
        <select name="aircraft_id" value={form.aircraft_id} onChange={handleChange} required>
          <option value="">Select...</option>
          {aircraft.map((a) => (
            <option key={a.id} value={a.id}>{a.tail_number} ({a.make} {a.model})</option>
          ))}
        </select>
      </div>
      <div>
        <label>Date</label>
        <input type="date" name="date" value={form.date} onChange={handleChange} required />
      </div>
      <div>
        <label>Start Time (24-hour)</label>
        <input type="time" name="start_time" value={form.start_time} onChange={handleChange} required step="60" />
      </div>
      <div>
        <label>End Time (24-hour)</label>
        <input type="time" name="end_time" value={form.end_time} onChange={handleChange} required step="60" />
      </div>
      <div>
        <label>Session Type</label>
        <select name="session_type" value={form.session_type} onChange={handleChange} required>
          <option value="mission">Mission (Flight)</option>
          <option value="ground">Ground</option>
          <option value="mock_oral">Mock Oral</option>
          <option value="mock_check_ride">Mock Check Ride</option>
        </select>
      </div>
      <div>
        <label>Prebrief (min)</label>
        <input type="number" name="prebrief_minutes" value={form.prebrief_minutes} onChange={handleChange} min={0} />
      </div>
      <div>
        <label>Postbrief (min)</label>
        <input type="number" name="postbrief_minutes" value={form.postbrief_minutes} onChange={handleChange} min={0} />
      </div>
      <div>
        <label>Location</label>
        <select name="location_id" value={form.location_id} onChange={handleChange} required>
          <option value="">Select...</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Recurrence Rule</label>
        <input type="text" name="recurrence_rule" value={form.recurrence_rule} onChange={handleChange} placeholder="e.g. FREQ=WEEKLY;BYDAY=MO,WE,FR" />
      </div>
      <div>
        <label>Notes</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} />
      </div>
      <button type="submit" disabled={loading} className="btn btn-primary">{loading ? "Requesting..." : "Request Session"}</button>
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">Session request submitted!</div>}
    </form>
  )
} 