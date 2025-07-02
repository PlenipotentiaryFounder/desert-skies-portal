"use client"

import { Calendar, dateFnsLocalizer, Event } from "react-big-calendar"
import format from "date-fns/format"
import parse from "date-fns/parse"
import startOfWeek from "date-fns/startOfWeek"
import getDay from "date-fns/getDay"
import enUS from "date-fns/locale/en-US"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

const locales = { "en-US": enUS }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export function StudentScheduleCalendar({ sessions = [] }: { sessions: any[] }) {
  const [selected, setSelected] = useState<Event | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showRescheduleSheet, setShowRescheduleSheet] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()
  const [rescheduleForm, setRescheduleForm] = useState<any>(null)
  const [lessonOptions, setLessonOptions] = useState<any[]>([])
  const [aircraftOptions, setAircraftOptions] = useState<any[]>([])
  const [instructorOptions, setInstructorOptions] = useState<any[]>([])
  const [optionsLoading, setOptionsLoading] = useState(false)

  const events = sessions.map((s) => ({
    id: s.id,
    title: `${s.instructor ? s.instructor.first_name + " " + s.instructor.last_name : "Session"} (${s.session_type})`,
    start: new Date(`${s.date}T${s.start_time}`),
    end: new Date(`${s.date}T${s.end_time}`),
    resource: s,
    status: s.request_status,
  }))
  function eventStyleGetter(event: any) {
    let bg = "#2563eb" // default blue
    if (event.status === "pending") bg = "#fbbf24" // yellow
    if (event.status === "approved") bg = "#22c55e" // green
    if (event.status === "denied" || event.status === "cancelled") bg = "#ef4444" // red
    return { style: { backgroundColor: bg, color: "#fff" } }
  }

  async function fetchOptions() {
    setOptionsLoading(true)
    try {
      const [lessonsRes, aircraftRes, instructorsRes] = await Promise.all([
        fetch("/api/instructor/schedule/lessons").then(r => r.json()),
        fetch("/api/instructor/schedule/aircraft").then(r => r.json()),
        fetch("/api/instructor/schedule/instructors").then(r => r.json()),
      ])
      setLessonOptions(lessonsRes.lessons || [])
      setAircraftOptions(aircraftRes.aircraft || [])
      setInstructorOptions(instructorsRes.instructors || [])
    } catch (e) {
      setLessonOptions([])
      setAircraftOptions([])
      setInstructorOptions([])
    }
    setOptionsLoading(false)
  }

  // Cancel session handler
  async function handleCancel() {
    if (!selected) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/instructor/schedule/${selected.resource.id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        toast({ title: "Session canceled", description: "Your instructor has been notified.", variant: "default" })
        setShowCancelDialog(false)
        setSelected(null)
        // Optionally: trigger a refresh or callback
      } else {
        const data = await res.json()
        setError(data.error || "Unknown error")
      }
    } catch (e) {
      setError("Network error. Please try again.")
    }
    setLoading(false)
  }

  // Reschedule session handler (simplified, PATCHes session)
  async function handleReschedule(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/instructor/schedule/${selected.resource.id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rescheduleForm,
          request_status: "pending",
        }),
      })
      if (res.ok) {
        toast({ title: "Reschedule request sent", description: "Your instructor will review it.", variant: "default" })
        setShowRescheduleSheet(false)
        setSelected(null)
        // Optionally: trigger a refresh or callback
      } else {
        const data = await res.json()
        setError(data.error || "Unknown error")
      }
    } catch (e) {
      setError("Network error. Please try again.")
    }
    setLoading(false)
  }

  function canCancelOrReschedule(session: any) {
    return ["pending", "approved"].includes(session.request_status) && session.status !== "completed" && session.status !== "canceled"
  }

  return (
    <TooltipProvider>
      <div>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event) => setSelected(event)}
        />
        <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Session Details</DialogTitle>
              <DialogDescription>
                <div className="space-y-2">
                  <div><b>Instructor:</b> {selected?.resource.instructor ? `${selected.resource.instructor.first_name} ${selected.resource.instructor.last_name}` : selected?.resource.instructor_id}</div>
                  <div><b>Lesson:</b> {selected?.resource.lesson ? selected.resource.lesson.title : selected?.resource.lesson_id}</div>
                  <div><b>Aircraft:</b> {selected?.resource.aircraft ? `${selected.resource.aircraft.tail_number} (${selected.resource.aircraft.make} ${selected.resource.aircraft.model})` : selected?.resource.aircraft_id}</div>
                  <div><b>Date:</b> {selected?.resource.date} <b>Time:</b> {selected?.resource.start_time} - {selected?.resource.end_time}</div>
                  <div><b>Type:</b> {selected?.resource.session_type}</div>
                  <div><b>Status:</b> {selected?.resource.request_status}</div>
                  <div><b>Notes:</b> {selected?.resource.notes}</div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              {canCancelOrReschedule(selected?.resource) ? (
                <div className="flex flex-col gap-2 w-full">
                  <Button variant="destructive" onClick={() => setShowCancelDialog(true)} disabled={loading}>Cancel Session</Button>
                  <Button variant="secondary" onClick={() => { setRescheduleForm({ ...selected.resource }); setShowRescheduleSheet(true) }} disabled={loading}>Reschedule</Button>
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" disabled>Cancel/Reschedule Unavailable</Button>
                  </TooltipTrigger>
                  <TooltipContent>Only pending or approved sessions can be changed.</TooltipContent>
                </Tooltip>
              )}
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
            {error && <div className="text-red-500 mt-2">{error}</div>}
          </DialogContent>
        </Dialog>
        {/* Cancel Confirmation Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Session</DialogTitle>
              <DialogDescription>Are you sure you want to cancel this session? This cannot be undone. Your instructor will be notified.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="destructive" onClick={handleCancel} disabled={loading}>{loading ? "Cancelling..." : "Yes, Cancel"}</Button>
              <DialogClose asChild>
                <Button variant="outline">No, Go Back</Button>
              </DialogClose>
            </DialogFooter>
            {error && <div className="text-red-500 mt-2">{error}</div>}
          </DialogContent>
        </Dialog>
        {/* Reschedule Sheet */}
        <Sheet open={showRescheduleSheet} onOpenChange={(open) => {
          setShowRescheduleSheet(open)
          if (open) fetchOptions()
        }}>
          <SheetContent side="right" className="max-w-md w-full">
            <form onSubmit={handleReschedule} className="space-y-4">
              <SheetHeader>
                <SheetTitle>Reschedule Session</SheetTitle>
              </SheetHeader>
              <div>
                <label>Lesson</label>
                <Select
                  value={rescheduleForm?.lesson_id || ""}
                  onValueChange={val => setRescheduleForm((f: any) => ({ ...f, lesson_id: val }))}
                  disabled={optionsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={optionsLoading ? "Loading..." : "Select a lesson"} />
                  </SelectTrigger>
                  <SelectContent>
                    {lessonOptions.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label>Aircraft</label>
                <Select
                  value={rescheduleForm?.aircraft_id || ""}
                  onValueChange={val => setRescheduleForm((f: any) => ({ ...f, aircraft_id: val }))}
                  disabled={optionsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={optionsLoading ? "Loading..." : "Select an aircraft"} />
                  </SelectTrigger>
                  <SelectContent>
                    {aircraftOptions.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.tail_number} ({a.make} {a.model})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label>Instructor</label>
                <Select
                  value={rescheduleForm?.instructor_id || ""}
                  onValueChange={val => setRescheduleForm((f: any) => ({ ...f, instructor_id: val }))}
                  disabled={optionsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={optionsLoading ? "Loading..." : "Select an instructor"} />
                  </SelectTrigger>
                  <SelectContent>
                    {instructorOptions.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.first_name} {i.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label>Date</label>
                <Input type="date" name="date" value={rescheduleForm?.date || ""} onChange={e => setRescheduleForm((f: any) => ({ ...f, date: e.target.value }))} required />
              </div>
              <div>
                <label>Start Time (24-hour)</label>
                <Input type="time" name="start_time" value={rescheduleForm?.start_time || ""} onChange={e => setRescheduleForm((f: any) => ({ ...f, start_time: e.target.value }))} required step="60" />
              </div>
              <div>
                <label>End Time (24-hour)</label>
                <Input type="time" name="end_time" value={rescheduleForm?.end_time || ""} onChange={e => setRescheduleForm((f: any) => ({ ...f, end_time: e.target.value }))} required step="60" />
              </div>
              <div>
                <label>Reason for Reschedule</label>
                <Textarea name="reason" value={rescheduleForm?.reason || ""} onChange={e => setRescheduleForm((f: any) => ({ ...f, reason: e.target.value }))} placeholder="Optional: Provide a reason for rescheduling" />
              </div>
              <SheetFooter>
                <Button type="submit" variant="secondary" disabled={loading || optionsLoading}>{loading ? "Rescheduling..." : "Submit Reschedule Request"}</Button>
                <SheetClose asChild>
                  <Button variant="outline" type="button">Cancel</Button>
                </SheetClose>
              </SheetFooter>
              {error && <div className="text-red-500 mt-2">{error}</div>}
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  )
} 