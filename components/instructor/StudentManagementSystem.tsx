"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  BookOpen, 
  Target, 
  TrendingUp, 
  MessageSquare, 
  Calendar as CalendarIcon,
  FileText,
  Settings,
  BarChart3,
  Plus,
  Search,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  MapPin,
  Plane,
  GraduationCap,
  Award,
  Star,
  MessageCircle,
  Edit,
  Eye,
  Download
} from 'lucide-react'

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_number?: string
  date_of_birth?: string
  status: string
  profile_image?: string
}

interface Enrollment {
  id: string
  syllabus_name: string
  start_date: string
  status: string
  progress: any
}

interface FlightSession {
  id: string
  date: string
  start_time: string
  end_time: string
  status: string
  notes?: string
}

interface ManeuverScore {
  maneuver: string
  score: number
  date: string
  notes?: string
}

interface ACSProgress {
  area: string
  completed: number
  total: number
  status: 'not_started' | 'in_progress' | 'completed'
}

interface StudentDetail extends Student {
  enrollments: Enrollment[]
  recentSessions: FlightSession[]
  nextSession?: FlightSession
  maneuverScores: ManeuverScore[]
  acsProgress: ACSProgress[]
  totalFlightHours: number
  soloHours: number
  crossCountryHours: number
  nightHours: number
  instructorNotes: string[]
}

export default function StudentManagementSystem() {
  const [students, setStudents] = useState<StudentDetail[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [newStudent, setNewStudent] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    date_of_birth: ''
  })

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Fetch students on component mount
  useEffect(() => {
    const fetchStudents = async () => {
      console.log('🔄 [Frontend] Starting to fetch students...')
      setIsLoadingStudents(true)
      
      try {
        console.log('📡 [Frontend] Making API request to /api/instructor/students')
        const response = await fetch('/api/instructor/students', {
          credentials: 'include'
        })
        
        console.log('📊 [Frontend] Response status:', response.status)
        console.log('📊 [Frontend] Response headers:', Object.fromEntries(response.headers.entries()))
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ [Frontend] API response received:', {
            studentsCount: data.students?.length || 0,
            totalStudents: data.totalStudents,
            activeStudents: data.activeStudents
          })
          
          if (data.students) {
            console.log('👥 [Frontend] Setting students in state:', data.students.map((s: any) => ({
              id: s.id,
              name: `${s.first_name} ${s.last_name}`,
              email: s.email,
              status: s.status
            })))
            setStudents(data.students)
          } else {
            console.warn('⚠️ [Frontend] No students array in response, setting empty array')
            setStudents([])
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }))
          console.error('❌ [Frontend] API request failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          })
          
          // Log detailed error information
          if (response.status === 401) {
            console.error('🔐 [Frontend] Authentication error - user may not be logged in')
          } else if (response.status === 403) {
            console.error('🚫 [Frontend] Authorization error - user may not have instructor role')
          } else if (response.status >= 500) {
            console.error('💥 [Frontend] Server error - check server logs')
          }
          
          // Set empty students array to prevent UI errors
          setStudents([])
        }
      } catch (error) {
        console.error('💥 [Frontend] Network or parsing error:', error)
        console.error('💥 [Frontend] Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        })
        
        // Set empty students array to prevent UI errors
        setStudents([])
      } finally {
        console.log('🏁 [Frontend] Fetch students operation completed')
        setIsLoadingStudents(false)
      }
    }

    fetchStudents()
  }, [])

  const handleStudentSelect = async (student: Student) => {
    console.log('👆 [Frontend] Selecting student:', { id: student.id, name: `${student.first_name} ${student.last_name}` })
    setIsLoading(true)
    
    try {
      // Find the student with full details from the students array
      const studentWithDetails = students.find(s => s.id === student.id)
      if (studentWithDetails) {
        console.log('✅ [Frontend] Student details found, setting as selected')
        setSelectedStudent(studentWithDetails as StudentDetail)
      } else {
        console.warn('⚠️ [Frontend] Student details not found in current students array')
      }
    } catch (error) {
      console.error('💥 [Frontend] Error selecting student:', error)
      console.error('💥 [Frontend] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'inactive': return 'bg-gray-500'
      case 'pending': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 80) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getACSStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-yellow-500'
      case 'not_started': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const handleAddStudent = async () => {
    console.log('➕ [Frontend] Starting to add new student:', newStudent)
    
    try {
      console.log('📡 [Frontend] Making POST request to /api/instructor/students')
      const response = await fetch('/api/instructor/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStudent),
      })

      console.log('📊 [Frontend] Add student response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ [Frontend] Student added successfully:', data)
        setStudents(prev => [...prev, data.student])
        setShowAddStudent(false)
        setNewStudent({
          first_name: '',
          last_name: '',
          email: '',
          phone_number: '',
          date_of_birth: ''
        })
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }))
        console.error('❌ [Frontend] Failed to add student:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        
        // Log specific error types
        if (response.status === 400) {
          console.error('📝 [Frontend] Validation error - check required fields')
        } else if (response.status === 401) {
          console.error('🔐 [Frontend] Authentication error')
        } else if (response.status === 403) {
          console.error('🚫 [Frontend] Authorization error')
        } else if (response.status >= 500) {
          console.error('💥 [Frontend] Server error - check server logs')
        }
      }
    } catch (error) {
      console.error('💥 [Frontend] Network or parsing error while adding student:', error)
      console.error('💥 [Frontend] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
    }
  }

  return (
    <div className="h-full bg-gradient-night-sky p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Left Panel - Student List */}
        <div className="lg:col-span-1 space-y-4">
          <Card variant="dashboard" className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 title-gold-glow">
                  <User className="w-5 h-5" />
                  Students
                </CardTitle>
                <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="aviation">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Student</DialogTitle>
                      <DialogDescription>
                        Enter the student's information to add them to your roster.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input 
                          placeholder="First Name" 
                          value={newStudent.first_name}
                          onChange={(e) => setNewStudent(prev => ({ ...prev, first_name: e.target.value }))}
                        />
                        <Input 
                          placeholder="Last Name" 
                          value={newStudent.last_name}
                          onChange={(e) => setNewStudent(prev => ({ ...prev, last_name: e.target.value }))}
                        />
                      </div>
                      <Input 
                        placeholder="Email" 
                        type="email" 
                        value={newStudent.email}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                      />
                      <Input 
                        placeholder="Phone Number" 
                        value={newStudent.phone_number}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, phone_number: e.target.value }))}
                      />
                      <Input 
                        placeholder="Date of Birth" 
                        type="date" 
                        value={newStudent.date_of_birth}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddStudent(false)}>
                        Cancel
                      </Button>
                      <Button variant="aviation" onClick={handleAddStudent}>
                        Add Student
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Search and Filter */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {isLoadingStudents ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aviation-sunset-500 mx-auto mb-4"></div>
                  <p>Loading students...</p>
                </div>
              ) : (
                <>
                  {filteredStudents.length > 0 ? (
                    <AnimatePresence>
                      {filteredStudents.map((student) => (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div
                          className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/10 border ${
                            selectedStudent?.id === student.id 
                              ? 'bg-aviation-sunset-500/20 border-aviation-sunset-500' 
                              : 'border-transparent hover:border-white/20'
                          }`}
                          onClick={() => handleStudentSelect(student)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={student.profile_image} />
                              <AvatarFallback>
                                {student.first_name[0]}{student.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground truncate">
                                  {student.first_name} {student.last_name}
                                </p>
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(student.status)}`} />
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {student.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    </AnimatePresence>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No students found</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Student Details */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Student Header */}
              <Card variant="dashboard">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={selectedStudent.profile_image} />
                      <AvatarFallback className="text-2xl">
                        {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <h2 className="text-3xl font-bold title-gold-glow">
                          {selectedStudent.first_name} {selectedStudent.last_name}
                        </h2>
                        <Badge variant={selectedStudent.status === 'active' ? 'default' : 'secondary'}>
                          {selectedStudent.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedStudent.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedStudent.phone_number || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedStudent.date_of_birth || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedStudent.totalFlightHours} hours</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                      <Button variant="outline" size="sm">
                        <CalendarDays className="w-4 h-4 mr-1" />
                        Schedule
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Student Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" />
                            View Documents
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <BookOpen className="w-4 h-4 mr-2" />
                            Update Syllabus
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Reports
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Student Details Tabs */}
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="progress">Progress</TabsTrigger>
                  <TabsTrigger value="sessions">Sessions</TabsTrigger>
                  <TabsTrigger value="maneuvers">Maneuvers</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Current Enrollment */}
                    <Card variant="dashboard">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 title-gold-glow">
                          <GraduationCap className="w-5 h-5" />
                          Current Enrollment
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedStudent.enrollments.map((enrollment) => (
                          <div key={enrollment.id} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{enrollment.syllabus_name}</h4>
                              <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                                {enrollment.status}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{enrollment.progress.completed}/{enrollment.progress.total} hours</span>
                              </div>
                              <Progress value={(enrollment.progress.completed / enrollment.progress.total) * 100} />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Started: {new Date(enrollment.start_date).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Next Session */}
                    <Card variant="dashboard">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 title-gold-glow">
                          <CalendarDays className="w-5 h-5" />
                          Next Session
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedStudent.nextSession ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">
                                {new Date(selectedStudent.nextSession.date).toLocaleDateString()}
                              </h4>
                              <Badge variant="outline">
                                {selectedStudent.nextSession.start_time} - {selectedStudent.nextSession.end_time}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {selectedStudent.nextSession.notes}
                            </p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="aviation">
                                View Details
                              </Button>
                              <Button size="sm" variant="outline">
                                Reschedule
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No upcoming sessions</p>
                            <Button size="sm" variant="aviation" className="mt-2">
                              Schedule Session
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Flight Hours Summary */}
                    <Card variant="dashboard">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 title-gold-glow">
                          <Plane className="w-5 h-5" />
                          Flight Hours
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Total Hours</span>
                            <span className="font-semibold">{selectedStudent.totalFlightHours}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Solo Hours</span>
                            <span className="font-semibold">{selectedStudent.soloHours}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cross Country</span>
                            <span className="font-semibold">{selectedStudent.crossCountryHours}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Night Hours</span>
                            <span className="font-semibold">{selectedStudent.nightHours}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card variant="dashboard">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 title-gold-glow">
                          <TrendingUp className="w-5 h-5" />
                          Recent Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedStudent.recentSessions.slice(0, 3).map((session) => (
                            <div key={session.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                              <div className={`w-2 h-2 rounded-full ${
                                session.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                              }`} />
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {new Date(session.date).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {session.start_time} - {session.end_time}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {session.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="progress" className="space-y-4">
                  <Card variant="dashboard">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 title-gold-glow">
                        <Award className="w-5 h-5" />
                        ACS Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedStudent.acsProgress.map((area) => (
                          <div key={area.area} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{area.area}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {area.completed}/{area.total}
                                </span>
                                <div className={`w-3 h-3 rounded-full ${getACSStatusColor(area.status)}`} />
                              </div>
                            </div>
                            <Progress value={(area.completed / area.total) * 100} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sessions" className="space-y-4">
                  <Card variant="dashboard">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 title-gold-glow">
                        <Clock3 className="w-5 h-5" />
                        Flight Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedStudent.recentSessions.map((session) => (
                          <div key={session.id} className="p-4 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-semibold">
                                  {new Date(session.date).toLocaleDateString()}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {session.start_time} - {session.end_time}
                                </p>
                              </div>
                              <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                                {session.status}
                              </Badge>
                            </div>
                            {session.notes && (
                              <p className="text-sm text-muted-foreground">{session.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="maneuvers" className="space-y-4">
                  <Card variant="dashboard">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 title-gold-glow">
                        <Target className="w-5 h-5" />
                        Maneuver Scores
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedStudent.maneuverScores.map((maneuver) => (
                          <div key={maneuver.maneuver} className="p-4 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{maneuver.maneuver}</h4>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${getProgressColor(maneuver.score)}`}>
                                  {maneuver.score}%
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(maneuver.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {maneuver.notes && (
                              <p className="text-sm text-muted-foreground">{maneuver.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  <Card variant="dashboard">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 title-gold-glow">
                        <FileText className="w-5 h-5" />
                        Instructor Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedStudent.instructorNotes.map((note, index) => (
                          <div key={index} className="p-4 rounded-lg border border-white/10">
                            <p className="text-sm">{note}</p>
                          </div>
                        ))}
                        <div className="pt-4 border-t border-white/10">
                          <Textarea placeholder="Add a new note..." className="mb-3" />
                          <Button variant="aviation" size="sm">
                            Add Note
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          ) : (
            <Card variant="dashboard" className="h-full">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">Select a Student</h3>
                  <p>Choose a student from the list to view their details and manage their training.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 