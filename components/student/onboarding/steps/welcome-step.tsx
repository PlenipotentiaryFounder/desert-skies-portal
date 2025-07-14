'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plane, 
  User, 
  Phone, 
  Shield, 
  Upload, 
  FileText, 
  CheckCircle,
  Clock,
  ArrowRight,
  Star,
  Users,
  Award
} from 'lucide-react'

interface WelcomeStepProps {
  onboardingData: any
  userProfile: any
  onComplete: (data: any) => void
  onSkip: () => void
  onSave: (data: any) => void
  isSaving: boolean
}

const UPCOMING_STEPS = [
  {
    icon: User,
    title: 'Personal Information',
    description: 'Contact details and basic information',
    required: true,
    time: '2 minutes'
  },
  {
    icon: Plane,
    title: 'Aviation Background',
    description: 'Current certificates and experience',
    required: true,
    time: '3 minutes'
  },
  {
    icon: Phone,
    title: 'Emergency Contact',
    description: 'Emergency contact information',
    required: true,
    time: '2 minutes'
  },
  {
    icon: Shield,
    title: 'Liability Waiver',
    description: 'Electronic signature required',
    required: true,
    time: '5 minutes'
  },
  {
    icon: Upload,
    title: 'Document Upload',
    description: 'Upload required documents',
    required: false,
    time: '10 minutes'
  },
  {
    icon: FileText,
    title: 'Program Selection',
    description: 'Choose your training program',
    required: true,
    time: '3 minutes'
  }
]

const BENEFITS = [
  {
    icon: Award,
    title: 'Professional Training',
    description: 'FAA Part 61 and Part 141 certified instruction'
  },
  {
    icon: Users,
    title: 'Expert Instructors',
    description: 'Experienced CFIs with thousands of flight hours'
  },
  {
    icon: Star,
    title: 'Modern Fleet',
    description: 'Well-maintained aircraft with latest avionics'
  }
]

export function WelcomeStep({
  onboardingData,
  userProfile,
  onComplete,
  onSkip,
  onSave,
  isSaving
}: WelcomeStepProps) {
  
  const handleContinue = () => {
    onComplete({
      welcome_completed: true,
      welcome_completed_at: new Date().toISOString()
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <Plane className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome to Desert Skies Aviation Training!
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          We're excited to help you begin your aviation journey. Let's get you set up with 
          everything you need to start training safely and effectively.
        </p>
      </div>

      {/* Benefits Section */}
      <div className="grid md:grid-cols-3 gap-6">
        {BENEFITS.map((benefit, index) => (
          <Card key={index} className="text-center">
            <CardContent className="p-6">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Onboarding Process Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            What to Expect
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Our onboarding process is designed to be quick and comprehensive. You can complete 
              it all at once or take breaks and return later. Here's what we'll cover:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {UPCOMING_STEPS.map((step, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <step.icon className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{step.title}</h4>
                      <Badge variant={step.required ? "default" : "secondary"} className="text-xs">
                        {step.required ? 'Required' : 'Optional'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{step.description}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{step.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Features */}
      <Card>
        <CardHeader>
          <CardTitle>Key Features of Our Onboarding</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Save & Continue Later</h4>
                  <p className="text-sm text-gray-600">
                    Complete the process at your own pace. Your progress is automatically saved.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Skip Optional Steps</h4>
                  <p className="text-sm text-gray-600">
                    Some steps can be completed later. We'll remind you with dashboard notifications.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Secure & Compliant</h4>
                  <p className="text-sm text-gray-600">
                    All information is encrypted and stored securely, meeting FAA requirements.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Mobile Friendly</h4>
                  <p className="text-sm text-gray-600">
                    Complete the process on any device - desktop, tablet, or mobile.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Electronic Signatures</h4>
                  <p className="text-sm text-gray-600">
                    Legally binding electronic signatures for all required documents.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Document Upload</h4>
                  <p className="text-sm text-gray-600">
                    Securely upload and store all required aviation documents.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-blue-900">Ready to Get Started?</h3>
            <p className="text-blue-700">
              The entire process takes about 25 minutes, but you can take breaks anytime. 
              Let's begin with your personal information.
            </p>
            <Button 
              onClick={handleContinue}
              size="lg"
              className="min-w-48"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Begin Onboarding
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 