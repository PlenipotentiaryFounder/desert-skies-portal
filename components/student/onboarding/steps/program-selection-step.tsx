'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { 
  FileText, 
  Check,
  RefreshCw,
  AlertTriangle,
  Plane,
  Clock,
  DollarSign,
  BookOpen,
  Award
} from 'lucide-react'

interface ProgramSelectionStepProps {
  onboardingData: any
  userProfile: any
  onComplete: (data: any) => void
  onSkip: () => void
  isSaving: boolean
}

const TRAINING_PROGRAMS = [
  {
    id: 'private_pilot',
    name: 'Private Pilot License (PPL)',
    description: 'Learn to fly for personal and recreational purposes',
    duration: '3-6 months',
    flightHours: '40+ hours',
    groundSchool: 'Included',
    cost: '$12,000 - $15,000',
    features: [
      'Comprehensive ground school',
      'One-on-one flight instruction',
      'Written and practical test prep',
      'Solo flight privileges',
      'Cross-country flight training'
    ],
    requirements: [
      'Be at least 17 years old',
      'Hold a valid medical certificate',
      'Read, speak, and understand English',
      'Pass FAA written and practical exams'
    ],
    popular: true
  },
  {
    id: 'instrument_rating',
    name: 'Instrument Rating (IR)',
    description: 'Fly in clouds and low visibility conditions',
    duration: '2-4 months',
    flightHours: '40+ hours',
    groundSchool: 'Included',
    cost: '$10,000 - $12,000',
    features: [
      'IFR procedures and navigation',
      'Instrument approach procedures',
      'Weather interpretation',
      'Emergency procedures',
      'Precision and non-precision approaches'
    ],
    requirements: [
      'Hold a Private Pilot License',
      'Valid medical certificate',
      'Pass FAA written and practical exams',
      'Cross-country flight experience'
    ],
    popular: false
  },
  {
    id: 'commercial_pilot',
    name: 'Commercial Pilot License (CPL)',
    description: 'Fly for compensation or commercial operations',
    duration: '4-8 months',
    flightHours: '250+ hours',
    groundSchool: 'Included',
    cost: '$20,000 - $25,000',
    features: [
      'Advanced flight maneuvers',
      'Commercial operations training',
      'Multi-engine training (optional)',
      'Complex aircraft operations',
      'Professional pilot standards'
    ],
    requirements: [
      'Be at least 18 years old',
      'Hold Private Pilot License',
      'Valid medical certificate',
      'Pass FAA written and practical exams'
    ],
    popular: false
  },
  {
    id: 'discovery_flight',
    name: 'Discovery Flight',
    description: 'Introductory flight lesson to experience aviation',
    duration: '1-2 hours',
    flightHours: '1 hour',
    groundSchool: 'Basic introduction',
    cost: '$150 - $200',
    features: [
      'Introduction to flight controls',
      'Basic flight principles',
      'Local area flight',
      'Hands-on flying experience',
      'Professional instructor guidance'
    ],
    requirements: [
      'No prior experience required',
      'Must be at least 12 years old',
      'Valid government ID',
      'Complete safety briefing'
    ],
    popular: false
  }
]

export function ProgramSelectionStep({
  onboardingData,
  userProfile,
  onComplete,
  onSkip,
  isSaving
}: ProgramSelectionStepProps) {
  const [selectedProgram, setSelectedProgram] = useState(
    onboardingData.desired_program || ''
  )
  const [errors, setErrors] = useState<string[]>([])

  const handleProgramSelect = (programId: string) => {
    setSelectedProgram(programId)
  }

  const validateForm = () => {
    const newErrors: string[] = []
    
    if (!selectedProgram) {
      newErrors.push('Please select a training program')
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    const programData = {
      desired_program: selectedProgram
    }
    
    onComplete(programData)
  }

  const selectedProgramData = TRAINING_PROGRAMS.find(p => p.id === selectedProgram)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <FileText className="w-12 h-12 text-blue-600 mx-auto" />
        <h2 className="text-3xl font-bold">Program Selection</h2>
        <p className="text-gray-600">
          Choose the training program that best fits your aviation goals
        </p>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <RadioGroup value={selectedProgram} onValueChange={handleProgramSelect}>
        <div className="grid md:grid-cols-2 gap-6">
          {TRAINING_PROGRAMS.map((program) => (
            <Card 
              key={program.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedProgram === program.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleProgramSelect(program.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={program.id} id={program.id} />
                    <Label htmlFor={program.id} className="text-lg font-semibold cursor-pointer">
                      {program.name}
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    {program.popular && (
                      <Badge variant="secondary" className="text-xs">Popular</Badge>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 mt-1">{program.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{program.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{program.flightHours}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{program.groundSchool}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{program.cost}</span>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h4 className="font-medium mb-2">What's Included:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {program.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Requirements */}
                <div>
                  <h4 className="font-medium mb-2">Requirements:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {program.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Award className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </RadioGroup>

      {selectedProgramData && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">
              Great Choice! You've selected: {selectedProgramData.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800 mb-4">
              {selectedProgramData.description}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Complete onboarding process</li>
                  <li>• Schedule your first lesson</li>
                  <li>• Meet your assigned instructor</li>
                  <li>• Begin ground school training</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">What to Expect:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Personalized training plan</li>
                  <li>• Flexible scheduling options</li>
                  <li>• Progress tracking and reporting</li>
                  <li>• Professional instructor support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertDescription>
          <strong>Program Flexibility:</strong> You can change your program selection later 
          if your goals change. Our instructors will work with you to create a custom 
          training plan that fits your schedule and budget.
        </AlertDescription>
      </Alert>

      <div className="flex justify-center pt-6">
        <Button
          onClick={handleSubmit}
          disabled={isSaving || !selectedProgram}
          size="lg"
          className="min-w-48"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving Selection...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Confirm Program Selection
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 