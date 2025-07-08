"use client"

import dynamic from "next/dynamic"

const EnrollmentsList = dynamic(
  () => import("@/app/admin/enrollments/enrollments-list").then(m => m.EnrollmentsList),
  { 
    loading: () => <div className="animate-pulse h-32 bg-muted rounded" />,
    ssr: false 
  }
)
const InstructorStudentsList = dynamic(
  () => import("@/components/instructor/instructor-students-list").then(m => m.InstructorStudentsList),
  { 
    loading: () => <div className="animate-pulse h-32 bg-muted rounded" />,
    ssr: false 
  }
)

interface UserEnrollmentsTabProps {
  userRole: string
  studentEnrollments: any[]
  instructorEnrollments: any[]
}

export default function UserEnrollmentsTab({ userRole, studentEnrollments, instructorEnrollments }: UserEnrollmentsTabProps) {
  if (userRole === "student") {
    return <EnrollmentsList enrollments={studentEnrollments} />
  }
  if (userRole === "instructor") {
    return <InstructorStudentsList enrollments={instructorEnrollments} />
  }
  return <div className="py-8">No enrollments to display for this user.</div>
} 