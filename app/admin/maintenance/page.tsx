"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Calendar,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Shield,
  DollarSign,
  Plane,
  Target,
  Award,
  Star,
  FileText,
  Settings,
  Bell,
  MapPin,
  Gauge,
  Fuel,
  Compass,
  Users
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  AviationBarChart,
  AviationComposedChart,
  AviationLineChart,
  AviationPieChart,
  AviationAreaChart
} from '@/components/ui/aviation-charts'

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
  aircraft?: {
    tail_number: string
    make: string
    model: string
  }
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
  aircraft?: {
    tail_number: string
    make: string
    model: string
  }
}

export default function MaintenanceManagementPage() {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [squawkReports, setSquawkReports] = useState<SquawkReport[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [supabase] = useState(() => createClient())
  const { toast } = useToast()

  useEffect(() => {
    fetchMaintenanceData()
  }, [])

  const fetchMaintenanceData = async () => {
    setLoading(true)
    try {
      // Fetch maintenance records with aircraft info
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('aircraft_maintenance')
        .select(`
          *,
          aircraft:aircraft_id (
            tail_number,
            make,
            model
          )
        `)
        .order('due_date')

      if (maintenanceError) throw maintenanceError

      // Fetch squawk reports with aircraft info
      const { data: squawkData, error: squawkError } = await supabase
        .from('squawk_reports')
        .select(`
          *,
          aircraft:aircraft_id (
            tail_number,
            make,
            model
          )
        `)
        .order('reported_at', { ascending: false })

      if (squawkError) throw squawkError

      setMaintenanceRecords(maintenanceData || [])
      setSquawkReports(squawkData || [])

    } catch (error) {
      console.error('Error fetching maintenance data:', error)
      toast({
        title: "Error loading maintenance data",
        description: "Failed to fetch maintenance records and squawk reports",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'in_progress': return <Wrench className="w-4 h-4" />
      case 'scheduled': return <Clock className="w-4 h-4" />
      case 'overdue': return <AlertTriangle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const maintenanceStats = {
    total: maintenanceRecords.length,
    scheduled: maintenanceRecords.filter(m => m.status === 'scheduled').length,
    inProgress: maintenanceRecords.filter(m => m.status === 'in_progress').length,
    completed: maintenanceRecords.filter(m => m.status === 'completed').length,
    overdue: maintenanceRecords.filter(m => m.status === 'overdue').length,
    critical: maintenanceRecords.filter(m => m.priority === 'critical').length
  }

  const squawkStats = {
    total: squawkReports.length,
    open: squawkReports.filter(s => s.status === 'open').length,
    inProgress: squawkReports.filter(s => s.status === 'in_progress').length,
    resolved: squawkReports.filter(s => s.status === 'resolved').length,
    critical: squawkReports.filter(s => s.severity === 'critical').length
  }

  const maintenanceData = [
    { month: 'Jan', scheduled: 12, completed: 10, overdue: 2 },
    { month: 'Feb', scheduled: 15, completed: 14, overdue: 1 },
    { month: 'Mar', scheduled: 18, completed: 16, overdue: 2 },
    { month: 'Apr', scheduled: 14, completed: 13, overdue: 1 },
    { month: 'May', scheduled: 20, completed: 18, overdue: 2 },
    { month: 'Jun', scheduled: 22, completed: 20, overdue: 2 }
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-orange-900 font-display">
              Maintenance Management
            </h1>
            <p className="text-orange-600">
              Comprehensive maintenance oversight, scheduling, and tracking
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white/80 backdrop-blur-sm">
            <Download className="w-4 h-4 mr-2" />
            Export Reports
          </Button>
          <Button className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Schedule Maintenance
          </Button>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Total Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{maintenanceStats.total}</div>
              <p className="text-xs text-blue-700">Active Records</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-900 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Scheduled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{maintenanceStats.scheduled}</div>
              <p className="text-xs text-yellow-700">Upcoming Work</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">{maintenanceStats.overdue}</div>
              <p className="text-xs text-red-700">Past Due</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Critical
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{maintenanceStats.critical}</div>
              <p className="text-xs text-orange-700">High Priority</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="squawks">Squawks</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Maintenance Trends */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Maintenance Trends
                    </CardTitle>
                    <CardDescription>6-month maintenance performance</CardDescription>
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
              </motion.div>

              {/* Squawk Overview */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Squawk Reports
                    </CardTitle>
                    <CardDescription>Current maintenance requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{squawkStats.open}</div>
                          <div className="text-sm text-red-700">Open</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{squawkStats.inProgress}</div>
                          <div className="text-sm text-blue-700">In Progress</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Critical Squawks</span>
                          <span className="font-medium text-red-600">{squawkStats.critical}</span>
                        </div>
                        <Progress value={squawkStats.total > 0 ? (squawkStats.resolved / squawkStats.total) * 100 : 0} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {squawkStats.resolved} of {squawkStats.total} resolved
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Maintenance Records
                </CardTitle>
                <CardDescription>All scheduled and completed maintenance work</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {maintenanceRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Wrench className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{record.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {record.aircraft?.tail_number} • {record.aircraft?.make} {record.aircraft?.model}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Due: {new Date(record.due_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs", getStatusColor(record.status))}>
                          {getStatusIcon(record.status)}
                          <span className="ml-1">{record.status}</span>
                        </Badge>
                        <Badge className={cn("text-xs", getPriorityColor(record.priority))}>
                          {record.priority}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="squawks" className="space-y-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Squawk Reports
                </CardTitle>
                <CardDescription>Maintenance requests and issues reported by pilots</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {squawkReports.map((squawk) => (
                    <div key={squawk.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", {
                          "bg-red-100": squawk.severity === 'critical',
                          "bg-orange-100": squawk.severity === 'major',
                          "bg-yellow-100": squawk.severity === 'normal',
                          "bg-green-100": squawk.severity === 'minor'
                        })}>
                          <AlertTriangle className={cn("w-4 h-4", {
                            "text-red-600": squawk.severity === 'critical',
                            "text-orange-600": squawk.severity === 'major',
                            "text-yellow-600": squawk.severity === 'normal',
                            "text-green-600": squawk.severity === 'minor'
                          })} />
                        </div>
                        <div>
                          <div className="font-medium">{squawk.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {squawk.aircraft?.tail_number} • {squawk.category}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Reported: {new Date(squawk.reported_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={squawk.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {squawk.severity}
                        </Badge>
                        <Badge variant={squawk.status === 'open' ? 'outline' : 'secondary'}>
                          {squawk.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Maintenance Calendar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Maintenance Calendar
                  </CardTitle>
                  <CardDescription>Upcoming maintenance events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {maintenanceRecords
                      .filter(r => r.status === 'scheduled' || r.status === 'overdue')
                      .slice(0, 5)
                      .map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{record.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {record.aircraft?.tail_number} • {new Date(record.due_date).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge className={cn("text-xs", getStatusColor(record.status))}>
                            {record.status}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Resource Allocation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Resource Allocation
                  </CardTitle>
                  <CardDescription>Mechanic workload and availability</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Available Mechanics</span>
                      <span className="font-medium">3</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Work Orders</span>
                      <span className="font-medium">{maintenanceStats.inProgress}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Estimated Hours</span>
                      <span className="font-medium">
                        {maintenanceRecords.reduce((sum, r) => sum + (r.estimated_hours || 0), 0)}
                      </span>
                    </div>
                    <Progress value={75} className="h-2" />
                    <div className="text-xs text-muted-foreground">75% capacity utilization</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Cost Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Cost Analysis
                  </CardTitle>
                  <CardDescription>Maintenance costs and budget tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Estimated</span>
                      <span className="font-semibold">
                        ${maintenanceRecords.reduce((sum, r) => sum + (r.estimated_cost || 0), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Actual</span>
                      <span className="font-semibold">
                        ${maintenanceRecords.reduce((sum, r) => sum + (r.actual_cost || 0), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Variance</span>
                      <span className="font-semibold text-green-600">
                        ${(maintenanceRecords.reduce((sum, r) => sum + (r.estimated_cost || 0), 0) - 
                           maintenanceRecords.reduce((sum, r) => sum + (r.actual_cost || 0), 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription>Maintenance efficiency and compliance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">On-Time Completion</span>
                      <span className="font-semibold text-green-600">94%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">FAA Compliance</span>
                      <span className="font-semibold text-green-600">100%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Safety Incidents</span>
                      <span className="font-semibold text-green-600">0</span>
                    </div>
                    <Progress value={94} className="h-2" />
                    <div className="text-xs text-muted-foreground">Overall performance score</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 