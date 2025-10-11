"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Shield,
  Key,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Smartphone
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function PINSetup() {
  const { toast } = useToast()
  const [currentPIN, setCurrentPIN] = useState("")
  const [newPIN, setNewPIN] = useState("")
  const [confirmPIN, setConfirmPIN] = useState("")
  const [showPIN, setShowPIN] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'setup' | 'change' | 'verify'>('setup')

  const handleSetPIN = async () => {
    if (newPIN.length !== 4 || !/^\d{4}$/.test(newPIN)) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 4 digits",
        variant: "destructive"
      })
      return
    }

    if (newPIN !== confirmPIN) {
      toast({
        title: "PIN Mismatch",
        description: "PIN confirmation doesn't match",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/student/pin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newPIN })
      })

      if (response.ok) {
        toast({
          title: "PIN Set Successfully",
          description: "Your 4-digit PIN has been configured for digital signatures",
        })
        setNewPIN("")
        setConfirmPIN("")
        setMode('verify')
      } else {
        throw new Error('Failed to set PIN')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set PIN. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPIN = async () => {
    if (currentPIN.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "Please enter your 4-digit PIN",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/student/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: currentPIN })
      })

      if (response.ok) {
        toast({
          title: "PIN Verified",
          description: "Your PIN is correct and ready for use",
        })
        setCurrentPIN("")
      } else {
        throw new Error('Invalid PIN')
      }
    } catch (error) {
      toast({
        title: "Invalid PIN",
        description: "The PIN you entered is incorrect",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Digital Signature PIN</h1>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">
          Set up a 4-digit PIN for digitally signing flight sessions and logbook entries
        </p>
      </div>

      {/* PIN Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">PIN Status</p>
                <p className="text-sm text-muted-foreground">Ready for digital signatures</p>
              </div>
            </div>
            <Badge variant="default">Configured</Badge>
          </div>
        </CardContent>
      </Card>

      {/* PIN Setup/Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            {mode === 'setup' ? 'Set PIN' : mode === 'change' ? 'Change PIN' : 'Verify PIN'}
          </CardTitle>
          <CardDescription>
            {mode === 'setup' && "Create a new 4-digit PIN for digital signatures"}
            {mode === 'change' && "Enter current PIN and set a new one"}
            {mode === 'verify' && "Enter your PIN to verify it's working"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'change' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="current-pin">Current PIN</Label>
                <div className="relative">
                  <Input
                    id="current-pin"
                    type={showPIN ? "text" : "password"}
                    value={currentPIN}
                    onChange={(e) => setCurrentPIN(e.target.value)}
                    placeholder="Enter current 4-digit PIN"
                    maxLength={4}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPIN(!showPIN)}
                  >
                    {showPIN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Separator />
            </>
          )}

          {mode !== 'verify' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-pin">New PIN</Label>
                <div className="relative">
                  <Input
                    id="new-pin"
                    type={showPIN ? "text" : "password"}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={newPIN}
                    onChange={(e) => setNewPIN(e.target.value)}
                    placeholder="Enter 4-digit PIN"
                    maxLength={4}
                    className="pr-10 text-center text-lg tracking-wider"
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPIN(!showPIN)}
                  >
                    {showPIN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-pin">Confirm PIN</Label>
                <Input
                  id="confirm-pin"
                  type={showPIN ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={confirmPIN}
                  onChange={(e) => setConfirmPIN(e.target.value)}
                  placeholder="Confirm 4-digit PIN"
                  maxLength={4}
                  className="text-center text-lg tracking-wider"
                  autoComplete="off"
                />
              </div>
            </>
          )}

          {mode === 'verify' && (
            <div className="space-y-2">
              <Label htmlFor="verify-pin">Enter PIN</Label>
              <div className="relative">
                <Input
                  id="verify-pin"
                  type={showPIN ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={currentPIN}
                  onChange={(e) => setCurrentPIN(e.target.value)}
                  placeholder="Enter your 4-digit PIN"
                  maxLength={4}
                  className="pr-10 text-center text-lg tracking-wider"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPIN(!showPIN)}
                >
                  {showPIN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {mode !== 'setup' && (
              <Button variant="outline" onClick={() => setMode('setup')}>
                Set New PIN
              </Button>
            )}
            {mode === 'setup' && (
              <Button onClick={handleSetPIN} disabled={loading || newPIN.length !== 4}>
                {loading ? 'Setting PIN...' : 'Set PIN'}
              </Button>
            )}
            {mode === 'change' && (
              <Button onClick={handleSetPIN} disabled={loading || currentPIN.length !== 4 || newPIN.length !== 4}>
                {loading ? 'Changing PIN...' : 'Change PIN'}
              </Button>
            )}
            {mode === 'verify' && (
              <Button onClick={handleVerifyPIN} disabled={loading || currentPIN.length !== 4}>
                {loading ? 'Verifying...' : 'Verify PIN'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            How to Use Your PIN
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-1 rounded-full bg-blue-100">
                <span className="text-xs font-bold text-blue-600">1</span>
              </div>
              <div>
                <p className="font-medium">Flight Session Signatures</p>
                <p className="text-sm text-muted-foreground">
                  After completing a flight, use your PIN to digitally sign the session record
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1 rounded-full bg-green-100">
                <span className="text-xs font-bold text-green-600">2</span>
              </div>
              <div>
                <p className="font-medium">Logbook Entries</p>
                <p className="text-sm text-muted-foreground">
                  Sign logbook entries to confirm flight time and meet FAA requirements
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1 rounded-full bg-orange-100">
                <span className="text-xs font-bold text-orange-600">3</span>
              </div>
              <div>
                <p className="font-medium">Billing Confirmation</p>
                <p className="text-sm text-muted-foreground">
                  Confirm billing amounts and account deductions with your signature
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="font-medium text-orange-800">Important</span>
            </div>
            <p className="text-sm text-orange-700">
              Your PIN serves as your legal digital signature for FAA compliance.
              Keep it secure and do not share it with anyone.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
