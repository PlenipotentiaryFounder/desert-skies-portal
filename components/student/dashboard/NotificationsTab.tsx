"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Bell, 
  Filter, 
  CheckCheck, 
  Eye, 
  Trash2, 
  Calendar,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Plane,
  User,
  Settings,
  BookOpen,
  HelpCircle
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Notification {
  id: string
  type: 'flight' | 'document' | 'weather' | 'system' | 'training' | 'maintenance'
  priority: 'low' | 'medium' | 'high'
  title: string
  message: string
  timestamp: Date
  read: boolean
  category: string
  metadata?: any
}

interface NotificationsTabProps {
  notifications: Notification[]
  onMarkRead?: (id: string) => void
  onMarkAllRead?: () => void
  onDelete?: (id: string) => void
  onAction?: (id: string, action: string) => void
}

export function NotificationsTab({ 
  notifications = [], 
  onMarkRead, 
  onMarkAllRead, 
  onDelete, 
  onAction 
}: NotificationsTabProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showEmptyState, setShowEmptyState] = useState(false)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="w-4 h-4" />
      case 'document': return <FileText className="w-4 h-4" />
      case 'weather': return <AlertTriangle className="w-4 h-4" />
      case 'system': return <Settings className="w-4 h-4" />
      case 'training': return <BookOpen className="w-4 h-4" />
      case 'maintenance': return <Settings className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'read' && !notification.read) return false
    if (filter === 'unread' && notification.read) return false
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const EmptyStateModal = () => (
    <Dialog open={showEmptyState} onOpenChange={setShowEmptyState}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            About Notifications
          </DialogTitle>
          <DialogDescription className="space-y-4">
            <p>
              Your notifications will appear here to keep you informed about important updates and activities in your flight training.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Plane className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium">Flight Updates</p>
                  <p className="text-sm text-muted-foreground">Session confirmations, cancellations, and reminders</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Document Status</p>
                  <p className="text-sm text-muted-foreground">Document approvals, expirations, and upload reminders</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium">Training Progress</p>
                  <p className="text-sm text-muted-foreground">Lesson completions, endorsements, and milestone updates</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium">Weather & Safety</p>
                  <p className="text-sm text-muted-foreground">Weather advisories and safety alerts</p>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )

  if (notifications.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowEmptyState(true)}>
                <HelpCircle className="w-4 h-4 mr-2" />
                Learn More
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Notifications Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You'll receive notifications here about flight sessions, document updates, training progress, and important announcements.
              </p>
              <Button variant="outline" onClick={() => setShowEmptyState(true)}>
                <HelpCircle className="w-4 h-4 mr-2" />
                Learn About Notifications
              </Button>
            </div>
          </CardContent>
        </Card>
        <EmptyStateModal />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}>
                <Filter className="w-4 h-4 mr-2" />
                {filter === 'all' ? 'Show Unread' : 'Show All'}
              </Button>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={onMarkAllRead}>
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={typeFilter} onValueChange={setTypeFilter} className="space-y-4">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="flight">Flights</TabsTrigger>
              <TabsTrigger value="training">Training</TabsTrigger>
              <TabsTrigger value="document">Docs</TabsTrigger>
              <TabsTrigger value="weather">Weather</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="maintenance">Maint</TabsTrigger>
            </TabsList>
            
            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No {filter} notifications</h3>
                  <p className="text-muted-foreground">
                    {filter === 'unread' ? "You're all caught up!" : "No notifications in this category."}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-start gap-4 p-4 border rounded-lg ${
                      !notification.read ? 'bg-muted/50 border-primary/20' : ''
                    } hover:bg-muted/30 transition-colors`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(notification.priority)}`} />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 mb-1">
                          {getNotificationIcon(notification.type)}
                          <h4 className="font-medium">{notification.title}</h4>
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs">New</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onMarkRead?.(notification.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onDelete?.(notification.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {notification.timestamp.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {notification.category}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
      <EmptyStateModal />
    </div>
  )
}
