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
  AviationPieChart
} from '@/components/ui/aviation-charts'
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Clock,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  BarChart3,
  PieChart,
  CalendarDays,
  Bell,
  Star,
  Award,
  Target,
  Zap,
  Shield,
  Heart,
  Activity,
  ArrowRight,
  ChevronRight,
  User,
  Plane,
  Wrench,
  FileText,
  Settings,
  Download,
  RefreshCw,
  MoreHorizontal,
  Flag,
  AlertOctagon,
  CheckSquare,
  Square,
  Circle,
  Triangle,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Gauge,
  Fuel,
  Compass
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface SquawkReport {
  id: string
  aircraft_id: string
  title: string
  description: string
  category: string
  subcategory: string
  severity: 'minor' | 'normal' | 'major' | 'critical'
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'critical'
  is_airworthiness_affecting: boolean
  requires_immediate_grounding: boolean
  reported_by: string
  assigned_to?: string
  flight_number?: string
  phase_of_flight?: string
  weather_conditions?: string
  estimated_repair_hours?: number
  estimated_repair_cost?: number
  resolution_notes?: string
  parts_required?: string[]
  reported_at: string
  resolved_at?: string
  aircraft?: {
    tail_number: string
    make: string
    model: string
  }
  reporter?: {
    full_name: string
    email: string
  }
  assignee?: {
    full_name: string
    email: string
  }
}

interface SquawkStats {
  total: number
  open: number
  assigned: number
  inProgress: number
  resolved: number
  closed: number
  critical: number
  major: number
  normal: number
  minor: number
  airworthinessAffecting: number
  grounded: number
  avgResolutionTime: number
}

export default function SquawkManagementPage() {
  const [squawkReports, setSquawkReports] = useState<SquawkReport[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [supabase] = useState(() => createClient())
  const { toast } = useToast()

  // Chart data
  const severityData = [
    { name: 'Critical', value: 3, color: '#EF4444' },
    { name: 'Major', value: 8, color: '#F59E0B' },
    { name: 'Normal', value: 15, color: '#3B82F6' },
    { name: 'Minor', value: 12, color: '#10B981' }
  ]

  const statusData = [
    { name: 'Open', value: 12, color: '#3B82F6' },
    { name: 'Assigned', value: 8, color: '#F59E0B' },
    { name: 'In Progress', value: 6, color: '#8B5CF6' },
    { name: 'Resolved', value: 10, color: '#10B981' },
    { name: 'Closed', value: 2, color: '#6B7280' }
  ]

  const squawkStats: SquawkStats = {
    total: squawkReports.length,
    open: squawkReports.filter(s => s.status === 'open').length,
    assigned: squawkReports.filter(s => s.status === 'assigned').length,
    inProgress: squawkReports.filter(s => s.status === 'in_progress').length,
    resolved: squawkReports.filter(s => s.status === 'resolved').length,
    closed: squawkReports.filter(s => s.status === 'closed').length,
    critical: squawkReports.filter(s => s.severity === 'critical').length,
    major: squawkReports.filter(s => s.severity === 'major').length,
    normal: squawkReports.filter(s => s.severity === 'normal').length,
    minor: squawkReports.filter(s => s.severity === 'minor').length,
    airworthinessAffecting: squawkReports.filter(s => s.is_airworthiness_affecting).length,
    grounded: squawkReports.filter(s => s.requires_immediate_grounding).length,
    avgResolutionTime: 2.5 // Mock data
  }

  useEffect(() => {
    fetchSquawkData()
  }, [])

  const fetchSquawkData = async () => {
    setLoading(true)
    try {
      const { data: squawkData, error: squawkError } = await supabase
        .from('squawk_reports')
        .select(`
          *,
          aircraft:aircraft_id(tail_number, make, model),
          reporter:reported_by(full_name, email),
          assignee:assigned_to(full_name, email)
        `)
        .order('reported_at', { ascending: false })

      if (squawkError) throw squawkError

      setSquawkReports(squawkData || [])

    } catch (error) {
      console.error('Error fetching squawk data:', error)
      toast({
        title: "Error loading squawk data",
        description: "Failed to fetch squawk reports",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'assigned': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Circle className="w-3 h-3" />
      case 'assigned': return <Square className="w-3 h-3" />
      case 'in_progress': return <Triangle className="w-3 h-3" />
      case 'resolved': return <CheckSquare className="w-3 h-3" />
      case 'closed': return <CheckCircle className="w-3 h-3" />
      default: return <Circle className="w-3 h-3" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'engine': return <Gauge className="w-4 h-4" />
      case 'airframe': return <Plane className="w-4 h-4" />
      case 'avionics': return <Activity className="w-4 h-4" />
      case 'landing_gear': return <Shield className="w-4 h-4" />
      case 'interior': return <Heart className="w-4 h-4" />
      case 'electrical': return <Zap className="w-4 h-4" />
      case 'fuel_system': return <Fuel className="w-4 h-4" />
      case 'flight_controls': return <Compass className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  const filteredSquawks = squawkReports.filter(squawk => {
    const matchesStatus = filterStatus === 'all' || squawk.status === filterStatus
    const matchesSeverity = filterSeverity === 'all' || squawk.severity === filterSeverity
    const matchesCategory = filterCategory === 'all' || squawk.category === filterCategory
    const matchesSearch = squawk.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         squawk.aircraft?.tail_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         squawk.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSeverity && matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading squawk data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Squawk Management</h1>
          <p className="text-muted-foreground">Issue reporting and resolution workflow</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSquawkData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Squawk
          </Button>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {squawkStats.critical > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">
                  {squawkStats.critical} Critical Squawks Require Immediate Attention
                </h3>
                <p className="text-sm text-red-700">
                  {squawkStats.grounded} aircraft are grounded due to critical issues
                </p>
              </div>
              <Button variant="destructive" size="sm">
                View Critical
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Squawk Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Squawks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{squawkStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {squawkStats.open} open, {squawkStats.resolved} resolved
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertOctagon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{squawkStats.critical}</div>
            <p className="text-xs text-muted-foreground">
              {squawkStats.grounded} aircraft grounded
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{squawkStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              {squawkStats.assigned} assigned
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {squawkStats.total > 0 ? Math.round((squawkStats.resolved / squawkStats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {squawkStats.avgResolutionTime} days avg
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Squawk Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="squawks" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Squawks
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Dashboard */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Squawk Severity Distribution
                </CardTitle>
                <CardDescription>Breakdown by severity level</CardDescription>
              </CardHeader>
              <CardContent>
                <AviationPieChart
                  title=""
                  data={severityData}
                  height={300}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Status Distribution
                </CardTitle>
                <CardDescription>Current workflow status</CardDescription>
              </CardHeader>
              <CardContent>
                <AviationBarChart
                  title=""
                  data={statusData}
                  xKey="name"
                  yKey="value"
                  fillColor="#3B82F6"
                  height={300}
                />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common squawk management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Plus className="w-6 h-6" />
                  New Squawk
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <AlertOctagon className="w-6 h-6" />
                  Critical Issues
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Wrench className="w-6 h-6" />
                  Assign Work
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Download className="w-6 h-6" />
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="squawks" className="space-y-6">
          {/* Squawk Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Search squawks..."
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
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="major">Major</option>
                <option value="normal">Normal</option>
                <option value="minor">Minor</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                <option value="engine">Engine</option>
                <option value="airframe">Airframe</option>
                <option value="avionics">Avionics</option>
                <option value="landing_gear">Landing Gear</option>
                <option value="interior">Interior</option>
                <option value="electrical">Electrical</option>
                <option value="fuel_system">Fuel System</option>
                <option value="flight_controls">Flight Controls</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                Kanban
              </Button>
            </div>
          </div>

          {/* Squawk List View */}
          {viewMode === 'list' && (
            <div className="space-y-3">
              {filteredSquawks.map((squawk) => (
                <Card key={squawk.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", {
                          "bg-red-100": squawk.severity === 'critical',
                          "bg-orange-100": squawk.severity === 'major',
                          "bg-blue-100": squawk.severity === 'normal',
                          "bg-green-100": squawk.severity === 'minor'
                        })}>
                          {getCategoryIcon(squawk.category)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{squawk.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {squawk.aircraft?.tail_number} • {squawk.category} • {new Date(squawk.reported_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {squawk.description.substring(0, 100)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {squawk.reporter?.full_name || 'Unknown'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {squawk.assignee?.full_name ? `Assigned to ${squawk.assignee.full_name}` : 'Unassigned'}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge className={cn("text-xs", getSeverityColor(squawk.severity))}>
                            {getSeverityIcon(squawk.severity)}
                            <span className="ml-1">{squawk.severity}</span>
                          </Badge>
                          <Badge className={cn("text-xs", getStatusColor(squawk.status))}>
                            {getStatusIcon(squawk.status)}
                            <span className="ml-1">{squawk.status}</span>
                          </Badge>
                        </div>
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

          {/* Kanban View */}
          {viewMode === 'kanban' && (
            <div className="grid gap-6 md:grid-cols-5">
              {['open', 'assigned', 'in_progress', 'resolved', 'closed'].map((status) => (
                <div key={status} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold capitalize">{status.replace('_', ' ')}</h3>
                    <Badge variant="outline" className="text-xs">
                      {filteredSquawks.filter(s => s.status === status).length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {filteredSquawks
                      .filter(squawk => squawk.status === status)
                      .map((squawk) => (
                        <Card key={squawk.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge className={cn("text-xs", getSeverityColor(squawk.severity))}>
                                  {getSeverityIcon(squawk.severity)}
                                  <span className="ml-1">{squawk.severity}</span>
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(squawk.reported_at).toLocaleDateString()}
                                </span>
                              </div>
                              <h4 className="font-medium text-sm">{squawk.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                {squawk.aircraft?.tail_number} • {squawk.category}
                              </p>
                              {squawk.assignee && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <User className="w-3 h-3" />
                                  {squawk.assignee.full_name}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="workflow" className="space-y-6">
          {/* Workflow Management */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Management</CardTitle>
              <CardDescription>Track squawk resolution process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Circle className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Open</h3>
                  <p className="text-sm text-muted-foreground">{squawkStats.open} squawks</p>
                  <p className="text-xs text-muted-foreground">New issues reported</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Square className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold">Assigned</h3>
                  <p className="text-sm text-muted-foreground">{squawkStats.assigned} squawks</p>
                  <p className="text-xs text-muted-foreground">Work assigned to technicians</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Triangle className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">In Progress</h3>
                  <p className="text-sm text-muted-foreground">{squawkStats.inProgress} squawks</p>
                  <p className="text-xs text-muted-foreground">Work actively being performed</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckSquare className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Resolved</h3>
                  <p className="text-sm text-muted-foreground">{squawkStats.resolved} squawks</p>
                  <p className="text-xs text-muted-foreground">Issues successfully resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Queue */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Queue</CardTitle>
              <CardDescription>Unassigned squawks requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {squawkReports
                  .filter(squawk => squawk.status === 'open' && !squawk.assignee)
                  .slice(0, 5)
                  .map((squawk) => (
                    <div key={squawk.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", {
                          "bg-red-100": squawk.severity === 'critical',
                          "bg-orange-100": squawk.severity === 'major',
                          "bg-blue-100": squawk.severity === 'normal',
                          "bg-green-100": squawk.severity === 'minor'
                        })}>
                          {getCategoryIcon(squawk.category)}
                        </div>
                        <div>
                          <div className="font-medium">{squawk.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {squawk.aircraft?.tail_number} • {squawk.category}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs", getSeverityColor(squawk.severity))}>
                          {squawk.severity}
                        </Badge>
                        <Button size="sm">
                          <User className="w-4 h-4 mr-2" />
                          Assign
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Squawk Reports */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resolution Time Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Average Resolution Time</span>
                    <span className="font-medium">{squawkStats.avgResolutionTime} days</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Critical Issue Response</span>
                    <span className="font-medium">2.1 hours</span>
                  </div>
                  <Progress value={90} className="h-2" />
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Customer Satisfaction</span>
                    <span className="font-medium">4.8/5.0</span>
                  </div>
                  <Progress value={96} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Engine Issues</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">12</span>
                      <span className="text-xs text-muted-foreground">(24%)</span>
                    </div>
                  </div>
                  <Progress value={24} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avionics</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">8</span>
                      <span className="text-xs text-muted-foreground">(16%)</span>
                    </div>
                  </div>
                  <Progress value={16} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Landing Gear</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">6</span>
                      <span className="text-xs text-muted-foreground">(12%)</span>
                    </div>
                  </div>
                  <Progress value={12} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Electrical</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">5</span>
                      <span className="text-xs text-muted-foreground">(10%)</span>
                    </div>
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>Report Export</CardTitle>
              <CardDescription>Generate and download squawk reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <FileText className="w-6 h-6" />
                  Daily Report
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Calendar className="w-6 h-6" />
                  Weekly Summary
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <BarChart3 className="w-6 h-6" />
                  Monthly Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 