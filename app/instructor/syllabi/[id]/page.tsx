import { Suspense } from "react"
import { getSyllabusById, getSyllabusLessons } from "@/lib/syllabus-service"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { 
  BookOpen, Users, Clock, TrendingUp, ChevronRight, 
  GraduationCap, Target, CheckCircle2, Circle, MapPin,
  AlertCircle, PlayCircle, FileText, Plane
} from "lucide-react"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InstructorSyllabusDetailPage({ params }: PageProps) {
  const { id } = await params
  const syllabus = await getSyllabusById(id)
  
  if (!syllabus) {
    notFound()
  }

  const lessons = await getSyllabusLessons(id)
  const supabase = await createClient(await cookies())
  
  // Get current instructor's ID
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get students enrolled in this syllabus under this instructor
  const { data: enrollments } = await supabase
    .from('student_enrollments')
    .select(`
      id,
      student_id,
      status,
      enrolled_at,
      current_lesson_index,
      progress,
      user_profiles!student_id (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('syllabus_id', id)
    .eq('instructor_id', user.id)
    .order('enrolled_at', { ascending: false })

  const students = enrollments?.map(e => ({
    id: e.student_id,
    enrollmentId: e.id,
    name: e.user_profiles?.full_name || 'Unknown',
    email: e.user_profiles?.email || '',
    avatarUrl: e.user_profiles?.avatar_url,
    status: e.status,
    enrolledAt: e.enrolled_at,
    currentLessonIndex: e.current_lesson_index || 0,
    progress: e.progress
  })) || []

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <Link href="/instructor/syllabi" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
            ← Back to Syllabi
          </Link>
          <h1 className="text-4xl font-bold tracking-tight">{syllabus.title}</h1>
          <p className="text-muted-foreground mt-2">
            {syllabus.description || "Manage students and track progress through this training program"}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Lessons</p>
                <p className="text-2xl font-bold">{lessons.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">My Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold">
                  {students.filter(s => s.status === 'active').length}
                </p>
              </div>
              <GraduationCap className="h-8 w-8 text-purple-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold">
                  {students.length > 0 
                    ? Math.round((students.reduce((sum, s) => sum + ((s.currentLessonIndex / lessons.length) * 100), 0) / students.length))
                    : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="students" className="space-y-6">
        <TabsList>
          <TabsTrigger value="students">
            <Users className="h-4 w-4 mr-2" />
            Students ({students.length})
          </TabsTrigger>
          <TabsTrigger value="lessons">
            <BookOpen className="h-4 w-4 mr-2" />
            Lessons ({lessons.length})
          </TabsTrigger>
          <TabsTrigger value="overview">
            <Target className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          {students.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Students Enrolled</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any students enrolled in this syllabus yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {students.map((student) => {
                const progressPercent = (student.currentLessonIndex / lessons.length) * 100
                const currentLesson = lessons[student.currentLessonIndex]
                
                return (
                  <Card key={student.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={student.avatarUrl || undefined} />
                          <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                        </Avatar>

                        {/* Student Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{student.name}</h3>
                              <p className="text-sm text-muted-foreground">{student.email}</p>
                            </div>
                            <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                              {student.status}
                            </Badge>
                          </div>

                          {/* Current Lesson */}
                          {currentLesson && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">Current Lesson:</span>
                              <span className="text-muted-foreground">
                                {currentLesson.title} (Lesson {student.currentLessonIndex + 1}/{lessons.length})
                              </span>
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">Overall Progress</span>
                              <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button size="sm" asChild>
                              <Link href={`/instructor/students/${student.id}`}>
                                View Profile
                              </Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/instructor/missions/new?student=${student.id}&syllabus=${id}`}>
                                Plan Next Mission
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Lessons Tab */}
        <TabsContent value="lessons" className="space-y-4">
          <div className="grid gap-3">
            {lessons.map((lesson, index) => (
              <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {/* Lesson Number */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>

                    {/* Lesson Icon */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{
                      backgroundColor: getLessonTypeColor(lesson.lesson_type).bg,
                      color: getLessonTypeColor(lesson.lesson_type).text
                    }}>
                      {getLessonIcon(lesson.lesson_type)}
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{lesson.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {formatLessonType(lesson.lesson_type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {lesson.description || "No description"}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lesson.estimated_hours}h
                        </span>
                        {lesson.maneuvers && lesson.maneuvers.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {lesson.maneuvers.length} maneuvers
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/instructor/syllabi/${id}/lessons/${lesson.id}`}>
                        View Details
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Syllabus Information</CardTitle>
              <CardDescription>Key details about this training program</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Certificate Type</p>
                  <p className="text-lg font-semibold">
                    {syllabus.faa_type ? formatCertificateType(syllabus.faa_type) : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Version</p>
                  <p className="text-lg font-semibold">{syllabus.version || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Lessons</p>
                  <p className="text-lg font-semibold">{lessons.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estimated Hours</p>
                  <p className="text-lg font-semibold">
                    {Math.round(lessons.reduce((sum, l) => sum + (l.estimated_hours || 0), 0))} hours
                  </p>
                </div>
              </div>

              {syllabus.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                  <p className="text-sm">{syllabus.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lesson Type Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Lesson Type Breakdown</CardTitle>
              <CardDescription>Distribution of lesson types in this syllabus</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {getLessonTypeBreakdown(lessons).map(({ type, count, color }) => (
                  <div key={type} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{
                      backgroundColor: color.bg,
                      color: color.text
                    }}>
                      {getLessonIcon(type)}
                    </div>
                    <div>
                      <p className="font-semibold">{count}</p>
                      <p className="text-xs text-muted-foreground">{formatLessonType(type)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function getLessonIcon(type: string) {
  const icons = {
    'flight': <Plane className="h-5 w-5" />,
    'ground': <BookOpen className="h-5 w-5" />,
    'stage_check': <CheckCircle2 className="h-5 w-5" />,
    'progress_check': <Target className="h-5 w-5" />,
    'sim': <PlayCircle className="h-5 w-5" />,
    'briefing': <FileText className="h-5 w-5" />
  }
  return icons[type as keyof typeof icons] || <Circle className="h-5 w-5" />
}

function getLessonTypeColor(type: string) {
  const colors = {
    'flight': { bg: '#EFF6FF', text: '#1E40AF' },
    'ground': { bg: '#F0FDF4', text: '#15803D' },
    'stage_check': { bg: '#FEF3C7', text: '#92400E' },
    'progress_check': { bg: '#F3E8FF', text: '#6B21A8' },
    'sim': { bg: '#FEE2E2', text: '#991B1B' },
    'briefing': { bg: '#E0E7FF', text: '#3730A3' }
  }
  return colors[type as keyof typeof colors] || { bg: '#F3F4F6', text: '#374151' }
}

function formatLessonType(type: string): string {
  const formats: Record<string, string> = {
    'flight': 'Flight',
    'ground': 'Ground',
    'stage_check': 'Stage Check',
    'progress_check': 'Progress Check',
    'sim': 'Simulator',
    'briefing': 'Briefing'
  }
  return formats[type] || type
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

function getLessonTypeBreakdown(lessons: any[]) {
  const breakdown = new Map<string, number>()
  lessons.forEach(l => {
    breakdown.set(l.lesson_type, (breakdown.get(l.lesson_type) || 0) + 1)
  })
  
  return Array.from(breakdown.entries()).map(([type, count]) => ({
    type,
    count,
    color: getLessonTypeColor(type)
  }))
}

