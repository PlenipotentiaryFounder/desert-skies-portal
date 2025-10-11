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
  Shield,
  ArrowLeft
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
  const [lastSaveTime, setLastSaveTime] = useState(0)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // Check if user has already completed onboarding and redirect if so
  useEffect(() => {
    if (initialOnboarding?.completed_at) {
      console.log('User has already completed onboarding, redirecting to dashboard')
      router.push('/student/dashboard')
    }
  }, [initialOnboarding?.completed_at, router])

  // If user has completed onboarding, don't render the flow
  if (initialOnboarding?.completed_at) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Redirecting to Dashboard...</h1>
          <p className="text-aviation-sunset-200">You have already completed onboarding.</p>
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

  const getStepStatus = (stepId: string) => {
    // Check if step is completed in the completed_steps object
    if (completedSteps[stepId] === true) return 'completed'
    // Check if step is completed based on onboarding data
    if (stepId === 'welcome' && onboardingData.welcome_completed) return 'completed'
    if (stepId === 'personal-info' && onboardingData.full_name) return 'completed'
    if (stepId === 'aviation-background' && onboardingData.pilot_certificate_type) return 'completed'
    if (stepId === 'emergency-contact' && onboardingData.emergency_contact_name) return 'completed'
    if (stepId === 'liability-waiver' && onboardingData.liability_waiver_signed) return 'completed'
    if (stepId === 'document-upload' && Object.keys(onboardingData.uploaded_documents || {}).length > 0) return 'completed'
    if (stepId === 'program-selection' && onboardingData.desired_program) return 'completed'
    if (stepId === 'completion' && onboardingData.completed_at) return 'completed'
    
    if (stepId === currentStep) return 'current'
    return 'pending'
  }

  const calculateProgress = () => {
    const completedCount = Object.keys(completedSteps).length
    return Math.round((completedCount / ONBOARDING_STEPS.length) * 100)
  }

  // Syllabus mapping for program selection
  const SYLLABUS_MAP: Record<string, string> = {
    private_pilot: '11111111-1111-1111-1111-111111111111',
    instrument_rating: '22222222-2222-2222-2222-222222222222',
    commercial_pilot: 'ab399a65-ea7e-4560-bd02-55a0e15c41c1',
    discovery_flight: '56ce2fe4-b63d-4f58-9755-0ccf4c2adf18',
  }
  const DEFAULT_INSTRUCTOR_ID = '7e6acaad-5d48-46e3-ad10-fa9144c541dc'

  const saveProgress = async (stepId: string, data: any, isComplete: boolean = false) => {
    // Prevent rapid successive calls
    const now = Date.now()
    if (now - lastSaveTime < 1000) { // 1 second debounce
      console.log('🔄 Debouncing saveProgress call')
      return
    }
    
    setIsSaving(true)
    setLastSaveTime(now)
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Set a new timeout to actually save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (!userId) {
          throw new Error('User authentication required')
        }

        console.log('🔄 Starting saveProgress:', { stepId, userId, isComplete })

        const updatedCompletedSteps = isComplete 
          ? { ...completedSteps, [stepId]: true }
          : completedSteps

        // --- PROGRAM SELECTION LOGIC ---
        let payload = {
          user_id: userId,
          current_step: currentStep, // Use the current UI step, not the completed step
          step_number: ONBOARDING_STEPS.findIndex(step => step.id === currentStep) + 1,
          completed_steps: updatedCompletedSteps,
          last_activity_at: new Date().toISOString(),
          ...(data && typeof data === 'object' ? data : {})
        }

        // Map first_name and last_name to full_name for student_onboarding table
        if (data.first_name && data.last_name) {
          payload.full_name = `${data.first_name} ${data.last_name}`
        } else if (data.first_name) {
          payload.full_name = data.first_name
        } else if (data.last_name) {
          payload.full_name = data.last_name
        }
        
        // Remove first_name and last_name from payload as they don't exist in student_onboarding table
        delete payload.first_name
        delete payload.last_name
        
        // Handle empty date strings - convert to null to avoid PostgreSQL date validation errors
        const dateFields = ['date_of_birth', 'medical_certificate_expires_at']
        dateFields.forEach(field => {
          if (payload[field] === '') {
            payload[field] = null
          }
        })
        
        // If this is the personal-info step, also update the user profile
        if (stepId === 'personal-info' && (data.first_name || data.last_name)) {
          try {
            const profileUpdateData: any = {}
            if (data.first_name) profileUpdateData.first_name = data.first_name
            if (data.last_name) profileUpdateData.last_name = data.last_name
            if (data.phone_number) profileUpdateData.phone_number = data.phone_number
            if (data.date_of_birth) profileUpdateData.date_of_birth = data.date_of_birth
            if (data.address_line1) profileUpdateData.address_line1 = data.address_line1
            if (data.address_line2) profileUpdateData.address_line2 = data.address_line2
            if (data.city) profileUpdateData.city = data.city
            if (data.state) profileUpdateData.state = data.state
            if (data.zip_code) profileUpdateData.zip_code = data.zip_code
            if (data.country) profileUpdateData.country = data.country
            
            const { error: profileError } = await supabase
              .from('profiles')
              .update(profileUpdateData)
              .eq('id', userId)
            
            if (profileError) {
              console.error('Failed to update profile:', profileError)
              // Don't throw error here, just log it - onboarding can continue
            } else {
              console.log('✅ Profile updated successfully')
            }
          } catch (error) {
            console.error('Error updating profile:', error)
            // Don't throw error here, just log it - onboarding can continue
          }
        }
        
        // If this is the program-selection step, map to syllabus_id and create enrollment
        if (stepId === 'program-selection' && data?.desired_program) {
          const syllabus_id = SYLLABUS_MAP[data.desired_program]
          if (syllabus_id) {
            payload = { ...payload, syllabus_id }
            // Check if enrollment already exists for this user and syllabus
            const { data: existing, error: existingError } = await supabase
              .from('student_enrollments')
              .select('id')
              .eq('student_id', userId)
              .eq('syllabus_id', syllabus_id)
              .maybeSingle()
            if (!existing && !existingError) {
              // Insert new active enrollment
              const { error: enrollError } = await supabase
                .from('student_enrollments')
                .insert({
                  student_id: userId,
                  syllabus_id,
                  instructor_id: DEFAULT_INSTRUCTOR_ID,
                  start_date: new Date().toISOString().slice(0, 10),
                  status: 'active',
                })
              if (enrollError) {
                console.error('Failed to create enrollment:', enrollError)
                toast.error('Failed to create enrollment: ' + enrollError.message)
              }
            }
          }
        }
        
        if (isComplete && stepId === 'completion') {
          payload.completed_at = new Date().toISOString()
          
          // Update profile with all onboarding data when completing onboarding
          try {
            const profileUpdateData: any = {}
            // Parse full_name back to first_name and last_name for profile
            if (onboardingData.full_name) {
              const nameParts = onboardingData.full_name.split(' ')
              if (nameParts.length >= 2) {
                profileUpdateData.first_name = nameParts[0]
                profileUpdateData.last_name = nameParts.slice(1).join(' ')
              } else {
                profileUpdateData.first_name = nameParts[0]
              }
            }
            if (onboardingData.phone_number) profileUpdateData.phone_number = onboardingData.phone_number
            if (onboardingData.date_of_birth) profileUpdateData.date_of_birth = onboardingData.date_of_birth
            if (onboardingData.address_line1) profileUpdateData.address_line1 = onboardingData.address_line1
            if (onboardingData.address_line2) profileUpdateData.address_line2 = onboardingData.address_line2
            if (onboardingData.city) profileUpdateData.city = onboardingData.city
            if (onboardingData.state) profileUpdateData.state = onboardingData.state
            if (onboardingData.zip_code) profileUpdateData.zip_code = onboardingData.zip_code
            if (onboardingData.country) profileUpdateData.country = onboardingData.country
            
            const { error: profileError } = await supabase
              .from('profiles')
              .update(profileUpdateData)
              .eq('id', userId)
            
            if (profileError) {
              console.error('Failed to update profile on completion:', profileError)
            } else {
              console.log('✅ Profile updated on completion')
            }
          } catch (error) {
            console.error('Error updating profile on completion:', error)
          }
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
        setOnboardingData((prev: any) => ({ ...prev, ...result }))

        console.log('✅ Progress saved successfully:', result)
        
        if (isComplete) {
          toast.success('Step completed successfully!')
        }
      } catch (error: any) {
        console.error('💥 Save progress failed:', error)
        toast.error(error.message || 'Failed to save progress')
      } finally {
        setIsSaving(false)
      }
    }, 500) // 500ms delay before actually saving
  }

  const goToStep = (stepId: string) => {
    setCurrentStep(stepId)
  }

  const nextStep = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      const nextStepId = ONBOARDING_STEPS[currentIndex + 1].id
      setCurrentStep(nextStepId)
    }
  }

  const prevStep = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex > 0) {
      const prevStepId = ONBOARDING_STEPS[currentIndex - 1].id
      setCurrentStep(prevStepId)
    }
  }

  // Save & Exit handler
  const handleSaveAndExit = async () => {
    await saveProgress(currentStep, onboardingData, false)
    exitOnboarding()
  }

  const skipStep = () => {
    const currentStepConfig = ONBOARDING_STEPS.find(step => step.id === currentStep)
    if (currentStepConfig && !currentStepConfig.required) {
      toast.info('Step skipped - you can return to complete it later')
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
    router.push('/student/dashboard')
  }

  const renderCurrentStep = () => {
    const stepProps = {
      onNext: nextStep,
      onPrev: prevStep,
      onComplete: completeStep,
      onSkip: skipStep,
      isSaving
    }

    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep onboardingData={onboardingData} userProfile={userProfile} {...stepProps} />
      case 'personal-info':
        return <PersonalInfoStep onboardingData={onboardingData} userProfile={userProfile} {...stepProps} />
      case 'aviation-background':
        return <AviationBackgroundStep onboardingData={onboardingData} userProfile={userProfile} {...stepProps} />
      case 'emergency-contact':
        return <EmergencyContactStep onboardingData={onboardingData} userProfile={userProfile} {...stepProps} />
      case 'liability-waiver':
        return <LiabilityWaiverStep onboardingData={onboardingData} userProfile={userProfile} {...stepProps} />
      case 'document-upload':
        return <DocumentUploadStep onboardingData={onboardingData} userProfile={userProfile} {...stepProps} />
      case 'program-selection':
        return <ProgramSelectionStep onboardingData={onboardingData} userProfile={userProfile} {...stepProps} />
      case 'completion':
        return <CompletionStep onboardingData={onboardingData} userProfile={userProfile} {...stepProps} onExit={exitOnboarding} />
      default:
        return <WelcomeStep onboardingData={onboardingData} userProfile={userProfile} {...stepProps} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Onboarding</h1>
          <p className="text-aviation-sunset-200">Complete your profile to get started with Desert Skies</p>
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
                    ${status === 'pending' ? 'bg-aviation-sky-100 text-aviation-sky-700' : ''}
                    hover:bg-opacity-80
                  `}
                  suppressHydrationWarning
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
              onClick={handleSaveAndExit}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save & Exit'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}