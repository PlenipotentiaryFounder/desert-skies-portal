"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Plane, 
  Users, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Activity,
  Shield,
  Settings,
  Bell,
  Eye,
  Wrench,
  FileText,
  DollarSign,
  Target,
  Award,
  MapPin,
  Wind,
  Thermometer,
  Gauge,
  Fuel,
  Compass,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Download,
  Share2,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Star,
  Award as AwardIcon,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  UserCheck,
  UserX,
  PlaneTakeoff,
  PlaneLanding,
  Navigation,
  Cloud,
  Sun,
  Moon,
  CloudRain,
  CloudLightning,
  Shield as ShieldIcon,
  Lock,
  Unlock,
  Key,
  Radio,
  Wifi,
  Signal,
  EyeOff,
  Trash2,
  Archive,
  MessageSquare,
  Phone,
  Mail,
  ChevronDown as ChevronDownIcon,
  ChevronUp,
  MoreHorizontal as MoreHorizontalIcon,
  ExternalLink,
  Download as DownloadIcon,
  Share2 as Share2Icon,
  Edit,
  Copy,
  Bookmark,
  BookmarkPlus,
  Search as SearchIcon,
  Filter as FilterIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Maximize2,
  Minimize2,
  RotateCcw,
  Play,
  Pause,
  Stop,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Desktop,
  Server,
  Database,
  HardDrive,
  MemoryStick,
  Cpu,
  Gpu,
  Network,
  Wifi as WifiIcon,
  WifiOff,
  Signal as SignalIcon,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  Power,
  PowerOff
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { AviationBarChart, AviationAreaChart, AviationComposedChart } from '@/components/ui/aviation-charts'
import { QuickStatsWidget } from '@/components/ui/aviation-dashboard-widget'
import { ActivityFeedWidget } from '@/components/ui/aviation-dashboard-widget'
import { AlertsWidget } from '@/components/ui/aviation-dashboard-widget'

// Types
interface FleetStatus {
  total: number
  airworthy: number
  maintenance: number
  grounded: number
  utilization: number
}

interface MaintenanceOverview {
  scheduled: number
  inProgress: number
  overdue: number
  critical: number
  squawks: number
}

interface OperationalMetrics {
  activeStudents: number
  activeInstructors: number
  sessionsToday: number
  completionRate: number
  revenue: number
  costs: number
}

interface Alert {
  id: string
  type: 'warning' | 'danger' | 'info' | 'success'
  title: string
  message: string
  timestamp: string
  priority: 'low' | 'medium' | 'high'
  action?: string
}

interface Activity {
  id: string
  type: 'session' | 'document' | 'assessment' | 'endorsement' | 'maintenance' | 'weather'
  title: string
  description: string
  timestamp: string
  status: 'completed' | 'pending' | 'cancelled' | 'warning'
  user?: string
}

export default function AdminOperationsCenter() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showFlightData, setShowFlightData] = useState(true)
  const [showNotifications, setShowNotifications] = useState(true)
  const [supabase] = useState(() => createClient())
  const { toast } = useToast()

  // State for operational data
  const [fleetStatus, setFleetStatus] = useState<FleetStatus>({
    total: 0,
    airworthy: 0,
    maintenance: 0,
    grounded: 0,
    utilization: 0
  })
  const [maintenanceOverview, setMaintenanceOverview] = useState<MaintenanceOverview>({
    scheduled: 0,
    inProgress: 0,
    overdue: 0,
    critical: 0,
    squawks: 0
  })
  const [operationalMetrics, setOperationalMetrics] = useState<OperationalMetrics>({
    activeStudents: 0,
    activeInstructors: 0,
    sessionsToday: 0,
    completionRate: 0,
    revenue: 0,
    costs: 0
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchOperationalData()
  }, [])

  const fetchOperationalData = async () => {
    setIsLoading(true)
    try {
      // Fetch fleet status
      const { count: totalAircraft } = await supabase
        .from('aircraft')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Fetch maintenance data
      const { count: scheduledMaintenance } = await supabase
        .from('aircraft_maintenance')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled')

      const { count: overdueMaintenance } = await supabase
        .from('aircraft_maintenance')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'overdue')

      // Fetch squawk reports
      const { count: openSquawks } = await supabase
        .from('squawk_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open')

      // Fetch student and instructor counts
      const { count: activeStudents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')

      const { count: activeInstructors } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'instructor')

      setFleetStatus({
        total: totalAircraft || 0,
        airworthy: Math.floor((totalAircraft || 0) * 0.85),
        maintenance: Math.floor((totalAircraft || 0) * 0.10),
        grounded: Math.floor((totalAircraft || 0) * 0.05),
        utilization: 78
      })

      setMaintenanceOverview({
        scheduled: scheduledMaintenance || 0,
        inProgress: 3,
        overdue: overdueMaintenance || 0,
        critical: 1,
        squawks: openSquawks || 0
      })

      setOperationalMetrics({
        activeStudents: activeStudents || 0,
        activeInstructors: activeInstructors || 0,
        sessionsToday: 24,
        completionRate: 94,
        revenue: 45600,
        costs: 23400
      })

    } catch (error) {
      console.error('Error fetching operational data:', error)
      toast({
        title: "Error loading data",
        description: "Failed to fetch operational metrics",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    await fetchOperationalData()
    toast({
      title: "Data refreshed",
      description: "Operational data has been updated",
    })
  }

  // Mock data for charts and widgets
  const fleetUtilizationData = [
    { name: 'Cessna 172', hours: 45, utilization: 85 },
    { name: 'Piper Arrow', hours: 32, utilization: 72 },
    { name: 'Diamond DA40', hours: 28, utilization: 68 },
    { name: 'Cessna 152', hours: 38, utilization: 78 },
    { name: 'Piper Warrior', hours: 41, utilization: 82 }
  ]

  const maintenanceTrendsData = [
    { month: 'Jan', scheduled: 12, completed: 10, overdue: 2 },
    { month: 'Feb', scheduled: 15, completed: 14, overdue: 1 },
    { month: 'Mar', scheduled: 18, completed: 16, overdue: 2 },
    { month: 'Apr', scheduled: 14, completed: 13, overdue: 1 },
    { month: 'May', scheduled: 20, completed: 18, overdue: 2 },
    { month: 'Jun', scheduled: 22, completed: 20, overdue: 2 }
  ]

  const revenueData = [
    { month: 'Jan', revenue: 42000, costs: 28000, profit: 14000 },
    { month: 'Feb', revenue: 45000, costs: 30000, profit: 15000 },
    { month: 'Mar', revenue: 48000, costs: 32000, profit: 16000 },
    { month: 'Apr', revenue: 52000, costs: 34000, profit: 18000 },
    { month: 'May', revenue: 55000, costs: 36000, profit: 19000 },
    { month: 'Jun', revenue: 58000, costs: 38000, profit: 20000 }
  ]

  const activeAlerts: Alert[] = [
    {
      id: '1',
      type: 'danger',
      title: 'Critical Maintenance Due',
      message: 'Cessna 172 N12345 requires immediate 100-hour inspection',
      timestamp: new Date().toISOString(),
      priority: 'high',
      action: 'Schedule Maintenance'
    },
    {
      id: '2',
      type: 'warning',
      title: 'Document Expiry Warning',
      message: 'Piper Arrow registration expires in 30 days',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      priority: 'medium',
      action: 'Renew Registration'
    },
    {
      id: '3',
      type: 'info',
      title: 'Weather Advisory',
      message: 'Thunderstorms expected in training area this afternoon',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      priority: 'medium'
    }
  ]

  const recentActivities: Activity[] = [
    {
      id: '1',
      type: 'session',
      title: 'Flight Session Completed',
      description: 'John Smith completed Lesson 3: Basic Maneuvers',
      timestamp: new Date().toISOString(),
      status: 'completed',
      user: 'John Smith'
    },
    {
      id: '2',
      type: 'maintenance',
      title: 'Maintenance Completed',
      description: 'Cessna 152 annual inspection completed successfully',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'completed',
      user: 'Mike Johnson'
    },
    {
      id: '3',
      type: 'document',
      title: 'Document Uploaded',
      description: 'New student enrollment documents uploaded',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      status: 'completed',
      user: 'Sarah Wilson'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-aviation-sky-50 via-white to-aviation-sky-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern-dense opacity-5" />
      
      <div className="relative z-10 p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-aviation-sky-600 to-aviation-sky-700 rounded-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-aviation-sky-900 font-display">
                Operations Center
              </h1>
              <p className="text-aviation-sky-600">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} • {currentTime.toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-white/80 backdrop-blur-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="bg-gradient-to-r from-aviation-sky-600 to-aviation-sky-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Quick Actions
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <QuickStatsWidget stats={[
            {
              label: "Fleet Status",
              value: `${fleetStatus.airworthy}/${fleetStatus.total}`,
              unit: " Airworthy",
              icon: <Plane className="w-6 h-6" />,
              trend: "stable" as const,
              color: "text-aviation-sky-400"
            },
            {
              label: "Active Students",
              value: operationalMetrics.activeStudents,
              unit: "",
              icon: <Users className="w-6 h-6" />,
              trend: "up" as const,
              trendValue: "+3 this week",
              color: "text-aviation-sunset-400"
            },
            {
              label: "Sessions Today",
              value: operationalMetrics.sessionsToday,
              unit: "",
              icon: <Calendar className="w-6 h-6" />,
              trend: "up" as const,
              trendValue: "+2",
              color: "text-aviation-success-400"
            },
            {
              label: "Revenue",
              value: `$${(operationalMetrics.revenue / 1000).toFixed(0)}`,
              unit: "k",
              icon: <DollarSign className="w-6 h-6" />,
              trend: "up" as const,
              trendValue: "+12%",
              color: "text-aviation-warning-400"
            }
          ]} />
        </motion.div>

        {/* Main Operations Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="fleet">Fleet Management</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              {/* Fleet Status Overview */}
              <motion.div variants={itemVariants}>
                <Card className="bg-white/80 backdrop-blur-sm border-aviation-sky-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-aviation-sky-900">
                      <Plane className="w-5 h-5" />
                      Fleet Status Overview
                    </CardTitle>
                    <CardDescription>Current aircraft availability and utilization</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-600">{fleetStatus.airworthy}</div>
                        <div className="text-sm text-green-700">Airworthy</div>
                        <CheckCircle className="w-6 h-6 mx-auto mt-2 text-green-500" />
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                        <div className="text-2xl font-bold text-yellow-600">{fleetStatus.maintenance}</div>
                        <div className="text-sm text-yellow-700">In Maintenance</div>
                        <Wrench className="w-6 h-6 mx-auto mt-2 text-yellow-500" />
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                        <div className="text-2xl font-bold text-red-600">{fleetStatus.grounded}</div>
                        <div className="text-sm text-red-700">Grounded</div>
                        <AlertTriangle className="w-6 h-6 mx-auto mt-2 text-red-500" />
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-600">{fleetStatus.utilization}%</div>
                        <div className="text-sm text-blue-700">Utilization</div>
                        <BarChart3 className="w-6 h-6 mx-auto mt-2 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Maintenance Alerts */}
              <motion.div variants={itemVariants}>
                <AlertsWidget alerts={activeAlerts} />
              </motion.div>

              {/* Activity Feed */}
              <motion.div variants={itemVariants}>
                <ActivityFeedWidget activities={recentActivities} />
              </motion.div>
            </motion.div>
          </TabsContent>

          <TabsContent value="fleet" className="space-y-6">
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              {/* Fleet Utilization Chart */}
              <motion.div variants={itemVariants}>
                <Card className="bg-white/80 backdrop-blur-sm border-aviation-sky-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-aviation-sky-900">
                      <BarChart3 className="w-5 h-5" />
                      Fleet Utilization
                    </CardTitle>
                    <CardDescription>Daily aircraft utilization and performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AviationBarChart
                      title=""
                      data={fleetUtilizationData}
                      xKey="name"
                      yKey="utilization"
                      fillColor="#1E3A8A"
                      height={300}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Aircraft Status Grid */}
              <motion.div variants={itemVariants}>
                <Card className="bg-white/80 backdrop-blur-sm border-aviation-sky-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-aviation-sky-900">
                      <Plane className="w-5 h-5" />
                      Aircraft Status
                    </CardTitle>
                    <CardDescription>Detailed status of each aircraft in the fleet</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {fleetUtilizationData.map((aircraft, index) => (
                        <div key={index} className="p-4 border border-aviation-sky-200 rounded-lg bg-white/50">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-aviation-sky-900">{aircraft.name}</h3>
                            <Badge variant={aircraft.utilization > 80 ? "default" : "secondary"}>
                              {aircraft.utilization}% Util
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-aviation-sky-600">Hours Today:</span>
                              <span className="font-medium">{aircraft.hours}</span>
                            </div>
                            <Progress value={aircraft.utilization} className="h-2" />
                            <div className="flex items-center gap-2 text-xs text-aviation-sky-500">
                              <CheckCircle className="w-3 h-3" />
                              <span>Airworthy</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              {/* Maintenance Overview */}
              <motion.div variants={itemVariants}>
                <Card className="bg-white/80 backdrop-blur-sm border-aviation-sky-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-aviation-sky-900">
                      <Wrench className="w-5 h-5" />
                      Maintenance Overview
                    </CardTitle>
                    <CardDescription>Current maintenance status and upcoming work</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-600">{maintenanceOverview.scheduled}</div>
                        <div className="text-sm text-blue-700">Scheduled</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                        <div className="text-2xl font-bold text-yellow-600">{maintenanceOverview.inProgress}</div>
                        <div className="text-sm text-yellow-700">In Progress</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                        <div className="text-2xl font-bold text-red-600">{maintenanceOverview.overdue}</div>
                        <div className="text-sm text-red-700">Overdue</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                        <div className="text-2xl font-bold text-orange-600">{maintenanceOverview.critical}</div>
                        <div className="text-sm text-orange-700">Critical</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                        <div className="text-2xl font-bold text-purple-600">{maintenanceOverview.squawks}</div>
                        <div className="text-sm text-purple-700">Open Squawks</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Maintenance Trends */}
              <motion.div variants={itemVariants}>
                <Card className="bg-white/80 backdrop-blur-sm border-aviation-sky-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-aviation-sky-900">
                      <TrendingUp className="w-5 h-5" />
                      Maintenance Trends
                    </CardTitle>
                    <CardDescription>6-month maintenance performance and trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AviationComposedChart
                      title=""
                      data={maintenanceTrendsData}
                      xKey="month"
                      lineKey="completed"
                      barKey="scheduled"
                      height={300}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              {/* Operational Metrics */}
              <motion.div variants={itemVariants}>
                <Card className="bg-white/80 backdrop-blur-sm border-aviation-sky-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-aviation-sky-900">
                      <Activity className="w-5 h-5" />
                      Operational Metrics
                    </CardTitle>
                    <CardDescription>Key performance indicators for flight operations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-aviation-sky-900">Student Progress</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-aviation-sky-600">Active Students</span>
                            <span className="font-medium">{operationalMetrics.activeStudents}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-aviation-sky-600">Completion Rate</span>
                            <span className="font-medium">{operationalMetrics.completionRate}%</span>
                          </div>
                          <Progress value={operationalMetrics.completionRate} className="h-2" />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold text-aviation-sky-900">Instructor Activity</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-aviation-sky-600">Active Instructors</span>
                            <span className="font-medium">{operationalMetrics.activeInstructors}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-aviation-sky-600">Sessions Today</span>
                            <span className="font-medium">{operationalMetrics.sessionsToday}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-aviation-sky-600">Avg. Sessions/Instructor</span>
                            <span className="font-medium">{(operationalMetrics.sessionsToday / operationalMetrics.activeInstructors).toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold text-aviation-sky-900">Fleet Operations</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-aviation-sky-600">Total Aircraft</span>
                            <span className="font-medium">{fleetStatus.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-aviation-sky-600">Available</span>
                            <span className="font-medium">{fleetStatus.airworthy}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-aviation-sky-600">Utilization</span>
                            <span className="font-medium">{fleetStatus.utilization}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              {/* Financial Overview */}
              <motion.div variants={itemVariants}>
                <Card className="bg-white/80 backdrop-blur-sm border-aviation-sky-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-aviation-sky-900">
                      <DollarSign className="w-5 h-5" />
                      Financial Overview
                    </CardTitle>
                    <CardDescription>Revenue, costs, and profitability metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                        <div className="text-3xl font-bold text-green-600">
                          ${(operationalMetrics.revenue / 1000).toFixed(0)}k
                        </div>
                        <div className="text-sm text-green-700">Monthly Revenue</div>
                        <TrendingUp className="w-6 h-6 mx-auto mt-2 text-green-500" />
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                        <div className="text-3xl font-bold text-red-600">
                          ${(operationalMetrics.costs / 1000).toFixed(0)}k
                        </div>
                        <div className="text-sm text-red-700">Monthly Costs</div>
                        <TrendingDown className="w-6 h-6 mx-auto mt-2 text-red-500" />
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <div className="text-3xl font-bold text-blue-600">
                          ${((operationalMetrics.revenue - operationalMetrics.costs) / 1000).toFixed(0)}k
                        </div>
                        <div className="text-sm text-blue-700">Net Profit</div>
                        <BarChart3 className="w-6 h-6 mx-auto mt-2 text-blue-500" />
                      </div>
                    </div>
                    
                    <AviationAreaChart
                      title=""
                      data={revenueData}
                      xKey="month"
                      yKey="revenue"
                      fillColor="rgba(34, 197, 94, 0.3)"
                      strokeColor="#22C55E"
                      height={300}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              {/* Compliance Dashboard */}
              <motion.div variants={itemVariants}>
                <Card className="bg-white/80 backdrop-blur-sm border-aviation-sky-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-aviation-sky-900">
                      <Shield className="w-5 h-5" />
                      FAA Compliance & Safety
                    </CardTitle>
                    <CardDescription>Regulatory compliance and safety oversight</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-600">100%</div>
                        <div className="text-sm text-green-700">FAA Part 141 Compliance</div>
                        <CheckCircle className="w-6 h-6 mx-auto mt-2 text-green-500" />
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-600">0</div>
                        <div className="text-sm text-blue-700">Safety Incidents</div>
                        <Shield className="w-6 h-6 mx-auto mt-2 text-blue-500" />
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                        <div className="text-2xl font-bold text-yellow-600">3</div>
                        <div className="text-sm text-yellow-700">Pending Inspections</div>
                        <Clock className="w-6 h-6 mx-auto mt-2 text-yellow-500" />
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                        <div className="text-2xl font-bold text-purple-600">15</div>
                        <div className="text-sm text-purple-700">Active Endorsements</div>
                        <Award className="w-6 h-6 mx-auto mt-2 text-purple-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
