'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  ArrowRight, 
  Users, 
  Calendar, 
  FileText,
  DollarSign,
  Plane,
  Trophy
} from 'lucide-react'

interface CompletionStepProps {
  onboardingData: any
  userProfile: any
  onComplete: (data: any) => void
  onSkip: () => void
  isSaving: boolean
}

export function CompletionStep({
  onboardingData,
  userProfile,
  onComplete,
  onSkip,
  isSaving
}: CompletionStepProps) {
  const router = useRouter()

  const handleFinish = async () => {
    // Mark onboarding as complete
    const data = {
      completed_at: new Date().toISOString()
    }
    
    onComplete(data)
    
    // Redirect to instructor dashboard after a short delay
    setTimeout(() => {
      router.push('/instructor/dashboard')
    }, 2000)
  }

  const firstName = userProfile?.first_name || onboardingData.first_name || 'Instructor'

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <Trophy className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900">
          Congratulations, {firstName}!
        </h1>
        <p className="text-xl text-gray-600">
          You've successfully completed the instructor onboarding process
        </p>
      </div>

      <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <CheckCircle className="w-6 h-6" />
            Onboarding Complete!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            Welcome to the Desert Skies Aviation team! Your profile is set up and you're ready to start 
            teaching. Our admin team will review your information and you'll be able to start accepting 
            students shortly.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What You've Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Personal Information</p>
                <p className="text-sm text-gray-600">Contact details and address</p>
              </div>
              <Badge variant="success">✓</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Aviation Credentials</p>
                <p className="text-sm text-gray-600">CFI certificates and experience</p>
              </div>
              <Badge variant="success">✓</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Emergency Contact</p>
                <p className="text-sm text-gray-600">Emergency contact information</p>
              </div>
              <Badge variant="success">✓</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Document Upload</p>
                <p className="text-sm text-gray-600">Certificates and identification</p>
              </div>
              <Badge variant="success">✓</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Insurance Verification</p>
                <p className="text-sm text-gray-600">Policy information and documents</p>
              </div>
              <Badge variant="success">✓</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Contractor Agreement</p>
                <p className="text-sm text-gray-600">Signed independent contractor agreement</p>
              </div>
              <Badge variant="success">✓</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Payment Setup</p>
                <p className="text-sm text-gray-600">Stripe Connect configured</p>
              </div>
              <Badge variant="success">✓</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Review Your Dashboard</p>
                <p className="text-sm text-gray-600">
                  Explore your instructor dashboard to see students, schedule lessons, and track hours
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Set Your Availability</p>
                <p className="text-sm text-gray-600">
                  Configure your teaching schedule and availability preferences
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Review Training Materials</p>
                <p className="text-sm text-gray-600">
                  Access syllabi, lesson plans, and training resources
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Plane className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Start Teaching</p>
                <p className="text-sm text-gray-600">
                  Once approved by admin, you'll be able to accept student assignments
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold text-blue-900">Ready to Begin Your Journey?</h3>
            <p className="text-blue-700">
              Click below to go to your instructor dashboard and start exploring the platform
            </p>
            <Button
              onClick={handleFinish}
              disabled={isSaving}
              size="lg"
              className="min-w-48"
            >
              {isSaving ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 animate-spin" />
                  Finishing...
                </>
              ) : (
                <>
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-gray-500">
        <p>Need help? Contact us at support@desertskiesaviationaz.com</p>
      </div>
    </div>
  )
}

