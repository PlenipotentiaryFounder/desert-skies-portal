"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Plane,
  BarChart3,
  BookOpen,
  ClipboardList,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  User,
  Shield,
  Wrench,
  AlertTriangle,
  DollarSign,
  GraduationCap,
  UserCheck,
  Target,
  Award,
  Activity,
  ClipboardCheck
} from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { AviationProfileCard } from '@/components/ui/aviation-profile-card'

// Icon mapping for string-based navItems
const iconMap = {
  home: Home,
  users: Users,
  userCheck: UserCheck,
  bookOpen: BookOpen,
  graduationCap: GraduationCap,
  plane: Plane,
  calendar: Calendar,
  fileText: FileText,
  clipboardCheck: ClipboardCheck,
  user: User,
  settings: Settings,
  barChart3: BarChart3,
  dollarSign: DollarSign,
  shield: Shield,
  wrench: Wrench,
  alertTriangle: AlertTriangle,
  target: Target,
  award: Award,
  activity: Activity,
  clipboardList: ClipboardList,
  messageSquare: MessageSquare,
  helpCircle: HelpCircle,
  bell: Bell,
  search: Search,
}

interface DashboardShellProps {
  children: React.ReactNode
  title?: string
  description?: string
  showNav?: boolean
  className?: string
  profile?: any
  userRole?: 'instructor' | 'admin' | 'student'
  navItems?: any[]
}

// Instructor Navigation Items
const instructorNavItems = [
  { name: "Dashboard", href: "/instructor/dashboard", icon: Home, badge: null },
  { name: "Students", href: "/instructor/students", icon: Users, badge: null },
  { name: "Schedule", href: "/instructor/schedule", icon: Calendar, badge: "3" },
  { name: "Syllabi", href: "/instructor/syllabi", icon: BookOpen, badge: null },
  { name: "Documents", href: "/instructor/documents", icon: FileText, badge: "2" },
  { name: "Maintenance", href: "/instructor/maintenance", icon: Wrench, badge: null },
  { name: "Reports", href: "/instructor/reports", icon: BarChart3, badge: null },
  { name: "Endorsements", href: "/instructor/endorsements", icon: ClipboardList, badge: null },
  { name: "Notifications", href: "/instructor/notifications", icon: Bell, badge: "5" },
  { name: "Settings", href: "/instructor/settings", icon: Settings, badge: null },
]

// Admin Navigation Items
const adminNavItems = [
  { name: "Operations Center", href: "/admin/dashboard", icon: Home, badge: null },
  { name: "Fleet Management", href: "/admin/fleet", icon: Plane, badge: null },
  { name: "Maintenance", href: "/admin/maintenance", icon: Wrench, badge: "2" },
  { name: "Squawk Management", href: "/admin/squawks", icon: AlertTriangle, badge: "1" },
  { name: "Users", href: "/admin/users", icon: Users, badge: null },
  { name: "Instructor Approvals", href: "/admin/instructors", icon: UserCheck, badge: null },
  { name: "Students", href: "/admin/students", icon: GraduationCap, badge: null },
  { name: "Syllabi", href: "/admin/syllabi", icon: BookOpen, badge: null },
  { name: "Enrollments", href: "/admin/enrollments", icon: GraduationCap, badge: null },
  { name: "Schedule", href: "/admin/schedule", icon: Calendar, badge: null },
  { name: "Documents", href: "/admin/documents", icon: FileText, badge: null },
  { name: "Requirements", href: "/admin/requirements", icon: ClipboardList, badge: null },
  { name: "Reports", href: "/admin/reports", icon: BarChart3, badge: null },
  { name: "Financial", href: "/admin/financial", icon: DollarSign, badge: null },
  { name: "Compliance", href: "/admin/compliance", icon: Shield, badge: null },
  { name: "Settings", href: "/admin/settings", icon: Settings, badge: null },
]

// Student Navigation Items
const studentNavItems = [
  { name: "Dashboard", href: "/student/dashboard", icon: Home, badge: null },
  { name: "Progress", href: "/student/progress", icon: Target, badge: null },
  { name: "Schedule", href: "/student/schedule", icon: Calendar, badge: null },
  { name: "Documents", href: "/student/documents", icon: FileText, badge: null },
  { name: "Maintenance", href: "/student/maintenance", icon: Wrench, badge: null },
  { name: "Instructors", href: "/student/instructors", icon: Users, badge: null },
  { name: "Notifications", href: "/student/notifications", icon: Bell, badge: null },
  { name: "Settings", href: "/student/settings", icon: Settings, badge: null },
]

export function DashboardShell({ 
  children, 
  title, 
  description, 
  showNav = true,
  className,
  profile,
  userRole,
  navItems
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  
  // Close sidebar when clicking outside on mobile or pressing Escape
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarOpen && window.innerWidth < 1024) {
        const sidebar = document.querySelector('[data-sidebar="mobile"]')
        const target = event.target as Element
        if (sidebar && !sidebar.contains(target)) {
          setSidebarOpen(false)
        }
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [sidebarOpen])
  const [user, setUser] = React.useState<any>(null)
  const [userProfile, setUserProfile] = React.useState<any>(profile)
  const router = useRouter()
  const { toast } = useToast()

  // Determine navigation items based on role
  const getNavigationItems = () => {
    if (navItems) return navItems
    switch (userRole) {
      case 'admin': return adminNavItems
      case 'instructor': return instructorNavItems
      case 'student': return studentNavItems
      default: return instructorNavItems
    }
  }

  const navigationItems = getNavigationItems()

  React.useEffect(() => {
    // If profile is passed as prop, use it
    if (profile) {
      setUserProfile(profile)
      return
    }

    // Otherwise fetch user data
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        // Fetch user profile with roles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileData) {
          // Fetch user roles
          const { data: rolesData } = await supabase.rpc("get_user_roles_for_middleware", { p_user_id: user.id })
          const roles = rolesData?.map((r: any) => ({ role_name: r.role_name })) || []
          const userProfileWithRoles = { ...profileData, roles }
          console.log('Dashboard Shell Debug:', {
            profileData,
            rolesData,
            roles,
            userProfileWithRoles
          })
          setUserProfile(userProfileWithRoles)
        }
      }
    }
    fetchUser()
  }, [profile])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    toast({
      title: "Signed out successfully",
      description: "You have been signed out of your account.",
    })
  }

  const [currentPath, setCurrentPath] = React.useState('')

  React.useEffect(() => {
    setCurrentPath(window.location.pathname)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-aviation-sky-50 via-white to-aviation-sky-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern-dense opacity-5" />
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - Always Visible */}
      {showNav && (
        <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-80 bg-gradient-to-b from-aviation-sky-900 via-aviation-sky-800 to-aviation-sky-900 border-r border-aviation-sky-700/50 backdrop-blur-xl flex-col h-screen">
          {/* Sidebar Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-aviation-sky-700/50">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-aviation-sky-500 to-aviation-sky-600 rounded-xl flex items-center justify-center shadow-aviation">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white font-display">Desert Skies</h1>
                <p className="text-xs text-aviation-sky-300">
                  {userRole === 'admin' ? 'Admin Portal' : 
                   userRole === 'instructor' ? 'Instructor Portal' : 
                   userRole === 'student' ? 'Student Portal' : 'Flight Training Portal'}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Navigation and Profile Container */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Scrollable Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto min-h-0">
              {navigationItems.map((item, index) => {
                const isActive = currentPath === item.href
                // Handle both string-based and component-based icons
                const Icon = typeof item.icon === 'string' ? iconMap[item.icon as keyof typeof iconMap] : item.icon
                const itemName = item.name || item.title
                
                return (
                  <motion.div
                    key={itemName || item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <motion.a
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden cursor-pointer",
                        isActive
                          ? "bg-gradient-to-r from-aviation-sky-600 to-aviation-sky-700 text-white shadow-aviation"
                          : "text-aviation-sky-300 hover:text-white hover:bg-aviation-sky-700/30"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gradient-to-r from-aviation-sky-500/20 to-aviation-sky-600/20"
                        />
                      )}
                      
                      {Icon && (
                        <Icon className={cn(
                          "w-5 h-5 transition-transform group-hover:scale-110",
                          isActive ? "text-white" : "text-aviation-sky-400 group-hover:text-white"
                        )} />
                      )}
                      
                      <span className="relative z-10">{itemName}</span>
                      
                      {item.badge && (
                        <motion.span
                          className="ml-auto bg-aviation-danger-500 text-white text-xs px-2 py-1 rounded-full font-bold"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                        >
                          {item.badge}
                        </motion.span>
                      )}
                    </motion.a>
                  </motion.div>
                )
              })}
            </nav>

            {/* Profile Card - Expandable at bottom */}
            <div className="px-4 pb-4 flex-shrink-0">
              <AviationProfileCard
                user={user}
                userProfile={userProfile}
                variant="aviation"
                showDetails={true}
                collapsible={true}
              />
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-aviation-sky-700/50">
            <motion.div 
              className="flex items-center gap-2 text-xs text-aviation-sky-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Shield className="w-3 h-3" />
              <span>FAA Part 141 Certified</span>
            </motion.div>
          </div>
        </aside>
      )}

      {/* Mobile Sidebar - Animated */}
      <AnimatePresence>
        {showNav && sidebarOpen && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 w-80 bg-gradient-to-b from-aviation-sky-900 via-aviation-sky-800 to-aviation-sky-900 border-r border-aviation-sky-700/50 backdrop-blur-xl flex flex-col h-screen lg:hidden"
            data-sidebar="mobile"
          >
            {/* Sidebar Header */}
            <div className="flex h-16 items-center justify-between px-6 border-b border-aviation-sky-700/50">
              <motion.div 
                className="flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-aviation-sky-500 to-aviation-sky-600 rounded-xl flex items-center justify-center shadow-aviation">
                  <Plane className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white font-display">Desert Skies</h1>
                  <p className="text-xs text-aviation-sky-300">
                    {userRole === 'admin' ? 'Admin Portal' : 
                     userRole === 'instructor' ? 'Instructor Portal' : 
                     userRole === 'student' ? 'Student Portal' : 'Flight Training Portal'}
                  </p>
                </div>
              </motion.div>
              
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white hover:bg-aviation-sky-700/50 transition-colors"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Navigation and Profile Container */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Scrollable Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto min-h-0">
                {navigationItems.map((item, index) => {
                  const isActive = currentPath === item.href
                  // Handle both string-based and component-based icons
                  const Icon = typeof item.icon === 'string' ? iconMap[item.icon as keyof typeof iconMap] : item.icon
                  const itemName = item.name || item.title
                  
                  return (
                    <motion.div
                      key={itemName || item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                    >
                      <motion.a
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden cursor-pointer",
                          isActive
                            ? "bg-gradient-to-r from-aviation-sky-600 to-aviation-sky-700 text-white shadow-aviation"
                            : "text-aviation-sky-300 hover:text-white hover:bg-aviation-sky-700/30"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-gradient-to-r from-aviation-sky-500/20 to-aviation-sky-600/20"
                          />
                        )}
                        
                        {Icon && (
                          <Icon className={cn(
                            "w-5 h-5 transition-transform group-hover:scale-110",
                            isActive ? "text-white" : "text-aviation-sky-400 group-hover:text-white"
                          )} />
                        )}
                        
                        <span className="relative z-10">{itemName}</span>
                        
                        {item.badge && (
                          <motion.span
                            className="ml-auto bg-aviation-danger-500 text-white text-xs px-2 py-1 rounded-full font-bold"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                          >
                            {item.badge}
                          </motion.span>
                        )}
                      </motion.a>
                    </motion.div>
                  )
                })}
              </nav>

              {/* Profile Card - Expandable at bottom */}
              <div className="px-4 pb-4 flex-shrink-0">
                <AviationProfileCard
                  user={user}
                  userProfile={userProfile}
                  variant="aviation"
                  showDetails={true}
                  collapsible={true}
                />
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-aviation-sky-700/50">
              <motion.div 
                className="flex items-center gap-2 text-xs text-aviation-sky-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Shield className="w-3 h-3" />
                <span>FAA Part 141 Certified</span>
              </motion.div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={cn(
        "min-h-screen transition-all duration-300",
        showNav ? "lg:pl-80" : ""
      )}>
        {/* Top Navigation */}
        {showNav && (
          <motion.header 
            className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-aviation-sky-200/50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "lg:hidden transition-colors",
                    sidebarOpen 
                      ? "bg-aviation-sky-100 text-aviation-sky-700" 
                      : "hover:bg-aviation-sky-50"
                  )}
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open navigation menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                
                {title && (
                  <div>
                    <h1 className="text-xl font-bold text-aviation-sky-900 font-display">
                      {title}
                    </h1>
                    {description && (
                      <p className="text-sm text-aviation-sky-600">
                        {description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-aviation-sky-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 w-64 rounded-xl border border-aviation-sky-200 bg-white/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-aviation-sky-500/20 focus:border-aviation-sky-500"
                    suppressHydrationWarning
                  />
                </div>

                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-aviation-sky-600 hover:text-aviation-sky-800 hover:bg-aviation-sky-50"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-aviation-danger-500 rounded-full" />
                </Button>

                {/* Help */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-aviation-sky-600 hover:text-aviation-sky-800 hover:bg-aviation-sky-50"
                >
                  <HelpCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.header>
        )}

        {/* Page Content */}
        <motion.main 
          className="p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={cn("max-w-7xl mx-auto", className)}>
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  )
}
