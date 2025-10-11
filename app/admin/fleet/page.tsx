"use client"

import { useState, useEffect } from 'react'
import { getAircraftStatus, calculateNextInspection, calculateAircraftUtilization } from '@/lib/aircraft-status-service'
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
  Activity as ActivityIcon,
  ArrowRight,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

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

interface FleetStats {
  totalAircraft: number
  airworthyCount: number
  maintenanceCount: number
  groundedCount: number
  totalHours: number
  totalFlights: number
  totalRevenue: number
  avgUtilization: number
  totalMaintenanceCost: number
  criticalAlerts: number
}

export default function FleetManagementPage() {
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid')
  const [supabase] = useState(() => createClient())
  const { toast } = useToast()

  // Mock data for maintenance and squawks (replace with real API calls)
  const [maintenanceData] = useState<any[]>([])
  const [squawkData] = useState<any[]>([])

  // Chart data
  const utilizationData = [
    { name: 'Jan', utilization: 85, hours: 120, revenue: 45000 },
    { name: 'Feb', utilization: 78, hours: 110, revenue: 42000 },
    { name: 'Mar', utilization: 92, hours: 135, revenue: 52000 },
    { name: 'Apr', utilization: 88, hours: 125, revenue: 48000 },
    { name: 'May', utilization: 95, hours: 140, revenue: 55000 },
    { name: 'Jun', utilization: 91, hours: 130, revenue: 51000 }
  ]

  const fleetStats: FleetStats = {
    totalAircraft: aircraft.length,
    airworthyCount: aircraft.filter(ac => ac.status === 'airworthy').length,
    maintenanceCount: aircraft.filter(ac => ac.status === 'maintenance').length,
    groundedCount: aircraft.filter(ac => ac.status === 'grounded').length,
    totalHours: aircraft.reduce((sum, ac) => sum + ac.total_hours, 0),
    totalFlights: aircraft.reduce((sum, ac) => sum + ac.total_flights, 0),
    totalRevenue: aircraft.reduce((sum, ac) => sum + ac.revenue_generated, 0),
    avgUtilization: aircraft.length > 0 ? aircraft.reduce((sum, ac) => sum + ac.utilization_rate, 0) / aircraft.length : 0,
    totalMaintenanceCost: aircraft.reduce((sum, ac) => sum + ac.maintenance_costs, 0),
    criticalAlerts: aircraft.filter(ac => ac.status === 'grounded').length
  }

  useEffect(() => {
    fetchFleetData()
  }, [])

  const fetchFleetData = async () => {
    setLoading(true)
    try {
      const { data: aircraftData, error: aircraftError } = await supabase
        .from('aircraft')
        .select('*')
        .eq('is_active', true)
        .order('tail_number')

      if (aircraftError) throw aircraftError

      // Transform aircraft data with real calculated fields
      const enhancedAircraft: Aircraft[] = (aircraftData || []).map((ac) => {
        const status = getAircraftStatus(ac, maintenanceData || [], squawkData || [])

        return {
          ...ac,
          status,
          next_inspection_date: calculateNextInspection(ac.last_inspection_date),
          utilization_rate: Math.floor(Math.random() * 40) + 60, // Mock utilization rate
          total_flights: Math.floor(Math.random() * 50) + 10, // Mock flight count
          total_hours: ac.hobbs_time,
          revenue_generated: Math.floor(Math.random() * 50000) + 10000, // Mock revenue
          maintenance_costs: Math.floor(Math.random() * 10000) + 5000 // Mock maintenance costs
        } as Aircraft
      })

      setAircraft(enhancedAircraft)

    } catch (error) {
      console.error('Error fetching fleet data:', error)
      toast({
        title: "Error loading fleet data",
        description: "Failed to fetch aircraft information",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Use the real aircraft status service

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
          <p className="text-muted-foreground">Command center for fleet operations and aircraft management</p>
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
      {fleetStats.criticalAlerts > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">
                  {fleetStats.criticalAlerts} Aircraft Grounded
                </h3>
                <p className="text-sm text-red-700">
                  {fleetStats.criticalAlerts} aircraft require immediate attention
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
            <div className="text-2xl font-bold">{fleetStats.totalAircraft}</div>
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

      {/* Main Fleet Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="aircraft" className="flex items-center gap-2">
            <Plane className="w-4 h-4" />
            Aircraft
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
                <Link href="/admin/maintenance">
                  <Button variant="outline" className="h-20 flex-col gap-2 w-full">
                    <Wrench className="w-6 h-6" />
                    Maintenance
                  </Button>
                </Link>
                <Link href="/admin/squawks">
                  <Button variant="outline" className="h-20 flex-col gap-2 w-full">
                    <AlertTriangle className="w-6 h-6" />
                    Squawk Reports
                  </Button>
                </Link>
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
                <Link key={ac.id} href={`/admin/fleet/${ac.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
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
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Aircraft List View */}
          {viewMode === 'list' && (
            <div className="space-y-2">
              {filteredAircraft.map((ac) => (
                <Link key={ac.id} href={`/admin/fleet/${ac.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
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
                            <Link href={`/admin/fleet/${ac.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
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
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Plane className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Training Flight</div>
                      <div className="text-sm text-muted-foreground">
                        09:00 - 11:00 • N12345
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">scheduled</Badge>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
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
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Wrench className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Annual Inspection</div>
                      <div className="text-sm text-muted-foreground">
                        Due: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()} • N12345
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">scheduled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 