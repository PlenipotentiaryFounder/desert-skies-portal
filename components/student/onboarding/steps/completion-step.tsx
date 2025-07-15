'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  PartyPopper,
  Calendar,
  BookOpen,
  Users,
  Plane,
  Star,
  ArrowRight
} from 'lucide-react'

interface CompletionStepProps {
  onboardingData: any
  userProfile: any
  onComplete: (data: any) => void
  onSkip: () => void
  onExit: () => void
  isSaving: boolean
}

const NEXT_STEPS = [
  {
    icon: Calendar,
    title: 'Schedule Your First Lesson',
    description: 'Book your first flight lesson with one of our certified instructors',
    action: 'Schedule Now',
    priority: 'high'
  },
  {
    icon: BookOpen,
    title: 'Access Study Materials',
    description: 'Review ground school materials and prepare for your training',
    action: 'View Materials',
    priority: 'high'
  },
  {
    icon: Users,
    title: 'Meet Your Instructor',
    description: 'Get introduced to your assigned flight instructor',
    action: 'View Profile',
    priority: 'medium'
  },
  {
    icon: Plane,
    title: 'Complete Medical Requirements',
    description: 'Ensure all medical certificates are current and valid',
    action: 'Check Status',
    priority: 'medium'
  }
]

const ONBOARDING_SUMMARY = [
  { label: 'Personal Information', icon: CheckCircle },
  { label: 'Aviation Background', icon: CheckCircle },
  { label: 'Emergency Contact', icon: CheckCircle },
  { label: 'Liability Waiver', icon: CheckCircle },
  { label: 'Document Upload', icon: CheckCircle },
  { label: 'Program Selection', icon: CheckCircle }
]

export function CompletionStep({
  onboardingData,
  userProfile,
  onComplete,
  onSkip,
  onExit,
  isSaving
}: CompletionStepProps) {
  
  const handleFinish = () => {
    onComplete({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString()
    })
  }

  const selectedProgram = onboardingData.desired_program || 'Not selected'
  const programNames = {
    'private_pilot': 'Private Pilot License (PPL)',
    'instrument_rating': 'Instrument Rating (IR)',
    'commercial_pilot': 'Commercial Pilot License (CPL)',
    'discovery_flight': 'Discovery Flight'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Celebration Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <PartyPopper className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900">
          Congratulations, {userProfile?.full_name?.split(' ')[0] || 'Student'}!
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          You've successfully completed the onboarding process. Welcome to the 
          Desert Skies Aviation Training family!
        </p>
      </div>

      {/* Onboarding Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Onboarding Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Completed Steps:</h3>
              <div className="space-y-2">
                {ONBOARDING_SUMMARY.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Your Information:</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Program:</span> {programNames[selectedProgram] || selectedProgram}
                </div>
                <div>
                  <span className="font-medium">Certificate Level:</span> {onboardingData.pilot_certificate_type || 'Not specified'}
                </div>
                <div>
                  <span className="font-medium">Medical Class:</span> {onboardingData.medical_certificate_class || 'Not specified'}
                </div>
                <div>
                  <span className="font-medium">Citizenship:</span> {onboardingData.tsa_citizenship_status || 'Not specified'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-blue-600" />
            What's Next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {NEXT_STEPS.map((step, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{step.title}</h4>
                    <Badge variant={step.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                      {step.priority === 'high' ? 'Priority' : 'Optional'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                  <Button variant="outline" size="sm">
                    {step.action}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Welcome Message */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">
                Welcome to Your Aviation Journey!
              </h3>
              <p className="text-blue-800 mb-4">
                You're now part of the Desert Skies Aviation Training community. Our team of 
                experienced instructors and modern training fleet are ready to help you achieve 
                your aviation goals safely and efficiently.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Support Available:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 24/7 student support portal</li>
                    <li>• Dedicated instructor assignments</li>
                    <li>• Progress tracking and reporting</li>
                    <li>• Flexible scheduling system</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Training Resources:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Comprehensive ground school</li>
                    <li>• Modern flight simulators</li>
                    <li>• Well-maintained aircraft fleet</li>
                    <li>• Exam preparation materials</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Reminders */}
      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertDescription>
          <strong>Important Reminders:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Keep your medical certificate current throughout training</li>
            <li>Maintain regular communication with your instructor</li>
            <li>Complete ground school assignments on time</li>
            <li>Contact us immediately if you have any questions or concerns</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pt-6">
        <Button
          variant="outline"
          onClick={onExit}
          size="lg"
        >
          View Dashboard
        </Button>
        <Button
          onClick={handleFinish}
          disabled={isSaving}
          size="lg"
          className="min-w-48"
        >
          {isSaving ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2 animate-spin" />
              Finalizing...
            </>
          ) : (
            <>
              <ArrowRight className="w-4 h-4 mr-2" />
              Complete Onboarding
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 