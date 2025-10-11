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
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  Plane,
  Wrench,
  Clock,
  Calendar,
  FileText,
  Shield,
  Eye,
  Search,
  Filter,
  RefreshCw,
  CheckSquare,
  Square,
  Circle,
  Triangle,
  AlertCircle,
  AlertOctagon,
  Gauge,
  Fuel,
  Compass,
  Activity,
  Zap,
  Heart,
  Target,
  Award,
  Star,
  ChevronRight,
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Bell,
  Settings,
  Download,
  Plus,
  User,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Send,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Aircraft {
  id: string
  tail_number: string
  make: string
  model: string
  year: number
  status: 'airworthy' | 'maintenance' | 'grounded'
  last_inspection_date: string
  next_inspection_date: string
  hobbs_time: number
  airframe_hours?: number
  engine_hours?: number
  propeller_hours?: number
  fuel_capacity?: number
  fuel_type?: string
  registration_expiry?: string
  insurance_expiry?: string
  last_maintenance_date?: string
  next_maintenance_hours?: number
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
  is_airworthiness_affecting: boolean
  scope_of_work: string
  findings?: string
  corrective_actions?: string
}

interface SquawkReport {
  id: string
  title: string
  description: string
  category: string
  severity: string
  status: string
  priority: string
  is_airworthiness_affecting: boolean
  requires_immediate_grounding: boolean
  reported_at: string
  resolved_at?: string
  aircraft_id: string
  reported_by: string
  assigned_to?: string
}

interface ADCompliance {
  ad_number: string
  title: string
  compliance_status: string
  compliance_date?: string
  next_compliance_date?: string
  notes?: string
}

export default function InstructorMaintenancePage() {
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [squawkReports, setSquawkReports] = useState<SquawkReport[]>([])
  const [adCompliance, setAdCompliance] = useState<ADCompliance[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedAircraft, setSelectedAircraft] = useState<string | null>(null)
  const [showSquawkForm, setShowSquawkForm] = useState(false)
  const [supabase] = useState(() => createClient())
  const { toast } = useToast()

  useEffect(() => {
    fetchMaintenanceData()
  }, [])

  const fetchMaintenanceData = async () => {
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
        .order('due_date', { ascending: false })

      if (maintenanceError) throw maintenanceError

      // Fetch squawk reports
      const { data: squawkData, error: squawkError } = await supabase
        .from('squawk_reports')
        .select('*')
        .order('reported_at', { ascending: false })

      if (squawkError) throw squawkError

      // Fetch AD compliance
      const { data: adData, error: adError } = await supabase
        .from('ad_compliance')
        .select(`
          *,
          ad:ad_id(ad_number, title)
        `)
        .order('next_compliance_date', { ascending: true })

      if (adError) throw adError

      // Transform aircraft data
      const enhancedAircraft = (aircraftData || []).map(ac => ({
        ...ac,
        status: getAircraftStatus(ac),
        next_inspection_date: calculateNextInspection(ac.last_inspection_date)
      }))

      setAircraft(enhancedAircraft)
      setMaintenanceRecords(maintenanceData || [])
      setSquawkReports(squawkData || [])
      setAdCompliance(adData || [])

    } catch (error) {
      console.error('Error fetching maintenance data:', error)
      toast({
        title: "Error loading maintenance data",
        description: "Failed to fetch aircraft maintenance information",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getAircraftStatus = (aircraft: any): 'airworthy' | 'maintenance' | 'grounded' => {
    // TODO: Implement real status logic based on maintenance and squawks
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertOctagon className="w-3 h-3" />
      case 'major': return <AlertTriangle className="w-3 h-3" />
      case 'normal': return <AlertCircle className="w-3 h-3" />
      case 'minor': return <Info className="w-3 h-3" />
      default: return <Info className="w-3 h-3" />
    }
  }

  const filteredAircraft = aircraft.filter(ac => {
    const matchesStatus = filterStatus === 'all' || ac.status === filterStatus
    const matchesSearch = ac.tail_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ac.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ac.model.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleSubmitSquawk = async (squawkData: any) => {
    try {
      const { data, error } = await supabase
        .from('squawk_reports')
        .insert([squawkData])
        .select()

      if (error) throw error

      toast({
        title: "Squawk Report Submitted",
        description: "Your squawk report has been submitted successfully",
      })

      setShowSquawkForm(false)
      fetchMaintenanceData() // Refresh data

    } catch (error) {
      console.error('Error submitting squawk:', error)
      toast({
        title: "Error submitting squawk",
        description: "Failed to submit squawk report",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading maintenance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aircraft Maintenance</h1>
          <p className="text-muted-foreground">Aircraft status, maintenance tracking, and squawk reporting</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchMaintenanceData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowSquawkForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Report Squawk
          </Button>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {aircraft.filter(ac => ac.status === 'grounded').length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">
                  {aircraft.filter(ac => ac.status === 'grounded').length} Aircraft Grounded
                </h3>
                <p className="text-sm text-red-700">
                  Some aircraft are not available for flight due to maintenance issues
                </p>
              </div>
              <Button variant="destructive" size="sm">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Aircraft</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{aircraft.filter(ac => ac.status === 'airworthy').length}</div>
            <p className="text-xs text-muted-foreground">
              Ready for flight operations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{aircraft.filter(ac => ac.status === 'maintenance').length}</div>
            <p className="text-xs text-muted-foreground">
              Undergoing maintenance
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Squawks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{squawkReports.filter(s => s.status === 'open').length}</div>
            <p className="text-xs text-muted-foreground">
              Pending maintenance issues
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Reports</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {squawkReports.filter(s => s.reported_by === 'current-user-id').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Squawks you've reported
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Maintenance Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="aircraft" className="flex items-center gap-2">
            <Plane className="w-4 h-4" />
            Aircraft
          </TabsTrigger>
          <TabsTrigger value="squawks" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Squawks
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Aircraft Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Aircraft Status Overview</CardTitle>
              <CardDescription>Current status of all available aircraft</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredAircraft.map((ac) => (
                  <div key={ac.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
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
                        <div className="font-medium">{ac.hobbs_time.toFixed(1)} hours</div>
                        <div className="text-sm text-muted-foreground">
                          Next inspection: {new Date(ac.next_inspection_date).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge className={cn("text-xs", getStatusColor(ac.status))}>
                        {getStatusIcon(ac.status)}
                        <span className="ml-1">{ac.status}</span>
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedAircraft(ac.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Squawk Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Squawk Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {squawkReports.slice(0, 5).map((squawk) => (
                  <div key={squawk.id} className="flex items-center justify-between p-3 border rounded-lg">
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
                    <Badge className={cn("text-xs", getSeverityColor(squawk.severity))}>
                      {getSeverityIcon(squawk.severity)}
                      <span className="ml-1">{squawk.severity}</span>
                    </Badge>
                  </div>
                ))}
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
          </div>

          {/* Aircraft List */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAircraft.map((ac) => (
              <Card key={ac.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{ac.tail_number}</CardTitle>
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
                      <div className="font-medium">{ac.hobbs_time.toFixed(1)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Engine:</span>
                      <div className="font-medium">{ac.engine_hours?.toFixed(1) || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Inspection:</span>
                      <div className="font-medium">{new Date(ac.last_inspection_date).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Next Inspection:</span>
                      <div className="font-medium">{new Date(ac.next_inspection_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedAircraft(ac.id)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowSquawkForm(true)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="squawks" className="space-y-6">
          {/* Squawk Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Squawk Reports</CardTitle>
              <CardDescription>Maintenance issues and their status</CardDescription>
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
                        <h3 className="font-semibold">{squawk.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {squawk.category} • {new Date(squawk.reported_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {squawk.description.substring(0, 100)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {squawk.reported_by === 'current-user-id' ? 'You' : 'Other'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {squawk.status}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={cn("text-xs", getSeverityColor(squawk.severity))}>
                          {getSeverityIcon(squawk.severity)}
                          <span className="ml-1">{squawk.severity}</span>
                        </Badge>
                        <Badge variant={squawk.priority === 'critical' ? 'destructive' : 'secondary'}>
                          {squawk.priority}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          {/* Maintenance Records */}
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Records</CardTitle>
              <CardDescription>Scheduled and completed maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {maintenanceRecords.map((record) => (
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
                        <div className="text-sm text-muted-foreground">
                          {record.scope_of_work}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={record.status === 'overdue' ? 'destructive' : 'secondary'}>
                        {record.status}
                      </Badge>
                      {record.is_airworthiness_affecting && (
                        <Badge variant="outline" className="text-xs">
                          Airworthiness
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          {/* Maintenance Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Documents</CardTitle>
              <CardDescription>Access to maintenance records and documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Aircraft Maintenance Manual</div>
                      <div className="text-sm text-muted-foreground">Manufacturer maintenance procedures</div>
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
                      <div className="font-medium">Pilot Operating Handbook</div>
                      <div className="text-sm text-muted-foreground">Aircraft operating procedures and limitations</div>
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
                      <div className="font-medium">Weight & Balance</div>
                      <div className="text-sm text-muted-foreground">Aircraft weight and balance documentation</div>
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
                      <div className="font-medium">Maintenance Logs</div>
                      <div className="text-sm text-muted-foreground">Recent maintenance activity and records</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Contact</CardTitle>
              <CardDescription>Contact information for maintenance questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Chief Mechanic</div>
                    <div className="text-sm text-muted-foreground">John Smith, A&P/IA</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium">Phone</div>
                    <div className="text-sm text-muted-foreground">(555) 123-4567</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">maintenance@desertskies.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-sm text-muted-foreground">Hangar 1, Maintenance Bay</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Squawk Report Form Modal */}
      {showSquawkForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Report Squawk</CardTitle>
              <CardDescription>Submit a maintenance issue report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Aircraft</label>
                  <select className="w-full p-2 border rounded-md mt-1">
                    {aircraft.map(ac => (
                      <option key={ac.id} value={ac.id}>{ac.tail_number}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <input 
                    type="text" 
                    placeholder="Brief description of the issue"
                    className="w-full p-2 border rounded-md mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea 
                    placeholder="Detailed description of the issue"
                    rows={4}
                    className="w-full p-2 border rounded-md mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <select className="w-full p-2 border rounded-md mt-1">
                      <option value="engine">Engine</option>
                      <option value="airframe">Airframe</option>
                      <option value="avionics">Avionics</option>
                      <option value="landing_gear">Landing Gear</option>
                      <option value="interior">Interior</option>
                      <option value="electrical">Electrical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Severity</label>
                    <select className="w-full p-2 border rounded-md mt-1">
                      <option value="minor">Minor</option>
                      <option value="normal">Normal</option>
                      <option value="major">Major</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowSquawkForm(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button onClick={() => handleSubmitSquawk({})}>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 