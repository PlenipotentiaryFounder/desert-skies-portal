"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle2, Clock, FileCheck, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  getStudentCertificateProgress,
  type CertificateType,
  type StudentRequirement,
} from "@/lib/faa-requirements-service"

interface StudentRequirementsListProps {
  studentId: string
}

export function StudentRequirementsList({ studentId }: StudentRequirementsListProps) {
  const [activeTab, setActiveTab] = useState<CertificateType>("private_pilot")
  const [requirements, setRequirements] = useState<StudentRequirement[]>([])
  const [progress, setProgress] = useState({
    totalRequirements: 0,
    completedRequirements: 0,
    progressPercentage: 0,
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchRequirements() {
      setLoading(true)
      try {
        const progress = await getStudentCertificateProgress(studentId, activeTab)
        setRequirements(progress.requirements)
        setProgress({
          totalRequirements: progress.totalRequirements,
          completedRequirements: progress.completedRequirements,
          progressPercentage: progress.progressPercentage,
        })
      } catch (error) {
        console.error("Error fetching requirements:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequirements()
  }, [studentId, activeTab])

  const certificateLabels: Record<CertificateType, string> = {
    private_pilot: "Private Pilot",
    commercial_pilot: "Commercial Pilot",
    instrument_rating: "Instrument Rating",
    flight_instructor: "Flight Instructor",
    multi_engine: "Multi-Engine",
    atp: "Airline Transport Pilot",
  }

  const categoryLabels: Record<string, string> = {
    total_time: "Total Time",
    pilot_in_command: "Pilot in Command",
    solo: "Solo",
    cross_country: "Cross Country",
    night: "Night",
    instrument: "Instrument",
    complex: "Complex Aircraft",
    high_performance: "High Performance",
    tailwheel: "Tailwheel",
    multi_engine: "Multi-Engine",
    simulator: "Flight Simulator",
    dual_received: "Dual Received",
    dual_given: "Dual Given",
    takeoffs_landings: "Takeoffs & Landings",
    checkride: "Checkride",
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-4 w-full max-w-sm" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (requirements.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <FileCheck className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Requirements Found</h3>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            There are no FAA requirements set up for this certificate type yet.
          </p>
          <Button className="mt-4" onClick={() => router.push("/student/logbook")}>
            Go to Logbook
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Certificate Progress</CardTitle>
          <CardDescription>Track your progress toward FAA certificate requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Overall Completion</p>
                <p className="text-sm text-muted-foreground">
                  {progress.completedRequirements} of {progress.totalRequirements} requirements met
                </p>
              </div>
              <span className="text-lg font-bold">{Math.round(progress.progressPercentage)}%</span>
            </div>
            <Progress value={progress.progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="private_pilot" value={activeTab} onValueChange={(v) => setActiveTab(v as CertificateType)}>
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="private_pilot">Private</TabsTrigger>
          <TabsTrigger value="instrument_rating">Instrument</TabsTrigger>
          <TabsTrigger value="commercial_pilot">Commercial</TabsTrigger>
          <TabsTrigger value="multi_engine">Multi-Engine</TabsTrigger>
          <TabsTrigger value="flight_instructor">CFI</TabsTrigger>
          <TabsTrigger value="atp">ATP</TabsTrigger>
        </TabsList>

        {Object.entries(certificateLabels).map(([cert, label]) => (
          <TabsContent key={cert} value={cert} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{label} Certificate Requirements</CardTitle>
                <CardDescription>FAA requirements for {label} certification</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requirement</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px] text-right">Required</TableHead>
                      <TableHead className="w-[100px] text-right">Current</TableHead>
                      <TableHead className="w-[100px] text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requirements
                      .filter((req) => req.requirement?.certificate_type === cert)
                      .sort((a, b) => {
                        // Sort by category
                        const categoryA = a.requirement?.category || ""
                        const categoryB = b.requirement?.category || ""
                        return categoryA.localeCompare(categoryB)
                      })
                      .map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">
                            {categoryLabels[req.requirement?.category || ""] || req.requirement?.category}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start space-x-2">
                              <span>{req.requirement?.description}</span>
                              {req.requirement?.notes && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs">{req.requirement.notes}</p>
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        Reference: {req.requirement.reference}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{req.requirement?.minimum_value}</TableCell>
                          <TableCell className="text-right">{req.current_value.toFixed(1)}</TableCell>
                          <TableCell className="text-center">
                            {req.is_complete ? (
                              <Badge className="bg-green-500 hover:bg-green-600">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Complete
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <Clock className="mr-1 h-3 w-3" />
                                In Progress
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
