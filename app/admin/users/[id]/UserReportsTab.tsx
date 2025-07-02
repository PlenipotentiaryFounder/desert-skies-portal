"use client"

import { useState, Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { StudentProgressReport } from "@/app/admin/reports/student-progress-report"
import { InstructorPerformanceReport } from "@/app/admin/reports/instructor-performance-report"
import { SchoolPerformanceReport } from "@/app/admin/reports/school-performance-report"
import { AircraftUtilizationReport } from "@/app/admin/reports/aircraft-utilization-report"

export default function UserReportsTab({ user }: { user: any }) {
  const [reportType, setReportType] = useState(
    user.role === "student"
      ? "student"
      : user.role === "instructor"
      ? "instructor"
      : "school"
  )
  return (
    <Card>
      <CardContent className="py-8">
        <h2 className="text-xl font-semibold mb-4">Reports</h2>
        <div className="mb-4 flex flex-col md:flex-row md:items-center gap-4">
          <label className="font-medium">Select Report:</label>
          <select
            className="border rounded px-3 py-2 text-base"
            value={reportType}
            onChange={e => setReportType(e.target.value)}
          >
            {user.role === "student" && <option value="student">Student Progress Report</option>}
            {user.role === "instructor" && <option value="instructor">Instructor Performance Report</option>}
            <option value="school">School Performance Report</option>
            <option value="aircraft">Aircraft Utilization Report</option>
          </select>
        </div>
        <Suspense fallback={<div>Loading report...</div>}>
          {reportType === "student" && <StudentProgressReport userId={user.id} />}
          {reportType === "instructor" && <InstructorPerformanceReport userId={user.id} />}
          {reportType === "school" && <SchoolPerformanceReport />}
          {reportType === "aircraft" && <AircraftUtilizationReport />}
        </Suspense>
      </CardContent>
    </Card>
  )
} 