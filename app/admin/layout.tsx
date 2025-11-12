import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import {
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Home,
  Plane,
  Settings,
  User,
  Users,
  UserCheck,
  Wrench,
  AlertTriangle,
  BarChart3,
  DollarSign,
  Shield,
  Activity,
  Bell,
  Target,
  Award,
  MapPin,
  Gauge,
  Fuel,
  Compass,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Eye,
  Edit,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Star,
  Award as AwardIcon,
  Navigation,
  Cloud,
  Sun,
  Moon,
  CloudRain,
  CloudLightning,
  Shield as ShieldIcon,
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
  ChevronDown as ChevronDownIcon,
  ChevronUp,
  MoreHorizontal as MoreHorizontalIcon,
  ExternalLink,
  Download as DownloadIcon,
  Share2,
  Share2 as Share2Icon,
  Edit as EditIcon,
  Copy,
  Bookmark,
  BookmarkPlus,
  Search as SearchIcon,
  Filter as FilterIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Maximize2,
  Minimize2,
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
  Calculator
} from "lucide-react"
import { DashboardShell } from "@/components/shared/dashboard-shell"
import { getUserProfileWithRoles } from "@/lib/user-service"

const navItems = [
  {
    title: "Operations Center",
    href: "/admin/dashboard",
    icon: "home",
    description: "Main operations dashboard"
  },
  {
    title: "Fleet Management",
    href: "/admin/fleet",
    icon: "plane",
    description: "Fleet operations command center"
  },
  {
    title: "Maintenance",
    href: "/admin/maintenance",
    icon: "wrench",
    description: "Maintenance operations center"
  },
  {
    title: "Squawk Management",
    href: "/admin/squawks",
    icon: "alertTriangle",
    description: "Issue reporting and resolution"
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: "users",
    description: "User management and roles"
  },
  {
    title: "Instructor Approvals",
    href: "/admin/instructors",
    icon: "userCheck",
    description: "Instructor certification and approvals"
  },
  {
    title: "Students",
    href: "/admin/students",
    icon: "graduationCap",
    description: "Student enrollment and progress"
  },
  {
    title: "Syllabi",
    href: "/admin/syllabi",
    icon: "bookOpen",
    description: "Training curriculum management"
  },
  {
    title: "Enrollments",
    href: "/admin/enrollments",
    icon: "graduationCap",
    description: "Student enrollment tracking"
  },
  {
    title: "Schedule",
    href: "/admin/schedule",
    icon: "calendar",
    description: "Flight scheduling and coordination"
  },
  {
    title: "Documents",
    href: "/admin/documents",
    icon: "fileText",
    description: "Document management and verification"
  },
  {
    title: "Requirements",
    href: "/admin/requirements",
    icon: "clipboardCheck",
    description: "FAA requirements and compliance"
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: "barChart3",
    description: "Analytics and reporting"
  },
  {
    title: "Billing",
    href: "/admin/billing",
    icon: "dollarSign",
    description: "Financial management and billing"
  },
  {
    title: "Ground School Calculator",
    href: "/admin/ground-school-calculator",
    icon: "calculator",
    description: "Plan and price ground school programs"
  },
  {
    title: "Compliance",
    href: "/admin/compliance",
    icon: "shield",
    description: "FAA compliance and safety"
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: "settings",
    description: "System configuration"
  },
]

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const profile = await getUserProfileWithRoles(user.id)
  console.log('ADMIN LAYOUT: profile:', profile)
  const roles = Array.isArray(profile?.roles)
    ? profile.roles.map((r: any) => typeof r === "string" ? r : r.role_name)
    : []
  console.log('ADMIN LAYOUT: roles:', roles)

  // Role verification is handled by middleware, so we don't need additional redirects here
  // The middleware ensures only users with admin role can access /admin routes

  return (
    <DashboardShell 
      navItems={navItems} 
      userRole="admin" 
      profile={profile}
    >
      {children}
    </DashboardShell>
  )
}
