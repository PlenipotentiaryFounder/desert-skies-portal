import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { Users, Eye, TrendingUp, Clock, Calendar } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface SyllabusStudentsTabProps {
  syllabusId: string
}

export async function SyllabusStudentsTab({ syllabusId }: SyllabusStudentsTabProps) {
  const supabase = await createClient(await cookies())

  // Get all enrollments for this syllabus
  const { data: enrollments } = await supabase
    .from('student_enrollments')
    .select(`
      *,
      student:student_id (
        id,
        first_name,
        last_name,
        email
      ),
      instructor:instructor_id (
        id,
        first_name,
        last_name
      )
    `)
    .eq('syllabus_id', syllabusId)
    .order('created_at', { ascending: false })

  if (!enrollments || enrollments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Students Enrolled</h3>
          <p className="text-muted-foreground text-center mb-4 max-w-md">
            No students are currently enrolled in this syllabus.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Enrolled Students</h3>
          <p className="text-sm text-muted-foreground">
            {enrollments.length} student{enrollments.length !== 1 ? 's' : ''} enrolled
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {enrollments.map((enrollment: any) => (
          <Card key={enrollment.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {enrollment.student?.first_name?.[0]}
                      {enrollment.student?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">
                        {enrollment.student?.first_name} {enrollment.student?.last_name}
                      </h4>
                      <Badge 
                        variant={enrollment.status === 'active' ? 'default' : 'secondary'}
                      >
                        {enrollment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {enrollment.student?.email}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Started: {formatDate(enrollment.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          Instructor: {enrollment.instructor?.first_name} {enrollment.instructor?.last_name}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar - TODO: Calculate from lesson progress */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Overall Progress</span>
                        <span className="text-xs font-medium">0%</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                  </div>
                </div>

                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/students/${enrollment.student_id}/progress`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Progress
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

