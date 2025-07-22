"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  Clock, 
  User, 
  Plane, 
  MapPin, 
  Settings, 
  Filter, 
  Search, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Trash2, 
  Archive, 
  Star, 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar, 
  Wind, 
  Thermometer, 
  Gauge, 
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
  PlaneArrival,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  ExternalLink,
  Download,
  Share2,
  Edit,
  Copy,
  Bookmark,
  BookmarkPlus
} from 'lucide-react'

// Types
interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'danger' | 'system' | 'flight' | 'weather' | 'maintenance'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: Date
  read: boolean
  acknowledged: boolean
  user?: string
  category?: string
  metadata?: {
    flightId?: string
    aircraftId?: string
    studentId?: string
    instructorId?: string
    location?: string
    coordinates?: { lat: number; lng: number }
    weather?: {
      temperature: number
      windSpeed: number
      visibility: number
      conditions: string
    }
    maintenance?: {
      type: string
      dueDate: Date
      severity: string
    }
  }
  actions?: Array<{
    label: string
    action: string
    icon: React.ReactNode
    variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  }>
}

interface NotificationCenterProps {
  notifications: Notification[]
  className?: string
  variant?: 'default' | 'glass' | 'aviation' | 'minimal'
  showFilters?: boolean
  showSearch?: boolean
  maxHeight?: number
  onMarkRead?: (id: string) => void
  onAcknowledge?: (id: string) => void
  onDelete?: (id: string) => void
  onAction?: (id: string, action: string) => void
  onRefresh?: () => void
}

interface NotificationItemProps {
  notification: Notification
  onMarkRead: (id: string) => void
  onAcknowledge: (id: string) => void
  onDelete: (id: string) => void
  onAction: (id: string, action: string) => void
  expanded?: boolean
  onToggleExpand?: () => void
}

// Notification Item Component
function NotificationItem({
  notification,
  onMarkRead,
  onAcknowledge,
  onDelete,
  onAction,
  expanded = false,
  onToggleExpand
}: NotificationItemProps) {
  const [isExpanded, setIsExpanded] = useState(expanded)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-aviation-success-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-aviation-warning-500" />
      case 'danger': return <XCircle className="w-4 h-4 text-aviation-danger-500" />
      case 'flight': return <Plane className="w-4 h-4 text-aviation-sunset-500" />
      case 'weather': return <Wind className="w-4 h-4 text-aviation-sky-500" />
      case 'maintenance': return <Gauge className="w-4 h-4 text-aviation-warning-500" />
      case 'system': return <Zap className="w-4 h-4 text-aviation-sunset-500" />
      default: return <Info className="w-4 h-4 text-aviation-sky-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-aviation-danger-500 bg-aviation-danger-500/10'
      case 'high': return 'border-l-aviation-warning-500 bg-aviation-warning-500/10'
      case 'medium': return 'border-l-aviation-sunset-500 bg-aviation-sunset-500/10'
      default: return 'border-l-aviation-sky-500 bg-aviation-sky-500/10'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-aviation-danger-500 bg-aviation-danger-500/20'
      case 'high': return 'text-aviation-warning-500 bg-aviation-warning-500/20'
      case 'medium': return 'text-aviation-sunset-500 bg-aviation-sunset-500/20'
      default: return 'text-aviation-sky-500 bg-aviation-sky-500/20'
    }
  }

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded)
    onToggleExpand?.()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`relative border-l-4 ${getPriorityColor(notification.priority)} rounded-r-lg p-4 hover:bg-white/5 transition-colors ${
        !notification.read ? 'bg-white/10' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getTypeIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-white text-sm">{notification.title}</h4>
                <Badge variant="outline" className={`text-xs capitalize ${getPriorityBadge(notification.priority)}`}>
                  {notification.priority}
                </Badge>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-aviation-sunset-500" />
                )}
              </div>
              
              <p className="text-sm text-white/80 mb-2">{notification.message}</p>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {notification.timestamp.toLocaleTimeString()}
                </span>
                {notification.user && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {notification.user}
                  </span>
                )}
                {notification.category && (
                  <span className="flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {notification.category}
                  </span>
                )}
              </div>

              {/* Metadata Display */}
              {isExpanded && notification.metadata && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {notification.metadata.flightId && (
                      <div className="flex items-center gap-2">
                        <Plane className="w-3 h-3 text-aviation-sunset-400" />
                        <span>Flight: {notification.metadata.flightId}</span>
                      </div>
                    )}
                    {notification.metadata.aircraftId && (
                      <div className="flex items-center gap-2">
                        <PlaneTakeoff className="w-3 h-3 text-aviation-sky-400" />
                        <span>Aircraft: {notification.metadata.aircraftId}</span>
                      </div>
                    )}
                    {notification.metadata.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-aviation-sunset-400" />
                        <span>Location: {notification.metadata.location}</span>
                      </div>
                    )}
                    {notification.metadata.weather && (
                      <div className="flex items-center gap-2">
                        <Wind className="w-3 h-3 text-aviation-sky-400" />
                        <span>Weather: {notification.metadata.weather.conditions}</span>
                      </div>
                    )}
                    {notification.metadata.maintenance && (
                      <div className="flex items-center gap-2">
                        <Gauge className="w-3 h-3 text-aviation-warning-400" />
                        <span>Maintenance: {notification.metadata.maintenance.type}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              {notification.actions && notification.actions.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  {notification.actions.map((action, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onAction(notification.id, action.action)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {action.icon}
                      {action.label}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleExpand}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onMarkRead(notification.id)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                title={notification.read ? 'Mark as unread' : 'Mark as read'}
              >
                {notification.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(notification.id)}
                className="p-1 rounded hover:bg-white/10 transition-colors text-aviation-danger-400 hover:text-aviation-danger-300"
                title="Delete notification"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Main Notification Center Component
export function AviationNotificationCenter({
  notifications,
  className,
  variant = 'aviation',
  showFilters = true,
  showSearch = true,
  maxHeight = 600,
  onMarkRead,
  onAcknowledge,
  onDelete,
  onAction,
  onRefresh
}: NotificationCenterProps) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showRead, setShowRead] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      await onRefresh()
      setIsRefreshing(false)
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || notification.type === filter || notification.priority === filter
    const matchesSearch = search === '' || 
      notification.title.toLowerCase().includes(search.toLowerCase()) ||
      notification.message.toLowerCase().includes(search.toLowerCase())
    const matchesRead = showRead || !notification.read
    return matchesFilter && matchesSearch && matchesRead
  })

  const unreadCount = notifications.filter(n => !n.read).length
  const criticalCount = notifications.filter(n => n.priority === 'critical').length

  return (
    <Card variant={variant} className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-aviation-sunset-500/20 to-aviation-sky-600/20">
              <Bell className="w-5 h-5 text-aviation-sunset-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-aviation">Notifications</CardTitle>
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread • {criticalCount} critical
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        {(showFilters || showSearch) && (
          <div className="flex items-center gap-4 mt-4">
            {showSearch && (
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aviation-sunset-500/50 focus:border-aviation-sunset-500"
                />
              </div>
            )}
            
            {showFilters && (
              <div className="flex items-center gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aviation-sunset-500/50 focus:border-aviation-sunset-500"
                >
                  <option value="all">All</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="flight">Flight</option>
                  <option value="weather">Weather</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="system">System</option>
                </select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRead(!showRead)}
                  className="text-xs"
                >
                  {showRead ? 'Hide Read' : 'Show Read'}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div 
          className="space-y-2 overflow-y-auto"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          <AnimatePresence>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={onMarkRead || (() => {})}
                  onAcknowledge={onAcknowledge || (() => {})}
                  onDelete={onDelete || (() => {})}
                  onAction={onAction || (() => {})}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
              >
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications found</p>
                <p className="text-xs">All caught up!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact Notification Widget
export function CompactNotificationWidget({ 
  notifications, 
  className,
  onMarkRead,
  onDelete 
}: { 
  notifications: Notification[]
  className?: string
  onMarkRead?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const unreadCount = notifications.filter(n => !n.read).length
  const criticalCount = notifications.filter(n => n.priority === 'critical').length

  return (
    <Card variant="glass" className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-aviation-sunset-400" />
            <span className="font-medium">Notifications</span>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {unreadCount} unread
              </Badge>
            )}
            {criticalCount > 0 && (
              <Badge variant="outline" className="text-xs text-aviation-danger-500 border-current">
                {criticalCount} critical
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          {notifications.slice(0, 3).map((notification) => (
            <div
              key={notification.id}
              className={`p-2 rounded text-xs ${
                !notification.read ? 'bg-white/10' : 'bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{notification.title}</span>
                <span className="text-muted-foreground">
                  {notification.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Notification Badge
export function NotificationBadge({ 
  count, 
  critical = 0,
  className 
}: { 
  count: number
  critical?: number
  className?: string 
}) {
  if (count === 0) return null

  return (
    <div className={`relative ${className}`}>
      <Bell className="w-5 h-5" />
      <Badge 
        variant="outline" 
        className={`absolute -top-2 -right-2 w-5 h-5 p-0 text-xs ${
          critical > 0 ? 'text-aviation-danger-500 border-aviation-danger-500' : 'text-aviation-sunset-500 border-aviation-sunset-500'
        }`}
      >
        {count}
      </Badge>
    </div>
  )
} 