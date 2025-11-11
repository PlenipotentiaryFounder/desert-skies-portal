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
  Phone, 
  Plane, 
  Upload, 
  FileText, 
  Shield,
  DollarSign,
  Calendar,
  ArrowLeft,
  Trophy
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Step Components
import { WelcomeStep } from './steps/welcome-step'
import { PersonalInfoStep } from './steps/personal-info-step'
import { AviationBackgroundStep } from './steps/aviation-background-step'
import { EmergencyContactStep } from './steps/emergency-contact-step'
import { DocumentUploadStep } from './steps/document-upload-step'
import { InsuranceStep } from './steps/insurance-step'
import { ContractorAgreementStep } from './steps/contractor-agreement-step'
import { StripeConnectStep } from './steps/stripe-connect-step'
import { CalendarIntegrationStep } from './steps/calendar-integration-step'
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
    description: 'Contact details and address',
    icon: User,
    required: true,
    stepNumber: 2
  },
  {
    id: 'aviation-background',
    title: 'Aviation Credentials',
    description: 'CFI certificates and experience',
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
    id: 'document-upload',
    title: 'Document Upload',
    description: 'Upload credentials and ID',
    icon: Upload,
    required: true,
    stepNumber: 5
  },
  {
    id: 'insurance',
    title: 'Insurance Verification',
    description: 'Insurance requirements',
    icon: Shield,
    required: true,
    stepNumber: 6
  },
  {
    id: 'contractor-agreement',
    title: '1099 Agreement',
    description: 'Contractor agreement signature',
    icon: FileText,
    required: true,
    stepNumber: 7
  },
  {
    id: 'stripe-connect',
    title: 'Payment Setup',
    description: 'Connect your bank account',
    icon: DollarSign,
    required: true,
    stepNumber: 8
  },
  {
    id: 'calendar-integration',
    title: 'Calendar Integration',
    description: 'Sync your calendar (optional)',
    icon: Calendar,
    required: false,
    stepNumber: 9
  },
  {
    id: 'completion',
    title: 'Complete',
    description: 'Onboarding finished',
    icon: Trophy,
    required: true,
    stepNumber: 10
  }
]

export function OnboardingFlow({ initialOnboarding, userProfile, userId }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(initialOnboarding?.current_step || 'welcome')
  const [completedSteps, setCompletedSteps] = useState(initialOnboarding?.completed_steps || {})
  const [onboardingData, setOnboardingData] = useState(initialOnboarding || {})
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState(0)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // Check if instructor has already completed onboarding and redirect if so
  useEffect(() => {
    if (initialOnboarding?.completed_at) {
      console.log('Instructor has already completed onboarding, redirecting to dashboard')
      router.push('/instructor/dashboard')
    }
  }, [initialOnboarding?.completed_at, router])

  // If instructor has completed onboarding, don't render the flow
  if (initialOnboarding?.completed_at) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Redirecting to Dashboard...</h1>
          <p className="text-gray-600">You have already completed onboarding.</p>
        </div>
      </div>
    )
  }
  
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

  const getProgressPercentage = () => {
    const completedCount = Object.keys(completedSteps).length
    const totalSteps = ONBOARDING_STEPS.length
    return Math.round((completedCount / totalSteps) * 100)
  }

  /**
   * Save progress to instructor_onboarding table
   * Implements debouncing to prevent excessive database calls
   */
  const saveProgress = async (stepId: string, data: any, isComplete: boolean = false) => {
    const now = Date.now()
    
    // Debounce: prevent saves within 1 second of each other
    if (now - lastSaveTime < 1000 && !isComplete) {
      console.log('🔄 Debouncing saveProgress call')
      return
    }
    
    setLastSaveTime(now)
    
    // Clear any pending save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Delay the actual save slightly to batch rapid changes
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true)

        const updateData: any = {
          ...data,
          current_step: stepId,
          step_number: ONBOARDING_STEPS.find(s => s.id === stepId)?.stepNumber || 1,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Update completed_steps tracking
        if (isComplete) {
          const newCompletedSteps = {
            ...completedSteps,
            [stepId]: {
              completed_at: new Date().toISOString(),
              ...data
            }
          }
          updateData.completed_steps = newCompletedSteps
          setCompletedSteps(newCompletedSteps)
          
          // Mark specific step as completed
          const completedFieldName = `${stepId.replace(/-/g, '_')}_completed`
          updateData[completedFieldName] = true
        }

        console.log('💾 Saving instructor onboarding progress:', {
          stepId,
          stepNumber: updateData.step_number,
          isComplete,
          updateData
        })

        const { error } = await supabase
          .from('instructor_onboarding')
          .update(updateData)
          .eq('user_id', userId)

        if (error) {
          console.error('Failed to save progress:', error)
          toast.error('Failed to save progress: ' + error.message)
        } else {
          console.log('✅ Progress saved successfully')
          if (!isComplete) {
            toast.success('Progress saved', { duration: 1000 })
          }
        }

      } catch (error: any) {
        console.error('Error saving progress:', error)
        toast.error('Failed to save progress')
      } finally {
        setIsSaving(false)
      }
    }, 500) // 500ms delay for batching
  }

  const nextStep = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      const nextStepId = ONBOARDING_STEPS[currentIndex + 1].id
      setCurrentStep(nextStepId)
      saveProgress(nextStepId, onboardingData, false)
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const previousStep = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex > 0) {
      const prevStepId = ONBOARDING_STEPS[currentIndex - 1].id
      setCurrentStep(prevStepId)
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const skipStep = () => {
    const step = ONBOARDING_STEPS.find(s => s.id === currentStep)
    if (step && !step.required) {
      nextStep()
    }
  }

  const completeStep = async (stepData: any) => {
    // Merge new step data into the existing onboardingData
    const mergedData = { ...onboardingData, ...stepData }
    
    // If this is the personal-info step, also update the user profile
    if (currentStep === 'personal-info' && (stepData.first_name || stepData.last_name)) {
      try {
        const profileUpdateData: any = {}
        if (stepData.first_name) profileUpdateData.first_name = stepData.first_name
        if (stepData.last_name) profileUpdateData.last_name = stepData.last_name
        if (stepData.phone_number) profileUpdateData.phone_number = stepData.phone_number
        if (stepData.date_of_birth) profileUpdateData.date_of_birth = stepData.date_of_birth
        if (stepData.address_line1) profileUpdateData.address_line1 = stepData.address_line1
        if (stepData.address_line2) profileUpdateData.address_line2 = stepData.address_line2
        if (stepData.city) profileUpdateData.city = stepData.city
        if (stepData.state) profileUpdateData.state = stepData.state
        if (stepData.zip_code) profileUpdateData.zip_code = stepData.zip_code
        if (stepData.country) profileUpdateData.country = stepData.country
        
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdateData)
          .eq('id', userId)
        
        if (profileError) {
          console.error('Failed to update profile:', profileError)
          toast.error('Failed to update profile: ' + profileError.message)
        }
      } catch (error) {
        console.error('Error updating profile:', error)
      }
    }
    
    await saveProgress(currentStep, mergedData, true)
    setOnboardingData(mergedData)
    
    // If this is the completion step, redirect to dashboard instead of nextStep
    if (currentStep === 'completion') {
      // Add a small delay to ensure the completion is saved, then redirect
      setTimeout(() => {
        exitOnboarding()
      }, 1000)
    } else {
      nextStep()
    }
  }

  const exitOnboarding = () => {
    router.push('/instructor/dashboard')
  }

  const renderCurrentStep = () => {
    const stepProps = {
      onboardingData,
      userProfile,
      onComplete: completeStep,
      onSkip: skipStep,
      isSaving
    }

    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep {...stepProps} />
      case 'personal-info':
        return <PersonalInfoStep {...stepProps} />
      case 'aviation-background':
        return <AviationBackgroundStep {...stepProps} />
      case 'emergency-contact':
        return <EmergencyContactStep {...stepProps} />
      case 'document-upload':
        return <DocumentUploadStep {...stepProps} />
      case 'insurance':
        return <InsuranceStep {...stepProps} />
      case 'contractor-agreement':
        return <ContractorAgreementStep {...stepProps} />
      case 'stripe-connect':
        return <StripeConnectStep {...stepProps} />
      case 'calendar-integration':
        return <CalendarIntegrationStep {...stepProps} />
      case 'completion':
        return <CompletionStep {...stepProps} />
      default:
        return <WelcomeStep {...stepProps} />
    }
  }

  const currentStepIndex = getCurrentStepIndex()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Instructor Onboarding</h1>
              <p className="text-gray-600 mt-1">
                Step {currentStepIndex + 1} of {ONBOARDING_STEPS.length}
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {getProgressPercentage()}% Complete
            </Badge>
          </div>
          
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>

        {/* Progress Steps */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {ONBOARDING_STEPS.map((step, index) => {
                const StepIcon = step.icon
                const isCompleted = completedSteps[step.id]
                const isCurrent = step.id === currentStep
                const isPast = index < currentStepIndex

                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                      isCurrent ? 'bg-blue-50 border-2 border-blue-500' : 
                      isCompleted ? 'bg-green-50' : 
                      'bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isCurrent ? 'bg-blue-500 text-white' :
                      'bg-gray-300 text-gray-600'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <p className={`text-xs font-medium text-center ${
                      isCurrent ? 'text-blue-700' : 
                      isCompleted ? 'text-green-700' : 
                      'text-gray-600'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Step Content */}
        <div className="mb-8">
          {renderCurrentStep()}
        </div>

        {/* Navigation */}
        {currentStep !== 'welcome' && currentStep !== 'completion' && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous Step
            </Button>
          </div>
        )}

        {/* Auto-save indicator */}
        {isSaving && (
          <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm">Saving...</span>
          </div>
        )}
      </div>
    </div>
  )
}

