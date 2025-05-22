'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function AdminAddStudentForm({ instructors, adminAddStudent }: { instructors: { id: string, name: string, email: string }[], adminAddStudent: (data: any) => Promise<any> }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [instructorIds, setInstructorIds] = useState<string[]>([])

  const canContinueStep1 = email && firstName && lastName
  const canContinueStep2 = instructorIds.length > 0

  const handleAssignInstructor = (id: string) => {
    setInstructorIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      // Use the server action via fetch
      const res = await fetch("/admin/students/new/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          instructorIds,
          instructors,
        }),
      })
      const result = await res.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to add student")
      }
      setSuccess(true)
    } catch (e: any) {
      setError(e.message || "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Add New Student</h1>
      <div className="mb-6 flex gap-2">
        <StepIndicator step={step} label="Student Info" active={step === 1} />
        <StepIndicator step={step} label="Assign Instructors" active={step === 2} />
        <StepIndicator step={step} label="Confirm & Create" active={step === 3} />
      </div>
      {step === 1 && (
        <form>
          <div className="mb-4">
            <label className="block font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@email.com"
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1">First Name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1">Last Name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex justify-end mt-6">
            <Button type="button" onClick={() => setStep(2)} disabled={!canContinueStep1}>
              Next
            </Button>
          </div>
        </form>
      )}
      {step === 2 && (
        <form>
          <div className="mb-4">
            <label className="block font-medium mb-1">Assign Instructors</label>
            <div className="space-y-2">
              {instructors.map((instructor) => (
                <label key={instructor.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={instructorIds.includes(instructor.id)}
                    onChange={() => handleAssignInstructor(instructor.id)}
                  />
                  {instructor.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep(3)} disabled={!canContinueStep2}>
              Next
            </Button>
          </div>
        </form>
      )}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Confirm Details</h2>
          <ul className="mb-4">
            <li><b>Email:</b> {email}</li>
            <li><b>Name:</b> {firstName} {lastName}</li>
            <li><b>Assigned Instructors:</b> {instructors.filter(i => instructorIds.includes(i.id)).map(i => i.name).join(", ")}</li>
          </ul>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          {success && <div className="text-green-600 mb-2">Student created and assigned successfully!</div>}
          <div className="flex justify-between mt-6">
            <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={loading}>
              Back
            </Button>
            <Button type="button" onClick={handleCreate} disabled={loading || success}>
              {loading ? "Creating..." : "Confirm & Create"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function StepIndicator({ step, label, active }: { step: number; label: string; active: boolean }) {
  return (
    <div className={`flex-1 text-center py-2 rounded ${active ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>{label}</div>
  )
} 