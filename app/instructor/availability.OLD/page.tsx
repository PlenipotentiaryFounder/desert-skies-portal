import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { InstructorAvailabilityCalendar } from '@/components/instructor/availability/InstructorAvailabilityCalendar'

export const metadata = {
  title: 'My Availability | Desert Skies Aviation',
  description: 'Manage your instructor availability calendar',
}

export default function InstructorAvailabilityPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="backdrop-blur-md bg-white/60 dark:bg-zinc-900/60 rounded-2xl shadow-xl p-6 border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-3xl font-bold tracking-tight mb-2">My Availability</h1>
        <p className="text-muted-foreground">
          Set your teaching availability so students and staff can schedule sessions when you're free.
        </p>
      </div>

      {/* Calendar */}
      <Suspense fallback={<Skeleton className="h-[700px] w-full rounded-xl" />}>
        <InstructorAvailabilityCalendar />
      </Suspense>

      {/* Help Section - Mobile Optimized */}
      <div className="backdrop-blur-md bg-blue-50/60 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Quick Tips</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Available:</strong> Students can schedule with you</li>
          <li>• <strong>Not Available:</strong> Blocks scheduling (time off, appointments)</li>
          <li>• <strong>Tentative:</strong> May be available, pending confirmation</li>
          <li>• Time slots let you specify morning, afternoon, evening, or all-day availability</li>
        </ul>
      </div>
    </div>
  )
}


