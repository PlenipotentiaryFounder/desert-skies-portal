import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { getMissionById } from "@/lib/mission-service"
import { getManeuversByLesson } from "@/lib/maneuver-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft,
  FileText,
  AlertTriangle,
  Mic,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { DebriefForm } from "@/components/instructor/debrief-form"

export async function generateMetadata({ params }: { params: { id: string } }) {
  const mission = await getMissionById(params.id)
  return {
    title: `Debrief - ${mission?.mission_code || 'Mission'} | Desert Skies Aviation`,
    description: `Post-mission debrief and documentation`,
  }
}

export default async function DebriefPage({
  params,
}: {
  params: { id: string }
}) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  const mission = await getMissionById(params.id)

  if (!mission) {
    notFound()
  }

  // Verify instructor has access
  if (mission.assigned_instructor_id !== user.id) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            You don't have permission to create this debrief.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Check if debrief already exists
  if (mission.debrief_id) {
    redirect(`/instructor/missions/${params.id}/debrief/view`)
  }

  // Get maneuvers for this lesson/mission
  let maneuvers: any[] = []
  if (mission.lesson_template_id) {
    maneuvers = await getManeuversByLesson(mission.lesson_template_id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/instructor/missions/${params.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Mission
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Debrief</h1>
            <p className="text-muted-foreground">{mission.mission_code}</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Debrief Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="flex items-start gap-2">
            <Mic className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Use the voice recorder to capture your verbal debrief with the student</span>
          </p>
          <p className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-500" />
            <span>AI will automatically format your recording into a structured debrief</span>
          </p>
          <p>• Score each maneuver practiced (1-4 scale)</p>
          <p>• Note strengths and areas for improvement</p>
          <p>• Plan next steps for continued training</p>
        </CardContent>
      </Card>

      {/* Debrief Form */}
      <DebriefForm
        mission={mission}
        maneuvers={maneuvers}
        instructorId={user.id}
      />
    </div>
  )
}

