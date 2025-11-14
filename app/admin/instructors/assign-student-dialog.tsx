"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, AlertCircle } from "lucide-react"
import { assignStudentToInstructor, getAvailableStudentsForAssignment, getAvailableSyllabi } from "@/lib/admin-instructor-service"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface AssignStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instructorId: string
  instructorName: string
}

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  current_instructor: string
  has_active_enrollment: boolean
}

interface Syllabus {
  id: string
  title: string
  faa_type: string
  description: string | null
}

export function AssignStudentDialog({ open, onOpenChange, instructorId, instructorName }: AssignStudentDialogProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [syllabi, setSyllabi] = useState<Syllabus[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [selectedSyllabus, setSelectedSyllabus] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    setLoading(true)
    try {
      const [studentsData, syllabiData] = await Promise.all([
        getAvailableStudentsForAssignment(),
        getAvailableSyllabi()
      ])
      setStudents(studentsData)
      setSyllabi(syllabiData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load students and syllabi. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student => {
    const searchLower = searchQuery.toLowerCase()
    return (
      student.first_name.toLowerCase().includes(searchLower) ||
      student.last_name.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower)
    )
  })

  const handleAssign = async () => {
    if (!selectedStudent || !selectedSyllabus) {
      toast({
        title: "Missing Information",
        description: "Please select both a student and a syllabus.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      await assignStudentToInstructor(selectedStudent, instructorId, selectedSyllabus)
      
      const student = students.find(s => s.id === selectedStudent)
      toast({
        title: "Student Assigned",
        description: `${student?.first_name} ${student?.last_name} has been assigned to ${instructorName}.`,
      })
      
      onOpenChange(false)
      router.refresh()
      
      // Reset form
      setSelectedStudent("")
      setSelectedSyllabus("")
      setSearchQuery("")
    } catch (error) {
      console.error('Error assigning student:', error)
      toast({
        title: "Error",
        description: "Failed to assign student. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedStudentData = students.find(s => s.id === selectedStudent)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Student to {instructorName}</DialogTitle>
          <DialogDescription>
            Select a student to assign to this instructor. You can assign students with existing instructors or new students.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Student Selection */}
          <div className="space-y-3">
            <Label htmlFor="search">Search Students</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading students...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No students found
              </div>
            ) : (
              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedStudent === student.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedStudent(student.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {student.first_name[0]}{student.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">{student.email}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Current: {student.current_instructor}
                        </div>
                      </div>
                      {student.has_active_enrollment && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          Has Active Enrollment
                        </Badge>
                      )}
                      {selectedStudent === student.id && (
                        <Badge variant="default">Selected</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Syllabus Selection */}
          {selectedStudent && (
            <div className="space-y-3">
              <Label htmlFor="syllabus">Select Syllabus / Program</Label>
              <Select value={selectedSyllabus} onValueChange={setSelectedSyllabus}>
                <SelectTrigger id="syllabus">
                  <SelectValue placeholder="Choose a training program" />
                </SelectTrigger>
                <SelectContent>
                  {syllabi.map((syllabus) => (
                    <SelectItem key={syllabus.id} value={syllabus.id}>
                      <div>
                        <div className="font-medium">{syllabus.title}</div>
                        <div className="text-xs text-muted-foreground">{syllabus.faa_type}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Select the training program for this student's enrollment
              </p>
            </div>
          )}

          {/* Warning for reassignment */}
          {selectedStudentData?.has_active_enrollment && (
            <div className="flex gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900">Reassignment Warning</p>
                <p className="text-yellow-700 mt-1">
                  This student is currently enrolled with {selectedStudentData.current_instructor}. 
                  Assigning them to {instructorName} will update their active enrollment.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedStudent || !selectedSyllabus || submitting}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            {submitting ? 'Assigning...' : 'Assign Student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

