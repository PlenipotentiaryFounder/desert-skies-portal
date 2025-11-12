"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plane } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface DayClickModalProps {
  date: Date | null
  open: boolean
  onClose: () => void
  onSubmit: (data: { 
    action: 'request_flight' | 'set_availability'
    availability?: 'available' | 'not_available'
    timeSlot?: 'all_day' | 'morning' | 'afternoon' | 'evening' | 'night'
    notes?: string 
  }) => void
}

export function DayClickModal({ date, open, onClose, onSubmit }: DayClickModalProps) {
  const [action, setAction] = useState<'request_flight' | 'set_availability'>('request_flight')
  const [availability, setAvailability] = useState<'available' | 'not_available'>('available')
  const [timeSlot, setTimeSlot] = useState<'all_day' | 'morning' | 'afternoon' | 'evening' | 'night'>('all_day')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  if (!date) return null

  const timeSlotOptions = [
    { value: 'all_day', label: 'All Day', icon: '☀️', time: 'Any Time' },
    { value: 'morning', label: 'Morning', icon: '🌅', time: '6 AM - 11 AM' },
    { value: 'afternoon', label: 'Afternoon', icon: '☀️', time: '12 PM - 3 PM' },
    { value: 'evening', label: 'Evening', icon: '🌆', time: '3 PM - 7 PM' },
    { value: 'night', label: 'Night', icon: '🌙', time: '8 PM - 12 AM' },
  ]

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      if (action === 'request_flight') {
        await onSubmit({ action: 'request_flight', notes })
      } else {
        await onSubmit({ action: 'set_availability', availability, timeSlot, notes })
      }
      
      // Reset form
      setAction('request_flight')
      setAvailability('available')
      setTimeSlot('all_day')
      setNotes('')
      onClose()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  const isPast = date < new Date() && !isToday

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="w-5 h-5 text-aviation-sky-600" />
            {isToday ? 'Today' : format(date, 'EEEE, MMMM d, yyyy')}
          </DialogTitle>
          <DialogDescription>
            {isPast ? (
              <span className="text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                This date has passed
              </span>
            ) : (
              'Request a flight or set your availability'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Action Toggle - Big, Clear Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAction('request_flight')}
              disabled={isPast}
              className={cn(
                "relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                "hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
                action === 'request_flight' 
                  ? 'border-aviation-sky-500 bg-aviation-sky-50 dark:bg-aviation-sky-950/30 shadow-sm' 
                  : 'border-gray-200 hover:border-aviation-sky-300'
              )}
            >
              <div className={cn(
                "p-3 rounded-full",
                action === 'request_flight' 
                  ? 'bg-aviation-sky-500 text-white' 
                  : 'bg-gray-100 text-gray-600'
              )}>
                <Plane className="w-6 h-6" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-sm">Request Flight</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Ask to schedule a training session
                </div>
              </div>
              {action === 'request_flight' && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-5 h-5 text-aviation-sky-600" />
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setAction('set_availability')}
              disabled={isPast}
              className={cn(
                "relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                "hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
                action === 'set_availability' 
                  ? 'border-aviation-sky-500 bg-aviation-sky-50 dark:bg-aviation-sky-950/30 shadow-sm' 
                  : 'border-gray-200 hover:border-aviation-sky-300'
              )}
            >
              <div className={cn(
                "p-3 rounded-full",
                action === 'set_availability' 
                  ? 'bg-aviation-sky-500 text-white' 
                  : 'bg-gray-100 text-gray-600'
              )}>
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-sm">Set Availability</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Let us know when you can fly
                </div>
              </div>
              {action === 'set_availability' && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-5 h-5 text-aviation-sky-600" />
                </div>
              )}
            </button>
          </div>

          {/* Availability Options - Only show if setting availability */}
          {action === 'set_availability' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Your Availability</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAvailability('available')}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border-2 transition-all hover:shadow-sm",
                      availability === 'available'
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                        : 'border-gray-200 hover:border-green-300'
                    )}
                  >
                    <CheckCircle className={cn(
                      "w-5 h-5",
                      availability === 'available' ? 'text-green-600' : 'text-gray-400'
                    )} />
                    <div className="text-left">
                      <div className="font-semibold text-sm">Available</div>
                      <div className="text-xs text-muted-foreground">Ready to fly</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAvailability('not_available')}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border-2 transition-all hover:shadow-sm",
                      availability === 'not_available'
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                        : 'border-gray-200 hover:border-red-300'
                    )}
                  >
                    <XCircle className={cn(
                      "w-5 h-5",
                      availability === 'not_available' ? 'text-red-600' : 'text-gray-400'
                    )} />
                    <div className="text-left">
                      <div className="font-semibold text-sm">Not Available</div>
                      <div className="text-xs text-muted-foreground">Can't fly this day</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Time Slot Selection - Only for Available */}
              {availability === 'available' && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">When are you available?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlotOptions.map((slot) => (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => setTimeSlot(slot.value as any)}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border-2 transition-all",
                          timeSlot === slot.value
                            ? 'border-aviation-sky-500 bg-aviation-sky-50 dark:bg-aviation-sky-950/30 shadow-sm'
                            : 'border-gray-200 hover:border-aviation-sky-300 hover:shadow-sm'
                        )}
                      >
                        <span className="text-lg">{slot.icon}</span>
                        <div className="text-left flex-1">
                          <div className="font-semibold text-xs">{slot.label}</div>
                          <div className="text-[10px] text-muted-foreground">{slot.time}</div>
                        </div>
                        {timeSlot === slot.value && (
                          <CheckCircle className="w-4 h-4 text-aviation-sky-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              {action === 'request_flight' ? 'Message (Optional)' : 'Notes (Optional)'}
            </Label>
            <Textarea
              id="notes"
              placeholder={
                action === 'request_flight'
                  ? 'Any specific requests or preferences?'
                  : 'Why are you unavailable? (vacation, work, etc.)'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={loading || isPast}
            >
              {loading ? (
                'Saving...'
              ) : action === 'request_flight' ? (
                'Send Request'
              ) : (
                'Save Availability'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

