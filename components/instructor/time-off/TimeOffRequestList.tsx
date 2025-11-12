"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { format, parseISO, differenceInDays } from 'date-fns'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Trash2,
  Ban
} from 'lucide-react'
import { toast } from 'sonner'

interface TimeOffRequest {
  id: string
  instructor_id: string
  start_date: string
  end_date: string
  reason: string
  notes: string | null
  status: 'pending' | 'approved' | 'denied' | 'cancelled'
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  created_at: string
  updated_at: string
  instructor?: {
    id: string
    first_name: string
    last_name: string
    email: string
    avatar_url: string | null
  }
  reviewer?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

interface TimeOffRequestListProps {
  refreshTrigger?: number
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-amber-500',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    color: 'bg-green-500',
    textColor: 'text-green-600 dark:text-green-400',
  },
  denied: {
    label: 'Denied',
    icon: XCircle,
    color: 'bg-red-500',
    textColor: 'text-red-600 dark:text-red-400',
  },
  cancelled: {
    label: 'Cancelled',
    icon: Ban,
    color: 'bg-gray-500',
    textColor: 'text-gray-600 dark:text-gray-400',
  },
}

const REASON_LABELS: Record<string, string> = {
  vacation: 'Vacation',
  sick: 'Sick Leave',
  personal: 'Personal',
  professional_development: 'Professional Development',
  family: 'Family',
  other: 'Other',
}

export function TimeOffRequestList({ refreshTrigger }: TimeOffRequestListProps) {
  const [requests, setRequests] = useState<TimeOffRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [refreshTrigger])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/instructor/time-off')
      if (!response.ok) throw new Error('Failed to fetch requests')
      
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error('Error fetching time-off requests:', error)
      toast.error('Failed to load time-off requests')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    setIsCancelling(true)
    try {
      const response = await fetch('/api/instructor/time-off', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'cancelled' }),
      })

      if (!response.ok) throw new Error('Failed to cancel request')
      
      toast.success('Request cancelled')
      setIsDetailsOpen(false)
      fetchRequests()
    } catch (error) {
      console.error('Error cancelling request:', error)
      toast.error('Failed to cancel request')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/instructor/time-off?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete request')
      
      toast.success('Request deleted')
      setIsDetailsOpen(false)
      fetchRequests()
    } catch (error) {
      console.error('Error deleting request:', error)
      toast.error('Failed to delete request')
    }
  }

  const openDetails = (request: TimeOffRequest) => {
    setSelectedRequest(request)
    setIsDetailsOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <CardTitle className="mb-2">No Time-Off Requests</CardTitle>
        <p className="text-muted-foreground">
          You haven't submitted any time-off requests yet. Use the form above to request time off.
        </p>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {requests.map((request) => {
          const statusConfig = STATUS_CONFIG[request.status]
          const Icon = statusConfig.icon
          const dayCount = differenceInDays(parseISO(request.end_date), parseISO(request.start_date)) + 1

          return (
            <Card 
              key={request.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => openDetails(request)}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${statusConfig.color} text-white`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      <Badge variant="outline">
                        {REASON_LABELS[request.reason] || request.reason}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(parseISO(request.start_date), 'MMM d, yyyy')}
                          {' '}-{' '}
                          {format(parseISO(request.end_date), 'MMM d, yyyy')}
                        </span>
                        <span className="text-muted-foreground">({dayCount} day{dayCount > 1 ? 's' : ''})</span>
                      </div>
                      
                      {request.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {request.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground text-right">
                    <p>Requested {format(parseISO(request.created_at), 'MMM d, yyyy')}</p>
                    {request.reviewed_at && (
                      <p className={statusConfig.textColor}>
                        {statusConfig.label} {format(parseISO(request.reviewed_at), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRequest && (
                <>
                  {React.createElement(STATUS_CONFIG[selectedRequest.status].icon, {
                    className: `w-5 h-5 ${STATUS_CONFIG[selectedRequest.status].textColor}`,
                  })}
                  Time-Off Request
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && REASON_LABELS[selectedRequest.reason]}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              {/* Date Range */}
              <div>
                <h4 className="text-sm font-medium mb-2">Date Range</h4>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {format(parseISO(selectedRequest.start_date), 'MMMM d, yyyy')}
                    {' → '}
                    {format(parseISO(selectedRequest.end_date), 'MMMM d, yyyy')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {differenceInDays(parseISO(selectedRequest.end_date), parseISO(selectedRequest.start_date)) + 1} days
                </p>
              </div>

              {/* Status */}
              <div>
                <h4 className="text-sm font-medium mb-2">Status</h4>
                <Badge className={`${STATUS_CONFIG[selectedRequest.status].color} text-white`}>
                  {React.createElement(STATUS_CONFIG[selectedRequest.status].icon, {
                    className: 'w-3 h-3 mr-1',
                  })}
                  {STATUS_CONFIG[selectedRequest.status].label}
                </Badge>
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Your Notes</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}

              {/* Review Info */}
              {selectedRequest.status !== 'pending' && selectedRequest.status !== 'cancelled' && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Review</h4>
                  <div className="text-sm space-y-1">
                    {selectedRequest.reviewer && (
                      <p>
                        Reviewed by: {selectedRequest.reviewer.first_name} {selectedRequest.reviewer.last_name}
                      </p>
                    )}
                    {selectedRequest.reviewed_at && (
                      <p className="text-muted-foreground">
                        {format(parseISO(selectedRequest.reviewed_at), 'MMMM d, yyyy h:mm a')}
                      </p>
                    )}
                    {selectedRequest.review_notes && (
                      <p className="text-muted-foreground bg-muted p-3 rounded-md mt-2">
                        {selectedRequest.review_notes}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedRequest?.status === 'pending' && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDelete(selectedRequest.id)}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            {(selectedRequest?.status === 'pending' || selectedRequest?.status === 'approved') && (
              <Button 
                variant="outline" 
                onClick={() => handleCancel(selectedRequest.id)}
                disabled={isCancelling}
                className="w-full sm:w-auto"
              >
                <Ban className="w-4 h-4 mr-2" />
                {isCancelling ? 'Cancelling...' : 'Cancel Request'}
              </Button>
            )}
            <Button 
              variant="secondary" 
              onClick={() => setIsDetailsOpen(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


