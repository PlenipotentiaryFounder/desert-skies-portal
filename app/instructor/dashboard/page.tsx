"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DashboardWidget, 
  QuickStatsWidget, 
  ActivityFeedWidget, 
  AlertsWidget 
} from '@/components/ui/aviation-dashboard-widget'
import { 
  AviationMetric, 
  WeatherMetrics, 
  AircraftMetrics, 
  FlightProgress 
} from '@/components/ui/aviation-metrics'
import { 
  FlightDataDisplay,
  CompactFlightDataDisplay,
  FlightStatusIndicator
} from '@/components/ui/flight-data-display'
import {
  AviationCommandCenter,
  CompactCommandCenter
} from '@/components/ui/aviation-command-center'
import {
  AviationNotificationCenter,
  CompactNotificationWidget,
  NotificationBadge
} from '@/components/ui/aviation-notifications'
import StudentManagementSystem from '@/components/instructor/StudentManagementSystem'
import {
  AviationLineChart,
  AviationBarChart,
  AviationPieChart,
  AviationRadarChart,
  AviationComposedChart,
  AviationAreaChart,
  FlightPerformanceChart,
  WeatherTrendChart,
  StudentProgressChart,
  AircraftUtilizationChart,
  ManeuverPerformanceChart,
  RevenueTrendChart
} from '@/components/ui/aviation-charts'
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
  CalendarDays,
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
  PowerOff,
  Zap as ZapIcon,
  Lightning,
  Thunder,
  Rain,
  Snow,
  Hail,
  Fog,
  Mist,
  Drizzle,
  Hurricane,
  Tornado,
  Earthquake,
  Volcano,
  Tsunami,
  Fire,
  Flood,
  Drought,
  Heat,
  Cold,
  Humidity,
  Pressure,
  Visibility,
  Ceiling,
  Turbulence,
  Icing,
  WindShear,
  Microburst,
  ClearAirTurbulence,
  MountainWave,
  JetStream,
  Front,
  WarmFront,
  ColdFront,
  StationaryFront,
  OccludedFront,
  HighPressure,
  LowPressure,
  Ridge,
  Trough,
  Convergence,
  Divergence,
  Advection,
  Convection,
  Radiation,
  Conduction,
  Evaporation,
  Condensation,
  Sublimation,
  Deposition,
  Melting,
  Freezing,
  Boiling,
  CondensationNuclei,
  CloudCondensationNuclei,
  IceNuclei,
  Aerosol,
  Particulate,
  Pollutant,
  Greenhouse,
  Ozone,
  CarbonDioxide,
  Methane,
  NitrousOxide,
  SulfurDioxide,
  NitrogenOxide,
  CarbonMonoxide,
  Lead,
  Mercury,
  Arsenic,
  Cadmium,
  Chromium,
  Nickel,
  Zinc,
  Copper,
  Iron,
  Aluminum,
  Silicon,
  Calcium,
  Magnesium,
  Sodium,
  Potassium,
  Chlorine,
  Fluorine,
  Bromine,
  Iodine,
  Helium,
  Neon,
  Argon,
  Krypton,
  Xenon,
  Radon,
  Hydrogen,
  Oxygen,
  Nitrogen,
  Carbon,
  Phosphorus,
  Sulfur,
  Selenium,
  Manganese,
  Cobalt,
  Molybdenum,
  Vanadium,
  Tungsten,
  Titanium,
  Zirconium,
  Hafnium,
  Niobium,
  Tantalum,
  Rhenium,
  Osmium,
  Iridium,
  Platinum,
  Gold,
  Silver,
  Palladium,
  Rhodium,
  Ruthenium,
  Technetium,
  Promethium,
  Neodymium,
  Praseodymium,
  Cerium,
  Lanthanum,
  Actinium,
  Thorium,
  Protactinium,
  Uranium,
  Neptunium,
  Plutonium,
  Americium,
  Curium,
  Berkelium,
  Californium,
  Einsteinium,
  Fermium,
  Mendelevium,
  Nobelium,
  Lawrencium,
  Rutherfordium,
  Dubnium,
  Seaborgium,
  Bohrium,
  Hassium,
  Meitnerium,
  Darmstadtium,
  Roentgenium,
  Copernicium,
  Nihonium,
  Flerovium,
  Moscovium,
  Livermorium,
  Tennessine,
  Oganesson
} from 'lucide-react'

export default function InstructorDashboard() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const handleTabChange = (value: string) => {
    console.log('Tab changed to:', value)
    setActiveTab(value)
  }
  const [showFlightData, setShowFlightData] = useState(true)
  const [showNotifications, setShowNotifications] = useState(true)

  useEffect(() => {
    // Set initial time on client side only
    setCurrentTime(new Date())
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Mock data - in real app, this would come from API calls
  const quickStats = [
    {
      label: "Active Students",
      value: 24,
      unit: "",
      icon: <Users className="w-6 h-6" />,
      trend: "up" as const,
      trendValue: "+3 this week",
      color: "text-aviation-sunset-400"
    },
    {
      label: "Flight Hours",
      value: 156,
      unit: "hrs",
      icon: <Clock className="w-6 h-6" />,
      trend: "up" as const,
      trendValue: "+12 this month",
      color: "text-aviation-sky-400"
    },
    {
      label: "Sessions Today",
      value: 8,
      unit: "",
      icon: <Calendar className="w-6 h-6" />,
      trend: "stable" as const,
      color: "text-aviation-success-400"
    },
    {
      label: "Completion Rate",
      value: 94,
      unit: "%",
      icon: <Target className="w-6 h-6" />,
      trend: "up" as const,
      trendValue: "+2%",
      color: "text-aviation-warning-400"
    }
  ]

  const recentActivities = [
    {
      id: "1",
      type: "session" as const,
      title: "Flight Session Completed",
      description: "Student John Smith completed Lesson 3 - Basic Maneuvers",
      timestamp: "2 hours ago",
      status: "completed" as const,
      user: "John Smith"
    },
    {
      id: "2",
      type: "document" as const,
      title: "Document Uploaded",
      description: "Medical certificate uploaded for Sarah Johnson",
      timestamp: "4 hours ago",
      status: "completed" as const,
      user: "Sarah Johnson"
    },
    {
      id: "3",
      type: "assessment" as const,
      title: "Progress Assessment",
      description: "Mike Davis passed Stage 1 Check",
      timestamp: "6 hours ago",
      status: "completed" as const,
      user: "Mike Davis"
    },
    {
      id: "4",
      type: "endorsement" as const,
      title: "Endorsement Required",
      description: "Solo flight endorsement needed for Lisa Chen",
      timestamp: "1 day ago",
      status: "pending" as const,
      user: "Lisa Chen"
    },
    {
      id: "5",
      type: "maintenance" as const,
      title: "Aircraft Maintenance",
      description: "Cessna 172 scheduled for 100-hour inspection",
      timestamp: "2 days ago",
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
      type: "danger" as const,
      title: "Aircraft Maintenance Due",
      message: "Cessna 172 N12345 requires immediate inspection",
      timestamp: "2 hours ago",
      priority: "high" as const,
      action: "Schedule"
    },
    {
      id: "3",
      type: "info" as const,
      title: "New Student Enrollment",
      message: "Welcome aboard! New student registration completed",
      timestamp: "1 day ago",
      priority: "low" as const,
      action: "View"
    }
  ]

  const weatherData = {
    temperature: 72,
    windSpeed: 8,
    visibility: 10,
    conditions: "Clear",
    pressure: 1013,
    humidity: 45
  }

  const aircraftData = {
    fuelLevel: 85,
    altitude: 2500,
    speed: 120,
    heading: 270,
    engineHours: 2450,
    nextMaintenance: 150
  }

  const flightProgressData = {
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

  const studentProgress = [
    { name: "John Smith", progress: 85, status: "active", nextLesson: "Cross-Country Navigation" },
    { name: "Sarah Johnson", progress: 72, status: "active", nextLesson: "Emergency Procedures" },
    { name: "Mike Davis", progress: 95, status: "ready", nextLesson: "Checkride Prep" },
    { name: "Lisa Chen", progress: 68, status: "active", nextLesson: "Solo Flight" },
    { name: "Alex Rodriguez", progress: 45, status: "active", nextLesson: "Advanced Maneuvers" }
  ]

  const upcomingSessions = [
    { time: "09:00", student: "John Smith", aircraft: "Cessna 172", lesson: "Cross-Country Planning" },
    { time: "11:30", student: "Sarah Johnson", aircraft: "Cessna 172", lesson: "Emergency Procedures" },
    { time: "14:00", student: "Mike Davis", aircraft: "Piper Arrow", lesson: "Complex Aircraft" },
    { time: "16:30", student: "Lisa Chen", aircraft: "Cessna 172", lesson: "Solo Flight Prep" }
  ]

  // Mock flight data for real-time display
  const flightData = {
    altitude: 2500,
    speed: 120,
    heading: 270,
    fuelLevel: 85,
    engineHours: 2450.5,
    temperature: 72,
    windSpeed: 8,
    visibility: 10,
    pressure: 1013,
    location: {
      lat: 33.7490,
      lng: -84.3880
    },
    status: 'normal' as const,
    timestamp: new Date()
  }

  // Mock chart data
  const flightPerformanceData = [
    { time: "00:00", altitude: 0, speed: 0, fuel: 100 },
    { time: "00:05", altitude: 500, speed: 60, fuel: 95 },
    { time: "00:10", altitude: 1500, speed: 110, fuel: 90 },
    { time: "00:15", altitude: 2500, speed: 120, fuel: 85 },
    { time: "00:20", altitude: 2500, speed: 125, fuel: 80 },
    { time: "00:25", altitude: 2400, speed: 115, fuel: 75 }
  ]

  const weatherTrendData = [
    { time: "06:00", temperature: 65, windSpeed: 5 },
    { time: "08:00", temperature: 68, windSpeed: 6 },
    { time: "10:00", temperature: 72, windSpeed: 8 },
    { time: "12:00", temperature: 75, windSpeed: 10 },
    { time: "14:00", temperature: 78, windSpeed: 12 },
    { time: "16:00", temperature: 76, windSpeed: 11 }
  ]

  const studentProgressData = [
    { student: "John Smith", progress: 85 },
    { student: "Sarah Johnson", progress: 72 },
    { student: "Mike Davis", progress: 95 },
    { student: "Lisa Chen", progress: 68 },
    { student: "Alex Rodriguez", progress: 45 }
  ]

  const aircraftUtilizationData = [
    { aircraft: "Cessna 172", hours: 45 },
    { aircraft: "Piper Arrow", hours: 32 },
    { aircraft: "Cessna 152", hours: 28 },
    { aircraft: "Diamond DA40", hours: 15 }
  ]

  const maneuverPerformanceData = [
    { subject: "Steep Turns", score: 85 },
    { subject: "Slow Flight", score: 92 },
    { subject: "Stalls", score: 78 },
    { subject: "Emergency Procedures", score: 88 },
    { subject: "Landings", score: 82 },
    { subject: "Navigation", score: 90 }
  ]

  const revenueTrendData = [
    { month: "Jan", revenue: 45000 },
    { month: "Feb", revenue: 52000 },
    { month: "Mar", revenue: 48000 },
    { month: "Apr", revenue: 61000 },
    { month: "May", revenue: 58000 },
    { month: "Jun", revenue: 65000 }
  ]

  // Mock notifications
  const notifications = [
    {
      id: "1",
      type: "flight" as const,
      priority: "medium" as const,
      title: "Flight Session Completed",
      message: "Student John Smith completed Lesson 3 - Basic Maneuvers",
      timestamp: new Date(Date.now() - 7200000),
      read: false,
      acknowledged: false,
      user: "John Smith",
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
      type: "maintenance" as const,
      priority: "critical" as const,
      title: "Aircraft Maintenance Due",
      message: "Cessna 172 N12345 requires immediate inspection",
      timestamp: new Date(Date.now() - 3600000),
      read: true,
      acknowledged: false,
      category: "Maintenance",
      metadata: {
        aircraftId: "AC-001",
        maintenance: {
          type: "100-hour inspection",
          dueDate: new Date(Date.now() + 86400000),
          severity: "Critical"
        }
      }
    }
  ]

  const handleRefresh = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
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
              Flight Command Center
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, Instructor. Here's your aviation operations overview.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Time</p>
              <p className="text-xl font-mono text-aviation-sunset-300">
                {currentTime ? currentTime.toLocaleTimeString() : '--:--:--'}
              </p>
            </div>
            <NotificationBadge count={notifications.filter(n => !n.read).length} critical={notifications.filter(n => n.priority === 'critical').length} />
            <Button
              variant="aviation"
              onClick={handleRefresh}
              loading={isLoading}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh Data
            </Button>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Current Tab: <span className="text-aviation-sunset-300 font-semibold">{activeTab}</span></p>
        </div>
        <TabsList className="grid w-full grid-cols-6 bg-white/10 backdrop-blur-sm border border-white/20">
          <TabsTrigger value="overview" className="data-[state=active]:bg-aviation-sunset-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200">Overview</TabsTrigger>
          <TabsTrigger value="flights" className="data-[state=active]:bg-aviation-sunset-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200">Flights</TabsTrigger>
          <TabsTrigger value="students" className="data-[state=active]:bg-aviation-sunset-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200">Students</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-aviation-sunset-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200">Analytics</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-aviation-sunset-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200">Notifications</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-aviation-sunset-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Quick Stats Row */}
            <motion.div variants={itemVariants}>
              <QuickStatsWidget stats={quickStats} />
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants}>
              <Card variant="dashboard">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 title-gold-glow title-gold-glow-hover">
                    <Zap className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <Button variant="aviation" className="flex flex-col items-center gap-2 h-auto py-4">
                      <PlaneTakeoff className="w-6 h-6" />
                      <span className="text-sm">New Session</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                      <UserCheck className="w-6 h-6" />
                      <span className="text-sm">Add Student</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                      <BookOpen className="w-6 h-6" />
                      <span className="text-sm">View Syllabus</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                      <BarChart3 className="w-6 h-6" />
                      <span className="text-sm">Reports</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                      <Settings className="w-6 h-6" />
                      <span className="text-sm">Settings</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                      <Bell className="w-6 h-6" />
                      <span className="text-sm">Notifications</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Weather & Aircraft */}
              <div className="space-y-6">
                <motion.div variants={itemVariants}>
                  <WeatherMetrics {...weatherData} />
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <Card variant="dashboard" className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 title-gold-glow title-gold-glow-hover">
                        <Plane className="w-5 h-5" />
                        Aircraft Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AircraftMetrics {...aircraftData} />
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Center Column - Flight Progress & Alerts */}
              <div className="space-y-6">
                <motion.div variants={itemVariants}>
                  <FlightProgress {...flightProgressData} />
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <AlertsWidget alerts={activeAlerts} />
                </motion.div>
              </div>

              {/* Right Column - Activity Feed */}
              <div className="space-y-6">
                <motion.div variants={itemVariants}>
                  <ActivityFeedWidget activities={recentActivities} />
                </motion.div>
              </div>
            </div>

            {/* Real-time Flight Data */}
            <motion.div variants={itemVariants}>
              <FlightDataDisplay
                data={flightData}
                variant="aviation"
                showControls={true}
                onRefresh={handleRefresh}
              />
            </motion.div>

            {/* Student Progress & Upcoming Sessions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
                <Card variant="dashboard" className="h-full">
                  <CardHeader>
                                          <CardTitle className="flex items-center gap-2 title-gold-glow title-gold-glow-hover">
                        <GraduationCap className="w-5 h-5" />
                        Student Progress Overview
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {studentProgress.map((student, index) => (
                        <motion.div
                          key={student.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-foreground">{student.name}</span>
                              <Badge 
                                variant={student.status === 'ready' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {student.status}
                              </Badge>
                            </div>
                            <Progress value={student.progress} className="h-2 mb-2" />
                            <p className="text-xs text-muted-foreground">
                              {student.progress}% complete • Next: {student.nextLesson}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card variant="dashboard" className="h-full">
                  <CardHeader>
                                          <CardTitle className="flex items-center gap-2 title-gold-glow title-gold-glow-hover">
                        <CalendarDays className="w-5 h-5" />
                        Today's Schedule
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {upcomingSessions.map((session, index) => (
                        <motion.div
                          key={session.time}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border-l-4 border-aviation-sunset-500"
                        >
                          <div className="text-center min-w-[60px]">
                            <p className="text-lg font-bold text-aviation-sunset-300">{session.time}</p>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{session.student}</p>
                            <p className="text-sm text-muted-foreground">{session.lesson}</p>
                            <p className="text-xs text-aviation-sky-300">{session.aircraft}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="flights" className="space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <FlightPerformanceChart data={flightPerformanceData} />
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
                <WeatherTrendChart data={weatherTrendData} />
              </motion.div>
              <motion.div variants={itemVariants}>
                <AircraftUtilizationChart data={aircraftUtilizationData} />
              </motion.div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Small Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={itemVariants} className="h-80">
                <StudentProgressChart data={studentProgressData} />
              </motion.div>
              
              <motion.div variants={itemVariants} className="h-80">
                <ManeuverPerformanceChart data={maneuverPerformanceData} />
              </motion.div>
            </div>

            {/* Student Management System */}
            <motion.div variants={itemVariants} className="h-[800px]">
              <StudentManagementSystem />
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <RevenueTrendChart data={revenueTrendData} />
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
                <AviationBarChart
                  title="Monthly Flight Hours"
                  subtitle="Total flight hours by month"
                  data={[
                    { name: "Jan", value: 120 },
                    { name: "Feb", value: 135 },
                    { name: "Mar", value: 142 },
                    { name: "Apr", value: 158 },
                    { name: "May", value: 165 },
                    { name: "Jun", value: 178 }
                  ]}
                  icon={<Clock className="w-5 h-5" />}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <AviationPieChart
                  title="Student Distribution"
                  subtitle="Students by certification level"
                  data={[
                    { name: "Private Pilot", value: 15 },
                    { name: "Instrument Rating", value: 8 },
                    { name: "Commercial Pilot", value: 5 },
                    { name: "Flight Instructor", value: 3 }
                  ]}
                  icon={<GraduationCap className="w-5 h-5" />}
                />
              </motion.div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <AviationNotificationCenter
                notifications={notifications}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
                onAction={handleAction}
                onRefresh={handleRefresh}
              />
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <Card variant="dashboard">
                <CardHeader>
                                      <CardTitle className="flex items-center gap-2 title-gold-glow title-gold-glow-hover">
                      <Settings className="w-5 h-5" />
                      System Settings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                      <div>
                        <h4 className="font-medium title-gold-glow">Real-time Flight Data</h4>
                        <p className="text-sm text-muted-foreground">Show live flight telemetry</p>
                      </div>
                      <Button
                        variant={showFlightData ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowFlightData(!showFlightData)}
                      >
                        {showFlightData ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                      <div>
                        <h4 className="font-medium title-gold-glow">Notifications</h4>
                        <p className="text-sm text-muted-foreground">Show notification center</p>
                      </div>
                      <Button
                        variant={showNotifications ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowNotifications(!showNotifications)}
                      >
                        {showNotifications ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
