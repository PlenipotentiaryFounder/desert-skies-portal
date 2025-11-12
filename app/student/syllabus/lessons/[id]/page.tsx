import { Suspense } from "react"
import { getSyllabusLessonById } from "@/lib/syllabus-service"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { 
  BookOpen, Clock, Target, CheckCircle2, FileText, 
  Video, ExternalLink, Plane, ChevronLeft, AlertCircle,
  Award, PlayCircle, InfoIcon, Lightbulb
} from "lucide-react"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function StudentLessonDetailPage({ params }: PageProps) {
  const { id: lessonId } = await params
  
  const lesson = await getSyllabusLessonById(lessonId)
  
  if (!lesson) {
    notFound()
  }

  const supabase = await createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get student's progress for this lesson (fallback until enhanced schema applied)
  // const { data: progress } = await supabase
  //   .from('student_lesson_progress')
  //   .select('*')
  //   .eq('student_id', user.id)
  //   .eq('lesson_id', lessonId)
  //   .single()
  const progress = null // Fallback until enhanced schema is applied

  // Get ACS standards linked to this lesson (fallback until enhanced schema applied)
  // const { data: acsStandards } = await supabase
  //   .from('lesson_acs_standards')
  //   .select(`...`)
  //   .eq('lesson_id', lessonId)
  const acsStandards = null // Fallback until enhanced schema is applied

  // Get FAR references (fallback until enhanced schema applied)
  // const { data: farReferences } = await supabase
  //   .from('lesson_far_references')
  //   .select('part, section, description')
  //   .eq('lesson_id', lessonId)
  const farReferences = null // Fallback until enhanced schema is applied

  // Get resources (fallback until enhanced schema applied)
  // const { data: resources } = await supabase
  //   .from('lesson_resources')
  //   .select('*')
  //   .eq('lesson_id', lessonId)
  //   .order('display_order')
  const resources = null // Fallback until enhanced schema is applied

  const isCompleted = progress?.completion_status === 'completed'
  const proficiency = progress?.proficiency_level

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link 
          href="/student/syllabus" 
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to My Syllabus
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-4xl font-bold tracking-tight">{lesson.title}</h1>
              <Badge variant="outline" className="text-sm">
                {formatLessonType(lesson.lesson_type)}
              </Badge>
              {isCompleted && (
                <Badge className="bg-green-600 text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
              {proficiency && !isCompleted && (
                <Badge variant="secondary">
                  {formatProficiency(proficiency)}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-lg">
              {lesson.description || "No description provided"}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{lesson.estimated_hours} hours</span>
          </div>
          {lesson.maneuvers && lesson.maneuvers.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{lesson.maneuvers.length} maneuvers</span>
            </div>
          )}
          {acsStandards && acsStandards.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{acsStandards.length} ACS standards</span>
            </div>
          )}
          {resources && resources.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
              <Video className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{resources.length} resources</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Alert (if started but not completed) */}
      {progress && !isCompleted && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Lesson In Progress</AlertTitle>
          <AlertDescription>
            You've started this lesson. Keep practicing to build proficiency!
            {proficiency && ` Current level: ${formatProficiency(proficiency)}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prep">Pre-Brief</TabsTrigger>
          <TabsTrigger value="standards">Standards</TabsTrigger>
          <TabsTrigger value="maneuvers">Maneuvers</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Learning Objectives */}
          {lesson.objective && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  What You'll Learn
                </CardTitle>
                <CardDescription>
                  Learning objectives for this lesson
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-foreground">{lesson.objective}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Standards */}
          {lesson.performance_standards && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Performance Standards
                </CardTitle>
                <CardDescription>
                  What success looks like for this lesson
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-foreground">{lesson.performance_standards}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Links */}
          <div className="grid gap-4 md:grid-cols-2">
            {resources && resources.length > 0 && (
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 text-purple-700">
                      <Video className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Learning Resources</h3>
                      <p className="text-sm text-muted-foreground">{resources.length} resources available</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Videos, articles, and materials to help you prepare
                  </p>
                  <Button size="sm" variant="outline" asChild className="w-full">
                    <a href="#resources">View Resources</a>
                  </Button>
                </CardContent>
              </Card>
            )}

            {acsStandards && acsStandards.length > 0 && (
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 text-blue-700">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">ACS Standards</h3>
                      <p className="text-sm text-muted-foreground">{acsStandards.length} standards covered</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Official FAA standards you'll be evaluated on
                  </p>
                  <Button size="sm" variant="outline" asChild className="w-full">
                    <a href="#standards">View Standards</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Pre-Brief Tab */}
        <TabsContent value="prep" className="space-y-6">
          {/* Student Prep Materials */}
          {lesson.student_prep_materials && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  What to Study
                </CardTitle>
                <CardDescription>
                  Prepare for this lesson by reviewing these materials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-foreground">{lesson.student_prep_materials}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pre-Brief Content */}
          {lesson.pre_brief_content && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Pre-Brief Overview
                </CardTitle>
                <CardDescription>
                  What to expect in the pre-flight briefing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-foreground">{lesson.pre_brief_content}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* FAR References */}
          {farReferences && farReferences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  FAR References
                </CardTitle>
                <CardDescription>
                  Relevant regulations to review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {farReferences.map((ref, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Badge variant="outline" className="mt-0.5 font-mono">
                        {ref.part}.{ref.section}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">{ref.description}</p>
                      </div>
                      <Button size="sm" variant="ghost" asChild>
                        <a 
                          href={`https://www.ecfr.gov/current/title-14/chapter-I/subchapter-D/part-${ref.part}/section-${ref.part}.${ref.section}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!lesson.student_prep_materials && !lesson.pre_brief_content && !farReferences?.length && (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pre-Brief Materials Yet</h3>
                <p className="text-muted-foreground">
                  Your instructor will provide pre-brief materials when you're ready for this lesson.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ACS Standards Tab */}
        <TabsContent value="standards" className="space-y-4" id="standards">
          {acsStandards && acsStandards.length > 0 ? (
            acsStandards.map((standard: any) => (
              <Card key={standard.acs_task_id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className="font-mono">
                          {standard.acs_tasks.acs_area.code}
                        </Badge>
                        <Badge variant="outline" className="font-mono">
                          {standard.acs_tasks.code}
                        </Badge>
                        {standard.is_required && (
                          <Badge variant="destructive">Required</Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl mb-1">
                        {standard.acs_tasks.title}
                      </CardTitle>
                      <CardDescription>
                        {standard.acs_tasks.acs_area.title}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Skill Elements */}
                  {standard.acs_tasks.skill_elements && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Skill Elements
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {standard.acs_tasks.skill_elements.map((skill: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-muted-foreground mt-0.5">•</span>
                            <span>{skill}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Knowledge Elements */}
                  {standard.acs_tasks.knowledge_elements && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Knowledge Elements
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {standard.acs_tasks.knowledge_elements.map((knowledge: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-muted-foreground mt-0.5">•</span>
                            <span>{knowledge}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Risk Management */}
                  {standard.acs_tasks.risk_management_elements && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Risk Management
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {standard.acs_tasks.risk_management_elements.map((risk: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-muted-foreground mt-0.5">•</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No ACS Standards Linked</h3>
                <p className="text-muted-foreground">
                  No specific ACS standards have been linked to this lesson yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Maneuvers Tab */}
        <TabsContent value="maneuvers" className="space-y-4">
          {lesson.maneuvers && lesson.maneuvers.length > 0 ? (
            lesson.maneuvers.map((maneuver: any) => (
              <Card key={maneuver.id} className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{maneuver.name}</CardTitle>
                        <Badge variant="secondary" className="capitalize">{maneuver.category}</Badge>
                      </div>
                      <CardDescription>{maneuver.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                {maneuver.tolerances && (
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Performance Standards
                      </h4>
                      <div className="prose prose-sm max-w-none p-4 rounded-lg bg-muted/30">
                        <p className="whitespace-pre-wrap text-sm text-foreground m-0">{maneuver.tolerances}</p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Maneuvers Defined</h3>
                <p className="text-muted-foreground">
                  No specific maneuvers have been added to this lesson yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4" id="resources">
          {resources && resources.length > 0 ? (
            <div className="grid gap-4">
              {resources.map((resource) => (
                <Card key={resource.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div 
                        className="flex items-center justify-center w-14 h-14 rounded-lg"
                        style={{
                          backgroundColor: getResourceColor(resource.resource_type).bg,
                          color: getResourceColor(resource.resource_type).text
                        }}
                      >
                        {getResourceIcon(resource.resource_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{resource.title}</h3>
                            {resource.description && (
                              <p className="text-sm text-muted-foreground">
                                {resource.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="capitalize ml-2">
                            {resource.resource_type}
                          </Badge>
                        </div>
                        <Button size="sm" asChild className="mt-2">
                          <a 
                            href={resource.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2"
                          >
                            {resource.resource_type === 'video' && <PlayCircle className="h-4 w-4" />}
                            {resource.resource_type === 'link' && <ExternalLink className="h-4 w-4" />}
                            {resource.resource_type === 'pdf' && <FileText className="h-4 w-4" />}
                            View Resource
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Resources Available</h3>
                <p className="text-muted-foreground">
                  Learning resources haven't been added to this lesson yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
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

function formatProficiency(level: string): string {
  const formats: Record<string, string> = {
    'beginner': 'Beginner',
    'developing': 'Developing',
    'proficient': 'Proficient',
    'mastered': 'Mastered'
  }
  return formats[level] || level
}

function getResourceIcon(type: string) {
  const icons = {
    'video': <Video className="h-7 w-7" />,
    'link': <ExternalLink className="h-7 w-7" />,
    'pdf': <FileText className="h-7 w-7" />
  }
  return icons[type as keyof typeof icons] || <FileText className="h-7 w-7" />
}

function getResourceColor(type: string) {
  const colors = {
    'video': { bg: '#FEE2E2', text: '#991B1B' },
    'link': { bg: '#DBEAFE', text: '#1E40AF' },
    'pdf': { bg: '#FEF3C7', text: '#92400E' }
  }
  return colors[type as keyof typeof colors] || { bg: '#F3F4F6', text: '#374151' }
}

