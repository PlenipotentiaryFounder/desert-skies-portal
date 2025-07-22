"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Badge } from './badge'
import { Progress } from './progress'
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
  Star
} from 'lucide-react'

interface DashboardWidgetProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  variant?: 'default' | 'metric' | 'status' | 'alert' | 'success' | 'weather' | 'progress' | 'activity'
  children: React.ReactNode
  className?: string
  collapsible?: boolean
  refreshable?: boolean
  onRefresh?: () => void
  actions?: React.ReactNode
}

export function DashboardWidget({
  title,
  subtitle,
  icon,
  variant = 'default',
  children,
  className,
  collapsible = false,
  refreshable = false,
  onRefresh,
  actions
}: DashboardWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      await onRefresh()
      setIsRefreshing(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card variant={variant} className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            {icon && <span className="text-aviation-sunset-400">{icon}</span>}
            <div>
              <CardTitle className="text-sm font-medium title-gold-glow">
                {title}
              </CardTitle>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {refreshable && (
              <Button
                variant="ghost"
                size="iconSm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
            
            {collapsible && (
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-muted-foreground hover:text-foreground"
              >
                {isCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
            )}
            
            {actions}
          </div>
        </CardHeader>
        
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent>
                {children}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

interface QuickStatsWidgetProps {
  stats: Array<{
    label: string
    value: string | number
    unit?: string
    icon?: React.ReactNode
    trend?: 'up' | 'down' | 'stable'
    trendValue?: string
    color?: string
  }>
}

export function QuickStatsWidget({ stats }: QuickStatsWidgetProps) {
  return (
    <DashboardWidget
      title="Quick Stats"
      subtitle="Key performance indicators"
      icon={<BarChart3 className="w-5 h-5" />}
      variant="metric"
      refreshable
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-2">
              {stat.icon && (
                <span className={`text-2xl ${stat.color || 'text-aviation-sunset-400'}`}>
                  {stat.icon}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-foreground">
              {stat.value}
              {stat.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{stat.unit}</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            {stat.trend && (
              <div className="flex items-center justify-center gap-1 mt-1">
                {stat.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-aviation-success-400" />
                ) : stat.trend === 'down' ? (
                  <TrendingDown className="w-3 h-3 text-aviation-danger-400" />
                ) : null}
                {stat.trendValue && (
                  <span className="text-xs text-muted-foreground">{stat.trendValue}</span>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </DashboardWidget>
  )
}

interface ActivityFeedWidgetProps {
  activities: Array<{
    id: string
    type: 'session' | 'document' | 'assessment' | 'endorsement' | 'maintenance' | 'weather'
    title: string
    description: string
    timestamp: string
    status: 'completed' | 'pending' | 'cancelled' | 'warning'
    user?: string
  }>
}

export function ActivityFeedWidget({ activities }: ActivityFeedWidgetProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'session': return <Plane className="w-4 h-4" />
      case 'document': return <FileText className="w-4 h-4" />
      case 'assessment': return <Target className="w-4 h-4" />
      case 'endorsement': return <Award className="w-4 h-4" />
      case 'maintenance': return <Settings className="w-4 h-4" />
      case 'weather': return <Thermometer className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-aviation-success-500'
      case 'pending': return 'bg-aviation-warning-500'
      case 'cancelled': return 'bg-aviation-danger-500'
      case 'warning': return 'bg-aviation-warning-500'
      default: return 'bg-aviation-sunset-500'
    }
  }

  return (
    <DashboardWidget
      title="Recent Activity"
      subtitle="Latest updates from your flight school"
      icon={<Activity className="w-5 h-5" />}
      variant="dashboard"
      collapsible
    >
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className={`p-2 rounded-lg ${getStatusColor(activity.status)} text-white`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {activity.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {activity.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xs text-muted-foreground">
                  {activity.timestamp}
                </p>
                {activity.user && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-xs text-aviation-sunset-300">
                      {activity.user}
                    </p>
                  </>
                )}
              </div>
            </div>
            <Badge 
              variant={activity.status === 'completed' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {activity.status}
            </Badge>
          </motion.div>
        ))}
      </div>
    </DashboardWidget>
  )
}

interface AlertsWidgetProps {
  alerts: Array<{
    id: string
    type: 'warning' | 'danger' | 'info' | 'success'
    title: string
    message: string
    timestamp: string
    priority: 'low' | 'medium' | 'high'
    action?: string
  }>
}

export function AlertsWidget({ alerts }: AlertsWidgetProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'danger': return <AlertTriangle className="w-4 h-4" />
      case 'info': return <Bell className="w-4 h-4" />
      case 'success': return <CheckCircle className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-aviation-warning-400'
      case 'danger': return 'text-aviation-danger-400'
      case 'info': return 'text-aviation-sky-400'
      case 'success': return 'text-aviation-success-400'
      default: return 'text-aviation-sunset-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-aviation-danger-500'
      case 'medium': return 'bg-aviation-warning-500'
      case 'low': return 'bg-aviation-sky-500'
      default: return 'bg-aviation-sunset-500'
    }
  }

  return (
    <DashboardWidget
      title="Active Alerts"
      subtitle="Important notifications and warnings"
      icon={<Bell className="w-5 h-5" />}
      variant="alert"
      collapsible
    >
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3 p-3 rounded-lg border border-aviation-danger-500/20 bg-aviation-danger-500/5"
          >
            <div className={`p-2 rounded-lg ${getAlertColor(alert.type)}`}>
              {getAlertIcon(alert.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-foreground">
                  {alert.title}
                </p>
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(alert.priority)}`} />
              </div>
              <p className="text-xs text-muted-foreground">
                {alert.message}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {alert.timestamp}
              </p>
            </div>
            {alert.action && (
              <Button variant="outline" size="sm" className="text-xs">
                {alert.action}
              </Button>
            )}
          </motion.div>
        ))}
      </div>
    </DashboardWidget>
  )
} 