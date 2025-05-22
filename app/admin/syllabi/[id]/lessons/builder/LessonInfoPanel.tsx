import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useState } from "react"

const LESSON_TYPES = [
  "Ground", "Flight", "Simulator", "Briefing", "Checkride Prep", "Exam", "Other"
]

export default function LessonInfoPanel({ value, onChange }: {
  value: any,
  onChange: (v: any) => void
}) {
  const [form, setForm] = useState(value || {
    title: "",
    description: "",
    objective: "",
    performance_standards: "",
    final_thoughts: "",
    notes: "",
    lesson_type: "",
    estimated_hours: 1,
    email_subject: "",
    email_body: "",
  })
  function handleChange(field: string, val: any) {
    const next = { ...form, [field]: val }
    setForm(next)
    onChange(next)
  }
  return (
    <form className="space-y-4 max-w-2xl">
      <Input
        label="Title"
        placeholder="Lesson Title"
        value={form.title}
        onChange={e => handleChange("title", e.target.value)}
        required
      />
      <Textarea
        label="Description"
        placeholder="Lesson description"
        value={form.description}
        onChange={e => handleChange("description", e.target.value)}
        required
      />
      <Textarea
        label="Objective"
        placeholder="What is the objective of this lesson?"
        value={form.objective}
        onChange={e => handleChange("objective", e.target.value)}
      />
      <Textarea
        label="Performance Standards"
        placeholder="What are the performance standards?"
        value={form.performance_standards}
        onChange={e => handleChange("performance_standards", e.target.value)}
      />
      <Textarea
        label="Final Thoughts"
        placeholder="Any final thoughts for the student?"
        value={form.final_thoughts}
        onChange={e => handleChange("final_thoughts", e.target.value)}
      />
      <Textarea
        label="Notes"
        placeholder="Instructor notes"
        value={form.notes}
        onChange={e => handleChange("notes", e.target.value)}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select value={form.lesson_type} onValueChange={v => handleChange("lesson_type", v)} required>
          <SelectTrigger>
            <SelectValue placeholder="Select lesson type" />
          </SelectTrigger>
          <SelectContent>
            {LESSON_TYPES.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          min={0.5}
          step={0.5}
          label="Estimated Hours"
          placeholder="1.0"
          value={form.estimated_hours}
          onChange={e => handleChange("estimated_hours", e.target.value)}
          required
        />
      </div>
      <Input
        label="Email Subject"
        placeholder="Lesson email subject"
        value={form.email_subject}
        onChange={e => handleChange("email_subject", e.target.value)}
      />
      <Textarea
        label="Email Body"
        placeholder="Lesson email body (markdown supported)"
        value={form.email_body}
        onChange={e => handleChange("email_body", e.target.value)}
      />
    </form>
  )
} 