import { Suspense } from "react"
import { getSyllabi } from "@/lib/syllabus-service"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { BookOpen, Users, Clock, TrendingUp, ChevronRight, GraduationCap } from "lucide-react"

export const metadata = {
  title: "Training Syllabi | Instructor",
  description: "View syllabi and track student progress"
}

export default async function InstructorSyllabiPage() {
  const syllabi = await getSyllabi()
  const supabase = await createClient(await cookies())
  
  // Get current instructor's ID
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get instructor's students across all syllabi
  const { data: enrollments } = await supabase
    .from('student_enrollments')
    .select('syllabus_id, status')
    .eq('instructor_id', user.id)

  // Group enrollments by syllabus
  const enrollmentsBySyllabus = new Map<string, { active: number; total: number }>()
  enrollments?.forEach(e => {
    if (!enrollmentsBySyllabus.has(e.syllabus_id)) {
      enrollmentsBySyllabus.set(e.syllabus_id, { active: 0, total: 0 })
    }
    const stats = enrollmentsBySyllabus.get(e.syllabus_id)!
    stats.total++
    if (e.status === 'active') stats.active++
  })

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Training Syllabi</h1>
          <p className="text-muted-foreground mt-2">
            View syllabi and track your students' progress through their training programs
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Syllabi</p>
                <p className="text-2xl font-bold">{syllabi.filter(s => s.is_active).length}</p>
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
                <p className="text-2xl font-bold">
                  {Array.from(enrollmentsBySyllabus.values()).reduce((sum, s) => sum + s.total, 0)}
                </p>
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
                  {Array.from(enrollmentsBySyllabus.values()).reduce((sum, s) => sum + s.active, 0)}
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
                <p className="text-sm font-medium text-muted-foreground">Total Lessons</p>
                <p className="text-2xl font-bold">
                  {syllabi.reduce((sum, s) => sum + (s.lesson_count || 0), 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Syllabi Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {syllabi.map((syllabus) => {
          const myStudents = enrollmentsBySyllabus.get(syllabus.id)
          
          return (
            <Card key={syllabus.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {syllabus.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {syllabus.description || "No description"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Certificate Badge */}
                {syllabus.faa_type && (
                  <Badge variant="outline" className={getCertificateColor(syllabus.faa_type)}>
                    {formatCertificateType(syllabus.faa_type)}
                  </Badge>
                )}

                {/* Lesson Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>
                      <strong className="text-foreground">{syllabus.lesson_count || 0}</strong> Lessons
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      <strong className="text-foreground">-</strong> Hours
                    </span>
                  </div>
                </div>

                {/* My Students Info */}
                {myStudents && myStudents.total > 0 ? (
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">My Students</span>
                      <Badge variant="secondary">
                        {myStudents.active} active / {myStudents.total} total
                      </Badge>
                    </div>
                    <Progress 
                      value={(myStudents.active / myStudents.total) * 100} 
                      className="h-2"
                    />
                  </div>
                ) : (
                  <div className="pt-3 border-t text-sm text-muted-foreground">
                    No students enrolled
                  </div>
                )}

                {/* View Button */}
                <Button asChild className="w-full">
                  <Link href={`/instructor/syllabi/${syllabus.id}`}>
                    View Syllabus
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
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
