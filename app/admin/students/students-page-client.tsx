"use client"

import { useState, useMemo } from "react"
import { 
  Search, 
  UserPlus, 
  Mail, 
  MoreVertical,
  Download,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Plane,
  GraduationCap,
  CreditCard,
  FileText,
  TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminStudentData } from "@/lib/admin-student-service"
import { StudentDetailsModal } from "./student-details-modal"
import { AddStudentDialog } from "./add-student-dialog"
import { InviteStudentDialog } from "./invite-student-dialog"
import { Progress } from "@/components/ui/progress"

interface AdminStudentsPageClientProps {
  initialStudents: AdminStudentData[]
}

export function AdminStudentsPageClient({ initialStudents }: AdminStudentsPageClientProps) {
  const [students, setStudents] = useState(initialStudents)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterProgram, setFilterProgram] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedStudent, setSelectedStudent] = useState<AdminStudentData | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  // Filter and search students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Search filter
      const matchesSearch = 
        searchQuery === "" ||
        student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())

      // Program filter
      const matchesProgram = 
        filterProgram === "all" ||
        student.enrollments.some(e => e.syllabus?.category === filterProgram)

      // Status filter
      const matchesStatus = 
        filterStatus === "all" ||
        (filterStatus === "active" && student.enrollments.some(e => e.status === "active")) ||
        (filterStatus === "inactive" && !student.enrollments.some(e => e.status === "active")) ||
        (filterStatus === "onboarding" && !student.onboarding.completed)

      return matchesSearch && matchesProgram && matchesStatus
    })
  }, [students, searchQuery, filterProgram, filterStatus])

  // Get unique programs for filter
  const programs = useMemo(() => {
    const programSet = new Set<string>()
    students.forEach(student => {
      student.enrollments.forEach(e => {
        if (e.syllabus?.category) {
          programSet.add(e.syllabus.category)
        }
      })
    })
    return Array.from(programSet)
  }, [students])

  // Summary stats
  const stats = useMemo(() => {
    return {
      total: students.length,
      active: students.filter(s => s.enrollments.some(e => e.status === "active")).length,
      onboarding: students.filter(s => !s.onboarding.completed).length,
      documentsExpiring: students.filter(s => 
        s.documents.medical_certificate_status === "expiring" || 
        s.documents.medical_certificate_status === "expired"
      ).length
    }
  }, [students])

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Valid</Badge>
      case 'expiring':
        return <Badge variant="secondary" className="bg-yellow-500 text-white"><Clock className="h-3 w-3 mr-1" />Expiring</Badge>
      case 'expired':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>
      case 'missing':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Missing</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleViewDetails = (student: AdminStudentData) => {
    setSelectedStudent(student)
    setIsDetailsModalOpen(true)
  }

  const handleExportData = () => {
    // Convert students data to CSV
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Enrollment', 'Flight Hours', 'Balance', 'Medical Status']
    const rows = filteredStudents.map(s => [
      `${s.first_name} ${s.last_name}`,
      s.email,
      s.phone_number || '',
      s.status,
      s.enrollments[0]?.syllabus?.title || 'None',
      s.progress.total_flight_hours,
      `$${s.billing.current_balance.toFixed(2)}`,
      s.documents.medical_certificate_status
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `students-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All registered students</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently enrolled</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Onboarding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.onboarding}</div>
            <p className="text-xs text-muted-foreground mt-1">Completing registration</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Documents Expiring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.documentsExpiring}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={filterProgram} onValueChange={setFilterProgram}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            {programs.map(program => (
              <SelectItem key={program} value={program} className="capitalize">
                {program}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="onboarding">In Onboarding</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={handleExportData}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        
        <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)}>
          <Mail className="h-4 w-4 mr-2" />
          Invite Student
        </Button>
        
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Flight Hours</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Medical</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No students found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow 
                    key={student.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewDetails(student)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-aviation-sky-600 text-white">
                            {getInitials(student.first_name, student.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">{student.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {student.enrollments.length > 0 ? (
                        <div>
                          <div className="font-medium capitalize">
                            {student.enrollments[0].syllabus?.category || 'N/A'}
                          </div>
                          {student.enrollments[0].instructor && (
                            <div className="text-sm text-muted-foreground">
                              {student.enrollments[0].instructor.first_name} {student.enrollments[0].instructor.last_name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not enrolled</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>ACS Progress</span>
                          <span className="font-medium">{student.progress.acs_completion}%</span>
                        </div>
                        <Progress value={student.progress.acs_completion} className="h-2" />
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Plane className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{student.progress.total_flight_hours.toFixed(1)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {student.progress.total_missions} missions
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className={`font-medium ${student.billing.current_balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${Math.abs(student.billing.current_balance).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {student.billing.current_balance < 0 ? 'Owed' : 'Credit'}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getDocumentStatusBadge(student.documents.medical_certificate_status)}
                    </TableCell>
                    
                    <TableCell>
                      {student.onboarding.completed ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Onboarding
                        </Badge>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleViewDetails(student)
                          }}>
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `/admin/users/${student.id}`
                          }}>
                            <GraduationCap className="h-4 w-4 mr-2" />
                            Manage Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            // TODO: Navigate to billing page
                          }}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Manage Billing
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `/student/progress?studentId=${student.id}`
                          }}>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            View Progress
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals and Dialogs */}
      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false)
            setSelectedStudent(null)
          }}
        />
      )}
      
      <AddStudentDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={() => {
          setIsAddDialogOpen(false)
          // Refresh students list
          window.location.reload()
        }}
      />
      
      <InviteStudentDialog
        isOpen={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
        onSuccess={() => {
          setIsInviteDialogOpen(false)
        }}
      />
    </div>
  )
}

