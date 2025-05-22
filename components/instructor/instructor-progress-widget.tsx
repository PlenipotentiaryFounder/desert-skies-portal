import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarCheck2, AlertTriangle } from "lucide-react"

function getExpectedProgress(startDate: string, totalLessons: number): number {
  // Assume a 90-day syllabus for simplicity
  const daysSinceStart = (Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  const expected = Math.min(1, daysSinceStart / 90)
  return expected * totalLessons
}

export function InstructorProgressWidget({ enrollments, isLoading }: { enrollments: any[], isLoading?: boolean }) {
  if (isLoading) {
    return <Skeleton className="h-[120px] w-full" />
  }
  if (!enrollments || enrollments.length === 0) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Student Progress</CardTitle>
          <CardDescription>No students enrolled yet.</CardDescription>
        </CardHeader>
      </Card>
    )
  }
  let onTrack = 0, behind = 0, recentCompletions = 0
  const now = Date.now()
  enrollments.forEach(e => {
    const expected = getExpectedProgress(e.start_date, e.totalLessons)
    if ((e.completedLessons?.length || 0) >= 0.7 * expected) {
      onTrack++
    } else {
      behind++
    }
    // Count completions in last 7 days
    if (e.completedLessons) {
      recentCompletions += e.completedLessons.filter((l: any) => {
        const completed = l.completed_at ? new Date(l.completed_at).getTime() : 0
        return completed > now - 7 * 24 * 60 * 60 * 1000
      }).length
    }
  })
  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Student Progress</CardTitle>
          <CardDescription>At-a-glance progress for your students</CardDescription>
        </div>
        <CalendarCheck2 className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex gap-4 items-center">
          <span className="text-green-600 font-semibold">{onTrack} on track</span>
          <span className="text-yellow-600 font-semibold">{behind} behind</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-primary font-semibold">{recentCompletions} completions this week</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">Students are considered "on track" if they've completed at least 70% of expected lessons for their time in the syllabus.</div>
      </CardContent>
    </Card>
  )
} 