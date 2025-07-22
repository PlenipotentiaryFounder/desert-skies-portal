import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Settings, BookOpen, FileText, Database } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Requirements Management | Admin Portal",
  description: "Manage FAA requirements and ACS standards for Desert Skies Aviation",
}

export default async function AdminRequirementsPage() {
  const supabase = createClient(await cookies())
  
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
          <h1 className="text-3xl font-bold tracking-tight">Requirements Management</h1>
          <p className="text-muted-foreground">
            Manage FAA certification requirements and ACS standards
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/requirements/new">
              <div className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Add Requirement
              </div>
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="requirements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requirements" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            FAA Requirements
          </TabsTrigger>
          <TabsTrigger value="acs-integration" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            ACS Integration
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            ACS Monitoring
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>FAA Requirements by Certificate Type</CardTitle>
                <CardDescription>
                  Manage minimum hour requirements for each certificate type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<RequirementsSkeleton />}>
                  <FAARequirementsManager />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="acs-integration" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>ACS Documents Status</CardTitle>
                <CardDescription>Current status of ACS document monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
                  <ACSDocumentsStatus />
                </Suspense>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Standards Integration</CardTitle>
                <CardDescription>Link ACS standards to requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
                  <ACSStandardsIntegration />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ACS Document Monitoring</CardTitle>
              <CardDescription>
                Real-time monitoring of FAA ACS document changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                <ACSMonitoringDashboard />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Requirements Settings</CardTitle>
                <CardDescription>Configure requirements tracking behavior</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
                  <RequirementsSettings />
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
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-[300px] w-full" />
    </div>
  )
}

// Placeholder components - we'll implement these with the ACS integration
async function FAARequirementsManager() {
  return (
    <div className="text-center p-8">
      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Requirements Manager</h3>
      <p className="text-muted-foreground mb-4">
        Comprehensive FAA requirements management interface
      </p>
      <Button asChild>
        <Link href="/admin/requirements/manage">
          Manage Requirements
        </Link>
      </Button>
    </div>
  )
}

async function ACSDocumentsStatus() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Document Status</h4>
        <span className="text-sm text-green-600 font-medium">✓ Up to date</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Private Pilot ACS</span>
          <span className="text-muted-foreground">Last updated: Today</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Commercial Pilot ACS</span>
          <span className="text-muted-foreground">Last updated: Today</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Instrument Rating ACS</span>
          <span className="text-muted-foreground">Last updated: Today</span>
        </div>
      </div>
      <Button variant="outline" size="sm" className="w-full">
        View All Documents
      </Button>
    </div>
  )
}

async function ACSStandardsIntegration() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <h4 className="font-semibold">Standards Mapping</h4>
        <p className="text-sm text-muted-foreground">
          Connect ACS knowledge areas to requirements
        </p>
      </div>
      <Button variant="outline" size="sm" className="w-full">
        Configure Integration
      </Button>
    </div>
  )
}

async function ACSMonitoringDashboard() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="text-center p-4 border rounded">
          <div className="text-2xl font-bold text-green-600">12</div>
          <div className="text-sm text-muted-foreground">Documents Monitored</div>
        </div>
        <div className="text-center p-4 border rounded">
          <div className="text-2xl font-bold text-blue-600">0</div>
          <div className="text-sm text-muted-foreground">Recent Changes</div>
        </div>
        <div className="text-center p-4 border rounded">
          <div className="text-2xl font-bold text-orange-600">24h</div>
          <div className="text-sm text-muted-foreground">Last Check</div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Monitoring system is active and checking for ACS document updates
        </p>
        <Button variant="outline" size="sm">
          View Monitoring Logs
        </Button>
      </div>
    </div>
  )
}

async function RequirementsSettings() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <Settings className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <h4 className="font-semibold">Configuration</h4>
        <p className="text-sm text-muted-foreground">
          System-wide requirements settings
        </p>
      </div>
      <Button variant="outline" size="sm" className="w-full">
        Configure Settings
      </Button>
    </div>
  )
} 