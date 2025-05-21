"use client"
import { MissionForm } from "./mission-form"

export function MissionFormClient({ enrollments, lessons, maneuvers, initialValues }: {
  enrollments: any[],
  lessons: any[],
  maneuvers: any[],
  initialValues?: any
}) {
  async function handleScheduleMission(form: any) {
    // TODO: Implement call to scheduleMissionServerAction via fetch or mutation
    // For now, just log
    console.log("Scheduling mission (client):", form)
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