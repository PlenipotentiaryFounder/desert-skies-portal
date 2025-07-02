'use client'

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

const LESSON_TYPES = [
  "Ground", "Flight", "Simulator", "Briefing", "Checkride Prep", "Exam", "Other"
]

const FIELDS = [
  { name: "title", label: "Lesson Title", required: true, max: 100, help: "A short, descriptive title for this lesson." },
  { name: "description", label: "Description", required: true, max: 500, help: "A detailed description of the lesson." },
  { name: "objective", label: "Objective", required: true, max: 500, help: "What is the objective of this lesson?" },
  { name: "performance_standards", label: "Performance Standards", required: false, max: 500, help: "What are the performance standards?" },
  { name: "final_thoughts", label: "Final Thoughts", required: false, max: 500, help: "Any final thoughts for the student?" },
  { name: "notes", label: "Notes", required: false, max: 2000, help: "Instructor notes" },
  { name: "lesson_type", label: "Lesson Type", required: true, max: 50, help: "Select the type of lesson." },
  { name: "estimated_hours", label: "Estimated Hours", required: true, max: 5, help: "Estimated hours for this lesson." },
  { name: "email_subject", label: "Email Subject", required: false, max: 200, help: "Lesson email subject" },
  { name: "email_body", label: "Email Body", required: false, max: 2000, help: "Lesson email body (markdown supported)" },
]

export default function LessonInfoPanel({ value, onChange }: {
  value: any,
  onChange: (v: any) => void
}) {
  const [info, setInfo] = useState(value || {})
  const [errors, setErrors] = useState<any>({})

  useEffect(() => { setInfo(value || {}) }, [value])

  function validate(field: string, val: string) {
    const meta = FIELDS.find(f => f.name === field)
    if (!meta) return ""
    if (meta.required && !val.trim()) return "Required."
    if (meta.max && val.length > meta.max) return `Max ${meta.max} characters.`
    return ""
  }

  function handleChange(field: string, val: string) {
    const next = { ...info, [field]: val }
    setInfo(next)
    onChange(next)
    setErrors((errs: any) => ({ ...errs, [field]: validate(field, val) }))
  }

  return (
    <Card className="p-6 space-y-6">
      {FIELDS.map(meta => (
        <div key={meta.name} className="space-y-1">
          <Label htmlFor={meta.name}>{meta.label}{meta.required && <span className="text-red-500 ml-1">*</span>}</Label>
          {meta.name === "email_body" ? (
            <Textarea
              id={meta.name}
              value={info[meta.name] || ""}
              onChange={e => handleChange(meta.name, e.target.value)}
              maxLength={meta.max}
              placeholder={meta.help}
            />
          ) : meta.name === "description" || meta.name === "objective" || meta.name === "performance_standards" || meta.name === "final_thoughts" || meta.name === "notes" ? (
            <Textarea
              id={meta.name}
              value={info[meta.name] || ""}
              onChange={e => handleChange(meta.name, e.target.value)}
              maxLength={meta.max}
              placeholder={meta.help}
            />
          ) : meta.name === "lesson_type" ? (
            <Select value={info[meta.name] || ""} onValueChange={v => handleChange(meta.name, v)} required>
              <SelectTrigger>
                <SelectValue placeholder={meta.help} />
              </SelectTrigger>
              <SelectContent>
                {LESSON_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={meta.name}
              value={info[meta.name] || ""}
              onChange={e => handleChange(meta.name, e.target.value)}
              maxLength={meta.max}
              placeholder={meta.help}
            />
          )}
          <div className="text-xs text-muted-foreground">{meta.help}</div>
          {errors[meta.name] && <div className="text-xs text-red-500">{errors[meta.name]}</div>}
        </div>
      ))}
    </Card>
  )
} 