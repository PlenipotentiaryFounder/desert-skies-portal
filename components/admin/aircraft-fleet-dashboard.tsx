"use client"

import { useState, useEffect } from 'react'
import { getAircraftStatus, calculateNextInspection, calculateAircraftUtilization, type MaintenanceRecord, type SquawkReport } from '@/lib/aircraft-status-service'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  AviationBarChart,
  AviationComposedChart,
  AviationLineChart,
  AviationPieChart,
  AviationAreaChart
} from '@/components/ui/aviation-charts'
import { 
  Plane, 
  Wrench, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Eye, 
  Plus, 
  Filter,
  Search,
  Calendar,
  Clock,
  DollarSign,
  Fuel,
  Gauge,
  MapPin,
  Users,
  FileText,
  Settings,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  BarChart3,
  PieChart,
  LineChart,
  CalendarDays,
  Bell,
  Star,
  Award,
  Target,
  Zap,
  Shield,
  Heart,
  Activity as ActivityIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Aircraft {
  id: string
  tail_number: string
  make: string
  model: string
  year: number
  category: string
  class: string
  is_complex: boolean
  is_high_performance: boolean
  is_tailwheel: boolean
  is_active: boolean
  hobbs_time: number
  last_inspection_date: string
  status: 'airworthy' | 'maintenance' | 'grounded'
  next_inspection_date: string
  utilization_rate: number
  total_flights: number
  total_hours: number
  revenue_generated: number
  maintenance_costs: number
  fuel_capacity?: number
  fuel_type?: string
  registration_expiry?: string
  insurance_expiry?: string
  last_maintenance_date?: string
  next_maintenance_hours?: number
  airframe_hours?: number
  engine_hours?: number
  propeller_hours?: number
  notes?: string
}

interface MaintenanceRecord {
  id: string
  aircraft_id: string
  maintenance_type: string
  title: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue'
  priority: 'low' | 'normal' | 'high' | 'critical'
  scheduled_date: string
  due_date: string
  completed_date?: string
  estimated_hours: number
  actual_hours?: number
  estimated_cost: number
  actual_cost?: number
  faa_requirement?: string
  is_airworthiness_affecting: boolean
  description?: string
  performed_by?: string
  notes?: string
}

interface SquawkReport {
  id: string
  aircraft_id: string
  title: string
  description: string
  category: string
  severity: 'minor' | 'normal' | 'major' | 'critical'
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'critical'
  reported_at: string
  resolved_at?: string
  is_airworthiness_affecting: boolean
  requires_immediate_grounding: boolean
  reported_by?: string
  assigned_to?: string
}

interface FlightSession {
  id: string
  aircraft_id: string
  instructor_id: string
  student_id: string
  start_time: string
  end_time: string
  duration: number
  fuel_used: number
  distance: number
  purpose: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
}

export function AircraftFleetDashboard() {
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [squawkReports, setSquawkReports] = useState<SquawkReport[]>([])
  const [flightSessions, setFlightSessions] = useState<FlightSession[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedAircraft, setSelectedAircraft] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid')
  const [supabase] = useState(() => createClient())
  const { toast } = useToast()

  // Chart data
  const maintenanceData = [
    { month: 'Jan', scheduled: 4, completed: 3, cost: 12000 },
    { month: 'Feb', scheduled: 3, completed: 4, cost: 9800 },
    { month: 'Mar', scheduled: 5, completed: 4, cost: 15600 },
    { month: 'Apr', scheduled: 2, completed: 3, cost: 7200 },
    { month: 'May', scheduled: 6, completed: 5, cost: 18900 },
    { month: 'Jun', scheduled: 4, completed: 4, cost: 13200 }
  ]

  const utilizationData = [
    { name: 'Jan', utilization: 85, hours: 120, revenue: 45000 },
    { name: 'Feb', utilization: 78, hours: 110, revenue: 42000 },
    { name: 'Mar', utilization: 92, hours: 135, revenue: 52000 },
    { name: 'Apr', utilization: 88, hours: 125, revenue: 48000 },
    { name: 'May', utilization: 95, hours: 140, revenue: 55000 },
    { name: 'Jun', utilization: 91, hours: 130, revenue: 51000 }
  ]

  const fleetStats = {
    totalHours: aircraft.reduce((sum, ac) => sum + ac.total_hours, 0),
    avgUtilization: aircraft.length > 0 ? aircraft.reduce((sum, ac) => sum + ac.utilization_rate, 0) / aircraft.length : 0,
    totalRevenue: aircraft.reduce((sum, ac) => sum + ac.revenue_generated, 0),
    totalMaintenanceCost: aircraft.reduce((sum, ac) => sum + ac.maintenance_costs, 0),
    totalFlights: aircraft.reduce((sum, ac) => sum + ac.total_flights, 0),
    airworthyCount: aircraft.filter(ac => ac.status === 'airworthy').length,
    maintenanceCount: aircraft.filter(ac => ac.status === 'maintenance').length,
    groundedCount: aircraft.filter(ac => ac.status === 'grounded').length
  }

  const criticalAlerts = [
    ...maintenanceRecords.filter(m => m.status === 'overdue' && m.is_airworthiness_affecting),
    ...squawkReports.filter(s => s.requires_immediate_grounding && s.status !== 'resolved')
  ]

  useEffect(() => {
    fetchFleetData()
  }, [])

  const fetchFleetData = async () => {
    setLoading(true)
    try {
      // Fetch aircraft data
      const { data: aircraftData, error: aircraftError } = await supabase
        .from('aircraft')
        .select('*')
        .eq('is_active', true)
        .order('tail_number')

      if (aircraftError) throw aircraftError

      // Fetch maintenance records
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('aircraft_maintenance')
        .select('*')
        .order('due_date')

      if (maintenanceError) throw maintenanceError

      // Fetch squawk reports
      const { data: squawkData, error: squawkError } = await supabase
        .from('squawk_reports')
        .select('*')
        .order('reported_at', { ascending: false })

      if (squawkError) throw squawkError

      // Fetch recent flight sessions from flight_sessions table
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('flight_sessions')
        .select(`
          *,
          aircraft(tail_number, make, model),
          student_enrollments!flight_sessions_enrollment_id_fkey(student_id),
          profiles!flight_sessions_instructor_id_fkey(first_name, last_name)
        `)
        .order('date', { ascending: false })
        .limit(20)

      if (sessionsError) {
        console.warn('Error fetching flight sessions:', sessionsError)
      }

      const flightSessions: FlightSession[] = (sessionsData || []).map(session => ({
        id: session.id,
        aircraft_id: session.aircraft_id,
        instructor_id: session.instructor_id,
        student_id: session.student_enrollments?.student_id || '',
        start_time: session.start_time,
        end_time: session.end_time,
        duration: calculateSessionDuration(session.start_time, session.end_time),
        fuel_used: session.fuel_used || 0,
        distance: session.distance || 0,
        purpose: session.notes || 'Training Flight',
        status: session.status,
        aircraft: session.aircraft?.tail_number || 'Unknown',
        instructor: session.profiles ?
          `${session.profiles.first_name} ${session.profiles.last_name}` :
          'Unknown Instructor',
        student: session.student_enrollments?.student_id || 'Unknown Student'
      }))

      // Transform aircraft data with real calculated fields
      const enhancedAircraft = await Promise.all((aircraftData || []).map(async (ac) => {
        const status = getAircraftStatus(ac, maintenanceData || [], squawkData || [])
        const utilization = await calculateAircraftUtilization(ac.id)

        return {
          ...ac,
          status,
          next_inspection_date: calculateNextInspection(ac.last_inspection_date),
          utilization_rate: utilization.utilizationRate,
          total_flights: utilization.totalFlights,
          total_hours: ac.hobbs_time,
          revenue_generated: utilization.revenueGenerated,
          maintenance_costs: Math.floor(Math.random() * 10000) + 5000 // TODO: Sum from maintenance records
        }
      }))

      setAircraft(enhancedAircraft)
      setMaintenanceRecords(maintenanceData || [])
      setSquawkReports(squawkData || [])
      setFlightSessions(flightSessions)

    } catch (error) {
      console.error('Error fetching fleet data:', error)
      toast({
        title: "Error loading fleet data",
        description: "Failed to fetch aircraft and maintenance information",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Use the real aircraft status service

  const calculateSessionDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0

    const start = new Date(`1970-01-01T${startTime}`)
    const end = new Date(`1970-01-01T${endTime}`)

    const diffMs = end.getTime() - start.getTime()
    return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10 // Convert to hours with 1 decimal
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'airworthy': return 'bg-green-100 text-green-800 border-green-200'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'grounded': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'airworthy': return <CheckCircle className="w-3 h-3" />
      case 'maintenance': return <Wrench className="w-3 h-3" />
      case 'grounded': return <XCircle className="w-3 h-3" />
      default: return <AlertCircle className="w-3 h-3" />
    }
  }

  const filteredAircraft = aircraft.filter(ac => {
    const matchesStatus = filterStatus === 'all' || ac.status === filterStatus
    const matchesSearch = ac.tail_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ac.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ac.model.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'normal': return 'bg-blue-500'
      case 'low': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'major': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'minor': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading fleet data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fleet Management</h1>
          <p className="text-muted-foreground">Monitor and manage your aircraft fleet</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchFleetData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Aircraft
          </Button>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">
                  {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-red-700">
                  {criticalAlerts.length} aircraft require immediate attention
                </p>
              </div>
              <Button variant="destructive" size="sm">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fleet Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aircraft</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aircraft.length}</div>
            <p className="text-xs text-muted-foreground">
              {fleetStats.airworthyCount} airworthy, {fleetStats.maintenanceCount} in maintenance
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flight Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetStats.totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {fleetStats.totalFlights} flights completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(fleetStats.totalRevenue / 1000).toFixed(0)}k</div>
            <p className="text-xs text-muted-foreground">
              ${fleetStats.totalHours > 0 ? (fleetStats.totalRevenue / fleetStats.totalHours).toFixed(0) : 0}/hour
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetStats.avgUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Fleet efficiency rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="aircraft" className="flex items-center gap-2">
            <Plane className="w-4 h-4" />
            Aircraft
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="squawks" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Squawks
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Dashboard */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Fleet Performance
                </CardTitle>
                <CardDescription>Monthly utilization and revenue trends</CardDescription>
              </CardHeader>
              <CardContent>
                <AviationComposedChart
                  title=""
                  data={utilizationData}
                  xKey="name"
                  lineKey="utilization"
                  barKey="revenue"
                  height={300}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Aircraft Status Distribution
                </CardTitle>
                <CardDescription>Current fleet status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <AviationPieChart
                  title=""
                  data={[
                    { name: 'Airworthy', value: fleetStats.airworthyCount, color: '#10B981' },
                    { name: 'Maintenance', value: fleetStats.maintenanceCount, color: '#F59E0B' },
                    { name: 'Grounded', value: fleetStats.groundedCount, color: '#EF4444' }
                  ]}
                  height={300}
                />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common fleet management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Plus className="w-6 h-6" />
                  Add Aircraft
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Wrench className="w-6 h-6" />
                  Schedule Maintenance
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  Report Squawk
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Download className="w-6 h-6" />
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aircraft" className="space-y-6">
          {/* Aircraft Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Search aircraft..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-4 py-2 border rounded-md text-sm"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="airworthy">Airworthy</option>
                <option value="maintenance">Maintenance</option>
                <option value="grounded">Grounded</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                Table
              </Button>
            </div>
          </div>

          {/* Aircraft Grid */}
          {viewMode === 'grid' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAircraft.map((ac) => (
                <Card key={ac.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {ac.tail_number}
                      </CardTitle>
                      <Badge className={cn("text-xs", getStatusColor(ac.status))}>
                        {getStatusIcon(ac.status)}
                        <span className="ml-1">{ac.status}</span>
                      </Badge>
                    </div>
                    <CardDescription>
                      {ac.year} {ac.make} {ac.model}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Hours:</span>
                        <div className="font-medium">{ac.total_hours.toFixed(1)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Utilization:</span>
                        <div className="font-medium">{ac.utilization_rate}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Flights:</span>
                        <div className="font-medium">{ac.total_flights}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Revenue:</span>
                        <div className="font-medium">${(ac.revenue_generated / 1000).toFixed(0)}k</div>
                      </div>
                    </div>
                    
                    <Progress value={ac.utilization_rate} className="h-2" />
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Next Inspection: {new Date(ac.next_inspection_date).toLocaleDateString()}</span>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Aircraft List View */}
          {viewMode === 'list' && (
            <div className="space-y-2">
              {filteredAircraft.map((ac) => (
                <Card key={ac.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Plane className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{ac.tail_number}</h3>
                          <p className="text-sm text-muted-foreground">
                            {ac.year} {ac.make} {ac.model}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">{ac.total_hours.toFixed(1)} hours</div>
                          <div className="text-sm text-muted-foreground">{ac.utilization_rate}% utilization</div>
                        </div>
                        <Badge className={cn("text-xs", getStatusColor(ac.status))}>
                          {getStatusIcon(ac.status)}
                          <span className="ml-1">{ac.status}</span>
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Aircraft Table View */}
          {viewMode === 'table' && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Tail Number</th>
                        <th className="text-left p-4 font-medium">Aircraft</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Hours</th>
                        <th className="text-left p-4 font-medium">Utilization</th>
                        <th className="text-left p-4 font-medium">Next Inspection</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAircraft.map((ac) => (
                        <tr key={ac.id} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-medium">{ac.tail_number}</td>
                          <td className="p-4">{ac.year} {ac.make} {ac.model}</td>
                          <td className="p-4">
                            <Badge className={cn("text-xs", getStatusColor(ac.status))}>
                              {getStatusIcon(ac.status)}
                              <span className="ml-1">{ac.status}</span>
                            </Badge>
                          </td>
                          <td className="p-4">{ac.total_hours.toFixed(1)}</td>
                          <td className="p-4">{ac.utilization_rate}%</td>
                          <td className="p-4">{new Date(ac.next_inspection_date).toLocaleDateString()}</td>
                          <td className="p-4">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          {/* Maintenance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Maintenance Overview
              </CardTitle>
              <CardDescription>Current maintenance status and upcoming work</CardDescription>
            </CardHeader>
            <CardContent>
              <AviationComposedChart
                title=""
                data={maintenanceData}
                xKey="month"
                lineKey="completed"
                barKey="scheduled"
                height={300}
              />
            </CardContent>
          </Card>

          {/* Maintenance Records */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Maintenance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {maintenanceRecords.slice(0, 10).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Wrench className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{record.title}</div>
                        <div className="text-sm text-muted-foreground">
                          Due: {new Date(record.due_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={record.status === 'overdue' ? 'destructive' : 'secondary'}>
                        {record.status}
                      </Badge>
                      <Badge variant="outline" className={cn("text-xs", {
                        "border-red-200 text-red-700": record.priority === 'critical',
                        "border-orange-200 text-orange-700": record.priority === 'high',
                        "border-blue-200 text-blue-700": record.priority === 'normal',
                        "border-gray-200 text-gray-700": record.priority === 'low'
                      })}>
                        {record.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="squawks" className="space-y-6">
          {/* Squawk Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Open Squawk Reports
              </CardTitle>
              <CardDescription>Current maintenance requests and issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {squawkReports.filter(s => s.status !== 'resolved').slice(0, 10).map((squawk) => (
                  <div key={squawk.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", {
                        "bg-red-100": squawk.severity === 'critical',
                        "bg-yellow-100": squawk.severity === 'major',
                        "bg-blue-100": squawk.severity === 'normal',
                        "bg-green-100": squawk.severity === 'minor'
                      })}>
                        <AlertTriangle className={cn("w-4 h-4", {
                          "text-red-600": squawk.severity === 'critical',
                          "text-yellow-600": squawk.severity === 'major',
                          "text-blue-600": squawk.severity === 'normal',
                          "text-green-600": squawk.severity === 'minor'
                        })} />
                      </div>
                      <div>
                        <div className="font-medium">{squawk.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {squawk.category} • {new Date(squawk.reported_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs", getSeverityColor(squawk.severity))}>
                        {squawk.severity}
                      </Badge>
                      <Badge variant={squawk.priority === 'critical' ? 'destructive' : 'secondary'}>
                        {squawk.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Dashboard */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AviationLineChart
                  title=""
                  data={utilizationData}
                  xKey="name"
                  yKey="utilization"
                  strokeColor="#1E3A8A"
                  height={300}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Fleet Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Flight Hours</span>
                    <span className="font-semibold">{fleetStats.totalHours.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Utilization</span>
                    <span className="font-semibold">{fleetStats.avgUtilization.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Revenue per Hour</span>
                    <span className="font-semibold">
                      ${fleetStats.totalHours > 0 ? (fleetStats.totalRevenue / fleetStats.totalHours).toFixed(0) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Maintenance Cost</span>
                    <span className="font-semibold">${(fleetStats.totalMaintenanceCost / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="w-5 h-5" />
                  Fuel Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AviationAreaChart
                  title=""
                  data={utilizationData}
                  xKey="name"
                  yKey="hours"
                  fillColor="#10B981"
                  height={200}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Revenue Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AviationBarChart
                  title=""
                  data={utilizationData}
                  xKey="name"
                  yKey="revenue"
                  fillColor="#3B82F6"
                  height={200}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Fleet Efficiency</span>
                    <span className="font-medium">{fleetStats.avgUtilization.toFixed(1)}%</span>
                  </div>
                  <Progress value={fleetStats.avgUtilization} className="h-2" />
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Revenue Efficiency</span>
                    <span className="font-medium">
                      ${fleetStats.totalHours > 0 ? (fleetStats.totalRevenue / fleetStats.totalHours).toFixed(0) : 0}/hr
                    </span>
                  </div>
                  <Progress 
                    value={fleetStats.totalHours > 0 ? Math.min((fleetStats.totalRevenue / fleetStats.totalHours) / 500 * 100, 100) : 0} 
                    className="h-2" 
                  />
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Maintenance Ratio</span>
                    <span className="font-medium">
                      {fleetStats.totalRevenue > 0 ? ((fleetStats.totalMaintenanceCost / fleetStats.totalRevenue) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={fleetStats.totalRevenue > 0 ? Math.min((fleetStats.totalMaintenanceCost / fleetStats.totalRevenue) * 100, 100) : 0} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          {/* Flight Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Today's Flight Schedule
              </CardTitle>
              <CardDescription>Current and upcoming flights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {flightSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Plane className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">Training Flight</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(session.start_time).toLocaleTimeString()} - {new Date(session.end_time).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{session.status}</Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Upcoming Maintenance
              </CardTitle>
              <CardDescription>Scheduled maintenance for the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {maintenanceRecords
                  .filter(m => new Date(m.due_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                  .slice(0, 5)
                  .map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Wrench className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{record.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Due: {new Date(record.due_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant={record.status === 'overdue' ? 'destructive' : 'secondary'}>
                        {record.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 