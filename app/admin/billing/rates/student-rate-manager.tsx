"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Plus,
  Edit,
  Search,
  DollarSign,
  User,
  Calendar,
  SquarePen
} from "lucide-react"
import { EditStudentRatesModal } from "@/components/admin/billing/edit-student-rates-modal"

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface Instructor {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface ExistingRate {
  id: string
  student_id: string
  instructor_id: string
  flight_instruction_rate: number
  ground_instruction_rate: number
  effective_date: string
  is_active: boolean
  notes?: string
  student?: Student
  instructor?: Instructor
}

interface StudentRateManagerProps {
  students: Student[]
  instructors: Instructor[]
  existingRates: ExistingRate[]
}

export function StudentRateManager({ students, instructors, existingRates }: StudentRateManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<ExistingRate | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [selectedInstructorId, setSelectedInstructorId] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredStudents = students.filter(student =>
    `${student.first_name} ${student.last_name} ${student.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const handleAddRate = (studentId?: string, instructorId?: string) => {
    setEditingRate(null)
    setSelectedStudentId(studentId || "")
    setSelectedInstructorId(instructorId || "")
    setIsModalOpen(true)
  }

  const handleEditRate = (rate: ExistingRate) => {
    setEditingRate(rate)
    setSelectedStudentId(rate.student_id)
    setSelectedInstructorId(rate.instructor_id)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingRate(null)
    setSelectedStudentId("")
    setSelectedInstructorId("")
  }

  const handleRateUpdated = () => {
    // In a real implementation, this would refresh the data
    // For now, we'll just show a success message
    window.location.reload()
  }


  const getStudentRateInfo = (studentId: string) => {
    const rate = existingRates.find(r => r.student_id === studentId && r.is_active)
    return rate || null
  }

  return (
    <div className="space-y-6">
      {/* Quick Rate Setting */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quick Rate Management</CardTitle>
              <CardDescription>
                Set custom rates for students or view current rates
              </CardDescription>
            </div>
            <Button onClick={handleAddRate}>
              <Plus className="w-4 h-4 mr-2" />
              Set Custom Rate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Students List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredStudents.map((student) => {
              const currentRate = getStudentRateInfo(student.id)
              const defaultInstructor = instructors.find(i => i.email === 'thomas@desertskiesaviationaz.com')

              return (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">{student.first_name} {student.last_name}</p>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {currentRate ? (
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Flight: ${currentRate.flight_instruction_rate.toFixed(2)}/hr
                        </p>
                        <p className="text-sm font-medium">
                          Ground: ${currentRate.ground_instruction_rate.toFixed(2)}/hr
                        </p>
                        <Badge variant="default" className="text-xs mt-1">Custom Rate</Badge>
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Flight: $75.00/hr (default)
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Ground: $75.00/hr (default)
                        </p>
                        <Badge variant="secondary" className="text-xs mt-1">Default Rate</Badge>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {currentRate ? (
                        <button
                          onClick={() => handleEditRate(currentRate)}
                          className="group relative inline-flex h-9 items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-aviation-sunset-200 bg-white/5 px-4 py-2 text-xs font-semibold text-aviation-sunset-300 ring-offset-background transition-all duration-300 hover:scale-105 hover:border-aviation-sunset-300 hover:bg-aviation-sunset-50/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                        >
                          <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"></span>
                          <span className="relative flex items-center gap-2">
                            <SquarePen className="h-4 w-4" />
                          </span>
                        </button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddRate(student.id, defaultInstructor?.id)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Student Rates Modal */}
      <EditStudentRatesModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        studentId={selectedStudentId}
        instructorId={selectedInstructorId}
        currentRate={editingRate}
        onRateUpdated={handleRateUpdated}
      />
    </div>
  )
}
