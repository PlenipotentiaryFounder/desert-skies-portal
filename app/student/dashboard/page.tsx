"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useStudentDashboardData } from '@/components/student/dashboard/StudentDashboardData'
import { TrainingSchedule } from '@/components/student/dashboard/TrainingSchedule'
import { TrainingProgress } from '@/components/student/dashboard/TrainingProgress'
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
  const [activeTab, setActiveTab] = useState('overview')
  const { data: dashboardData, loading, error } = useStudentDashboardData()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Debug tab changes
  useEffect(() => {
    console.log('🔄 Active tab changed to:', activeTab)
  }, [activeTab])

  const handleTabChange = (value: string) => {
    console.log('🔄 Tab change requested:', value)
    setActiveTab(value)
  }

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
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
                          {dashboardData.enrollment?.instructor_name || 'TBD'}
                        </div>
                        <div className="text-sm text-muted-foreground">Current Instructor</div>
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
                      <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
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
          ) : null}
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Current Lesson Progress */}
            <motion.div variants={itemVariants}>
              <Card variant="dashboard">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <BookOpen className="w-5 h-5" />
                    Current Lesson Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-foreground">Lesson 4: Cross-Country Navigation</h4>
                        <p className="text-sm text-muted-foreground">Private Pilot Syllabus</p>
                      </div>
                      <Progress value={75} className="h-2" />
                      <p className="text-sm text-muted-foreground">75% Complete</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-foreground">Next Objective</h4>
                        <p className="text-sm text-muted-foreground">Flight Planning & Weather Analysis</p>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        View Lesson Details
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-foreground">Instructor Notes</h4>
                        <p className="text-sm text-muted-foreground">Ready for cross-country planning session</p>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        View Notes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Maneuver Performance */}
            <motion.div variants={itemVariants}>
              <Card variant="dashboard">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Target className="w-5 h-5" />
                    Maneuver Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {maneuverPerformanceData.map((maneuver, index) => (
                      <div key={maneuver.subject} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-foreground">{maneuver.subject}</h4>
                          <Badge variant={maneuver.score >= 90 ? "default" : maneuver.score >= 80 ? "secondary" : "destructive"}>
                            {maneuver.score}%
                          </Badge>
                        </div>
                        <Progress value={maneuver.score} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Needs Work</span>
                          <span>Excellent</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Training Resources */}
            <motion.div variants={itemVariants}>
              <Card variant="dashboard">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <FileText className="w-5 h-5" />
                    Training Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-6">
                      <BookOpen className="w-8 h-8" />
                      <span className="font-medium">Syllabus</span>
                      <span className="text-sm text-muted-foreground">View training plan</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-6">
                      <FileText className="w-8 h-8" />
                      <span className="font-medium">Study Materials</span>
                      <span className="text-sm text-muted-foreground">Access resources</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-6">
                      <BarChart3 className="w-8 h-8" />
                      <span className="font-medium">Progress Reports</span>
                      <span className="text-sm text-muted-foreground">Track performance</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-6">
                      <Target className="w-8 h-8" />
                      <span className="font-medium">Requirements</span>
                      <span className="text-sm text-muted-foreground">Check completion</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
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
          ) : dashboardData ? (
            <TrainingSchedule 
              upcomingSessions={dashboardData.upcomingSessions}
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
          ) : null}
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Overall Progress */}
            <motion.div variants={itemVariants}>
              <Card variant="dashboard">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <TrendingUp className="w-5 h-5" />
                    Training Progress Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-aviation-sunset-300 mb-2">75%</div>
                      <div className="text-sm text-muted-foreground">Syllabus Complete</div>
                      <Progress value={75} className="mt-2" />
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-aviation-sky-300 mb-2">45.5</div>
                      <div className="text-sm text-muted-foreground">Total Hours</div>
                      <Progress value={76} className="mt-2" />
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-aviation-success-300 mb-2">12.3</div>
                      <div className="text-sm text-muted-foreground">Solo Hours</div>
                      <Progress value={82} className="mt-2" />
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-aviation-warning-300 mb-2">8.7</div>
                      <div className="text-sm text-muted-foreground">Cross Country</div>
                      <Progress value={58} className="mt-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Progress Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
                <Card variant="dashboard">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <BarChart3 className="w-5 h-5" />
                      Lesson Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trainingProgressData.map((lesson, index) => (
                        <div key={lesson.lesson} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground">{lesson.lesson}</span>
                            <span className="text-muted-foreground">{lesson.progress}%</span>
                          </div>
                          <Progress value={lesson.progress} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card variant="dashboard">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Target className="w-5 h-5" />
                      Skill Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {maneuverPerformanceData.map((skill, index) => (
                        <div key={skill.subject} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground">{skill.subject}</span>
                            <span className="text-muted-foreground">{skill.score}%</span>
                          </div>
                          <Progress value={skill.score} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Requirements Checklist */}
            <motion.div variants={itemVariants}>
              <Card variant="dashboard">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="w-5 h-5" />
                    Certification Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-foreground mb-4">Flight Hours</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Total Time (40 required)</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">45.5/40</span>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Solo Time (10 required)</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">12.3/10</span>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Cross Country (5 required)</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">8.7/5</span>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Night Time (3 required)</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">3.2/3</span>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-4">Other Requirements</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Medical Certificate</span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Student Pilot Certificate</span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Knowledge Test</span>
                          <X className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Practical Test</span>
                          <X className="w-4 h-4 text-red-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Notification Filters */}
            <motion.div variants={itemVariants}>
              <Card variant="dashboard">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Bell className="w-5 h-5" />
                      Notifications
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                      </Button>
                      <Button variant="outline" size="sm">
                        <CheckCheck className="w-4 h-4 mr-2" />
                        Mark All Read
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className={`flex items-start gap-4 p-4 border rounded-lg ${!notification.read ? 'bg-muted/50' : ''}`}>
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.priority === 'high' ? 'bg-red-500' : 
                          notification.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-foreground">{notification.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {notification.timestamp.toLocaleDateString()}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {notification.category}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notification Settings */}
            <motion.div variants={itemVariants}>
              <Card variant="dashboard">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Settings className="w-5 h-5" />
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground">Email Notifications</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Flight Reminders</span>
                          <Button variant="outline" size="sm">Enabled</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Progress Updates</span>
                          <Button variant="outline" size="sm">Enabled</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Document Approvals</span>
                          <Button variant="outline" size="sm">Enabled</Button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground">In-App Notifications</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">New Messages</span>
                          <Button variant="outline" size="sm">Enabled</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Schedule Changes</span>
                          <Button variant="outline" size="sm">Enabled</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Weather Alerts</span>
                          <Button variant="outline" size="sm">Enabled</Button>
                        </div>
                      </div>
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
