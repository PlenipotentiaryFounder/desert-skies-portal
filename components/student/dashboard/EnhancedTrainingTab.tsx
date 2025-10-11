"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  BookOpen, 
  Target, 
  Award, 
  Clock, 
  CheckCircle, 
  X, 
  TrendingUp,
  FileText,
  BarChart3,
  Calendar,
  User,
  Plane,
  Navigation,
  HelpCircle,
  Play,
  Eye,
  ExternalLink
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Lesson {
  id: string
  title: string
  description: string
  order_index: number
  lesson_type: string
  estimated_hours: number
  objective?: string
  performance_standards?: string
  completed: boolean
  progress: number
}

interface ManeuverScore {
  id: string
  maneuver_name: string
  score: number
  last_assessed: string
  meets_acs_standard: boolean
}

interface TrainingData {
  currentLesson?: Lesson
  upcomingLessons: Lesson[]
  completedLessons: Lesson[]
  maneuverScores: ManeuverScore[]
  syllabusProgress: number
  totalLessons: number
  completedLessons: number
}

interface EnhancedTrainingTabProps {
  trainingData: TrainingData
  onStartLesson?: (lessonId: string) => void
  onViewLesson?: (lessonId: string) => void
  onViewSyllabus?: () => void
  onViewProgress?: () => void
}

export function EnhancedTrainingTab({ 
  trainingData,
  onStartLesson,
  onViewLesson,
  onViewSyllabus,
  onViewProgress
}: EnhancedTrainingTabProps) {
  const [showEmptyState, setShowEmptyState] = useState(false)

  const getManeuverColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 80) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getManeuverBadge = (score: number) => {
    if (score >= 90) return 'default'
    if (score >= 80) return 'secondary'
    return 'destructive'
  }

  const EmptyStateModal = () => (
    <Dialog open={showEmptyState} onOpenChange={setShowEmptyState}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            About Training
          </DialogTitle>
          <DialogDescription className="space-y-4">
            <p>
              Your training tab will show your progress through the flight training syllabus, including lessons, maneuvers, and performance tracking.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium">Current Lesson</p>
                  <p className="text-sm text-muted-foreground">Your active lesson with objectives and progress</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Maneuver Performance</p>
                  <p className="text-sm text-muted-foreground">Track your skill development and ACS standards</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium">Training Resources</p>
                  <p className="text-sm text-muted-foreground">Access study materials and lesson plans</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium">Progress Tracking</p>
                  <p className="text-sm text-muted-foreground">Monitor your advancement through the syllabus</p>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )

  // Empty state when no training data
  if (!trainingData.currentLesson && trainingData.upcomingLessons.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Flight Training
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowEmptyState(true)}>
                <HelpCircle className="w-4 h-4 mr-2" />
                Learn More
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Training Not Started</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Once you're enrolled in a training program and have scheduled lessons, your training progress and current lesson will appear here.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={onViewSyllabus}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Available Programs
                </Button>
                <Button variant="outline" onClick={() => setShowEmptyState(true)}>
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Learn About Training
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <EmptyStateModal />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Lesson Progress */}
      {trainingData.currentLesson && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Current Lesson Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">{trainingData.currentLesson.title}</h4>
                    <p className="text-sm text-muted-foreground">{trainingData.currentLesson.lesson_type}</p>
                  </div>
                  <Progress value={trainingData.currentLesson.progress} className="h-2" />
                  <p className="text-sm text-muted-foreground">{trainingData.currentLesson.progress}% Complete</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Lesson Objective</h4>
                    <p className="text-sm text-muted-foreground">
                      {trainingData.currentLesson.objective || "Complete assigned maneuvers and procedures"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => onViewLesson?.(trainingData.currentLesson!.id)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Lesson Details
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Estimated Duration</h4>
                    <p className="text-sm text-muted-foreground">{trainingData.currentLesson.estimated_hours} hours</p>
                  </div>
                  <Button size="sm" className="w-full" onClick={() => onStartLesson?.(trainingData.currentLesson!.id)}>
                    <Play className="w-4 h-4 mr-2" />
                    Continue Lesson
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Training Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Training Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {trainingData.syllabusProgress}%
                </div>
                <div className="text-sm text-muted-foreground mb-2">Syllabus Complete</div>
                <Progress value={trainingData.syllabusProgress} className="h-2" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500 mb-2">
                  {trainingData.completedLessons}
                </div>
                <div className="text-sm text-muted-foreground mb-2">Lessons Completed</div>
                <Progress value={(trainingData.completedLessons / trainingData.totalLessons) * 100} className="h-2" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {trainingData.upcomingLessons.length}
                </div>
                <div className="text-sm text-muted-foreground mb-2">Upcoming Lessons</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500 mb-2">
                  {trainingData.maneuverScores.filter(m => m.meets_acs_standard).length}
                </div>
                <div className="text-sm text-muted-foreground mb-2">ACS Standards Met</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Maneuver Performance */}
      {trainingData.maneuverScores.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Maneuver Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trainingData.maneuverScores.map((maneuver, index) => (
                  <motion.div
                    key={maneuver.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{maneuver.maneuver_name}</h4>
                      <Badge variant={getManeuverBadge(maneuver.score)}>
                        {maneuver.score}%
                      </Badge>
                    </div>
                    <Progress value={maneuver.score} className="h-2 mb-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Last: {new Date(maneuver.last_assessed).toLocaleDateString()}</span>
                      {maneuver.meets_acs_standard && (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Upcoming Lessons */}
      {trainingData.upcomingLessons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Lessons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingData.upcomingLessons.slice(0, 5).map((lesson, index) => (
                  <div key={lesson.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {lesson.order_index}
                      </div>
                      <div>
                        <h4 className="font-medium">{lesson.title}</h4>
                        <p className="text-sm text-muted-foreground">{lesson.estimated_hours} hours</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onViewLesson?.(lesson.id)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Training Resources */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Training Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-6" onClick={onViewSyllabus}>
                <BookOpen className="w-8 h-8" />
                <span className="font-medium">Full Syllabus</span>
                <span className="text-sm text-muted-foreground">View complete training plan</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-6">
                <FileText className="w-8 h-8" />
                <span className="font-medium">Study Materials</span>
                <span className="text-sm text-muted-foreground">Access resources</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-6" onClick={onViewProgress}>
                <BarChart3 className="w-8 h-8" />
                <span className="font-medium">Progress Reports</span>
                <span className="text-sm text-muted-foreground">Detailed analytics</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-6">
                <Target className="w-8 h-8" />
                <span className="font-medium">ACS Standards</span>
                <span className="text-sm text-muted-foreground">Check requirements</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <EmptyStateModal />
    </div>
  )
}
