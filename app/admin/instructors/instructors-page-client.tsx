"use client"

import { useState, useMemo } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  UserCheck, 
  UserX, 
  Mail,
  Phone,
  Filter,
  AlertCircle,
  CheckCircle,
  Award,
  Users,
  DollarSign,
  Clock,
  Plane
} from "lucide-react"
import { AdminInstructorData } from "@/lib/admin-instructor-service"
import { InstructorDetailsModal } from "./instructor-details-modal"
import { PendingApprovalsCard } from "./pending-approvals-card"
import { cn } from "@/lib/utils"

interface AdminInstructorsPageClientProps {
  initialInstructors: AdminInstructorData[]
}

type CertificationFilter = 'all' | 'cfi' | 'cfii' | 'mei'
type StatusFilter = 'all' | 'active' | 'pending' | 'inactive'

export function AdminInstructorsPageClient({ initialInstructors }: AdminInstructorsPageClientProps) {
  const [instructors] = useState<AdminInstructorData[]>(initialInstructors)
  const [searchQuery, setSearchQuery] = useState("")
  const [certificationFilter, setCertificationFilter] = useState<CertificationFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedInstructor, setSelectedInstructor] = useState<AdminInstructorData | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  // Calculate statistics
  const stats = useMemo(() => {
    const total = instructors.length
    const cfi = instructors.filter(i => i.certifications.cfi).length
    const cfii = instructors.filter(i => i.certifications.cfii).length
    const mei = instructors.filter(i => i.certifications.mei).length
    const pending = instructors.filter(i => i.onboarding.completed && !i.onboarding.admin_approved).length
    const active = instructors.filter(i => i.status === 'active').length
    const totalStudents = instructors.reduce((sum, i) => sum + i.students.active_count, 0)
    const avgRate = instructors.reduce((sum, i) => sum + i.rates.average_student_rate, 0) / (instructors.length || 1)
    
    return { total, cfi, cfii, mei, pending, active, totalStudents, avgRate }
  }, [instructors])

  // Filter instructors
  const filteredInstructors = useMemo(() => {
    return instructors.filter(instructor => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = 
        instructor.first_name?.toLowerCase().includes(searchLower) ||
        instructor.last_name?.toLowerCase().includes(searchLower) ||
        instructor.email?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
      
      // Certification filter
      if (certificationFilter !== 'all') {
        if (certificationFilter === 'cfi' && !instructor.certifications.cfi) return false
        if (certificationFilter === 'cfii' && !instructor.certifications.cfii) return false
        if (certificationFilter === 'mei' && !instructor.certifications.mei) return false
      }
      
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending' && (instructor.status !== 'active' || instructor.onboarding.admin_approved)) return false
        if (statusFilter === 'active' && instructor.status !== 'active') return false
        if (statusFilter === 'inactive' && instructor.status === 'active') return false
      }
      
      return true
    })
  }, [instructors, searchQuery, certificationFilter, statusFilter])

  const handleViewDetails = (instructor: AdminInstructorData) => {
    setSelectedInstructor(instructor)
    setDetailsModalOpen(true)
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(cents / 100)
  }

  const getStatusBadge = (instructor: AdminInstructorData) => {
    if (instructor.onboarding.completed && !instructor.onboarding.admin_approved) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Approval</Badge>
    }
    if (instructor.status === 'active') {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
    }
    return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Inactive</Badge>
  }

  const getCertificationBadges = (instructor: AdminInstructorData) => {
    const badges = []
    if (instructor.certifications.cfi) badges.push(<Badge key={`${instructor.id}-table-cfi`} variant="secondary">CFI</Badge>)
    if (instructor.certifications.cfii) badges.push(<Badge key={`${instructor.id}-table-cfii`} variant="secondary">CFII</Badge>)
    if (instructor.certifications.mei) badges.push(<Badge key={`${instructor.id}-table-mei`} variant="secondary">MEI</Badge>)
    return badges
  }

  return (
    <div className="space-y-6">
      {/* Pending Approvals Alert */}
      {stats.pending > 0 && (
        <PendingApprovalsCard 
          count={stats.pending} 
          instructors={instructors.filter(i => i.onboarding.completed && !i.onboarding.admin_approved)}
        />
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Instructors</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active, {stats.pending} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certifications</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex flex-col">
                <span className="text-2xl font-bold">{stats.cfi}</span>
                <span className="text-xs text-muted-foreground">CFI</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold">{stats.cfii}</span>
                <span className="text-xs text-muted-foreground">CFII</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold">{stats.mei}</span>
                <span className="text-xs text-muted-foreground">MEI</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Currently active students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Student Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.round(stats.avgRate)}/hr</div>
            <p className="text-xs text-muted-foreground">
              Average charged to students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Instructors</CardTitle>
          <CardDescription>View and manage all flight instructors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select value={certificationFilter} onValueChange={(value) => setCertificationFilter(value as CertificationFilter)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Certification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Certs</SelectItem>
                  <SelectItem value="cfi">CFI Only</SelectItem>
                  <SelectItem value="cfii">CFII Only</SelectItem>
                  <SelectItem value="mei">MEI Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructors Table */}
      <Card>
        <CardContent className="p-0">
          {filteredInstructors.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">No instructors found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || certificationFilter !== 'all' || statusFilter !== 'all'
                  ? "Try adjusting your filters"
                  : "No instructors have been added yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-sm text-muted-foreground">
                    <th className="text-left p-4 font-medium">Instructor</th>
                    <th className="text-left p-4 font-medium">Certifications</th>
                    <th className="text-left p-4 font-medium">Students</th>
                    <th className="text-left p-4 font-medium">Payout Rate</th>
                    <th className="text-left p-4 font-medium">Experience</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstructors.map((instructor) => (
                    <tr key={instructor.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {instructor.first_name?.[0]}{instructor.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {instructor.first_name} {instructor.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">{instructor.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {getCertificationBadges(instructor)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{instructor.students.active_count}</span>
                          <span className="text-sm text-muted-foreground">active</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {formatCurrency(instructor.rates.flight_instruction_payout)}/hr
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Plane className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{instructor.experience.total_flight_hours.toFixed(1)} hrs</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(instructor)}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewDetails(instructor)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Phone className="mr-2 h-4 w-4" />
                              Call
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedInstructor && (
        <InstructorDetailsModal
          instructor={selectedInstructor}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
        />
      )}
    </div>
  )
}

