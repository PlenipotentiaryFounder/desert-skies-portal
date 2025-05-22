import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getStudents } from "@/lib/user-service"

export const metadata = {
  title: "Students | Admin | Desert Skies",
  description: "Manage all students in the system.",
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getStudents()
      .then((data) => setStudents(data))
      .catch((e) => setError(e.message || "Failed to load students"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Students</h1>
        <Button asChild>
          <Link href="/admin/students/new">Add New Student</Link>
        </Button>
      </div>
      {loading && <div>Loading students...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full border bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-gray-500">No students found.</td>
                </tr>
              )}
              {students.map((student) => (
                <tr key={student.id} className="border-t">
                  <td className="px-4 py-2">{student.first_name} {student.last_name}</td>
                  <td className="px-4 py-2">{student.email}</td>
                  <td className="px-4 py-2 capitalize">{student.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 