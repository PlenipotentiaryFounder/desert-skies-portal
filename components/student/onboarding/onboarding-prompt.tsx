'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  AlertCircle,
  User,
  Plane,
  Phone,
  Shield,
  Upload,
  FileText,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface OnboardingPromptProps {
  userId: string
  onDismiss?: () => void
  className?: string
}

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome',
    icon: CheckCircle,
    required: true
  },
  {
    id: 'personal-info',
    title: 'Personal Info',
    icon: User,
    required: true
  },
  {
    id: 'aviation-background',
    title: 'Aviation Background',
    icon: Plane,
    required: true
  },
  {
    id: 'emergency-contact',
    title: 'Emergency Contact',
    icon: Phone,
    required: true
  },
  {
    id: 'liability-waiver',
    title: 'Liability Waiver',
    icon: Shield,
    required: true
  },
  {
    id: 'document-upload',
    title: 'Document Upload',
    icon: Upload,
    required: false
  },
  {
    id: 'program-selection',
    title: 'Program Selection',
    icon: FileText,
    required: true
  }
]

export function OnboardingPrompt({ userId, onDismiss, className }: OnboardingPromptProps) {
  const [onboardingData, setOnboardingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchOnboardingStatus()
  }, [userId])

  const fetchOnboardingStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('student_onboarding')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching onboarding status:', error)
      } else {
        setOnboardingData(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  const handleContinue = () => {
    router.push('/student/onboarding')
  }

  const calculateProgress = () => {
    if (!onboardingData?.completed_steps) return 0
    
    const completedSteps = Object.keys(onboardingData.completed_steps).length
    const totalSteps = ONBOARDING_STEPS.length
    
    return Math.round((completedSteps / totalSteps) * 100)
  }

  const getIncompleteSteps = () => {
    if (!onboardingData?.completed_steps) return ONBOARDING_STEPS
    
    return ONBOARDING_STEPS.filter(step => !onboardingData.completed_steps[step.id])
  }

  const getTimeRemaining = () => {
    if (!onboardingData?.last_activity_at) return 'Unknown'
    
    const lastActivity = new Date(onboardingData.last_activity_at)
    const now = new Date()
    const hoursSince = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60))
    
    if (hoursSince < 24) {
      return `${hoursSince} hours ago`
    } else {
      const daysSince = Math.floor(hoursSince / 24)
      return `${daysSince} days ago`
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Don't show if onboarding is complete or dismissed
  if (dismissed || onboardingData?.completed_at) {
    return null
  }

  const progress = calculateProgress()
  const incompleteSteps = getIncompleteSteps()
  const isJustStarted = !onboardingData

  return (
    <Card className={`border-orange-200 bg-orange-50 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <AlertCircle className="w-5 h-5" />
            {isJustStarted ? 'Complete Your Onboarding' : 'Continue Your Onboarding'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-orange-600 hover:text-orange-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-orange-800">
              {isJustStarted ? 'Get started with your student onboarding' : 'Progress'}
            </span>
            {!isJustStarted && (
              <span className="text-orange-600 font-medium">{progress}% complete</span>
            )}
          </div>
          {!isJustStarted && (
            <Progress value={progress} className="h-2" />
          )}
        </div>

        {!isJustStarted && (
          <div className="space-y-2">
            <p className="text-sm text-orange-800">
              Last updated: {getTimeRemaining()}
            </p>
            <p className="text-sm text-orange-700">
              {incompleteSteps.length} step{incompleteSteps.length !== 1 ? 's' : ''} remaining
            </p>
          </div>
        )}

        {/* Show incomplete steps */}
        {incompleteSteps.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-orange-900">
              {isJustStarted ? 'Required Steps:' : 'Still need to complete:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {incompleteSteps.slice(0, 4).map((step) => (
                <Badge 
                  key={step.id}
                  variant={step.required ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {step.title}
                </Badge>
              ))}
              {incompleteSteps.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{incompleteSteps.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <Alert className="bg-orange-100 border-orange-200">
          <Clock className="h-4 w-4" />
          <AlertDescription className="text-orange-800">
            <strong>Important:</strong> Complete your onboarding to access all features, 
            schedule lessons, and begin your flight training.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button onClick={handleContinue} className="flex-1">
            <ArrowRight className="w-4 h-4 mr-2" />
            {isJustStarted ? 'Start Onboarding' : 'Continue Onboarding'}
          </Button>
          <Button variant="outline" onClick={handleDismiss}>
            Later
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 