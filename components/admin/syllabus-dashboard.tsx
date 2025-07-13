"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Clock, 
  Users, 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertCircle,
  Plane,
  GraduationCap,
  Calendar,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Target,
  Award
} from "lucide-react"
import type { SyllabusStatistics } from "@/lib/syllabus-service"
import { cn } from "@/lib/utils"

interface SyllabusDashboardProps {
  statistics: SyllabusStatistics
  syllabusTitle: string
  faaType: string
  isExpanded?: boolean
  onToggleExpanded?: () => void
}

export function SyllabusDashboard({ 
  statistics, 
  syllabusTitle, 
  faaType,
  isExpanded = false,
  onToggleExpanded 
}: SyllabusDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const complianceStatus = statistics.faaCompliance.compliancePercentage >= 100 ? "compliant" : "warning"
  const enrollmentTrend = statistics.enrollmentTrends.thisMonth >= statistics.enrollmentTrends.lastMonth ? "up" : "down"

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{syllabusTitle}</h2>
            <p className="text-blue-600 font-medium">{faaType}</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge 
              variant={complianceStatus === "compliant" ? "default" : "destructive"}
              className="px-3 py-1"
            >
              {complianceStatus === "compliant" ? (
                <CheckCircle className="w-4 h-4 mr-1" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-1" />
              )}
              FAA {complianceStatus === "compliant" ? "Compliant" : "Review Needed"}
            </Badge>
            {onToggleExpanded && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onToggleExpanded}
                className="text-blue-600 hover:text-blue-800"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Expand Details
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Flight Hours</p>
                  <p className="text-2xl font-bold text-blue-600">{statistics.totalFlightHours}</p>
                </div>
                <Plane className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ground Hours</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.totalGroundHours}</p>
                </div>
                <BookOpen className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Students</p>
                  <p className="text-2xl font-bold text-purple-600">{statistics.activeStudents}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Lessons</p>
                  <p className="text-2xl font-bold text-orange-600">{statistics.totalLessons}</p>
                </div>
                <GraduationCap className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAA Compliance Bar */}
        <Card className="mb-6 bg-white/70 backdrop-blur-sm border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">FAA Compliance</h3>
              <span className="text-sm font-medium text-gray-600">
                {statistics.faaCompliance.compliancePercentage}%
              </span>
            </div>
            <Progress 
              value={Math.min(statistics.faaCompliance.compliancePercentage, 100)} 
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                Flight: {statistics.faaCompliance.actualFlightHours}/{statistics.faaCompliance.requiredFlightHours}h
              </span>
              <span>
                Ground: {statistics.faaCompliance.actualGroundHours}/{statistics.faaCompliance.requiredGroundHours}h
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-blue-200 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
              <TabsTrigger value="lessons">Lesson Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Enrollment Overview */}
                <Card className="bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Student Enrollment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Enrolled</span>
                        <span className="font-semibold">{statistics.enrolledStudents}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active</span>
                        <span className="font-semibold text-green-600">{statistics.activeStudents}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Completed</span>
                        <span className="font-semibold text-blue-600">{statistics.completedStudents}</span>
                      </div>
                      {statistics.averageCompletionTime && (
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm text-gray-600">Avg. Completion</span>
                          <span className="font-semibold">{statistics.averageCompletionTime} days</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Enrollment Trends */}
                <Card className="bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Enrollment Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">This Month</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{statistics.enrollmentTrends.thisMonth}</span>
                          {enrollmentTrend === "up" ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Last Month</span>
                        <span className="font-semibold">{statistics.enrollmentTrends.lastMonth}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">This Year</span>
                        <span className="font-semibold">{statistics.enrollmentTrends.thisYear}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="enrollment" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white/70 backdrop-blur-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {statistics.completedStudents}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                    <Award className="w-6 h-6 mx-auto mt-2 text-green-500" />
                  </CardContent>
                </Card>

                <Card className="bg-white/70 backdrop-blur-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {statistics.activeStudents}
                    </div>
                    <div className="text-sm text-gray-600">In Progress</div>
                    <Target className="w-6 h-6 mx-auto mt-2 text-blue-500" />
                  </CardContent>
                </Card>

                <Card className="bg-white/70 backdrop-blur-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-gray-600 mb-2">
                      {statistics.enrolledStudents - statistics.activeStudents - statistics.completedStudents}
                    </div>
                    <div className="text-sm text-gray-600">On Hold/Withdrawn</div>
                    <Clock className="w-6 h-6 mx-auto mt-2 text-gray-500" />
                  </CardContent>
                </Card>
              </div>

              {statistics.averageCompletionTime && (
                <Card className="bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Completion Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        {statistics.averageCompletionTime}
                      </div>
                      <div className="text-gray-600">Average Days to Complete</div>
                      <p className="text-sm text-gray-500 mt-2">
                        Based on {statistics.completedStudents} completed enrollments
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="lessons" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white/70 backdrop-blur-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {statistics.lessonDistribution.flight}
                    </div>
                    <div className="text-sm text-gray-600">Flight Lessons</div>
                  </CardContent>
                </Card>

                <Card className="bg-white/70 backdrop-blur-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {statistics.lessonDistribution.ground}
                    </div>
                    <div className="text-sm text-gray-600">Ground Lessons</div>
                  </CardContent>
                </Card>

                <Card className="bg-white/70 backdrop-blur-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {statistics.lessonDistribution.simulator}
                    </div>
                    <div className="text-sm text-gray-600">Simulator</div>
                  </CardContent>
                </Card>

                <Card className="bg-white/70 backdrop-blur-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {statistics.lessonDistribution.checkride}
                    </div>
                    <div className="text-sm text-gray-600">Checkrides</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Hour Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Flight Hours</span>
                        <span className="text-sm text-gray-600">
                          {statistics.totalFlightHours}h / {statistics.faaCompliance.requiredFlightHours}h required
                        </span>
                      </div>
                      <Progress 
                        value={(statistics.totalFlightHours / statistics.faaCompliance.requiredFlightHours) * 100} 
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Ground Hours</span>
                        <span className="text-sm text-gray-600">
                          {statistics.totalGroundHours}h / {statistics.faaCompliance.requiredGroundHours}h required
                        </span>
                      </div>
                      <Progress 
                        value={(statistics.totalGroundHours / statistics.faaCompliance.requiredGroundHours) * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
} 