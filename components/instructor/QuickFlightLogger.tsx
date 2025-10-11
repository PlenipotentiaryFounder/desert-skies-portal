"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plane,
  Clock,
  Calculator,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  MapPin,
  DollarSign,
  Timer,
  Play,
  Pause,
  Square
} from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface QuickFlightLoggerProps {
  studentId: string
  instructorId: string
  onSessionCreated?: (sessionId: string) => void
  scheduledSessionId?: string // If this is for an existing scheduled session
}

export function QuickFlightLogger({
  studentId,
  instructorId,
  onSessionCreated,
  scheduledSessionId
}: QuickFlightLoggerProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [sessionData, setSessionData] = useState({
    aircraft_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    start_time: "",
    end_time: "",
    hobbs_start: 0,
    hobbs_end: 0,
    flight_hours: 0,
    ground_hours: 0,
    notes: ""
  })

  const [availableAircraft, setAvailableAircraft] = useState<any[]>([])
  const [accountInfo, setAccountInfo] = useState<any>(null)
  const [rates, setRates] = useState<any>(null)
  const [sessionTimer, setSessionTimer] = useState<{
    isRunning: boolean
    startTime: Date | null
    elapsed: number
  }>({
    isRunning: false,
    startTime: null,
    elapsed: 0
  })

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (sessionTimer.isRunning && sessionTimer.startTime) {
      interval = setInterval(() => {
        setSessionTimer(prev => ({
          ...prev,
          elapsed: Date.now() - prev.startTime!.getTime()
        }))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [sessionTimer.isRunning, sessionTimer.startTime])

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [studentId, instructorId])

  const loadInitialData = async () => {
    try {
      // Load aircraft, account info, and rates
      const [aircraftRes, accountRes, ratesRes] = await Promise.all([
        fetch('/api/admin/aircraft'),
        fetch(`/api/instructor/billing/account?student_id=${studentId}&instructor_id=${instructorId}`),
        fetch(`/api/instructor/billing/rates?student_id=${studentId}&instructor_id=${instructorId}`)
      ])

      const aircraft = await aircraftRes.json()
      const account = await accountRes.json()
      const rates = await ratesRes.json()

      setAvailableAircraft(aircraft || [])
      setAccountInfo(account || {})
      setRates(rates?.[0] || {})

      // Pre-select first aircraft if available
      if (aircraft?.length > 0) {
        setSessionData(prev => ({ ...prev, aircraft_id: aircraft[0].id }))
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
    }
  }

  const startTimer = () => {
    setSessionTimer({
      isRunning: true,
      startTime: new Date(),
      elapsed: 0
    })
  }

  const pauseTimer = () => {
    setSessionTimer(prev => ({ ...prev, isRunning: false }))
  }

  const stopTimer = () => {
    if (sessionTimer.startTime) {
      const elapsedMinutes = sessionTimer.elapsed / (1000 * 60)
      setSessionData(prev => ({
        ...prev,
        flight_hours: Math.round(elapsedMinutes * 100) / 100
      }))
    }
    setSessionTimer({
      isRunning: false,
      startTime: null,
      elapsed: 0
    })
  }

  const calculateCosts = () => {
    if (!rates) return { flightCost: 0, groundCost: 0, totalCost: 0 }

    const flightCost = sessionData.flight_hours * rates.flight_instruction_rate
    const groundCost = sessionData.ground_hours * rates.ground_instruction_rate
    const totalCost = flightCost + groundCost

    return { flightCost, groundCost, totalCost }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const costs = calculateCosts()

      // Create flight session
      const sessionPayload = {
        student_id: studentId,
        instructor_id: instructorId,
        aircraft_id: sessionData.aircraft_id,
        date: sessionData.date,
        start_time: sessionData.start_time,
        end_time: sessionData.end_time,
        hobbs_start: sessionData.hobbs_start,
        hobbs_end: sessionData.hobbs_end,
        status: 'completed',
        notes: sessionData.notes,
        flight_hours: sessionData.flight_hours,
        ground_hours: sessionData.ground_hours
      }

      const sessionRes = await fetch('/api/instructor/schedule/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionPayload)
      })

      if (!sessionRes.ok) {
        throw new Error('Failed to create flight session')
      }

      const session = await sessionRes.json()

      // Process billing
      const billingRes = await fetch('/api/instructor/billing/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          payment_method: 'account_balance'
        })
      })

      if (!billingRes.ok) {
        throw new Error('Failed to process billing')
      }

      toast({
        title: "Flight session logged successfully!",
        description: `Billed ${costs.totalCost.toFixed(2)} from student account`,
      })

      onSessionCreated?.(session.id)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const costs = calculateCosts()
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quick Flight Logger</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Log a flight session and process billing in one step
          </p>
        </div>
        <div className="flex gap-2">
          {sessionTimer.isRunning ? (
            <>
              <Button variant="outline" onClick={pauseTimer} size="sm" className="flex-1 sm:flex-none">
                <Pause className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Pause Timer</span>
                <span className="sm:hidden">Pause</span>
              </Button>
              <Button variant="outline" onClick={stopTimer} size="sm" className="flex-1 sm:flex-none">
                <Square className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Stop & Log</span>
                <span className="sm:hidden">Stop</span>
              </Button>
            </>
          ) : (
            <Button onClick={startTimer} size="sm" className="flex-1 sm:flex-none">
              <Play className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Start Timer</span>
              <span className="sm:hidden">Start</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Session Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5" />
              Session Details
            </CardTitle>
            <CardDescription>
              Flight session information and timing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Aircraft Selection */}
            <div className="space-y-2">
              <Label>Aircraft</Label>
              <Select value={sessionData.aircraft_id} onValueChange={(value) =>
                setSessionData(prev => ({ ...prev, aircraft_id: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select aircraft" />
                </SelectTrigger>
                <SelectContent>
                  {availableAircraft.map(aircraft => (
                    <SelectItem key={aircraft.id} value={aircraft.id}>
                      {aircraft.tail_number} - {aircraft.make} {aircraft.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={sessionData.date}
                  onChange={(e) => setSessionData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {sessionTimer.isRunning ? formatTime(sessionTimer.elapsed) : `${sessionData.flight_hours.toFixed(1)}h`}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {sessionTimer.isRunning ? 'Timer Running' : 'Flight Time'}
                  </p>
                </div>
              </div>
            </div>

            {/* Hobbs Times */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hobbs Start</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={sessionData.hobbs_start}
                  onChange={(e) => setSessionData(prev => ({ ...prev, hobbs_start: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2">
                <Label>Hobbs End</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={sessionData.hobbs_end}
                  onChange={(e) => setSessionData(prev => ({ ...prev, hobbs_end: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.0"
                />
              </div>
            </div>

            {/* Ground Hours */}
            <div className="space-y-2">
              <Label>Ground Instruction (hours)</Label>
              <Input
                type="number"
                step="0.5"
                value={sessionData.ground_hours}
                onChange={(e) => setSessionData(prev => ({ ...prev, ground_hours: parseFloat(e.target.value) || 0 }))}
                placeholder="0.0"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={sessionData.notes}
                onChange={(e) => setSessionData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Brief session notes..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Account & Billing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Account & Billing
            </CardTitle>
            <CardDescription>
              Student account status and billing calculation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Account Balance */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Account Balance</span>
                <Badge variant={accountInfo?.account_balance > costs.totalCost ? "default" : "destructive"}>
                  {accountInfo?.account_balance > costs.totalCost ? "Sufficient" : "Insufficient"}
                </Badge>
              </div>
              <div className="text-2xl font-bold">
                ${accountInfo?.account_balance?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-muted-foreground">
                Available for this session
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Flight Instruction</span>
                <span>${costs.flightCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ground Instruction</span>
                <span>${costs.groundCost.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Cost</span>
                <span>${costs.totalCost.toFixed(2)}</span>
              </div>
            </div>

            {/* Billing Status */}
            <div className="p-4 rounded-lg border-2" style={{
              borderColor: costs.totalCost <= (accountInfo?.account_balance || 0) ? '#22c55e' : '#ef4444',
              backgroundColor: costs.totalCost <= (accountInfo?.account_balance || 0) ? '#f0fdf4' : '#fef2f2'
            }}>
              {costs.totalCost <= (accountInfo?.account_balance || 0) ? (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Ready to bill</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Insufficient balance</span>
                </div>
              )}
              <p className="text-sm mt-1">
                {costs.totalCost <= (accountInfo?.account_balance || 0)
                  ? `Will deduct $${costs.totalCost.toFixed(2)} from account`
                  : `Student needs $${(costs.totalCost - (accountInfo?.account_balance || 0)).toFixed(2)} more`
                }
              </p>
            </div>

            {/* Action Button */}
            <Button
              onClick={handleSubmit}
              disabled={loading || !sessionData.aircraft_id || sessionData.flight_hours <= 0}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Log Session & Bill Account
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Timer Display (when running) */}
      {sessionTimer.isRunning && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Timer className="w-8 h-8 text-primary" />
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-mono font-bold text-primary">
                  {formatTime(sessionTimer.elapsed)}
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">Flight Timer Running</p>
                {/* Touch-friendly pause/stop buttons for mobile */}
                <div className="flex gap-2 mt-4 sm:hidden">
                  <Button variant="outline" onClick={pauseTimer} size="sm" className="flex-1">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                  <Button variant="outline" onClick={stopTimer} size="sm" className="flex-1">
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
