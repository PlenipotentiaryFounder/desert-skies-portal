"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from './card'
import { Button } from './button'
import { Badge } from './badge'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  Plane, 
  Award, 
  Clock, 
  Star,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Bell,
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Home,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface AviationProfileCardProps {
  user: any
  userProfile: any
  className?: string
  variant?: 'default' | 'glass' | 'aviation' | 'minimal'
  showDetails?: boolean
  collapsible?: boolean
}

export function AviationProfileCard({
  user,
  userProfile,
  className,
  variant = 'aviation',
  showDetails = true,
  collapsible = true
}: AviationProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentRole, setCurrentRole] = useState<string>('')
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const supabase = createClient()

  // Get user roles
  const userRoles = userProfile?.roles?.map((r: any) => r.role_name) || []
  const hasMultipleRoles = userRoles.length > 1

  // Set initial role based on current path or first role
  React.useEffect(() => {
    const path = pathname
    let detectedRole = ''
    
    // Role detection logic
    
    if (path.includes('/admin/')) {
      detectedRole = 'admin'
    } else if (path.includes('/instructor/')) {
      detectedRole = 'instructor'
    } else if (path.includes('/student/')) {
      detectedRole = 'student'
    } else {
      // If not on a specific role path, use the first available role
      detectedRole = userRoles[0] || ''
    }
    
    // Set current role
    setCurrentRole(detectedRole)
  }, [userRoles, pathname]) // Add router.asPath to dependencies

  // Profile card state

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.push('/login')
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      })
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSettings = () => {
    router.push(`/${currentRole}/settings`)
  }

  const handleProfile = () => {
    router.push(`/${currentRole}/profile`)
  }

  const handleDashboardSwitch = (role: string) => {
    setCurrentRole(role)
    router.push(`/${role}/dashboard`)
    toast({
      title: "Dashboard switched",
      description: `Switched to ${role} dashboard`,
    })
  }

  const getRoleDisplay = () => {
    switch (currentRole) {
      case 'instructor': return 'Flight Instructor'
      case 'admin': return 'System Administrator'
      case 'student': return 'Student Pilot'
      default: return 'User'
    }
  }

  const getRoleColor = () => {
    switch (currentRole) {
      case 'instructor': return 'bg-aviation-sunset-500 text-white'
      case 'admin': return 'bg-aviation-danger-500 text-white'
      case 'student': return 'bg-aviation-sky-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getRoleIcon = () => {
    switch (currentRole) {
      case 'instructor': return <Plane className="w-3 h-3" />
      case 'admin': return <Shield className="w-3 h-3" />
      case 'student': return <Award className="w-3 h-3" />
      default: return <User className="w-3 h-3" />
    }
  }

  const fullName = `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || user?.email || 'User'
  const initials = (userProfile?.first_name?.[0] || '') + (userProfile?.last_name?.[0] || '') || user?.email?.slice(0, 2) || 'U'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("w-full", className)}
    >
      <Card variant={variant} className="overflow-hidden">
        <CardContent className="p-0">
          {/* Profile Details - Expand Upwards */}
          <AnimatePresence>
            {showDetails && (isExpanded || !collapsible) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden max-h-96 overflow-y-auto"
              >
                <div className="p-4 space-y-3 bg-gradient-to-r from-aviation-sky-50 to-aviation-sky-100">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{user?.email}</span>
                    </div>
                    {userProfile?.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{userProfile.phone}</span>
                      </div>
                    )}
                    {userProfile?.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{userProfile.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Dashboard Toggle - Only show if user has multiple roles */}
                  {hasMultipleRoles && (
                    <div className="space-y-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-muted-foreground">
                          Switch Dashboard
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {userRoles.length} roles
                        </div>
                      </div>
                      <div className="space-y-2">
                        {userRoles.map((role: string) => (
                          <Button
                            key={role}
                            variant={currentRole === role ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "w-full justify-start transition-all duration-200",
                              currentRole === role 
                                ? "bg-aviation-sky-600 text-white shadow-md" 
                                : "hover:bg-aviation-sky-50 hover:border-aviation-sky-200"
                            )}
                            onClick={() => handleDashboardSwitch(role)}
                          >
                            <div className="flex items-center gap-2">
                              {role === 'instructor' && <Plane className="w-4 h-4" />}
                              {role === 'admin' && <Shield className="w-4 h-4" />}
                              {role === 'student' && <Award className="w-4 h-4" />}
                              <span className="font-medium">
                                {role === 'instructor' ? 'Instructor' : 
                                 role === 'admin' ? 'Admin' : 
                                 role === 'student' ? 'Student' : 
                                 role.charAt(0).toUpperCase() + role.slice(1)}
                              </span>
                              {currentRole === role && (
                                <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  {userProfile?.roles?.[0]?.role_name === 'instructor' && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                      <div className="text-center">
                        <div className="text-lg font-bold text-aviation-sky-600">
                          {userProfile?.total_flights || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Flights</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-aviation-sunset-600">
                          {userProfile?.total_hours || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Flight Hours</div>
                      </div>
                    </div>
                  )}

                  {/* Student Stats */}
                  {userProfile?.roles?.[0]?.role_name === 'student' && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                      <div className="text-center">
                        <div className="text-lg font-bold text-aviation-sky-600">
                          {userProfile?.total_flights || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Flight Hours</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-aviation-sunset-600">
                          {userProfile?.completed_lessons || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Lessons Completed</div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleProfile}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleSettings}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </div>

                  {/* Logout Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={handleSignOut}
                    disabled={isLoading}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {isLoading ? 'Signing out...' : 'Sign Out'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Header */}
          <div className="relative p-4 bg-gradient-to-r from-aviation-sky-600 to-aviation-sky-700">
            <div className="relative z-10 flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-white/20">
                <AvatarImage src={userProfile?.avatar_url || ''} />
                <AvatarFallback className="bg-aviation-sky-500 text-white font-semibold">
                  {initials.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">
                  {fullName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn("text-xs px-2 py-0.5", getRoleColor())}>
                    <span className="flex items-center gap-1">
                      {getRoleIcon()}
                      {getRoleDisplay()}
                    </span>
                  </Badge>
                  {hasMultipleRoles && (
                    <div className="text-xs bg-aviation-sky-600 text-white px-2 py-0.5 rounded-full">
                      {userRoles.length} roles
                    </div>
                  )}
                </div>
              </div>
              {collapsible && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 