import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getEnhancedSyllabusById, getEnhancedLessons } from "@/lib/enhanced-syllabus-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import {
  ArrowLeft,
  Edit,
  PlusCircle,
  Settings,
  Users,
  BookOpen,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  GripVertical,
  Copy,
  Trash2,
  Eye,
  PlayCircle,
  Plane,
  GraduationCap,
  MonitorPlay
} from "lucide-react"
import { SyllabusLessonsList } from "./syllabus-lessons-list"
import { SyllabusOverviewTab } from "./syllabus-overview-tab"
import { SyllabusStudentsTab } from "./syllabus-students-tab"
import { SyllabusSettingsTab } from "./syllabus-settings-tab"

export async function generateMetadata({ params }: { params: { id: string } }) {
  const syllabus = await getEnhancedSyllabusById(params.id)
  
  return {
    title: syllabus ? `${syllabus.name} | Admin` : 'Syllabus | Admin',
    description: syllabus?.description || 'Manage training syllabus'
  }
}

export default async function SyllabusDetailPage({ params }: { params: { id: string } }) {
  const syllabus = await getEnhancedSyllabusById(params.id)
  
  if (!syllabus) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/syllabi">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{syllabus.name}</h1>
              <Badge variant={syllabus.is_active ? "default" : "secondary"}>
                {syllabus.is_active ? "Active" : "Inactive"}
              </Badge>
              {syllabus.target_certificate && (
                <Badge variant="outline" className={getCertificateColor(syllabus.target_certificate)}>
                  {formatCertificateType(syllabus.target_certificate)}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {syllabus.description || "No description provided"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/admin/syllabi/${syllabus.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Syllabus
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/admin/syllabi/${syllabus.id}/lessons/new`}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Lesson
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Lessons</p>
                  <p className="text-2xl font-bold">{syllabus.lesson_count || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Training Hours</p>
                  <p className="text-2xl font-bold">{Math.round(syllabus.total_estimated_hours || 0)}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                  <p className="text-2xl font-bold">{syllabus.active_enrollments || 0}</p>
                </div>
                <Users className="h-8 w-8 text-green-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Enrolled</p>
                  <p className="text-2xl font-bold">{syllabus.enrollment_count || 0}</p>
                </div>
                <GraduationCap className="h-8 w-8 text-orange-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="lessons" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none">
          <TabsTrigger value="lessons" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Lessons</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Students</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-4">
          <Suspense fallback={<LessonsLoadingSkeleton />}>
            <LessonsTab syllabusId={syllabus.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Suspense fallback={<div>Loading overview...</div>}>
            <SyllabusOverviewTab syllabus={syllabus} />
          </Suspense>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Suspense fallback={<div>Loading students...</div>}>
            <SyllabusStudentsTab syllabusId={syllabus.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SyllabusSettingsTab syllabus={syllabus} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

async function LessonsTab({ syllabusId }: { syllabusId: string }) {
  const lessons = await getEnhancedLessons(syllabusId)

  if (lessons.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Lessons Yet</h3>
          <p className="text-muted-foreground text-center mb-4 max-w-md">
            Start building your syllabus by adding lessons. Each lesson can include maneuvers, 
            ACS standards, FAR references, and learning resources.
          </p>
          <Button asChild>
            <Link href={`/admin/syllabi/${syllabusId}/lessons/new`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add First Lesson
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Group lessons by type for better organization
  const lessonsByType = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.lesson_type]) {
      acc[lesson.lesson_type] = []
    }
    acc[lesson.lesson_type].push(lesson)
    return acc
  }, {} as Record<string, typeof lessons>)

  const typeOrder = ['Ground', 'Flight', 'Simulator', 'Solo', 'Checkride']
  const sortedTypes = typeOrder.filter(type => lessonsByType[type])

  return (
    <div className="space-y-6">
      {/* Lessons List - Drag and Drop will be handled by client component */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lesson Sequence</CardTitle>
              <CardDescription>
                Manage the order and content of training lessons. Drag to reorder.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href={`/admin/syllabi/${syllabusId}/lessons/new`}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Lesson
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <SyllabusLessonsList lessons={lessons} syllabusId={syllabusId} />
        </CardContent>
      </Card>

      {/* Lessons by Type */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedTypes.map(type => (
          <Card key={type}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {getLessonTypeIcon(type)}
                <CardTitle className="text-base">{type} Lessons</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Count:</span>
                  <span className="font-medium">{lessonsByType[type].length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Hours:</span>
                  <span className="font-medium">
                    {lessonsByType[type].reduce((sum, l) => sum + l.estimated_hours, 0).toFixed(1)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function getLessonTypeIcon(type: string) {
  switch (type) {
    case 'Ground':
      return <BookOpen className="h-4 w-4 text-blue-600" />
    case 'Flight':
      return <Plane className="h-4 w-4 text-green-600" />
    case 'Simulator':
      return <MonitorPlay className="h-4 w-4 text-purple-600" />
    case 'Solo':
      return <PlayCircle className="h-4 w-4 text-orange-600" />
    case 'Checkride':
      return <CheckCircle2 className="h-4 w-4 text-red-600" />
    default:
      return <FileText className="h-4 w-4 text-gray-600" />
  }
}

function getCertificateColor(certificate: string): string {
  const colors: Record<string, string> = {
    'private': 'border-blue-500 text-blue-700 bg-blue-50',
    'instrument': 'border-purple-500 text-purple-700 bg-purple-50',
    'commercial': 'border-green-500 text-green-700 bg-green-50',
    'cfi': 'border-orange-500 text-orange-700 bg-orange-50',
    'multi': 'border-red-500 text-red-700 bg-red-50',
    'atp': 'border-indigo-500 text-indigo-700 bg-indigo-50'
  }
  return colors[certificate] || 'border-gray-500 text-gray-700 bg-gray-50'
}

function formatCertificateType(type: string): string {
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

function LessonsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

