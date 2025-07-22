"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plane, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  Clock,
  MapPin,
  Target,
  Award,
  BookOpen,
  FileText,
  MessageSquare,
  Bell,
  Search,
  Filter,
  RefreshCw,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Download,
  Share2,
  Edit,
  Trash2,
  Plus,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Star,
  TrendingUp,
  TrendingDown,
  Wind,
  Thermometer,
  Gauge,
  Compass,
  Fuel,
  Navigation,
  Radio,
  Wifi,
  Signal,
  Zap,
  Shield,
  Lock,
  Unlock,
  Key,
  UserCheck,
  UserX,
  PlaneTakeoff,
  PlaneLanding,
  PlaneDeparture,
  PlaneArrival
} from 'lucide-react'

// Types
interface CommandCenterProps {
  className?: string
  variant?: 'default' | 'glass' | 'aviation' | 'cockpit' | 'minimal'
  showHeader?: boolean
  showSidebar?: boolean
  showFooter?: boolean
  collapsible?: boolean
  refreshable?: boolean
  onRefresh?: () => void
  onSettings?: () => void
}

interface PanelProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'aviation' | 'sunset' | 'sky' | 'night'
  collapsible?: boolean
  defaultCollapsed?: boolean
  actions?: React.ReactNode
}

// Panel Component
function Panel({ 
  title, 
  subtitle, 
  icon, 
  children, 
  className, 
  variant = 'aviation',
  collapsible = false,
  defaultCollapsed = false,
  actions 
}: PanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  return (
    <Card variant={variant} className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 rounded-lg bg-gradient-to-br from-aviation-sunset-500/20 to-aviation-sky-600/20">
                {icon}
              </div>
            )}
            <div>
              <CardTitle className="text-lg font-aviation">{title}</CardTitle>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            {collapsible && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </motion.button>
            )}
          </div>
        </div>
      </CardHeader>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <CardContent>{children}</CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

// Quick Stats Component
function QuickStats({ stats }: { stats: Array<{ label: string; value: string | number; unit?: string; trend?: 'up' | 'down' | 'neutral'; icon: React.ReactNode }> }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="p-4 rounded-lg bg-gradient-to-br from-white/5 to-white/3 backdrop-blur-sm border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-aviation-sunset-500/20 to-aviation-sky-600/20">
              {stat.icon}
            </div>
            {stat.trend && (
              <div className={`flex items-center gap-1 text-xs ${
                stat.trend === 'up' ? 'text-aviation-success-500' : 
                stat.trend === 'down' ? 'text-aviation-danger-500' : 
                'text-muted-foreground'
              }`}>
                {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
                 stat.trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
              </div>
            )}
          </div>
          <div className="text-2xl font-mono font-bold text-white mb-1">
            {stat.value}{stat.unit}
          </div>
          <div className="text-xs text-muted-foreground">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  )
}

// Activity Feed Component
function ActivityFeed({ activities }: { activities: Array<{ id: string; type: 'info' | 'success' | 'warning' | 'danger'; message: string; timestamp: Date; user?: string }> }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-aviation-success-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-aviation-warning-500" />
      case 'danger': return <XCircle className="w-4 h-4 text-aviation-danger-500" />
      default: return <Activity className="w-4 h-4 text-aviation-sunset-500" />
    }
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <div className="mt-0.5">
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/90">{activity.message}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {activity.timestamp.toLocaleTimeString()}
              </span>
              {activity.user && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-aviation-sunset-400">{activity.user}</span>
                </>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Alert Panel Component
function AlertPanel({ alerts }: { alerts: Array<{ id: string; priority: 'low' | 'medium' | 'high' | 'critical'; title: string; message: string; timestamp: Date }> }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-aviation-danger-500 bg-aviation-danger-500/20'
      case 'high': return 'text-aviation-warning-500 bg-aviation-warning-500/20'
      case 'medium': return 'text-aviation-sunset-500 bg-aviation-sunset-500/20'
      default: return 'text-aviation-sky-500 bg-aviation-sky-500/20'
    }
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className={`p-4 rounded-lg border-l-4 ${getPriorityColor(alert.priority)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-white mb-1">{alert.title}</h4>
              <p className="text-sm text-white/80 mb-2">{alert.message}</p>
              <span className="text-xs text-white/60">
                {alert.timestamp.toLocaleString()}
              </span>
            </div>
            <Badge variant="outline" className="text-xs capitalize">
              {alert.priority}
            </Badge>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Main Command Center Component
export function AviationCommandCenter({
  className,
  variant = 'aviation',
  showHeader = true,
  showSidebar = true,
  showFooter = true,
  collapsible = true,
  refreshable = true,
  onRefresh,
  onSettings
}: CommandCenterProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      await onRefresh()
      setIsRefreshing(false)
    }
  }

  // Mock data - in real app, this would come from API
  const quickStats = [
    { label: 'Active Flights', value: 12, unit: '', trend: 'up' as const, icon: <Plane className="w-4 h-4" /> },
    { label: 'Students', value: 45, unit: '', trend: 'up' as const, icon: <Users className="w-4 h-4" /> },
    { label: 'Instructors', value: 8, unit: '', trend: 'neutral' as const, icon: <UserCheck className="w-4 h-4" /> },
    { label: 'Aircraft', value: 15, unit: '', trend: 'up' as const, icon: <PlaneTakeoff className="w-4 h-4" /> }
  ]

  const activities = [
    { id: '1', type: 'success' as const, message: 'Flight session completed successfully', timestamp: new Date(), user: 'John Smith' },
    { id: '2', type: 'info' as const, message: 'New student enrollment received', timestamp: new Date(Date.now() - 300000), user: 'System' },
    { id: '3', type: 'warning' as const, message: 'Aircraft maintenance due in 2 days', timestamp: new Date(Date.now() - 600000), user: 'Maintenance' },
    { id: '4', type: 'success' as const, message: 'Instructor certification renewed', timestamp: new Date(Date.now() - 900000), user: 'Admin' }
  ]

  const alerts = [
    { id: '1', priority: 'medium' as const, title: 'Weather Advisory', message: 'Light turbulence expected in training area', timestamp: new Date() },
    { id: '2', priority: 'low' as const, title: 'System Update', message: 'Database maintenance scheduled for tonight', timestamp: new Date(Date.now() - 1800000) }
  ]

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 ${className}`}>
      {/* Header */}
      {showHeader && (
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-b border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-aviation-sunset-500/20 to-aviation-sky-600/20">
                <Plane className="w-6 h-6 text-aviation-sunset-400" />
              </div>
              <div>
                <h1 className="text-xl font-aviation font-bold title-gold-glow title-gold-glow-hover">Desert Skies Command Center</h1>
                <p className="text-sm text-muted-foreground">Flight School Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-aviation-success-500 border-current">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-aviation-success-500 animate-pulse" />
                  <span>Online</span>
                </div>
              </Badge>
              {refreshable && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </motion.button>
              )}
              {onSettings && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onSettings}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.header>
      )}

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <motion.aside
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-64 border-r border-white/10 bg-white/5 backdrop-blur-sm"
          >
            <nav className="p-4">
              <div className="space-y-2">
                {[
                  { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
                  { id: 'flights', label: 'Flights', icon: <Plane className="w-4 h-4" /> },
                  { id: 'students', label: 'Students', icon: <Users className="w-4 h-4" /> },
                  { id: 'schedule', label: 'Schedule', icon: <Calendar className="w-4 h-4" /> },
                  { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
                  { id: 'alerts', label: 'Alerts', icon: <Bell className="w-4 h-4" /> }
                ].map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-aviation-sunset-500/20 to-aviation-sky-600/20 text-aviation-sunset-400 border border-aviation-sunset-500/30'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </nav>
          </motion.aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsContent value="overview" className="space-y-6">
              {/* Quick Stats */}
              <Panel
                title="Quick Overview"
                subtitle="Real-time flight school metrics"
                icon={<BarChart3 className="w-5 h-5" />}
                variant="aviation"
                collapsible={collapsible}
              >
                <QuickStats stats={quickStats} />
              </Panel>

              {/* Activity Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Panel
                  title="Recent Activity"
                  subtitle="Latest system events and updates"
                  icon={<Activity className="w-5 h-5" />}
                  variant="aviation"
                  collapsible={collapsible}
                >
                  <ActivityFeed activities={activities} />
                </Panel>

                <Panel
                  title="Active Alerts"
                  subtitle="Important notifications and warnings"
                  icon={<AlertTriangle className="w-5 h-5" />}
                  variant="aviation"
                  collapsible={collapsible}
                >
                  <AlertPanel alerts={alerts} />
                </Panel>
              </div>
            </TabsContent>

            <TabsContent value="flights" className="space-y-6">
              <Panel
                title="Active Flights"
                subtitle="Current flight operations"
                icon={<Plane className="w-5 h-5" />}
                variant="aviation"
                collapsible={collapsible}
              >
                <div className="text-center py-8 text-muted-foreground">
                  Flight tracking interface would go here
                </div>
              </Panel>
            </TabsContent>

            <TabsContent value="students" className="space-y-6">
              <Panel
                title="Student Management"
                subtitle="Student enrollment and progress tracking"
                icon={<Users className="w-5 h-5" />}
                variant="aviation"
                collapsible={collapsible}
              >
                <div className="text-center py-8 text-muted-foreground">
                  Student management interface would go here
                </div>
              </Panel>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <Panel
                title="Flight Schedule"
                subtitle="Scheduled flights and training sessions"
                icon={<Calendar className="w-5 h-5" />}
                variant="aviation"
                collapsible={collapsible}
              >
                <div className="text-center py-8 text-muted-foreground">
                  Schedule management interface would go here
                </div>
              </Panel>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Panel
                title="Reports & Analytics"
                subtitle="Performance metrics and insights"
                icon={<FileText className="w-5 h-5" />}
                variant="aviation"
                collapsible={collapsible}
              >
                <div className="text-center py-8 text-muted-foreground">
                  Reports and analytics interface would go here
                </div>
              </Panel>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-6">
              <Panel
                title="System Alerts"
                subtitle="All active alerts and notifications"
                icon={<Bell className="w-5 h-5" />}
                variant="aviation"
                collapsible={collapsible}
              >
                <AlertPanel alerts={alerts} />
              </Panel>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Footer */}
      {showFooter && (
        <motion.footer
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-t border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Desert Skies Portal v2.0</span>
              <span>•</span>
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Secure</span>
                </div>
              </Badge>
            </div>
          </div>
        </motion.footer>
      )}
    </div>
  )
}

// Compact Command Center
export function CompactCommandCenter({ className }: { className?: string }) {
  return (
    <Card variant="aviation" className={className}>
      <CardHeader>
                  <CardTitle className="flex items-center gap-2 title-gold-glow title-gold-glow-hover">
            <Plane className="w-5 h-5" />
            Command Center
          </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-white/5">
            <div className="text-2xl font-mono font-bold text-aviation-sunset-400">12</div>
            <div className="text-xs text-muted-foreground">Active Flights</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-white/5">
            <div className="text-2xl font-mono font-bold text-aviation-sky-400">45</div>
            <div className="text-xs text-muted-foreground">Students</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 