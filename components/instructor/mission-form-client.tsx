"use client"
import { MissionForm } from "./mission-form"

export function MissionFormClient({ enrollments, lessons, maneuvers, initialValues }: {
  enrollments: any[],
  lessons: any[],
  maneuvers: any[],
  initialValues?: any
}) {
  async function handleScheduleMission(form: any) {
    try {
      const response = await fetch("/api/instructor/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to schedule mission")
      }

      // Redirect to the schedule page on success
      window.location.href = "/instructor/schedule"
    } catch (error) {
      console.error("Error scheduling mission:", error)
      throw error
    }
  }
  return (
    <MissionForm
      enrollments={enrollments}
      lessons={lessons}
      maneuvers={maneuvers}
      initialValues={initialValues}
      onSubmit={handleScheduleMission}
    />
  )
} 