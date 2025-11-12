import { Suspense } from "react"
import { getEnhancedSyllabi } from "@/lib/enhanced-syllabus-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import {
  PlusCircle,
  BookOpen,
  Users,
  Clock,
  FileText,
  Settings,
  TrendingUp,
  CheckCircle2,
  Edit,
  Copy,
  Archive,
  Eye
} from "lucide-react"

export const metadata = {
  title: "Training Syllabi | Admin",
  description: "Manage flight training syllabi and curriculum"
}

export default async function EnhancedSyllabiPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Training Syllabi</h1>
          <p className="text-muted-foreground mt-2">
            Manage your flight training curriculum, lessons, and ACS standards
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/syllabi/import">
              <FileText className="mr-2 h-4 w-4" />
              Import Syllabus
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/syllabi/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Syllabus
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <Suspense fallback={<StatsLoadingSkeleton />}>
        <SyllabusStats />
      </Suspense>

      {/* Syllabi Grid */}
      <Suspense fallback={<SyllabiLoadingSkeleton />}>
        <SyllabiGrid />
      </Suspense>
    </div>
  )
}

async function SyllabusStats() {
  const syllabi = await getEnhancedSyllabi()
  
  const totalSyllabi = syllabi.length
  const activeSyllabi = syllabi.filter(s => s.is_active).length
  const totalEnrollments = syllabi.reduce((sum, s) => sum + (s.enrollment_count || 0), 0)
  const totalLessons = syllabi.reduce((sum, s) => sum + (s.lesson_count || 0), 0)
  const totalHours = syllabi.reduce((sum, s) => sum + (s.total_estimated_hours || 0), 0)

  const stats = [
    {
      title: "Active Syllabi",
      value: `${activeSyllabi} / ${totalSyllabi}`,
      description: "Training programs",
      icon: BookOpen,
      color: "text-blue-600"
    },
    {
      title: "Total Enrollments",
      value: totalEnrollments,
      description: "Students enrolled",
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Total Lessons",
      value: totalLessons,
      description: "Across all syllabi",
      icon: CheckCircle2,
      color: "text-purple-600"
    },
    {
      title: "Training Hours",
      value: Math.round(totalHours),
      description: "Estimated total",
      icon: Clock,
      color: "text-orange-600"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function SyllabiGrid() {
  const syllabi = await getEnhancedSyllabi()

  if (syllabi.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Syllabi Yet</h3>
          <p className="text-muted-foreground text-center mb-4 max-w-md">
            Create your first training syllabus to get started. Link it to ACS standards, 
            add lessons, and enroll students.
          </p>
          <Button asChild>
            <Link href="/admin/syllabi/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create First Syllabus
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {syllabi.map((syllabus) => (
        <SyllabusCard key={syllabus.id} syllabus={syllabus} />
      ))}
    </div>
  )
}

function SyllabusCard({ syllabus }: { syllabus: any }) {
  const statusColor = syllabus.is_active ? "bg-green-500" : "bg-gray-400"
  const certificateColor = getCertificateColor(syllabus.target_certificate)
  
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 relative overflow-hidden">
      {/* Status Indicator */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${statusColor}`} />
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2 flex items-center gap-2">
              <Link 
                href={`/admin/syllabi/${syllabus.id}`}
                className="hover:text-primary transition-colors"
              >
                {syllabus.name}
              </Link>
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {syllabus.description || "No description"}
            </CardDescription>
          </div>
          <Badge variant={syllabus.is_active ? "default" : "secondary"} className="ml-2">
            {syllabus.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Certificate Type Badge */}
        {syllabus.target_certificate && (
          <div>
            <Badge variant="outline" className={certificateColor}>
              {formatCertificateType(syllabus.target_certificate)}
            </Badge>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>
              <strong className="text-foreground">{syllabus.lesson_count || 0}</strong> Lessons
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              <strong className="text-foreground">{Math.round(syllabus.total_estimated_hours || 0)}</strong> Hours
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              <strong className="text-foreground">{syllabus.active_enrollments || 0}</strong> Active
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>
              <strong className="text-foreground">{syllabus.enrollment_count || 0}</strong> Total
            </span>
          </div>
        </div>

        {/* ACS Document Info */}
        {syllabus.acs_document && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" />
              <span className="font-medium">ACS:</span>
              <span className="truncate">{syllabus.acs_document.title}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/admin/syllabi/${syllabus.id}`}>
              <Eye className="h-3 w-3 mr-1" />
              View
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/admin/syllabi/${syllabus.id}/edit`}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/syllabi/${syllabus.id}/duplicate`}>
              <Copy className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function getCertificateColor(certificate: string | null): string {
  switch (certificate) {
    case 'private':
      return 'border-blue-500 text-blue-700 bg-blue-50'
    case 'instrument':
      return 'border-purple-500 text-purple-700 bg-purple-50'
    case 'commercial':
      return 'border-green-500 text-green-700 bg-green-50'
    case 'cfi':
      return 'border-orange-500 text-orange-700 bg-orange-50'
    case 'multi':
      return 'border-red-500 text-red-700 bg-red-50'
    case 'atp':
      return 'border-indigo-500 text-indigo-700 bg-indigo-50'
    default:
      return 'border-gray-500 text-gray-700 bg-gray-50'
  }
}

function formatCertificateType(type: string | null): string {
  if (!type) return 'General'
  
  const formats: Record<string, string> = {
    'private': 'Private Pilot',
    'instrument': 'Instrument Rating',
    'commercial': 'Commercial Pilot',
    'cfi': 'Flight Instructor',
    'multi': 'Multi-Engine',
    'atp': 'ATP'
  }
  
  return formats[type] || type
}

function StatsLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function SyllabiLoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, j) => (
                <Skeleton key={j} className="h-5 w-full" />
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-9" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

