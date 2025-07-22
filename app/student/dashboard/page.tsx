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
  AviationNotificationCenter,
  CompactNotificationWidget,
  NotificationBadge
} from '@/components/ui/aviation-notifications'
import {
  AviationLineChart,
  AviationBarChart,
  AviationPieChart,
  AviationRadarChart,
  AviationComposedChart,
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

// Mock data for the client component
const mockStudentData = {
  name: "John Smith",
  progress: 75,
  totalHours: 45.5,
  soloHours: 12.3,
  crossCountryHours: 8.7,
  nightHours: 3.2,
  instrumentHours: 2.1,
  nextLesson: "Cross-Country Navigation",
  instructor: "Sarah Johnson",
  aircraft: "Cessna 172 N12345",
  certification: "Private Pilot",
  status: "active"
}

export default function StudentDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showFlightData, setShowFlightData] = useState(true)
  const [showNotifications, setShowNotifications] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Mock data - in real app, this would come from API calls
  const quickStats = [
    {
      label: "Training Progress",
      value: mockStudentData.progress,
      unit: "%",
      icon: <GraduationCap className="w-6 h-6" />,
      trend: "up" as const,
      trendValue: "+5% this week",
      color: "text-aviation-sunset-400"
    },
    {
      label: "Total Flight Hours",
      value: mockStudentData.totalHours,
      unit: "hrs",
      icon: <Clock className="w-6 h-6" />,
      trend: "up" as const,
      trendValue: "+2.5 this week",
      color: "text-aviation-sky-400"
    },
    {
      label: "Solo Hours",
      value: mockStudentData.soloHours,
      unit: "hrs",
      icon: <PlaneTakeoff className="w-6 h-6" />,
      trend: "up" as const,
      color: "text-aviation-success-400"
    },
    {
      label: "Next Lesson",
      value: "Ready",
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

  const upcomingSessions = [
    { time: "10:00", instructor: "Sarah Johnson", aircraft: "Cessna 172", lesson: "Cross-Country Planning" },
    { time: "14:30", instructor: "Sarah Johnson", aircraft: "Cessna 172", lesson: "Emergency Procedures" },
    { time: "09:00", instructor: "Sarah Johnson", aircraft: "Cessna 172", lesson: "Advanced Maneuvers" },
    { time: "16:00", instructor: "Sarah Johnson", aircraft: "Cessna 172", lesson: "Solo Flight Prep" }
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

  const maneuverPerformanceData = [
    { subject: "Steep Turns", score: 85 },
    { subject: "Slow Flight", score: 92 },
    { subject: "Stalls", score: 78 },
    { subject: "Emergency Procedures", score: 88 },
    { subject: "Landings", score: 82 },
    { subject: "Navigation", score: 90 }
  ]

  const trainingProgressData = [
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
            <h1 className="text-4xl font-bold text-foreground font-display">
              Flight Training Command Center
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {mockStudentData.name}. Here's your training progress overview.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Time</p>
              <p className="text-xl font-mono text-aviation-sunset-300">
                {currentTime.toLocaleTimeString()}
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
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
                      <CardTitle className="flex items-center gap-2 text-foreground">
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

            {/* Upcoming Sessions */}
            <motion.div variants={itemVariants}>
              <Card variant="dashboard">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <CalendarDays className="w-5 h-5" />
                    Upcoming Training Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {upcomingSessions.map((session, index) => (
                      <motion.div
                        key={session.time}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex flex-col gap-2 p-4 rounded-lg hover:bg-white/5 transition-colors border-l-4 border-aviation-sunset-500"
                      >
                        <div className="text-center">
                          <p className="text-lg font-bold text-aviation-sunset-300">{session.time}</p>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{session.instructor}</p>
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

            {/* Quick Actions */}
            <motion.div variants={itemVariants}>
              <Card variant="dashboard">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Zap className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <Button variant="aviation" className="flex flex-col items-center gap-2 h-auto py-4">
                      <PlaneTakeoff className="w-6 h-6" />
                      <span className="text-sm">Schedule Flight</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                      <BookOpen className="w-6 h-6" />
                      <span className="text-sm">View Syllabus</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                      <FileText className="w-6 h-6" />
                      <span className="text-sm">Documents</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                      <BarChart3 className="w-6 h-6" />
                      <span className="text-sm">Progress</span>
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
          </motion.div>
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <ManeuverPerformanceChart data={maneuverPerformanceData} />
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
                <AviationBarChart
                  title="Training Progress"
                  subtitle="Lesson completion status"
                  data={trainingProgressData}
                  icon={<GraduationCap className="w-5 h-5" />}
                  xKey="lesson"
                  yKey="progress"
                  fillColor="#10B981"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <AviationPieChart
                  title="Flight Hours Distribution"
                  subtitle="Hours by flight type"
                  data={[
                    { name: "Solo", value: mockStudentData.soloHours },
                    { name: "Cross Country", value: mockStudentData.crossCountryHours },
                    { name: "Night", value: mockStudentData.nightHours },
                    { name: "Instrument", value: mockStudentData.instrumentHours }
                  ]}
                  icon={<Clock className="w-5 h-5" />}
                  dataKey="value"
                  nameKey="name"
                />
              </motion.div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <Card variant="dashboard">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Calendar className="w-5 h-5" />
                    Flight Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Schedule management interface would go here
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <StudentProgressChart data={trainingProgressData} />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <AviationRadarChart
                title="Skill Assessment"
                subtitle="Your proficiency in key areas"
                data={maneuverPerformanceData}
                icon={<Target className="w-5 h-5" />}
                dataKey="score"
              />
            </motion.div>
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
      </Tabs>
    </div>
  )
}
