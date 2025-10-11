"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useStudentDashboardData } from '@/components/student/dashboard/StudentDashboardData'
import { getCurrentWeather, getWeatherTrend, type WeatherData, type WeatherTrendData } from '@/lib/weather-service'
import { getActiveAircraftData, type AircraftData } from '@/lib/aircraft-service'
import {
  getFlightProgress,
  getFlightPerformanceData,
  getManeuverPerformanceData,
  getTrainingProgressData,
  type FlightProgressData,
  type FlightPerformanceData
} from '@/lib/flight-service'
import { TrainingSchedule } from '@/components/student/dashboard/TrainingSchedule'
import { TrainingProgress } from '@/components/student/dashboard/TrainingProgress'
import { NotificationsTab } from '@/components/student/dashboard/NotificationsTab'
import { EnhancedTrainingTab } from '@/components/student/dashboard/EnhancedTrainingTab'
import {
  Plane,
  Users,
  Calendar,
  Clock,
  MapPin,
  Wind,
  Thermometer,
  Eye,
  Gauge,
  Fuel,
  Compass,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  RefreshCw,
  Settings,
  Maximize2,
  Minimize2,
  Zap,
  Target,
  Award,
  FileText,
  BarChart3,
  Activity,
  Bell,
  Star,
  BookOpen,
  GraduationCap,
  Clock3,
  CreditCard,
  CalendarDays,
  UserCheck,
  UserX,
  PlaneTakeoff,
  DollarSign,
  Receipt,
  X,
  PlaneLanding,
  Navigation,
  Cloud,
  Sun,
  Moon,
  CloudRain,
  CloudLightning,
  Shield,
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
  ChevronDown,
  ChevronUp,
  MoreHorizontal as MoreHorizontalIcon,
  ExternalLink,
  Download,
  Share2,
  Edit,
  Copy,
  Bookmark,
  BookmarkPlus,
  Search,
  Filter,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Maximize2 as Maximize2Icon,
  Minimize2 as Minimize2Icon,
  RotateCcw,
  Play,
  Pause,
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
  Server,
  Database,
  HardDrive,
  MemoryStick,
  Cpu,
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
  PowerOff,
  Zap as ZapIcon,
  History,
  CheckCheck,
  Plus,
  X
} from 'lucide-react'

// Mock data removed - using real data from useStudentDashboardData hook

export default function StudentDashboard() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [weatherTrendData, setWeatherTrendData] = useState<WeatherTrendData[]>([])
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [aircraftData, setAircraftData] = useState<AircraftData | null>(null)
  const [aircraftLoading, setAircraftLoading] = useState(false)
  const [flightProgressData, setFlightProgressData] = useState<FlightProgressData | null>(null)
  const [flightPerformanceData, setFlightPerformanceData] = useState<FlightPerformanceData[]>([])
  const [maneuverPerformanceData, setManeuverPerformanceData] = useState<Array<{subject: string, score: number}>>([])
  const [trainingProgressData, setTrainingProgressData] = useState<Array<{lesson: string, progress: number}>>([])
  const [flightDataLoading, setFlightDataLoading] = useState(false)
  const { data: dashboardData, loading, error } = useStudentDashboardData()

  useEffect(() => {
    // Set initial time on client mount to prevent hydration mismatch
    setCurrentTime(new Date())

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function fetchWeatherData() {
      try {
        setWeatherLoading(true)
        const [currentWeather, trendData] = await Promise.all([
          getCurrentWeather(),
          getWeatherTrend()
        ])
        setWeatherData(currentWeather)
        setWeatherTrendData(trendData)
      } catch (error) {
        console.error('Error fetching weather data:', error)
      } finally {
        setWeatherLoading(false)
      }
    }

    async function fetchAircraftData() {
      try {
        setAircraftLoading(true)
        const aircraft = await getActiveAircraftData()
        setAircraftData(aircraft[0] || null)
      } catch (error) {
        console.error('Error fetching aircraft data:', error)
      } finally {
        setAircraftLoading(false)
      }
    }

    async function fetchFlightData() {
      try {
        setFlightDataLoading(true)
        const studentId = dashboardData?.student?.id

        if (studentId) {
          const [progress, performance, maneuvers, training] = await Promise.all([
            getFlightProgress(studentId),
            getFlightPerformanceData('current'), // TODO: Get actual session ID
            getManeuverPerformanceData(studentId),
            getTrainingProgressData(studentId)
          ])

          setFlightProgressData(progress)
          setFlightPerformanceData(performance)
          setManeuverPerformanceData(maneuvers)
          setTrainingProgressData(training)
        }
      } catch (error) {
        console.error('Error fetching flight data:', error)
      } finally {
        setFlightDataLoading(false)
      }
    }

    fetchWeatherData()
    fetchAircraftData()
    fetchFlightData()
  }, [])

  // Debug tab changes
  useEffect(() => {
    console.log('🔄 Active tab changed to:', activeTab)
  }, [activeTab])

  const handleTabChange = (value: string) => {
    console.log('🔄 Tab change requested:', value)
    setActiveTab(value)
  }

  // Real data from dashboard hook
  const quickStats = [
    {
      label: "Training Progress",
      value: dashboardData?.progress?.syllabusProgress || 0,
      unit: "%",
      icon: <GraduationCap className="w-6 h-6" />,
      trend: "up" as const,
      trendValue: "+5% this week",
      color: "text-aviation-sunset-400"
    },
    {
      label: "Total Flight Hours",
      value: dashboardData?.progress?.totalHours || 0,
      unit: "hrs",
      icon: <Clock className="w-6 h-6" />,
      trend: "up" as const,
      trendValue: "+2.5 this week",
      color: "text-aviation-sky-400"
    },
    {
      label: "Solo Hours",
      value: dashboardData?.progress?.soloHours || 0,
      unit: "hrs",
      icon: <PlaneTakeoff className="w-6 h-6" />,
      trend: "up" as const,
      color: "text-aviation-success-400"
    },
    {
      label: "Next Lesson",
      value: dashboardData?.upcomingSessions?.length ? "Scheduled" : "Ready",
      unit: "",
      icon: <Target className="w-6 h-6" />,
      trend: "stable" as const,
      color: "text-aviation-warning-400"
    }
  ]

  const recentActivities = [
    {
      id: "1",
      type: "session" as const,
      title: "Flight Session Completed",
      description: "Completed Lesson 3 - Basic Maneuvers with Instructor Sarah",
      timestamp: "2 hours ago",
      status: "completed" as const,
      user: "Sarah Johnson"
    },
    {
      id: "2",
      type: "document" as const,
      title: "Document Uploaded",
      description: "Medical certificate uploaded and approved",
      timestamp: "1 day ago",
      status: "completed" as const,
      user: "System"
    },
    {
      id: "3",
      type: "assessment" as const,
      title: "Progress Assessment",
      description: "Passed Stage 1 Check - Ready for solo flights",
      timestamp: "3 days ago",
      status: "completed" as const,
      user: "Sarah Johnson"
    },
    {
      id: "4",
      type: "endorsement" as const,
      title: "Solo Endorsement",
      description: "Received solo flight endorsement",
      timestamp: "1 week ago",
      status: "completed" as const,
      user: "Sarah Johnson"
    },
    {
      id: "5",
      type: "maintenance" as const,
      title: "Aircraft Maintenance",
      description: "Cessna 172 scheduled for maintenance",
      timestamp: "2 weeks ago",
      status: "warning" as const,
      user: "Maintenance Team"
    }
  ]

  const activeAlerts = [
    {
      id: "1",
      type: "warning" as const,
      title: "Weather Advisory",
      message: "Crosswinds exceeding 15 knots expected this afternoon",
      timestamp: "30 minutes ago",
      priority: "medium" as const,
      action: "Review"
    },
    {
      id: "2",
      type: "info" as const,
      title: "Next Flight Scheduled",
      message: "Your next flight is scheduled for tomorrow at 10:00 AM",
      timestamp: "2 hours ago",
      priority: "low" as const,
      action: "View"
    },
    {
      id: "3",
      type: "success" as const,
      title: "Document Approved",
      message: "Your medical certificate has been approved",
      timestamp: "1 day ago",
      priority: "low" as const,
      action: "View"
    }
  ]

  // Use real weather data from API
  const currentWeatherData = weatherData || {
    temperature: 72,
    windSpeed: 8,
    visibility: 10,
    conditions: "Clear",
    pressure: 1013,
    humidity: 45
  }

  // Use real aircraft data from API
  const currentAircraftData = aircraftData || {
    fuelLevel: 85,
    altitude: 2500,
    speed: 120,
    heading: 270,
    engineHours: 2450,
    nextMaintenance: 150
  }

  // Use real flight progress data from API
  const currentFlightProgressData = flightProgressData || {
    currentPhase: "En Route",
    phases: [
      { name: "Preflight", completed: true, current: false, time: "15 min" },
      { name: "Takeoff", completed: true, current: false, time: "5 min" },
      { name: "En Route", completed: false, current: true, time: "45 min" },
      { name: "Approach", completed: false, current: false },
      { name: "Landing", completed: false, current: false }
    ],
    totalTime: "1:05",
    remainingTime: "20 min"
  }

  // TODO: Fetch upcoming sessions from flight_sessions table
  const upcomingSessions = [
    { time: "10:00", instructor: "Sarah Johnson", aircraft: "Cessna 172", lesson: "Cross-Country Planning" },
    { time: "14:30", instructor: "Sarah Johnson", aircraft: "Cessna 172", lesson: "Emergency Procedures" },
    { time: "09:00", instructor: "Sarah Johnson", aircraft: "Cessna 172", lesson: "Advanced Maneuvers" },
    { time: "16:00", instructor: "Sarah Johnson", aircraft: "Cessna 172", lesson: "Solo Flight Prep" }
  ]

  // TODO: Fetch real flight data from current flight session or aircraft sensors
  const flightData = {
    altitude: 2500,     // TODO: Fetch from current flight session
    speed: 120,         // TODO: Fetch from current flight session
    heading: 270,       // TODO: Fetch from current flight session
    fuelLevel: 85,      // TODO: Fetch from aircraft status
    engineHours: 2450.5, // TODO: Fetch from aircraft table
    temperature: 72,    // TODO: Fetch from weather API
    windSpeed: 8,       // TODO: Fetch from weather API
    visibility: 10,     // TODO: Fetch from weather API
    pressure: 1013,     // TODO: Fetch from weather API
    location: {
      lat: 33.7490,
      lng: -84.3880
    },
    status: 'normal' as const,
    timestamp: new Date()
  }

  // Use real chart data from API
  const currentFlightPerformanceData = flightPerformanceData.length > 0 ? flightPerformanceData : [
    { time: "00:00", altitude: 0, speed: 0, fuel: 100 },
    { time: "00:05", altitude: 500, speed: 60, fuel: 95 },
    { time: "00:10", altitude: 1500, speed: 110, fuel: 90 },
    { time: "00:15", altitude: 2500, speed: 120, fuel: 85 },
    { time: "00:20", altitude: 2500, speed: 125, fuel: 80 },
    { time: "00:25", altitude: 2400, speed: 115, fuel: 75 }
  ]

  // Use real weather trend data from API
  const currentWeatherTrendData = weatherTrendData.length > 0 ? weatherTrendData : [
    { time: "06:00", temperature: 65, windSpeed: 5 },
    { time: "08:00", temperature: 68, windSpeed: 6 },
    { time: "10:00", temperature: 72, windSpeed: 8 },
    { time: "12:00", temperature: 75, windSpeed: 10 },
    { time: "14:00", temperature: 78, windSpeed: 12 },
    { time: "16:00", temperature: 76, windSpeed: 11 }
  ]

  // Use real performance data from API
  const currentManeuverPerformanceData = maneuverPerformanceData.length > 0 ? maneuverPerformanceData : [
    { subject: "Steep Turns", score: 85 },
    { subject: "Slow Flight", score: 92 },
    { subject: "Stalls", score: 78 },
    { subject: "Emergency Procedures", score: 88 },
    { subject: "Landings", score: 82 },
    { subject: "Navigation", score: 90 }
  ]

  const currentTrainingProgressData = trainingProgressData.length > 0 ? trainingProgressData : [
    { lesson: "Lesson 1", progress: 100 },
    { lesson: "Lesson 2", progress: 100 },
    { lesson: "Lesson 3", progress: 100 },
    { lesson: "Lesson 4", progress: 75 },
    { lesson: "Lesson 5", progress: 50 },
    { lesson: "Lesson 6", progress: 25 }
  ]

  // Mock notifications
  const notifications = [
    {
      id: "1",
      type: "flight" as const,
      priority: "medium" as const,
      title: "Flight Session Completed",
      message: "Completed Lesson 3 - Basic Maneuvers with Instructor Sarah",
      timestamp: new Date(Date.now() - 7200000),
      read: false,
      acknowledged: false,
      user: "Sarah Johnson",
      category: "Training",
      metadata: {
        flightId: "FL-2024-001",
        studentId: "ST-001",
        location: "Phoenix Sky Harbor"
      }
    },
    {
      id: "2",
      type: "weather" as const,
      priority: "high" as const,
      title: "Weather Advisory",
      message: "Crosswinds exceeding 15 knots expected this afternoon",
      timestamp: new Date(Date.now() - 1800000),
      read: false,
      acknowledged: false,
      category: "Weather",
      metadata: {
        location: "Training Area",
        weather: {
          temperature: 75,
          windSpeed: 18,
          visibility: 8,
          conditions: "Windy"
        }
      }
    },
    {
      id: "3",
      type: "document" as const,
      priority: "low" as const,
      title: "Document Approved",
      message: "Your medical certificate has been approved",
      timestamp: new Date(Date.now() - 86400000),
      read: true,
      acknowledged: false,
      category: "Documents",
      metadata: {
        documentType: "Medical Certificate",
        status: "Approved"
      }
    }
  ]

  const handleRefresh = async () => {
    // Refresh data by reloading the page or refetching
    window.location.reload()
  }

  const handleMarkRead = (id: string) => {
    // Handle mark as read
    console.log('Mark as read:', id)
  }

  const handleDelete = (id: string) => {
    // Handle delete
    console.log('Delete:', id)
  }

  const handleAction = (id: string, action: string) => {
    // Handle action
    console.log('Action:', id, action)
  }

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
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-gradient-night-sky p-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold title-gold-glow title-gold-glow-hover font-display">
              Flight Training Command Center
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {dashboardData?.student?.first_name || 'Student'}! Here's your training progress overview.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Time</p>
              <p className="text-xl font-mono text-aviation-sunset-300">
                {currentTime ? currentTime.toLocaleTimeString() : '--:--:--'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {dashboardData?.notifications?.filter(n => !n.read).length || 0} notifications
              </Badge>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading dashboard data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">Error loading dashboard: {error}</p>
              <Button onClick={handleRefresh}>Try Again</Button>
            </div>
          ) : dashboardData ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Welcome Section */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Welcome back, {dashboardData.student.first_name}!
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary mb-2">
                          {dashboardData.progress.syllabusProgress}%
                        </div>
                        <div className="text-sm text-muted-foreground">Syllabus Complete</div>
                        <Progress value={dashboardData.progress.syllabusProgress} className="mt-2" />
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-500 mb-2">
                          {dashboardData.progress.totalHours}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Flight Hours</div>
                        <Progress value={(dashboardData.progress.totalHours / 40) * 100} className="mt-2" />
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-500 mb-2">
                          {dashboardData.enrollment?.instructor_name || 'Thomas Ferrier'}
                        </div>
                        <div className="text-sm text-muted-foreground">Current Instructor</div>
                        <div className="flex gap-2 mt-2 justify-center">
                          <Button variant="outline" size="sm" onClick={() => window.location.href = '/student/messages'}>
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Message
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => window.location.href = '/student/schedule/new'}>
                            <Calendar className="w-4 h-4 mr-1" />
                            Schedule
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Upcoming Sessions */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Upcoming Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboardData.upcomingSessions.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Upcoming Sessions</h3>
                        <p className="text-muted-foreground mb-4">
                          You don't have any scheduled flight sessions.
                        </p>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Request Session
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {dashboardData.upcomingSessions.slice(0, 3).map((session, index) => (
                          <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <p className="text-lg font-bold text-primary">
                                  {new Date(session.start_time).toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(session.date).toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium">
                                  {session.lesson_name || 'Flight Training Session'}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {session.instructor_name} • {session.aircraft_name}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline">{session.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Billing Overview Widget */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Account & Billing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Account Balance */}
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary mb-2">
                          $1,250.00
                        </div>
                        <div className="text-sm text-muted-foreground">Account Balance</div>
                        <div className="flex gap-2 mt-2 justify-center">
                          <Button variant="outline" size="sm" onClick={() => window.location.href = '/student/billing/add-funds'}>
                            <Plus className="w-3 h-3 mr-1" />
                            Add Funds
                          </Button>
                        </div>
                      </div>

                      {/* Recent Sessions */}
                      <div className="space-y-3">
                        <h4 className="font-medium">Recent Sessions</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="text-sm">Flight Training - Lesson 3</span>
                            <Badge variant="outline">$125.00</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="text-sm">Ground Instruction</span>
                            <Badge variant="outline">$75.00</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="text-sm">Cross-Country Planning</span>
                            <Badge variant="outline">$150.00</Badge>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab('billing')}>
                          View All Billing
                        </Button>
                      </div>

                      {/* Quick Actions */}
                      <div className="space-y-3">
                        <h4 className="font-medium">Quick Actions</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" onClick={() => window.location.href = '/student/billing'}>
                            <FileText className="w-4 h-4 mr-1" />
                            View Invoices
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => window.location.href = '/student/billing/pay-balance'}>
                            <CreditCard className="w-4 h-4 mr-1" />
                            Pay Balance
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => window.location.href = '/student/billing/add-funds'}>
                            <Plus className="w-4 h-4 mr-1" />
                            Add Funds
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => window.location.href = '/student/billing/purchase-hours'}>
                            <Clock className="w-4 h-4 mr-1" />
                            Buy Hours
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" onClick={() => window.location.href = '/student/schedule/new'}>
                        <PlaneTakeoff className="w-6 h-6" />
                        <span className="text-sm">Schedule Flight</span>
                      </Button>
                      <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" onClick={() => window.location.href = '/student/syllabus'}>
                        <BookOpen className="w-6 h-6" />
                        <span className="text-sm">View Syllabus</span>
                      </Button>
                      <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" onClick={() => window.location.href = '/student/documents'}>
                        <FileText className="w-6 h-6" />
                        <span className="text-sm">Documents</span>
                      </Button>
                      <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" onClick={() => setActiveTab('progress')}>
                        <BarChart3 className="w-6 h-6" />
                        <span className="text-sm">Progress</span>
                      </Button>
                      <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" onClick={() => window.location.href = '/student/settings'}>
                        <Settings className="w-6 h-6" />
                        <span className="text-sm">Settings</span>
                      </Button>
                      <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" onClick={() => setActiveTab('notifications')}>
                        <Bell className="w-6 h-6" />
                        <span className="text-sm">Notifications</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ) : null}
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading training data...</p>
                      </div>
                    </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">Error loading training data: {error}</p>
              <Button onClick={handleRefresh}>Try Again</Button>
                      </div>
          ) : (
            <EnhancedTrainingTab
              trainingData={{
                currentLesson: {
                  id: "lesson-4",
                  title: "Cross-Country Navigation",
                  description: "Learn flight planning and navigation techniques",
                  order_index: 4,
                  lesson_type: "Flight Training",
                  estimated_hours: 2.5,
                  objective: "Complete cross-country flight planning and weather analysis",
                  performance_standards: "Plan and execute a cross-country flight",
                  completed: false,
                  progress: 75
                },
                upcomingLessons: [
                  {
                    id: "lesson-5",
                    title: "Solo Cross-Country",
                    description: "First solo cross-country flight",
                    order_index: 5,
                    lesson_type: "Solo Flight",
                    estimated_hours: 3.0,
                    completed: false,
                    progress: 0
                  },
                  {
                    id: "lesson-6",
                    title: "Advanced Maneuvers",
                    description: "Complex flight maneuvers",
                    order_index: 6,
                    lesson_type: "Flight Training",
                    estimated_hours: 2.0,
                    completed: false,
                    progress: 0
                  }
                ],
                completedLessons: [],
                maneuverScores: currentManeuverPerformanceData.map(m => ({
                  id: m.subject,
                  maneuver_name: m.subject,
                  score: m.score,
                  last_assessed: "2024-01-15",
                  meets_acs_standard: m.score >= 80
                })),
                syllabusProgress: dashboardData?.progress.syllabusProgress || 75,
                totalLessons: 20,
                completedLessons: 15
              }}
              onStartLesson={(lessonId) => console.log('Start lesson:', lessonId)}
              onViewLesson={(lessonId) => window.location.href = `/student/syllabus/lesson/${lessonId}`}
              onViewSyllabus={() => window.location.href = '/student/syllabus'}
              onViewProgress={() => setActiveTab('progress')}
            />
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading schedule...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">Error loading schedule: {error}</p>
              <Button onClick={handleRefresh}>Try Again</Button>
            </div>
          ) : (
            <TrainingSchedule 
              upcomingSessions={dashboardData?.upcomingSessions || []}
              onRequestSession={() => {
                // Navigate to session request page
                window.location.href = '/student/schedule/new'
              }}
              onViewSession={(sessionId) => {
                // Navigate to session details
                window.location.href = `/student/schedule/${sessionId}`
              }}
              onEditSession={(sessionId) => {
                // Navigate to session edit
                window.location.href = `/student/schedule/${sessionId}/edit`
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading progress data...</p>
                    </div>
                    </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">Error loading progress data: {error}</p>
              <Button onClick={handleRefresh}>Try Again</Button>
                    </div>
          ) : (
            <TrainingProgress
              progress={dashboardData?.progress || {
                totalHours: 45.5,
                soloHours: 12.3,
                crossCountryHours: 8.7,
                nightHours: 3.2,
                instrumentHours: 2.1,
                syllabusProgress: 75
              }}
              skillAssessments={currentManeuverPerformanceData.map(m => ({
                subject: m.subject,
                score: m.score,
                lastAssessed: "2024-01-15"
              }))}
              onViewDetails={(type) => {
                switch (type) {
                  case 'syllabus':
                    window.location.href = '/student/syllabus'
                    break
                  case 'logbook':
                    window.location.href = '/student/logbook'
                    break
                  case 'requirements':
                    window.location.href = '/student/requirements'
                    break
                  case 'assessments':
                    console.log('View assessments:', type)
                    break
                  default:
                    console.log('View details:', type)
                }
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationsTab
            notifications={dashboardData?.notifications || []}
            onMarkRead={(id) => console.log('Mark read:', id)}
            onMarkAllRead={() => console.log('Mark all read')}
            onDelete={(id) => console.log('Delete:', id)}
            onAction={(id, action) => console.log('Action:', id, action)}
          />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Account Overview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Account Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Account Balance */}
                <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    $1,250.00
                  </div>
                  <div className="text-sm text-muted-foreground">Available Balance</div>
                  <div className="flex gap-2 mt-4 justify-center">
                    <Button size="sm" onClick={() => window.location.href = '/student/billing/add-funds'}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Funds
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = '/student/billing'}>
                      <FileText className="w-4 h-4 mr-2" />
                      View History
                    </Button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">12.5</div>
                    <div className="text-sm text-muted-foreground">Flight Hours Available</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="text-2xl font-bold text-orange-600">8.3</div>
                    <div className="text-sm text-muted-foreground">Ground Hours Available</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={() => window.location.href = '/student/billing/pay-balance'}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay Outstanding Balance
                </Button>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = '/student/billing/add-funds'}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Funds to Account
                </Button>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = '/student/billing/purchase-hours'}>
                  <Clock className="w-4 h-4 mr-2" />
                  Purchase Prepaid Hours
                </Button>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = '/student/billing'}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Detailed Billing
                </Button>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Recent Billing Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                        <Plane className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">Flight Training - Lesson 3</p>
                        <p className="text-sm text-muted-foreground">Jan 15, 2024 • 2.0 hours</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">$150.00</p>
                      <Badge variant="outline" className="text-green-600">Paid</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-100 text-green-600">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">Ground Instruction</p>
                        <p className="text-sm text-muted-foreground">Jan 14, 2024 • 1.5 hours</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">$112.50</p>
                      <Badge variant="outline" className="text-green-600">Paid</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                        <Plus className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">Account Deposit</p>
                        <p className="text-sm text-muted-foreground">Jan 12, 2024 • Credit Card</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">+$500.00</p>
                      <Badge variant="outline" className="text-green-600">Completed</Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" className="w-full" onClick={() => window.location.href = '/student/billing'}>
                    <Receipt className="w-4 h-4 mr-2" />
                    View Complete Billing History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
