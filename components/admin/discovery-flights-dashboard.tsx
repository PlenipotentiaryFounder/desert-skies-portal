'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  Plane, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  Target
} from 'lucide-react'
import { format } from 'date-fns'

interface DiscoveryFlightsDashboardProps {
  discoveryFlights: any[]
  stats: any
  instructors: any[]
  aircraft: any[]
}

export function DiscoveryFlightsDashboard({
  discoveryFlights: initialFlights,
  stats: initialStats,
  instructors,
  aircraft,
}: DiscoveryFlightsDashboardProps) {
  const [discoveryFlights, setDiscoveryFlights] = useState(initialFlights)
  const [stats, setStats] = useState(initialStats)
  const [selectedFlight, setSelectedFlight] = useState<any>(null)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Scheduling form
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [selectedInstructor, setSelectedInstructor] = useState('')
  const [selectedAircraft, setSelectedAircraft] = useState('')

  const getStatusBadge = (flight: any) => {
    const stage = flight.workflow_stage

    switch (stage) {
      case 'onboarding':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Onboarding</Badge>
      case 'ready_to_schedule':
        return <Badge variant="default"><Calendar className="w-3 h-3 mr-1" />Ready to Schedule</Badge>
      case 'scheduled':
        return <Badge variant="default" className="bg-blue-600"><CheckCircle className="w-3 h-3 mr-1" />Scheduled</Badge>
      case 'conversion_opportunity':
        return <Badge variant="default" className="bg-green-600"><Target className="w-3 h-3 mr-1" />Convert to Student</Badge>
      case 'converted':
        return <Badge variant="default" className="bg-purple-600"><Users className="w-3 h-3 mr-1" />Converted</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const handleScheduleFlight = async () => {
    if (!selectedFlight || !scheduleDate || !scheduleTime || !selectedInstructor) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/discovery-flights/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discovery_flight_id: selectedFlight.id,
          scheduled_date: scheduleDate,
          scheduled_time: scheduleTime,
          scheduled_instructor_id: selectedInstructor,
          scheduled_aircraft_id: selectedAircraft || null,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      toast({
        title: 'Flight Scheduled',
        description: 'Discovery flight has been scheduled successfully.',
      })

      setIsScheduleDialogOpen(false)
      // Refresh data
      window.location.reload()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to schedule flight',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignInstructor = async () => {
    if (!selectedFlight || !selectedInstructor) {
      toast({
        title: 'Missing Information',
        description: 'Please select an instructor.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/discovery-flights/assign-instructor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discovery_flight_id: selectedFlight.id,
          instructor_id: selectedInstructor,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      toast({
        title: 'Instructor Assigned',
        description: 'Instructor has been assigned successfully.',
      })

      setIsAssignDialogOpen(false)
      window.location.reload()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign instructor',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConvertToStudent = async (flightId: string) => {
    if (!confirm('Are you sure you want to convert this customer to a full student?')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/discovery-flights/convert-to-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discovery_flight_id: flightId,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      toast({
        title: 'Converted to Student',
        description: 'Customer has been converted to a full student enrollment.',
      })

      window.location.reload()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to convert to student',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Schedule</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ready_to_schedule}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversion_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.converted} of {stats.completed} converted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding ({stats.pending_onboarding})</TabsTrigger>
          <TabsTrigger value="ready">Ready ({stats.ready_to_schedule})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({stats.scheduled})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {discoveryFlights.map((flight) => (
            <Card key={flight.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {flight.first_name} {flight.last_name}
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {flight.email}
                        </span>
                        {flight.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {flight.phone}
                          </span>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                  {getStatusBadge(flight)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Booking Source:</span>{' '}
                      <Badge variant="outline">{flight.booking_source}</Badge>
                    </div>
                    <div>
                      <span className="font-medium">Payment:</span>{' '}
                      <Badge variant={flight.payment_status === 'paid' ? 'default' : 'secondary'}>
                        {flight.payment_status}
                      </Badge>
                    </div>
                    {flight.scheduled_date && (
                      <div>
                        <span className="font-medium">Scheduled:</span>{' '}
                        {format(new Date(flight.scheduled_date), 'PPP')} at {flight.scheduled_time}
                      </div>
                    )}
                    {flight.instructor_name && (
                      <div>
                        <span className="font-medium">Instructor:</span> {flight.instructor_name}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {flight.workflow_stage === 'ready_to_schedule' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedFlight(flight)
                          setIsScheduleDialogOpen(true)
                        }}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Flight
                      </Button>
                    )}

                    {flight.workflow_stage === 'scheduled' && !flight.scheduled_instructor_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedFlight(flight)
                          setIsAssignDialogOpen(true)
                        }}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Assign Instructor
                      </Button>
                    )}

                    {flight.workflow_stage === 'conversion_opportunity' && (
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleConvertToStudent(flight.id)}
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Convert to Student
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(`/admin/discovery-flights/${flight.id}`, '_blank')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>

                {flight.special_requests && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm">
                      <strong>Special Requests:</strong> {flight.special_requests}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Other tab contents would filter the flights */}
        <TabsContent value="onboarding">
          {/* Similar to above but filtered */}
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Discovery Flight</DialogTitle>
            <DialogDescription>
              Schedule a flight for {selectedFlight?.first_name} {selectedFlight?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="scheduleDate">Date *</Label>
              <Input
                id="scheduleDate"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="scheduleTime">Time *</Label>
              <Input
                id="scheduleTime"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="instructor">Instructor *</Label>
              <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select instructor" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.first_name} {instructor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="aircraft">Aircraft</Label>
              <Select value={selectedAircraft} onValueChange={setSelectedAircraft}>
                <SelectTrigger>
                  <SelectValue placeholder="Select aircraft (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {aircraft.map((ac) => (
                    <SelectItem key={ac.id} value={ac.id}>
                      {ac.tail_number} - {ac.make_model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleScheduleFlight} className="w-full" disabled={isLoading}>
              Schedule Flight
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Instructor Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Instructor</DialogTitle>
            <DialogDescription>
              Assign an instructor to {selectedFlight?.first_name} {selectedFlight?.last_name}'s flight
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="assignInstructor">Instructor *</Label>
              <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select instructor" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.first_name} {instructor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssignInstructor} className="w-full" disabled={isLoading}>
              Assign Instructor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


