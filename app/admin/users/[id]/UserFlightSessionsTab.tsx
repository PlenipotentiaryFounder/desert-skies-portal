"use client"

import dynamic from "next/dynamic"
import React from "react"

const StudentFlightSessionsList = dynamic(() => import("../../../student/schedule/student-flight-sessions-list").then(m => m.StudentFlightSessionsList))
const InstructorFlightSessionsList = dynamic(() => import("../../../instructor/schedule/instructor-flight-sessions-list").then(m => m.InstructorFlightSessionsList))
const FlightSessionsList = dynamic(() => import("@/app/admin/schedule/flight-sessions-list").then(m => m.FlightSessionsList))

interface UserFlightSessionsTabProps {
  userRole: string
  userId: string
  studentSessions: any[]
  instructorSessions: any[]
}

export default function UserFlightSessionsTab({ userRole, userId, studentSessions, instructorSessions }: UserFlightSessionsTabProps) {
  if (userRole === "student") {
    return <StudentFlightSessionsList initialSessions={studentSessions} />
  }
  if (userRole === "instructor") {
    return <InstructorFlightSessionsList initialSessions={instructorSessions} />
  }
  // For admin or other roles, show both sets or a message
  if (studentSessions.length > 0 || instructorSessions.length > 0) {
    return (
      <>
        {studentSessions.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">As Student</h3>
            <StudentFlightSessionsList initialSessions={studentSessions} />
          </div>
        )}
        {instructorSessions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">As Instructor</h3>
            <InstructorFlightSessionsList initialSessions={instructorSessions} />
          </div>
        )}
      </>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <h3 className="mt-2 text-lg font-semibold">No flight sessions found</h3>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">This user has no flight sessions as a student or instructor.</p>
    </div>
  )
} 