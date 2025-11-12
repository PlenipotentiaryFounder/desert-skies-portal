"use client"

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { TimeOffRequestForm } from '@/components/instructor/time-off/TimeOffRequestForm'
import { TimeOffRequestList } from '@/components/instructor/time-off/TimeOffRequestList'

export default function InstructorTimeOffPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleRequestSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="backdrop-blur-md bg-white/60 dark:bg-zinc-900/60 rounded-2xl shadow-xl p-6 border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Time-Off Requests</h1>
        <p className="text-muted-foreground">
          Request time off from teaching. All requests must be approved by an administrator.
        </p>
      </div>

      {/* Mobile-Optimized Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Form */}
        <div className="order-1 lg:order-1">
          <TimeOffRequestForm onSuccess={handleRequestSuccess} />
        </div>

        {/* Request List */}
        <div className="order-2 lg:order-2">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">My Requests</h2>
            <p className="text-sm text-muted-foreground">
              View and manage your time-off requests below.
            </p>
          </div>
          <TimeOffRequestList refreshTrigger={refreshTrigger} />
        </div>
      </div>

      {/* Info Section - Mobile Optimized */}
      <div className="backdrop-blur-md bg-amber-50/60 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
        <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">How It Works</h3>
        <ol className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
          <li>1. Submit your time-off request using the form above</li>
          <li>2. An administrator will review and approve or deny your request</li>
          <li>3. Once approved, your availability will automatically be blocked for those dates</li>
          <li>4. You can cancel approved requests if your plans change</li>
        </ol>
      </div>
    </div>
  )
}


