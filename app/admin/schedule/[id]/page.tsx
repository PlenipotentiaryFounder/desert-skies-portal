import { notFound } from "next/navigation"
import Link from "next/link"
import { Edit } from "lucide-react"
import { getFlightSessionById, getAvailableManeuversForLesson } from "@/lib/flight-session-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FlightSessionDetails } from "./flight-session-details"
import { ManeuverScoring } from "./maneuver-scoring"

export const metadata = {
  title: "Flight Session Details | Desert Skies Aviation",
  description: "View and manage flight session details",
}

export default async function FlightSessionDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getFlightSessionById(params.id)

  if (!session) {
    notFound()
  }

  // Get maneuvers for this lesson
  const maneuvers = await getAvailableManeuversForLesson(session.lesson_id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flight Session Details</h1>
          <p className="text-muted-foreground">
            {session.lesson?.title} with {session.student?.first_name} {session.student?.last_name}
          </p>
        </div>
        <Button asChild>
          <Link href={`/admin/schedule/${params.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Session
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
              <CardDescription>Details about this flight session</CardDescription>
            </CardHeader>
            <CardContent>
              <FlightSessionDetails session={session} />
            </CardContent>
          </Card>

          {session.status === "completed" && maneuvers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Maneuver Scoring</CardTitle>
                <CardDescription>Record and track student performance on flight maneuvers</CardDescription>
              </CardHeader>
              <CardContent>
                <ManeuverScoring
                  sessionId={session.id}
                  maneuvers={maneuvers}
                  existingScores={session.maneuver_scores || []}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <div className="text-sm font-medium">Name</div>
                  <div>
                    {session.student?.first_name} {session.student?.last_name}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Email</div>
                  <div>{session.student?.email}</div>
                </div>
                <Separator className="my-4" />
                <div>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/admin/students/${session.enrollment?.student_id}`}>View Student Profile</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instructor Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <div className="text-sm font-medium">Name</div>
                  <div>
                    {session.instructor?.first_name} {session.instructor?.last_name}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Email</div>
                  <div>{session.instructor?.email}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aircraft Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <div className="text-sm font-medium">Tail Number</div>
                  <div>{session.aircraft?.tail_number}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Aircraft</div>
                  <div>
                    {session.aircraft?.make} {session.aircraft?.model}
                  </div>
                </div>
                <Separator className="my-4" />
                <div>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/admin/aircraft/${session.aircraft_id}`}>View Aircraft Details</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
