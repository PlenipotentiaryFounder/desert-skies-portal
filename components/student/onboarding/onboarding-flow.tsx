'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  Home,
  FileText,
  User,
  Shield,
  Upload,
  Plane,
  Phone
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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
    description: 'Introduction to Desert Skies',
    icon: Home,
    required: true,
    stepNumber: 1
  },
  {
    id: 'personal-info',
    title: 'Personal Information',
    description: 'Basic contact details',
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
      const updatedCompletedSteps = isComplete 
        ? { ...completedSteps, [stepId]: true }
        : completedSteps

      const updateData = {
        current_step: stepId,
        completed_steps: updatedCompletedSteps,
        last_activity_at: new Date().toISOString(),
        ...data
      }

      if (isComplete && stepId === 'completion') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('student_onboarding')
        .update(updateData)
        .eq('user_id', userId)

      if (error) throw error

      setCompletedSteps(updatedCompletedSteps)
      setOnboardingData(prev => ({ ...prev, ...updateData }))

      if (isComplete) {
        toast.success('Step completed successfully!')
      }
    } catch (error) {
      console.error('Error saving progress:', error)
      toast.error('Failed to save progress. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const goToStep = (stepId: string) => {
    setCurrentStep(stepId)
    saveProgress(stepId, {}, false)
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
      onboardingData,
      userProfile,
      onComplete: completeStep,
      onSkip: skipStep,
      onSave: (data: any) => saveProgress(currentStep, data, false),
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
      case 'liability-waiver':
        return <LiabilityWaiverStep {...stepProps} />
      case 'document-upload':
        return <DocumentUploadStep {...stepProps} />
      case 'program-selection':
        return <ProgramSelectionStep {...stepProps} />
      case 'completion':
        return <CompletionStep {...stepProps} onExit={exitOnboarding} />
      default:
        return <WelcomeStep {...stepProps} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Student Onboarding</CardTitle>
            <Badge variant="outline" className="text-sm">
              Step {getCurrentStepIndex() + 1} of {ONBOARDING_STEPS.length}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Progress: {calculateProgress()}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={exitOnboarding}
                className="text-xs"
              >
                Exit & Continue Later
              </Button>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Step Navigator */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {ONBOARDING_STEPS.map((step, index) => {
          const status = getStepStatus(step.id)
          const Icon = step.icon
          
          return (
            <Card 
              key={step.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                status === 'current' ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => goToStep(step.id)}
            >
              <CardContent className="p-3">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className={`p-2 rounded-full ${
                    status === 'completed' ? 'bg-green-100' :
                    status === 'current' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : status === 'current' ? (
                      <Clock className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Icon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="text-xs font-medium">{step.title}</div>
                  {!step.required && (
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Current Step Content */}
      <Card>
        <CardContent className="p-6">
          {renderCurrentStep()}
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={getCurrentStepIndex() === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex space-x-2">
          {ONBOARDING_STEPS.find(step => step.id === currentStep)?.required === false && (
            <Button variant="ghost" onClick={skipStep}>
              Skip for Now
            </Button>
          )}
          <Button
            variant="outline"
            onClick={exitOnboarding}
          >
            Save & Exit
          </Button>
        </div>
      </div>
    </div>
  )
} 