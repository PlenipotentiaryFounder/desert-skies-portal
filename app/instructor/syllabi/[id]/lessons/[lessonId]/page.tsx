import { Suspense } from "react"
import { getSyllabusLessonById, getSyllabusById, getLessonManeuvers } from "@/lib/syllabus-service"
import { getPerformanceStandards, getManeuverExpectations, getLessonResources, getLessonSuggestions } from "@/lib/lesson-suggestions-service"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { 
  BookOpen, Clock, Target, CheckCircle2, FileText, 
  Video, ExternalLink, Plane, ChevronLeft, Mic, Sparkles,
  ArrowLeft, ArrowRight, AlertCircle
} from "lucide-react"
import { notFound } from "next/navigation"
import { LessonNavigationKeyboard } from "@/components/instructor/lesson-navigation-keyboard"
import { SuggestEditDialog } from "@/components/instructor/suggest-edit-dialog"

interface PageProps {
  params: Promise<{ id: string; lessonId: string }>
}

export default async function InstructorLessonDetailPage({ params }: PageProps) {
  const { id: syllabusId, lessonId } = await params
  
  const [syllabus, lesson, lessonManeuvers, performanceStandards, maneuverExpectations, resources, pendingSuggestions] = await Promise.all([
    getSyllabusById(syllabusId),
    getSyllabusLessonById(lessonId),
    getLessonManeuvers(lessonId),
    getPerformanceStandards(lessonId),
    getManeuverExpectations(lessonId),
    getLessonResources(lessonId),
    getLessonSuggestions(lessonId)
  ])
  
  if (!syllabus || !lesson) {
    notFound()
  }

  const supabase = await createClient(await cookies())

  // Get all lessons in this syllabus for prev/next navigation
  const { data: allLessons } = await supabase
    .from('syllabus_lessons')
    .select('id, title, description, lesson_type, order_index, estimated_hours')
    .eq('syllabus_id', syllabusId)
    .order('order_index')

  // Find current lesson index and get prev/next
  const currentIndex = allLessons?.findIndex(l => l.id === lessonId) ?? -1
  const previousLesson = currentIndex > 0 ? allLessons?.[currentIndex - 1] : null
  const nextLesson = currentIndex >= 0 && currentIndex < (allLessons?.length ?? 0) - 1 ? allLessons?.[currentIndex + 1] : null

  // Get ACS standards linked to this lesson
  const { data: acsStandards } = await supabase
    .from('lesson_acs_standards')
    .select(`
      acs_task_id,
      is_primary_focus,
      proficiency_target,
      acs_tasks (
        id,
        code,
        title,
        skill_elements,
        knowledge_elements,
        risk_management_elements,
        acs_area:acs_areas (
          id,
          code,
          title
        )
      )
    `)
    .eq('lesson_id', lessonId)

  // Get FAR references (commented out until schema is applied)
  // const { data: farReferences } = await supabase
  //   .from('lesson_far_references')
  //   .select('far_part, far_section, far_subsection, description, relevance')
  //   .eq('lesson_id', lessonId)
  const farReferences = null  // Fallback

  // Resources are now fetched in Promise.all() above via getLessonResources()

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Keyboard Navigation */}
      <LessonNavigationKeyboard 
        syllabusId={syllabusId}
        previousLessonId={previousLesson?.id || null}
        nextLessonId={nextLesson?.id || null}
      />

      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link 
          href={`/instructor/syllabi/${syllabusId}`} 
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to {syllabus.title}
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold tracking-tight">{lesson.title}</h1>
              <Badge variant="outline" className="text-sm">
                {formatLessonType(lesson.lesson_type)}
              </Badge>
            </div>
            <p className="text-muted-foreground text-lg">
              {lesson.description || "No description provided"}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{lesson.estimated_hours}h</span>
          </div>
          {lessonManeuvers && lessonManeuvers.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
              <Target className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{lessonManeuvers.length} maneuvers</span>
            </div>
          )}
          {acsStandards && acsStandards.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{acsStandards.length} ACS</span>
            </div>
          )}
        </div>
      </div>

      {/* Migration Notice - Show if new tables don't exist yet */}
      {!performanceStandards && !maneuverExpectations && !resources && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm">
            <strong>Enhanced features available!</strong> Apply the database migration to enable edit suggestions, structured performance standards, and resource management.
            <br />
            <code className="text-xs mt-1 block">Run: database/lesson-edit-suggestions-schema.sql</code>
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Suggestions Alert */}
      {pendingSuggestions && pendingSuggestions.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm">
            You have <strong>{pendingSuggestions.length}</strong> pending edit suggestion{pendingSuggestions.length !== 1 ? 's' : ''} awaiting admin review.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button size="lg" asChild>
          <Link href={`/instructor/missions/new?lesson=${lessonId}`}>
            <Plane className="h-4 w-4 mr-2" />
            Create Mission from Lesson
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href={`/instructor/syllabi/${syllabusId}/lessons/${lessonId}/poa`}>
            <Mic className="h-4 w-4 mr-2" />
            Create Plan of Action
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href={`/instructor/syllabi/${syllabusId}/lessons/${lessonId}/ai-assist`}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Teaching Assistant
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="objectives">Objectives</TabsTrigger>
          <TabsTrigger value="maneuvers">Maneuvers</TabsTrigger>
          <TabsTrigger value="standards">ACS Standards</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="briefing">Briefing Notes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Maneuvers to Practice - PROMINENT DISPLAY */}
          {lessonManeuvers && lessonManeuvers.length > 0 && (
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Maneuvers to Practice ({lessonManeuvers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {lessonManeuvers.map((lm: any) => (
                    <div key={lm.id} className="flex items-start gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary flex-shrink-0">
                        <Target className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-semibold text-sm">{lm.maneuver?.name}</h4>
                          {lm.is_required && (
                            <Badge variant="destructive" className="text-xs px-1 py-0">Required</Badge>
                          )}
                          {lm.maneuver?.category && (
                            <Badge variant="outline" className="text-xs px-1 py-0">{lm.maneuver.category}</Badge>
                          )}
                        </div>
                        {lm.maneuver?.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{lm.maneuver.description}</p>
                        )}
                        {lm.maneuver?.primary_acs_task_code && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs font-mono text-muted-foreground">ACS: {lm.maneuver.primary_acs_task_code}</span>
                          </div>
                        )}
                      </div>
                      {lm.target_proficiency && (
                        <div className="text-xs text-muted-foreground">
                          Target: {lm.target_proficiency}/4
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
              {/* Learning Objectives */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      Learning Objectives
                    </CardTitle>
                    <SuggestEditDialog
                      lessonId={lessonId}
                      fieldName="objective"
                      fieldLabel="Learning Objectives"
                      currentValue={lesson.objective}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {lesson.objective ? (
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">{lesson.objective}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No objectives defined yet</p>
                  )}
                </CardContent>
              </Card>

            {/* Performance Standards */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Performance Standards {performanceStandards && `(${performanceStandards.length})`}
                  </CardTitle>
                  {performanceStandards && (
                    <SuggestEditDialog
                      lessonId={lessonId}
                      fieldName="performance_standards"
                      fieldLabel="Performance Standards"
                      currentValue={performanceStandards.map(s => s.standard_text).join('\n')}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {performanceStandards && performanceStandards.length > 0 ? (
                  <ul className="space-y-1.5">
                    {performanceStandards.map((standard) => (
                      <li key={standard.id} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-600 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-muted-foreground">{standard.standard_text}</span>
                          {standard.acs_reference && (
                            <span className="ml-2 text-xs font-mono text-blue-600">
                              ({standard.acs_reference})
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : lesson.performance_standards ? (
                  <ul className="space-y-1.5">
                    {lesson.performance_standards.split(/\n+/).filter(line => line.trim()).map((standard: string, idx: number) => {
                      const trimmed = standard.trim().replace(/^[-•*]\s*/, '')
                      if (!trimmed) return null
                      return (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-600 flex-shrink-0" />
                          <span className="text-muted-foreground">{trimmed}</span>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No performance standards defined yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* FAR References */}
          {farReferences && farReferences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  FAR References
                </CardTitle>
                <CardDescription>
                  Relevant Federal Aviation Regulations for this lesson
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {farReferences.map((ref, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                      <Badge variant="outline" className="mt-0.5">
                        {ref.part}.{ref.section}
                      </Badge>
                      <p className="text-sm flex-1">{ref.description}</p>
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

          {/* Instructor Notes */}
          {lesson.instructor_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Instructor Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{lesson.instructor_notes}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Objectives Tab */}
        <TabsContent value="objectives">
          <Card>
            <CardHeader>
              <CardTitle>Learning Objectives</CardTitle>
              <CardDescription>
                What students should achieve by completing this lesson
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lesson.objective ? (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{lesson.objective}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No objectives defined yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maneuvers Tab */}
        <TabsContent value="maneuvers" className="space-y-3">
          {lessonManeuvers && lessonManeuvers.length > 0 ? (
            lessonManeuvers.map((lm: any) => (
              <Card key={lm.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{lm.maneuver?.name}</CardTitle>
                        {lm.is_required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      </div>
                      <CardDescription className="text-xs">{lm.maneuver?.description}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary" className="text-xs">{lm.maneuver?.category}</Badge>
                      {lm.target_proficiency && (
                        <span className="text-xs text-muted-foreground">Target: {lm.target_proficiency}/4</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {/* ACS Reference */}
                  {lm.maneuver?.primary_acs_task_code && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                      <Badge variant="outline" className="font-mono text-xs">
                        ACS: {lm.maneuver.primary_acs_task_code}
                      </Badge>
                      {lm.maneuver.faa_reference && (
                        <span className="text-xs text-muted-foreground">{lm.maneuver.faa_reference}</span>
                      )}
                    </div>
                  )}

                  {/* Performance Standards/Tolerances */}
                  {lm.maneuver?.tolerances && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold">Performance Standards:</p>
                      <div className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 p-2 rounded-md">
                        {lm.maneuver.tolerances}
                      </div>
                    </div>
                  )}

                  {/* Instructor Notes for THIS lesson */}
                  {lm.instructor_notes && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold">Instructor Notes (for this lesson):</p>
                      <div className="text-xs text-blue-900 dark:text-blue-100 whitespace-pre-wrap bg-blue-50 dark:bg-blue-950/20 p-2 rounded-md border border-blue-200 dark:border-blue-800">
                        {lm.instructor_notes}
                      </div>
                    </div>
                  )}

                  {/* Emphasis Level */}
                  {lm.emphasis_level && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Emphasis:</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {lm.emphasis_level}
                      </Badge>
                      {lm.is_introduction && (
                        <Badge variant="secondary" className="text-xs">First Exposure</Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Target className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-base font-semibold mb-1">No Maneuvers Linked</h3>
                <p className="text-sm text-muted-foreground">
                  No maneuvers have been linked to this lesson yet. Contact an admin to add maneuvers.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ACS Standards Tab */}
        <TabsContent value="standards" className="space-y-3">
          {acsStandards && acsStandards.length > 0 ? (
            acsStandards.map((standard: any) => {
              const task = standard.acs_tasks
              const area = task?.acs_area
              return (
                <Card key={standard.acs_task_id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Badge variant="outline" className="font-mono text-xs">
                            {area?.code || 'N/A'}
                          </Badge>
                          <Badge variant="outline" className="font-mono text-xs font-semibold">
                            {task?.code || 'N/A'}
                          </Badge>
                          {standard.is_primary_focus && (
                            <Badge variant="default" className="text-xs">Primary Focus</Badge>
                          )}
                          {standard.proficiency_target && (
                            <span className="text-xs text-muted-foreground ml-2">
                              Target: {standard.proficiency_target}/4
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-base mb-0.5">
                          {task?.title || 'Unknown Task'}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {area?.title || 'Unknown Area'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {(task?.skill_elements || task?.knowledge_elements || task?.risk_management_elements) && (
                    <CardContent className="pt-0 space-y-2.5">
                      {/* Skill Elements */}
                      {task.skill_elements && Array.isArray(task.skill_elements) && task.skill_elements.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-1.5 text-blue-600">Skill Elements:</p>
                          <ul className="space-y-0.5 text-xs text-muted-foreground">
                            {task.skill_elements.map((skill: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>{skill}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Knowledge Elements */}
                      {task.knowledge_elements && Array.isArray(task.knowledge_elements) && task.knowledge_elements.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-1.5 text-green-600">Knowledge Elements:</p>
                          <ul className="space-y-0.5 text-xs text-muted-foreground">
                            {task.knowledge_elements.map((knowledge: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-green-600 mt-0.5">•</span>
                                <span>{knowledge}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Risk Management Elements */}
                      {task.risk_management_elements && Array.isArray(task.risk_management_elements) && task.risk_management_elements.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-1.5 text-orange-600">Risk Management:</p>
                          <ul className="space-y-0.5 text-xs text-muted-foreground">
                            {task.risk_management_elements.map((risk: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-orange-600 mt-0.5">•</span>
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-base font-semibold mb-1">No ACS Standards Linked</h3>
                <p className="text-sm text-muted-foreground">
                  No ACS standards have been linked to this lesson yet. Contact an admin to link ACS tasks.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          {resources && resources.length > 0 ? (
            <div className="grid gap-4">
              {resources.map((resource) => (
                <Card key={resource.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                        {resource.resource_type === 'video' && <Video className="h-6 w-6" />}
                        {resource.resource_type === 'link' && <ExternalLink className="h-6 w-6" />}
                        {resource.resource_type === 'pdf' && <FileText className="h-6 w-6" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{resource.title}</h3>
                            {resource.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {resource.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {resource.resource_type}
                          </Badge>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <a 
                            href={resource.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2"
                          >
                            View Resource
                            <ExternalLink className="h-3 w-3" />
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
                  No learning resources have been added to this lesson yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Briefing Notes Tab */}
        <TabsContent value="briefing" className="space-y-6">
          {/* Pre-Brief Content */}
          <Card>
            <CardHeader>
              <CardTitle>Pre-Brief Content</CardTitle>
              <CardDescription>
                Information to cover before the flight/training session
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lesson.pre_brief_content ? (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{lesson.pre_brief_content}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No pre-brief content defined.</p>
              )}
            </CardContent>
          </Card>

          {/* Post-Brief Content */}
          <Card>
            <CardHeader>
              <CardTitle>Post-Brief Content</CardTitle>
              <CardDescription>
                Key debrief points and areas to review after the session
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lesson.post_brief_content ? (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{lesson.post_brief_content}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No post-brief content defined.</p>
              )}
            </CardContent>
          </Card>

          {/* Student Prep Materials */}
          {lesson.student_prep_materials && (
            <Card>
              <CardHeader>
                <CardTitle>Student Preparation Materials</CardTitle>
                <CardDescription>
                  What students should study before this lesson
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{lesson.student_prep_materials}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Previous/Next Lesson Navigation */}
      {(previousLesson || nextLesson) && (
        <div className="mt-8 pt-6 border-t border-border/40">
          <div className="grid gap-3 md:grid-cols-2">
            {/* Previous Lesson */}
            {previousLesson ? (
              <Link 
                href={`/instructor/syllabi/${syllabusId}/lessons/${previousLesson.id}`}
                className="group block"
              >
                <div className="relative overflow-hidden rounded-lg p-3 transition-all bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900 dark:hover:to-indigo-900 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <ArrowLeft className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-wide text-blue-700 dark:text-blue-300 font-medium mb-0.5">
                        Previous
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                        {previousLesson.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 font-medium">
                          {formatLessonType(previousLesson.lesson_type)}
                        </span>
                        <span className="text-[10px] text-gray-700 dark:text-gray-300 font-medium">
                          {previousLesson.estimated_hours}h
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div /> 
            )}

            {/* Next Lesson */}
            {nextLesson ? (
              <Link 
                href={`/instructor/syllabi/${syllabusId}/lessons/${nextLesson.id}`}
                className="group block"
              >
                <div className="relative overflow-hidden rounded-lg p-3 transition-all bg-gradient-to-bl from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 hover:from-violet-100 hover:to-purple-100 dark:hover:from-violet-900 dark:hover:to-purple-900 border border-violet-200 dark:border-violet-800">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0 text-right">
                      <div className="text-[10px] uppercase tracking-wide text-violet-700 dark:text-violet-300 font-medium mb-0.5">
                        Next
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                        {nextLesson.title}
                      </div>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <span className="text-[10px] text-gray-700 dark:text-gray-300 font-medium">
                          {nextLesson.estimated_hours}h
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-200 dark:bg-violet-800 text-violet-900 dark:text-violet-100 font-medium">
                          {formatLessonType(nextLesson.lesson_type)}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                  </div>
                </div>
              </Link>
            ) : (
              <div />
            )}
          </div>
          
          {/* Keyboard hint - subtle and small */}
          <div className="text-center mt-3">
            <span className="text-[10px] text-muted-foreground">
              Use <kbd className="px-1 py-0.5 text-[9px] font-medium text-gray-700 dark:text-gray-300 bg-muted border border-border rounded">←</kbd> <kbd className="px-1 py-0.5 text-[9px] font-medium text-gray-700 dark:text-gray-300 bg-muted border border-border rounded">→</kbd> to navigate
            </span>
          </div>
        </div>
      )}
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

