"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Info } from "lucide-react"

interface StudentDetailsDebugProps {
  studentId: string
  activeEnrollment: any
  instructorId: string
}

export function StudentDetailsDebug({ studentId, activeEnrollment, instructorId }: StudentDetailsDebugProps) {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    // Check for common issues that could cause MutationObserver errors
    const checks = {
      isClient: typeof window !== 'undefined',
      hasDocument: typeof document !== 'undefined',
      hasMutationObserver: typeof MutationObserver !== 'undefined',
      hasReact: typeof React !== 'undefined',
      hasTabs: true, // We'll check this below
      hasCards: true,
      hasButtons: true,
    }

    // Check if required DOM elements exist
    try {
      const tabsElement = document.querySelector('[role="tablist"]')
      checks.hasTabs = !!tabsElement
    } catch (e) {
      checks.hasTabs = false
      setErrors(prev => [...prev, 'Tabs element check failed'])
    }

    // Check for any existing MutationObserver instances
    try {
      const observers = (window as any).__mutationObservers || []
      checks.existingObservers = observers.length
    } catch (e) {
      checks.existingObservers = 0
    }

    setDebugInfo(checks)

    // Listen for errors
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('MutationObserver')) {
        setErrors(prev => [...prev, `MutationObserver Error: ${event.message}`])
      }
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  const testMutationObserver = () => {
    try {
      const testElement = document.createElement('div')
      const observer = new MutationObserver(() => {})
      observer.observe(testElement, { childList: true })
      observer.disconnect()
      setErrors(prev => [...prev, 'MutationObserver test passed'])
    } catch (error) {
      setErrors(prev => [...prev, `MutationObserver test failed: ${error}`])
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Debug Information
          </CardTitle>
          <CardDescription>Diagnostic information for troubleshooting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Environment Checks:</h4>
              <div className="grid gap-2 md:grid-cols-2">
                {Object.entries(debugInfo).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    {value ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">{key}: {String(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Student Data:</h4>
              <div className="text-sm space-y-1">
                <p>Student ID: {studentId}</p>
                <p>Instructor ID: {instructorId}</p>
                <p>Active Enrollment: {activeEnrollment ? 'Yes' : 'No'}</p>
                {activeEnrollment && (
                  <p>Enrollment ID: {activeEnrollment.id}</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Errors:</h4>
              {errors.length > 0 ? (
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-green-600">No errors detected</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={testMutationObserver} variant="outline" size="sm">
                Test MutationObserver
              </Button>
              <Button onClick={() => setErrors([])} variant="outline" size="sm">
                Clear Errors
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}










