"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Plane, CalendarDays, Sun } from "lucide-react"
import { InstructorMissionsDataWrapper } from "./instructor-missions-data-wrapper"
import { InstructorScheduleCalendarWrapper } from "./instructor-schedule-calendar-wrapper"
import { InstructorAvailabilityCalendar } from "@/components/instructor/availability/InstructorAvailabilityCalendar"
import { TimeOffRequestForm } from "@/components/instructor/time-off/TimeOffRequestForm"
import { TimeOffRequestList } from "@/components/instructor/time-off/TimeOffRequestList"
import { QuickScheduleSection } from "@/components/instructor/quick-schedule-section"

export default function InstructorSchedulePage() {
  const [refreshTimeOff, setRefreshTimeOff] = useState(0)
  const [activeTab, setActiveTab] = useState("missions")

  const handleTimeOffSuccess = () => {
    setRefreshTimeOff(prev => prev + 1)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="backdrop-blur-md bg-white/60 dark:bg-zinc-900/60 rounded-2xl shadow-xl p-6 border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Scheduling Command Center
        </h1>
        <p className="text-muted-foreground">
          Manage your missions, availability, and time-off all in one place
        </p>
      </div>

      {/* Unified Tabs Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto mb-6">
          <TabsTrigger value="missions" className="flex items-center gap-2">
            <Plane className="h-4 w-4" />
            <span className="hidden sm:inline">My Missions</span>
            <span className="sm:hidden">Missions</span>
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">My Availability</span>
            <span className="sm:hidden">Available</span>
          </TabsTrigger>
          <TabsTrigger value="timeoff" className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <span className="hidden sm:inline">Time Off</span>
            <span className="sm:hidden">Time Off</span>
          </TabsTrigger>
        </TabsList>

        {/* MISSIONS TAB */}
        <TabsContent value="missions" className="space-y-6">
          {/* Quick Stats for Missions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="backdrop-blur-md bg-blue-50/60 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-muted-foreground">Today</span>
              </div>
              <p className="text-2xl font-bold">View below</p>
            </div>
            <div className="backdrop-blur-md bg-green-50/60 dark:bg-green-900/30 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-muted-foreground">This Week</span>
              </div>
              <p className="text-2xl font-bold">View below</p>
            </div>
            <div className="backdrop-blur-md bg-orange-50/60 dark:bg-orange-900/30 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-muted-foreground">Need POA</span>
              </div>
              <p className="text-2xl font-bold">View below</p>
            </div>
          </div>

          {/* Mission Views Toggle */}
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <Plane className="h-4 w-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendar View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-6">
              <InstructorMissionsDataWrapper />
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <div className="rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                <InstructorScheduleCalendarWrapper />
              </div>
            </TabsContent>
          </Tabs>

          {/* Quick Schedule Section */}
          <QuickScheduleSection />

          {/* Help Section */}
          <div className="backdrop-blur-md bg-blue-50/60 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Mission Management Tips
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>Red badge</strong> = Needs POA - create it before the flight</li>
              <li>• <strong>Green badge</strong> = POA Ready - you're all set!</li>
              <li>• Click any mission to view details or take action</li>
              <li>• Use calendar view for weekly planning, list view for daily ops</li>
              <li>• <strong>Quick Schedule below</strong> - Schedule your students in just 2-3 clicks!</li>
            </ul>
          </div>
        </TabsContent>

        {/* AVAILABILITY TAB */}
        <TabsContent value="availability" className="space-y-6">
          {/* Info Banner */}
          <div className="backdrop-blur-md bg-green-50/60 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              📅 Set Your Teaching Schedule
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200">
              Click any day to mark yourself as <strong>Available</strong>, <strong>Not Available</strong>, or <strong>Tentative</strong>. 
              Students will only see your available slots when requesting flights.
            </p>
          </div>

          {/* Availability Calendar */}
          <InstructorAvailabilityCalendar />

          {/* Quick Tips */}
          <div className="backdrop-blur-md bg-blue-50/60 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Availability Tips
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• 🟢 <strong>Available</strong> = Students can schedule with you</li>
              <li>• 🔴 <strong>Not Available</strong> = Blocks scheduling (appointments, time off)</li>
              <li>• 🟡 <strong>Tentative</strong> = May be available, pending confirmation</li>
              <li>• Set time slots: All Day, Morning, Afternoon, Evening, or Night</li>
              <li>• Add notes to explain limited availability</li>
            </ul>
          </div>
        </TabsContent>

        {/* TIME OFF TAB */}
        <TabsContent value="timeoff" className="space-y-6">
          {/* Info Banner */}
          <div className="backdrop-blur-md bg-amber-50/60 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              ☀️ Request Time Off
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Submit time-off requests for admin approval. Once approved, your availability will be automatically blocked for those dates.
            </p>
          </div>

          {/* Time Off Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Request Form */}
            <div className="order-1 lg:order-1">
              <TimeOffRequestForm onSuccess={handleTimeOffSuccess} />
            </div>

            {/* Request List */}
            <div className="order-2 lg:order-2">
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">My Requests</h2>
                <p className="text-sm text-muted-foreground">
                  View and manage your time-off requests below.
                </p>
              </div>
              <TimeOffRequestList refreshTrigger={refreshTimeOff} />
            </div>
          </div>

          {/* How It Works */}
          <div className="backdrop-blur-md bg-purple-50/60 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
              📋 How Time-Off Approval Works
            </h3>
            <ol className="text-sm text-purple-800 dark:text-purple-200 space-y-2">
              <li>1. <strong>Submit Request</strong> - Fill out the form with your dates and reason</li>
              <li>2. <strong>Admin Review</strong> - An administrator will review and approve/deny</li>
              <li>3. <strong>Auto-Blocking</strong> - Once approved, your availability is automatically blocked</li>
              <li>4. <strong>Flexibility</strong> - You can cancel approved requests if plans change</li>
            </ol>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
