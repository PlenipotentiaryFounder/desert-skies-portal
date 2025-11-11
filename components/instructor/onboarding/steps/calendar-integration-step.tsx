'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, AlertTriangle, Check, RefreshCw, ExternalLink, CheckCircle } from 'lucide-react'
import Image from 'next/image'

interface CalendarIntegrationStepProps {
  onboardingData: any
  userProfile: any
  onComplete: (data: any) => void
  onSkip: () => void
  isSaving: boolean
}

export function CalendarIntegrationStep({
  onboardingData,
  userProfile,
  onComplete,
  onSkip,
  isSaving
}: CalendarIntegrationStepProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'outlook' | null>(null)

  const connectCalendar = async (provider: 'google' | 'outlook') => {
    setIsConnecting(true)
    setSelectedProvider(provider)

    try {
      // Redirect to OAuth flow
      const callbackUrl = `${window.location.origin}/api/auth/callback/${provider}-calendar`
      const redirectUrl = `/api/calendar/connect?provider=${provider}&callback=${encodeURIComponent(callbackUrl)}`
      
      window.location.href = redirectUrl
    } catch (error) {
      console.error('Error connecting calendar:', error)
      setIsConnecting(false)
      setSelectedProvider(null)
    }
  }

  const handleSkipStep = () => {
    const data = {
      calendar_integration_completed: false,
      calendar_integration_completed_step: true
    }
    onSkip()
    onComplete(data)
  }

  const handleComplete = () => {
    const data = {
      calendar_integration_completed: true,
      calendar_provider: selectedProvider,
      calendar_integration_completed_step: true
    }
    onComplete(data)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <Calendar className="w-12 h-12 text-blue-600 mx-auto" />
        <h2 className="text-3xl font-bold">Calendar Integration</h2>
        <p className="text-gray-600">
          Connect your calendar for seamless scheduling (Optional)
        </p>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Calendar className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Optional Step:</strong> Calendar integration enables automatic sync of flight lessons 
          with your personal calendar. You can set this up now or skip and configure it later from your dashboard.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Benefits of Calendar Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Automatic Sync</p>
                <p className="text-gray-600">Lessons automatically appear on your calendar</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Conflict Prevention</p>
                <p className="text-gray-600">Avoid double-booking with your personal schedule</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Mobile Notifications</p>
                <p className="text-gray-600">Get reminders on your phone for upcoming lessons</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Multi-Device Access</p>
                <p className="text-gray-600">View your schedule from any device</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Choose Your Calendar Provider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-auto p-6 flex flex-col items-center gap-3 hover:border-blue-500 hover:bg-blue-50"
              onClick={() => connectCalendar('google')}
              disabled={isConnecting}
            >
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 24 24" className="w-8 h-8">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Google Calendar</p>
                <p className="text-xs text-gray-500 mt-1">Connect with Gmail</p>
              </div>
              {isConnecting && selectedProvider === 'google' && (
                <RefreshCw className="w-4 h-4 animate-spin" />
              )}
            </Button>

            <Button
              variant="outline"
              className="h-auto p-6 flex flex-col items-center gap-3 hover:border-blue-500 hover:bg-blue-50"
              onClick={() => connectCalendar('outlook')}
              disabled={isConnecting}
            >
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 24 24" className="w-8 h-8">
                  <path fill="#0078D4" d="M24 7.875v8.25A3.375 3.375 0 0120.625 19.5h-12A3.375 3.375 0 015.25 16.125V7.875A3.375 3.375 0 018.625 4.5h12A3.375 3.375 0 0124 7.875z"/>
                  <path fill="#FFF" d="M14.25 8.25h-4.5v7.5h4.5v-7.5z"/>
                  <path fill="#50E6FF" d="M0 9.75h7.5v4.5H0z"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Outlook Calendar</p>
                <p className="text-xs text-gray-500 mt-1">Connect with Microsoft</p>
              </div>
              {isConnecting && selectedProvider === 'outlook' && (
                <RefreshCw className="w-4 h-4 animate-spin" />
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            You'll be redirected to securely authorize calendar access
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4 pt-6">
        <Button
          variant="outline"
          onClick={handleSkipStep}
          disabled={isSaving}
          size="lg"
        >
          Skip for Now
        </Button>
      </div>

      <Alert className="bg-gray-50 border-gray-200">
        <Calendar className="h-4 w-4 text-gray-600" />
        <AlertDescription className="text-gray-700 text-xs">
          <strong>Note:</strong> You can connect your calendar later from Settings → Calendar Integration. 
          This step is completely optional and doesn't affect your ability to teach.
        </AlertDescription>
      </Alert>
    </div>
  )
}

