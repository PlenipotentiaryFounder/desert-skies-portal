"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Clock, 
  Target, 
  CheckCircle, 
  X, 
  BarChart3,
  Award,
  BookOpen,
  PlaneTakeoff,
  Navigation
} from 'lucide-react'
import { motion } from 'framer-motion'

interface ProgressData {
  totalHours: number
  soloHours: number
  crossCountryHours: number
  nightHours: number
  instrumentHours: number
  syllabusProgress: number
}

interface SkillAssessment {
  subject: string
  score: number
  lastAssessed?: string
}

interface TrainingProgressProps {
  progress: ProgressData
  skillAssessments: SkillAssessment[]
  onViewDetails?: (type: string) => void
}

export function TrainingProgress({ 
  progress, 
  skillAssessments, 
  onViewDetails 
}: TrainingProgressProps) {
  const requirements = {
    flightHours: {
      total: { required: 40, current: progress.totalHours },
      solo: { required: 10, current: progress.soloHours },
      crossCountry: { required: 5, current: progress.crossCountryHours },
      night: { required: 3, current: progress.nightHours }
    },
    documents: {
      medical: { required: true, current: true },
      studentPilot: { required: true, current: true },
      knowledgeTest: { required: true, current: false },
      practicalTest: { required: true, current: false }
    }
  }

  const getProgressPercentage = (current: number, required: number) => {
    return Math.min((current / required) * 100, 100)
  }

  const getStatusIcon = (current: number, required: number) => {
    if (current >= required) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }
    return <X className="w-4 h-4 text-red-500" />
  }

  const getSkillColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 80) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Training Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {progress.syllabusProgress}%
              </div>
              <div className="text-sm text-muted-foreground mb-2">Syllabus Complete</div>
              <Progress value={progress.syllabusProgress} className="h-2" />
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">
                {progress.totalHours}
              </div>
              <div className="text-sm text-muted-foreground mb-2">Total Hours</div>
              <Progress 
                value={getProgressPercentage(progress.totalHours, 40)} 
                className="h-2" 
              />
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">
                {progress.soloHours}
              </div>
              <div className="text-sm text-muted-foreground mb-2">Solo Hours</div>
              <Progress 
                value={getProgressPercentage(progress.soloHours, 10)} 
                className="h-2" 
              />
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">
                {progress.crossCountryHours}
              </div>
              <div className="text-sm text-muted-foreground mb-2">Cross Country</div>
              <Progress 
                value={getProgressPercentage(progress.crossCountryHours, 5)} 
                className="h-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Certification Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Flight Hours
              </h4>
              <div className="space-y-3">
                {Object.entries(requirements.flightHours).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()} ({value.required} required)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {value.current}/{value.required}
                      </span>
                      {getStatusIcon(value.current, value.required)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Other Requirements
              </h4>
              <div className="space-y-3">
                {Object.entries(requirements.documents).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center gap-2">
                      {value.current ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Skill Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skillAssessments.map((skill, index) => (
              <motion.div
                key={skill.subject}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onViewDetails?.(skill.subject)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{skill.subject}</h4>
                  <Badge 
                    variant={skill.score >= 90 ? "default" : skill.score >= 80 ? "secondary" : "destructive"}
                  >
                    {skill.score}%
                  </Badge>
                </div>
                <Progress value={skill.score} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Needs Work</span>
                  <span>Excellent</span>
                </div>
                {skill.lastAssessed && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last assessed: {skill.lastAssessed}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Progress Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              onClick={() => onViewDetails?.('syllabus')}
            >
              <BookOpen className="w-8 h-8 text-primary" />
              <span className="font-medium">View Syllabus</span>
              <span className="text-sm text-muted-foreground">Training plan</span>
            </button>
            
            <button 
              className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              onClick={() => onViewDetails?.('logbook')}
            >
              <PlaneTakeoff className="w-8 h-8 text-primary" />
              <span className="font-medium">Flight Log</span>
              <span className="text-sm text-muted-foreground">View entries</span>
            </button>
            
            <button 
              className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              onClick={() => onViewDetails?.('requirements')}
            >
              <Award className="w-8 h-8 text-primary" />
              <span className="font-medium">Requirements</span>
              <span className="text-sm text-muted-foreground">Check status</span>
            </button>
            
            <button 
              className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              onClick={() => onViewDetails?.('assessments')}
            >
              <Target className="w-8 h-8 text-primary" />
              <span className="font-medium">Assessments</span>
              <span className="text-sm text-muted-foreground">Skill review</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 