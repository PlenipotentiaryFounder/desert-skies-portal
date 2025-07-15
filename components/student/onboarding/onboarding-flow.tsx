'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Circle, 
  User, 
  Mail, 
  Phone, 
  Plane, 
  Upload, 
  FileText, 
  Shield
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Step Components
import { WelcomeStep } from './steps/welcome-step'
import { PersonalInfoStep } from './steps/personal-info-step'
import { AviationBackgroundStep } from './steps/aviation-background-step'
import { EmergencyContactStep } from './steps/emergency-contact-step'
import { LiabilityWaiverStep } from './steps/liability-waiver-step'
import { DocumentUploadStep } from './steps/document-upload-step'
import { ProgramSelectionStep } from './steps/program-selection-step'
import { CompletionStep } from './steps/completion-step'

interface OnboardingFlowProps {
  initialOnboarding: any
  userProfile: any
  userId: string
}

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Get started with your onboarding',
    icon: User,
    required: true,
    stepNumber: 1
  },
  {
    id: 'personal-info',
    title: 'Personal Information',
    description: 'Basic contact information',
    icon: User,
    required: true,
    stepNumber: 2
  },
  {
    id: 'aviation-background',
    title: 'Aviation Background',
    description: 'Current certificates and experience',
    icon: Plane,
    required: true,
    stepNumber: 3
  },
  {
    id: 'emergency-contact',
    title: 'Emergency Contact',
    description: 'Emergency contact information',
    icon: Phone,
    required: true,
    stepNumber: 4
  },
  {
    id: 'liability-waiver',
    title: 'Liability Waiver',
    description: 'Electronic signature required',
    icon: Shield,
    required: true,
    stepNumber: 5
  },
  {
    id: 'document-upload',
    title: 'Document Upload',
    description: 'Upload required documents',
    icon: Upload,
    required: false,
    stepNumber: 6
  },
  {
    id: 'program-selection',
    title: 'Program Selection',
    description: 'Choose your training program',
    icon: FileText,
    required: true,
    stepNumber: 7
  },
  {
    id: 'completion',
    title: 'Complete',
    description: 'Onboarding finished',
    icon: CheckCircle,
    required: true,
    stepNumber: 8
  }
]

export function OnboardingFlow({ initialOnboarding, userProfile, userId }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(initialOnboarding?.current_step || 'welcome')
  const [completedSteps, setCompletedSteps] = useState(initialOnboarding?.completed_steps || {})
  const [onboardingData, setOnboardingData] = useState(initialOnboarding || {})
  const [isSaving, setIsSaving] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()
  
  // Debounce save operations to prevent rapid-fire saves
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const getCurrentStepIndex = () => {
    return ONBOARDING_STEPS.findIndex(step => step.id === currentStep)
  }

  const getStepStatus = (stepId: string) => {
    if (completedSteps[stepId]) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'pending'
  }

  const calculateProgress = () => {
    const completedCount = Object.keys(completedSteps).length
    return Math.round((completedCount / ONBOARDING_STEPS.length) * 100)
  }

  const saveProgress = async (stepId: string, data: any, isComplete: boolean = false) => {
    setIsSaving(true)
    
    try {
      if (!userId) {
        throw new Error('User authentication required')
      }

      console.log('🔄 Starting saveProgress:', { stepId, userId, isComplete })

      const updatedCompletedSteps = isComplete 
        ? { ...completedSteps, [stepId]: true }
        : completedSteps

      // Prepare the data payload
      const payload = {
        user_id: userId,
        current_step: stepId,
        completed_steps: updatedCompletedSteps,
        last_activity_at: new Date().toISOString(),
        ...(data && typeof data === 'object' ? data : {})
      }

      if (isComplete && stepId === 'completion') {
        payload.completed_at = new Date().toISOString()
      }

      console.log('📦 Payload to save:', payload)

      // Use upsert with the unique constraint on user_id
      const { data: result, error, status, statusText } = await supabase
        .from('student_onboarding')
        .upsert(payload, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()
        .single()

      console.log('📊 Database response:', { result, error, status, statusText })

      if (error) {
        // Handle different types of errors with comprehensive logging
        const errorInfo = {
          message: error.message || 'Unknown database error',
          details: error.details || 'No additional details',
          hint: error.hint || 'No hint available',
          code: error.code || 'UNKNOWN_ERROR',
          // Additional debugging info
          originalError: error,
          payload: payload,
          userId: userId,
          stepId: stepId
        }
        
        console.error('❌ Database error details:', errorInfo)
        
        // Provide specific error messages based on error codes
        let userMessage = 'Failed to save progress'
        if (error.code === '23505') {
          userMessage = 'Duplicate entry detected'
        } else if (error.code === '23503') {
          userMessage = 'Invalid reference data'
        } else if (error.code === '42501') {
          userMessage = 'Permission denied - please check your authentication'
        } else if (error.code === '42703') {
          userMessage = 'Database column error'
        } else if (error.message) {
          userMessage = error.message
        }
        
        throw new Error(userMessage)
      }

      if (!result) {
        throw new Error('No data returned from database operation')
      }

      // Success - update local state
      setCompletedSteps(updatedCompletedSteps)
      setOnboardingData(prev => ({ ...prev, ...result }))

      console.log('✅ Progress saved successfully:', result)
      
      if (isComplete) {
        toast.success('Step completed successfully!')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('💥 Save progress failed:', {
        error,
        stepId,
        userId,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      })
      
      toast.error(`Failed to save progress: ${errorMessage}`)
    } finally {
      setIsSaving(false)
    }
  }

  const debouncedSaveProgress = (stepId: string, data: any, isComplete: boolean = false) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveProgress(stepId, data, isComplete)
    }, 300) // 300ms debounce
  }

  const goToStep = (stepId: string) => {
    setCurrentStep(stepId)
    // Only save progress if we're actually moving to a different step
    if (stepId !== currentStep) {
      debouncedSaveProgress(stepId, {}, false)
    }
  }

  const nextStep = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      const nextStepId = ONBOARDING_STEPS[currentIndex + 1].id
      goToStep(nextStepId)
    }
  }

  const prevStep = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex > 0) {
      const prevStepId = ONBOARDING_STEPS[currentIndex - 1].id
      goToStep(prevStepId)
    }
  }

  const skipStep = () => {
    const currentStepConfig = ONBOARDING_STEPS.find(step => step.id === currentStep)
    if (currentStepConfig && !currentStepConfig.required) {
      toast.info('Step skipped - you can return to complete it later')
      nextStep()
    }
  }

  const completeStep = async (stepData: any) => {
    await saveProgress(currentStep, stepData, true)
    nextStep()
  }

  const exitOnboarding = () => {
    router.push('/student/dashboard')
  }

  const renderCurrentStep = () => {
    const stepProps = {
      onNext: nextStep,
      onPrev: prevStep,
      onComplete: completeStep,
      onSkip: skipStep,
      onSave: (data: any) => saveProgress(currentStep, data, false),
      isSaving
    }

    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep {...stepProps} userProfile={userProfile} />
      case 'personal-info':
        return <PersonalInfoStep {...stepProps} userProfile={userProfile} />
      case 'aviation-background':
        return <AviationBackgroundStep {...stepProps} data={onboardingData} />
      case 'emergency-contact':
        return <EmergencyContactStep {...stepProps} data={onboardingData} />
      case 'liability-waiver':
        return <LiabilityWaiverStep {...stepProps} data={onboardingData} />
      case 'document-upload':
        return <DocumentUploadStep {...stepProps} data={onboardingData} />
      case 'program-selection':
        return <ProgramSelectionStep {...stepProps} data={onboardingData} />
      case 'completion':
        return <CompletionStep {...stepProps} onExit={exitOnboarding} />
      default:
        return <WelcomeStep {...stepProps} userProfile={userProfile} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Onboarding</h1>
          <p className="text-gray-600">Complete your profile to get started with Desert Skies</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-700">{calculateProgress()}%</span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {ONBOARDING_STEPS.map((step) => {
              const status = getStepStatus(step.id)
              const Icon = step.icon
              
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                    ${status === 'current' ? 'bg-blue-100 text-blue-800' : ''}
                    ${status === 'pending' ? 'bg-gray-100 text-gray-600' : ''}
                    hover:bg-opacity-80
                  `}
                >
                  {status === 'completed' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : status === 'current' ? (
                    <Icon className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                  <span className="sm:hidden">{step.stepNumber}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Current Step */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const currentStepConfig = ONBOARDING_STEPS.find(step => step.id === currentStep)
                const Icon = currentStepConfig?.icon || User
                return (
                  <>
                    <Icon className="w-5 h-5" />
                    {currentStepConfig?.title}
                    {currentStepConfig?.required && (
                      <Badge variant="destructive" className="ml-2">Required</Badge>
                    )}
                  </>
                )
              })()} 
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need help? Contact support at support@desertskies.com</p>
        </div>
      </div>
    </div>
  )
}