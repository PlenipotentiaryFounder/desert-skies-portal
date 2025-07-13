import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StudentRequirementsList } from "./student-requirements-list"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, CheckCircle2, FileText } from "lucide-react"

export const metadata = {
  title: "FAA Requirements | Student Portal",
  description: "Track your progress toward FAA certification requirements and ACS standards",
}

export default async function StudentRequirementsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FAA Requirements & ACS Standards</h1>
          <p className="text-muted-foreground">
            Track your progress toward certification and monitor ACS compliance
          </p>
        </div>
      </div>

      <Tabs defaultValue="requirements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requirements" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            FAA Requirements
          </TabsTrigger>
          <TabsTrigger value="acs-standards" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            ACS Standards
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Overall Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="space-y-6">
          <Suspense fallback={<RequirementsSkeleton />}>
            <StudentRequirementsList studentId={user.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="acs-standards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ACS Standards Tracking</CardTitle>
              <CardDescription>
                Monitor your progress through Airman Certification Standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ACSStandardsSkeleton />}>
                <ACSStandardsDisplay studentId={user.id} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Certification Progress</CardTitle>
                <CardDescription>Your overall progress toward certification</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
                  <CertificationProgressChart studentId={user.id} />
                </Suspense>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>ACS Knowledge Areas</CardTitle>
                <CardDescription>Areas of Operation progress</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
                  <ACSKnowledgeProgress studentId={user.id} />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RequirementsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
}

function ACSStandardsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-6 w-2/3" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}

// Placeholder components - we'll implement these next
async function ACSStandardsDisplay({ studentId }: { studentId: string }) {
  return (
    <div className="text-center p-8">
      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">ACS Standards Integration</h3>
      <p className="text-muted-foreground">
        Connecting to FAA ACS monitoring system for real-time standards tracking...
      </p>
    </div>
  )
}

async function CertificationProgressChart({ studentId }: { studentId: string }) {
  return (
    <div className="text-center p-8">
      <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Progress Chart</h3>
      <p className="text-muted-foreground">
        Visual progress tracking coming soon...
      </p>
    </div>
  )
}

async function ACSKnowledgeProgress({ studentId }: { studentId: string }) {
  return (
    <div className="text-center p-8">
      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Knowledge Areas</h3>
      <p className="text-muted-foreground">
        ACS knowledge area tracking integration...
      </p>
    </div>
  )
} 