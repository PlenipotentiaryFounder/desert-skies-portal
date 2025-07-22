"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  AviationBarChart,
  AviationLineChart,
  AviationPieChart
} from '@/components/ui/aviation-charts'
import { 
  Plane, 
  Wrench, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Eye, 
  Plus, 
  Calendar,
  Clock,
  DollarSign,
  Fuel,
  Gauge,
  MapPin,
  FileText,
  Settings,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  BarChart3,
  CalendarDays,
  Bell,
  Star,
  Award,
  Target,
  Shield,
  Heart,
  ArrowLeft,
  ChevronRight,
  Edit,
  History,
  Tool,
  BookOpen,
  AlertCircle as AlertCircleIcon,
  CheckSquare,
  Square,
  Circle,
  Triangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

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
  title: string
  status: string
  priority: string
  scheduled_date: string
  due_date: string
  completed_date?: string
  estimated_hours: number
  actual_hours?: number
  estimated_cost: number
  actual_cost?: number
  is_airworthiness_affecting: boolean
}

interface SquawkReport {
  id: string
  title: string
  description: string
  category: string
  severity: string
  status: string
  priority: string
  reported_at: string
  resolved_at?: string
  is_airworthiness_affecting: boolean
  requires_immediate_grounding: boolean
}

interface MaintenanceLog {
  id: string
  log_type: string
  title: string
  description: string
  hours_before: number
  hours_after: number
  date_performed: string
  findings: string
  corrective_actions: string
  airworthiness_status: string
}

export default function AircraftDetailPage() {
  const [aircraft, setAircraft] = useState<Aircraft | null>(null)
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [squawkReports, setSquawkReports] = useState<SquawkReport[]>([])
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [supabase] = useState(() => createClient())
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const aircraftId = params.id as string

  // Chart data
  const utilizationData = [
    { name: 'Jan', utilization: 85, hours: 120, revenue: 45000 },
    { name: 'Feb', utilization: 78, hours: 110, revenue: 42000 },
    { name: 'Mar', utilization: 92, hours: 135, revenue: 52000 },
    { name: 'Apr', utilization: 88, hours: 125, revenue: 48000 },
    { name: 'May', utilization: 95, hours: 140, revenue: 55000 },
    { name: 'Jun', utilization: 91, hours: 130, revenue: 51000 }
  ]

  useEffect(() => {
    if (aircraftId) {
      fetchAircraftData()
    }
  }, [aircraftId])

  const fetchAircraftData = async () => {
    setLoading(true)
    try {
      // Fetch aircraft data
      const { data: aircraftData, error: aircraftError } = await supabase
        .from('aircraft')
        .select('*')
        .eq('id', aircraftId)
        .single()

      if (aircraftError) throw aircraftError

      // Fetch maintenance records
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('aircraft_maintenance')
        .select('*')
        .eq('aircraft_id', aircraftId)
        .order('due_date', { ascending: false })

      if (maintenanceError) throw maintenanceError

      // Fetch squawk reports
      const { data: squawkData, error: squawkError } = await supabase
        .from('squawk_reports')
        .select('*')
        .eq('aircraft_id', aircraftId)
        .order('reported_at', { ascending: false })

      if (squawkError) throw squawkError

      // Fetch maintenance logs
      const { data: logsData, error: logsError } = await supabase
        .from('maintenance_logs')
        .select('*')
        .eq('aircraft_id', aircraftId)
        .order('date_performed', { ascending: false })

      if (logsError) throw logsError

      // Transform aircraft data
      const enhancedAircraft = {
        ...aircraftData,
        status: getAircraftStatus(aircraftData),
        next_inspection_date: calculateNextInspection(aircraftData.last_inspection_date),
        utilization_rate: Math.floor(Math.random() * 30) + 70,
        total_flights: Math.floor(Math.random() * 100) + 50,
        total_hours: aircraftData.hobbs_time,
        revenue_generated: Math.floor(Math.random() * 50000) + 20000,
        maintenance_costs: Math.floor(Math.random() * 10000) + 5000
      }

      setAircraft(enhancedAircraft)
      setMaintenanceRecords(maintenanceData || [])
      setSquawkReports(squawkData || [])
      setMaintenanceLogs(logsData || [])

    } catch (error) {
      console.error('Error fetching aircraft data:', error)
      toast({
        title: "Error loading aircraft data",
        description: "Failed to fetch aircraft information",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getAircraftStatus = (aircraft: any): 'airworthy' | 'maintenance' | 'grounded' => {
    // Mock status logic - in real app, this would check maintenance and squawks
    const statuses = ['airworthy', 'maintenance', 'grounded']
    return statuses[Math.floor(Math.random() * 3)] as 'airworthy' | 'maintenance' | 'grounded'
  }

  const calculateNextInspection = (lastInspection: string): string => {
    const lastDate = new Date(lastInspection)
    const nextDate = new Date(lastDate)
    nextDate.setFullYear(nextDate.getFullYear() + 1)
    return nextDate.toISOString().split('T')[0]
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
          <p className="text-muted-foreground">Loading aircraft data...</p>
        </div>
      </div>
    )
  }

  if (!aircraft) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Aircraft Not Found</h3>
          <p className="text-muted-foreground">The requested aircraft could not be found.</p>
          <Button onClick={() => router.push('/admin/fleet')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Fleet
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/admin/fleet')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Fleet
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{aircraft.tail_number}</h1>
            <p className="text-muted-foreground">
              {aircraft.year} {aircraft.make} {aircraft.model}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAircraftData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit Aircraft
          </Button>
        </div>
      </div>

      {/* Aircraft Status Banner */}
      <Card className={cn("border-l-4", {
        "border-green-500 bg-green-50": aircraft.status === 'airworthy',
        "border-yellow-500 bg-yellow-50": aircraft.status === 'maintenance',
        "border-red-500 bg-red-50": aircraft.status === 'grounded'
      })}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            {getStatusIcon(aircraft.status)}
            <div className="flex-1">
              <h3 className="font-semibold">
                Aircraft Status: {aircraft.status.charAt(0).toUpperCase() + aircraft.status.slice(1)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {aircraft.status === 'airworthy' && 'Aircraft is ready for flight operations'}
                {aircraft.status === 'maintenance' && 'Aircraft is undergoing maintenance'}
                {aircraft.status === 'grounded' && 'Aircraft is grounded and not available for flight'}
              </p>
            </div>
            <Badge className={cn("text-xs", getStatusColor(aircraft.status))}>
              {getStatusIcon(aircraft.status)}
              <span className="ml-1">{aircraft.status}</span>
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Aircraft Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aircraft.total_hours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {aircraft.total_flights} flights completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aircraft.utilization_rate}%</div>
            <p className="text-xs text-muted-foreground">
              Fleet efficiency rating
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(aircraft.revenue_generated / 1000).toFixed(0)}k</div>
            <p className="text-xs text-muted-foreground">
              ${aircraft.total_hours > 0 ? (aircraft.revenue_generated / aircraft.total_hours).toFixed(0) : 0}/hour
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Cost</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(aircraft.maintenance_costs / 1000).toFixed(0)}k</div>
            <p className="text-xs text-muted-foreground">
              Total maintenance expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Aircraft Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="squawks" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Squawks
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="inspections" className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Inspections
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Aircraft Details */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="w-5 h-5" />
                  Aircraft Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tail Number</label>
                      <p className="text-lg font-semibold">{aircraft.tail_number}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Make/Model</label>
                      <p className="text-lg font-semibold">{aircraft.make} {aircraft.model}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Year</label>
                      <p className="text-lg font-semibold">{aircraft.year}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Category</label>
                      <p className="text-lg font-semibold">{aircraft.category}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Class</label>
                      <p className="text-lg font-semibold">{aircraft.class}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Complex</label>
                      <p className="text-lg font-semibold">{aircraft.is_complex ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Special Endorsements</h4>
                    <div className="flex gap-2">
                      {aircraft.is_high_performance && (
                        <Badge variant="outline">High Performance</Badge>
                      )}
                      {aircraft.is_tailwheel && (
                        <Badge variant="outline">Tailwheel</Badge>
                      )}
                      {aircraft.is_complex && (
                        <Badge variant="outline">Complex</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
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
          </div>

          {/* Operational Data */}
          <Card>
            <CardHeader>
              <CardTitle>Operational Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <h4 className="font-medium mb-3">Flight Hours</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Hours</span>
                      <span className="font-medium">{aircraft.total_hours.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Airframe Hours</span>
                      <span className="font-medium">{aircraft.airframe_hours?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Engine Hours</span>
                      <span className="font-medium">{aircraft.engine_hours?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Propeller Hours</span>
                      <span className="font-medium">{aircraft.propeller_hours?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Financial Data</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Revenue Generated</span>
                      <span className="font-medium">${(aircraft.revenue_generated / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Maintenance Costs</span>
                      <span className="font-medium">${(aircraft.maintenance_costs / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Net Profit</span>
                      <span className="font-medium">${((aircraft.revenue_generated - aircraft.maintenance_costs) / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Revenue per Hour</span>
                      <span className="font-medium">${aircraft.total_hours > 0 ? (aircraft.revenue_generated / aircraft.total_hours).toFixed(0) : 0}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Key Dates</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Last Inspection</span>
                      <span className="font-medium">{new Date(aircraft.last_inspection_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Next Inspection</span>
                      <span className="font-medium">{new Date(aircraft.next_inspection_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Registration Expiry</span>
                      <span className="font-medium">{aircraft.registration_expiry ? new Date(aircraft.registration_expiry).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Insurance Expiry</span>
                      <span className="font-medium">{aircraft.insurance_expiry ? new Date(aircraft.insurance_expiry).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          {/* Maintenance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Maintenance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{maintenanceRecords.filter(m => m.status === 'scheduled').length}</div>
                  <div className="text-sm text-muted-foreground">Scheduled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{maintenanceRecords.filter(m => m.status === 'in_progress').length}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{maintenanceRecords.filter(m => m.status === 'completed').length}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{maintenanceRecords.filter(m => m.status === 'overdue').length}</div>
                  <div className="text-sm text-muted-foreground">Overdue</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Records */}
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {maintenanceRecords.map((record) => (
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
                      <Badge variant="outline" className="text-xs">
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
          {/* Squawk Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Squawk Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{squawkReports.filter(s => s.status === 'open').length}</div>
                  <div className="text-sm text-muted-foreground">Open</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{squawkReports.filter(s => s.status === 'in_progress').length}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{squawkReports.filter(s => s.status === 'resolved').length}</div>
                  <div className="text-sm text-muted-foreground">Resolved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{squawkReports.filter(s => s.severity === 'critical').length}</div>
                  <div className="text-sm text-muted-foreground">Critical</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Squawk Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Squawk Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {squawkReports.map((squawk) => (
                  <div key={squawk.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", {
                        "bg-red-100": squawk.severity === 'critical',
                        "bg-orange-100": squawk.severity === 'major',
                        "bg-blue-100": squawk.severity === 'normal',
                        "bg-green-100": squawk.severity === 'minor'
                      })}>
                        <AlertTriangle className={cn("w-4 h-4", {
                          "text-red-600": squawk.severity === 'critical',
                          "text-orange-600": squawk.severity === 'major',
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

        <TabsContent value="logs" className="space-y-6">
          {/* Maintenance Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {maintenanceLogs.map((log) => (
                  <div key={log.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {log.log_type}
                        </Badge>
                        <span className="font-medium">{log.title}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.date_performed).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{log.description}</p>
                    {log.findings && (
                      <div className="mb-2">
                        <span className="text-sm font-medium">Findings:</span>
                        <p className="text-sm">{log.findings}</p>
                      </div>
                    )}
                    {log.corrective_actions && (
                      <div className="mb-2">
                        <span className="text-sm font-medium">Corrective Actions:</span>
                        <p className="text-sm">{log.corrective_actions}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Hours: {log.hours_before.toFixed(1)} → {log.hours_after.toFixed(1)}</span>
                      <Badge variant={log.airworthiness_status === 'airworthy' ? 'default' : 'destructive'}>
                        {log.airworthiness_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspections" className="space-y-6">
          {/* Inspection Status */}
          <Card>
            <CardHeader>
              <CardTitle>Inspection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium">Annual Inspection</div>
                      <div className="text-sm text-muted-foreground">
                        Last: {new Date(aircraft.last_inspection_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">Next Due</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(aircraft.next_inspection_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium">100-Hour Inspection</div>
                      <div className="text-sm text-muted-foreground">
                        Due every 100 hours
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">Next Due</div>
                    <div className="text-sm text-muted-foreground">
                      {aircraft.next_maintenance_hours?.toFixed(1) || 'N/A'} hours
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          {/* Aircraft Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Aircraft Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Aircraft Registration</div>
                      <div className="text-sm text-muted-foreground">FAA Registration Certificate</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium">Airworthiness Certificate</div>
                      <div className="text-sm text-muted-foreground">FAA Airworthiness Certificate</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-orange-600" />
                    <div>
                      <div className="font-medium">Maintenance Manual</div>
                      <div className="text-sm text-muted-foreground">Aircraft Maintenance Manual</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="font-medium">Pilot Operating Handbook</div>
                      <div className="text-sm text-muted-foreground">POH and Operating Limitations</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 