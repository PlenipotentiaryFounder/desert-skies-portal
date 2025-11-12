import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { 
  BookOpen, Clock, Target, TrendingUp, CheckCircle2, 
  Circle, PlayCircle, Award, MapPin, ChevronRight,
  Plane, FileText, AlertCircle, Lock
} from "lucide-react"

export const metadata = {
  title: "My Training Syllabus | Student",
  description: "Track your progress and access training materials"
}

export default async function StudentEnhancedSyllabusPage() {
  const supabase = await createClient(await cookies())
  
  // Get current student's ID
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get active enrollments
  const { data: enrollments } = await supabase
    .from('student_enrollments')
    .select(`
      id,
      syllabus_id,
      current_lesson_index,
      status,
      enrolled_at,
      progress,
      syllabi (
        id,
        title,
        description,
        faa_type,
        version
      ),
      instructor:user_profiles!instructor_id (
        full_name,
        email
      )
    `)
    .eq('student_id', user.id)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false })

  if (!enrollments || enrollments.length === 0) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Active Training</h2>
            <p className="text-muted-foreground mb-6">
              You are not currently enrolled in any training programs.
            </p>
            <Button asChild>
              <Link href="/student/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get lessons for each enrollment
  const enrollmentData = await Promise.all(
    enrollments.map(async (enrollment) => {
      const { data: lessons } = await supabase
        .from('syllabus_lessons')
        .select(`
          id,
          title,
          description,
          order_index,
          lesson_type,
          estimated_hours,
          objective,
          performance_standards
        `)
        .eq('syllabus_id', enrollment.syllabus_id)
        .order('order_index')

      // Get student's lesson progress (using flight_sessions as fallback until enhanced schema is applied)
      const { data: completedSessions } = await supabase
        .from('flight_sessions')
        .select('lesson_id')
        .eq('student_id', user.id)
        .eq('status', 'completed')

      const progressMap = new Map(
        completedSessions?.map(s => [s.lesson_id, { completion_status: 'completed', proficiency_level: null, completed_at: null }]) || []
      )

      return {
        ...enrollment,
        lessons: lessons || [],
        progressMap
      }
    })
  )

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">My Training Syllabus</h1>
          <p className="text-muted-foreground mt-2">
            Track your progress and access all your training materials
          </p>
        </div>
      </div>

      {/* Enrollments */}
      {enrollmentData.map((enrollment) => {
        const syllabus = enrollment.syllabi
        const lessons = enrollment.lessons
        const currentLessonIndex = enrollment.current_lesson_index || 0
        const completedLessons = Array.from(enrollment.progressMap.values()).filter(
          p => p.completion_status === 'completed'
        ).length
        const progressPercent = lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0

        return (
          <div key={enrollment.id} className="space-y-6">
            {/* Syllabus Header Card */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-2xl">{syllabus.title}</CardTitle>
                      {syllabus.faa_type && (
                        <Badge className={getCertificateColor(syllabus.faa_type)}>
                          {formatCertificateType(syllabus.faa_type)}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-base">
                      {syllabus.description || "Your personalized flight training program"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-700">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lessons</p>
                      <p className="text-lg font-bold">{lessons.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 text-green-700">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-lg font-bold">{completedLessons}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 text-purple-700">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Progress</p>
                      <p className="text-lg font-bold">{Math.round(progressPercent)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 text-orange-700">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Est. Hours</p>
                      <p className="text-lg font-bold">{Math.round(lessons.reduce((sum, l) => sum + (l.estimated_hours || 0), 0))}</p>
                    </div>
                  </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-muted-foreground">
                      {completedLessons} of {lessons.length} lessons completed
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-3" />
                </div>

                {/* Instructor Info */}
                {enrollment.instructor && (
                  <div className="flex items-center gap-2 text-sm pt-2 border-t">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Instructor:</span>
                    <span className="font-medium">{enrollment.instructor.full_name}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lessons List */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold">Your Training Lessons</h2>
              
              <div className="space-y-3">
                {lessons.map((lesson, index) => {
                  const isCompleted = enrollment.progressMap.get(lesson.id)?.completion_status === 'completed'
                  const isCurrent = index === currentLessonIndex
                  const isLocked = index > currentLessonIndex && !isCompleted
                  const proficiency = enrollment.progressMap.get(lesson.id)?.proficiency_level

                  return (
                    <Card 
                      key={lesson.id} 
                      className={`transition-all ${
                        isCurrent ? 'border-2 border-primary shadow-md' : ''
                      } ${isLocked ? 'opacity-60' : 'hover:shadow-md'}`}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          {/* Lesson Number & Status */}
                          <div className="flex flex-col items-center gap-2">
                            <div 
                              className={`flex items-center justify-center w-12 h-12 rounded-lg font-bold ${
                                isCompleted 
                                  ? 'bg-green-100 text-green-700' 
                                  : isCurrent
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-6 w-6" />
                              ) : isLocked ? (
                                <Lock className="h-6 w-6" />
                              ) : (
                                index + 1
                              )}
                            </div>
                            {isCurrent && (
                              <Badge variant="default" className="text-xs">Current</Badge>
                            )}
                          </div>

                          {/* Lesson Type Icon */}
                          <div 
                            className="flex items-center justify-center w-10 h-10 rounded-lg"
                            style={{
                              backgroundColor: getLessonTypeColor(lesson.lesson_type).bg,
                              color: getLessonTypeColor(lesson.lesson_type).text
                            }}
                          >
                            {getLessonIcon(lesson.lesson_type)}
                          </div>

                          {/* Lesson Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-lg">{lesson.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {formatLessonType(lesson.lesson_type)}
                              </Badge>
                              {proficiency && (
                                <Badge variant="secondary" className="text-xs">
                                  {formatProficiency(proficiency)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {lesson.description || "No description available"}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {lesson.estimated_hours}h estimated
                              </span>
                              {lesson.objective && (
                                <span className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  Learning objectives available
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            {!isLocked && (
                              <Button 
                                size="sm" 
                                variant={isCurrent ? "default" : "outline"}
                                asChild
                              >
                                <Link href={`/student/syllabus/lessons/${lesson.id}`}>
                                  {isCompleted ? 'Review' : isCurrent ? 'Continue' : 'Preview'}
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Link>
                              </Button>
                            )}
                            {isLocked && (
                              <Button size="sm" variant="ghost" disabled>
                                <Lock className="h-4 w-4 mr-1" />
                                Locked
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function getLessonIcon(type: string) {
  const icons = {
    'flight': <Plane className="h-5 w-5" />,
    'ground': <BookOpen className="h-5 w-5" />,
    'stage_check': <Award className="h-5 w-5" />,
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

function getCertificateColor(certificate: string): string {
  const colors: Record<string, string> = {
    'private': 'bg-blue-500 text-white',
    'instrument': 'bg-purple-500 text-white',
    'commercial': 'bg-green-500 text-white',
    'cfi': 'bg-orange-500 text-white',
    'multi': 'bg-red-500 text-white',
    'atp': 'bg-indigo-500 text-white'
  }
  return colors[certificate] || 'bg-gray-500 text-white'
}

function formatProficiency(level: string): string {
  const formats: Record<string, string> = {
    'beginner': 'Beginner',
    'developing': 'Developing',
    'proficient': 'Proficient',
    'mastered': 'Mastered'
  }
  return formats[level] || level
}

