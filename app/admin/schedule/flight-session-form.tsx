"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import type { Enrollment } from "@/lib/enrollment-service"
import type { FlightSession, FlightSessionFormData } from "@/lib/flight-session-service"
import { createFlightSession, updateFlightSession } from "@/lib/flight-session-service"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"

const flightSessionSchema = z.object({
  enrollment_id: z.string().min(1, "Student enrollment is required"),
  lesson_id: z.string().min(1, "Lesson is required"),
  instructor_id: z.string().min(1, "Instructor is required"),
  aircraft_id: z.string().min(1, "Aircraft is required"),
  date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  hobbs_start: z.coerce.number().min(0, "Hobbs start must be a positive number"),
  hobbs_end: z.coerce.number().min(0, "Hobbs end must be a positive number"),
  status: z.enum(["scheduled", "completed", "canceled", "no_show"]),
  notes: z.string().optional(),
  weather_conditions: z
    .object({
      wind: z.string().optional(),
      visibility: z.string().optional(),
      ceiling: z.string().optional(),
      temperature: z.string().optional(),
      altimeter: z.string().optional(),
      conditions: z.string().optional(),
    })
    .optional()
    .nullable(),
})

interface FlightSessionFormProps {
  enrollments: Enrollment[]
  instructors: { id: string; first_name: string; last_name: string }[]
  aircraft: { id: string; tail_number: string; make: string; model: string }[]
  initialData?: FlightSession
}

export function FlightSessionForm({ enrollments, instructors, aircraft, initialData }: FlightSessionFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [lessons, setLessons] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<string | null>(initialData?.enrollment_id || null)

  const form = useForm<z.infer<typeof flightSessionSchema>>({
    resolver: zodResolver(flightSessionSchema),
    defaultValues: initialData
      ? {
          enrollment_id: initialData.enrollment_id,
          lesson_id: initialData.lesson_id,
          instructor_id: initialData.instructor_id,
          aircraft_id: initialData.aircraft_id,
          date: initialData.date,
          start_time: initialData.start_time,
          end_time: initialData.end_time,
          hobbs_start: initialData.hobbs_start,
          hobbs_end: initialData.hobbs_end,
          status: initialData.status,
          notes: initialData.notes || "",
          weather_conditions: initialData.weather_conditions,
        }
      : {
          enrollment_id: "",
          lesson_id: "",
          instructor_id: "",
          aircraft_id: "",
          date: new Date().toISOString().split("T")[0],
          start_time: "09:00",
          end_time: "11:00",
          hobbs_start: 0,
          hobbs_end: 0,
          status: "scheduled",
          notes: "",
          weather_conditions: null,
        },
  })

  // Fetch lessons when enrollment changes
  useEffect(() => {
    const fetchLessons = async (enrollmentId: string) => {
      try {
        // Get the syllabus ID for this enrollment
        const { data: enrollment } = await supabase
          .from("student_enrollments")
          .select("syllabus_id")
          .eq("id", enrollmentId)
          .single()

        if (!enrollment) return

        // Get all lessons for this syllabus
        const { data } = await supabase
          .from("syllabus_lessons")
          .select("id, title")
          .eq("syllabus_id", enrollment.syllabus_id)
          .order("order_index", { ascending: true })

        setLessons(data || [])
      } catch (error) {
        console.error("Error fetching lessons:", error)
        toast({
          title: "Error",
          description: "Failed to load lessons. Please try again.",
          variant: "destructive",
        })
      }
    }

    if (selectedEnrollment) {
      fetchLessons(selectedEnrollment)
    } else {
      setLessons([])
    }
  }, [selectedEnrollment, supabase])

  const onSubmit = async (data: z.infer<typeof flightSessionSchema>) => {
    setLoading(true)
    try {
      if (initialData) {
        // Update existing flight session
        const result = await updateFlightSession(initialData.id, data)
        if (result.success) {
          toast({
            title: "Flight session updated",
            description: "The flight session has been updated successfully.",
          })
          router.push("/admin/schedule")
          router.refresh()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update flight session. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        // Create new flight session
        const result = await createFlightSession(data as FlightSessionFormData)
        if (result.success) {
          toast({
            title: "Flight session created",
            description: "The flight session has been created successfully.",
          })
          router.push("/admin/schedule")
          router.refresh()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create flight session. Please try again.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="enrollment_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Enrollment</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        setSelectedEnrollment(value)
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student enrollment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {enrollments.map((enrollment) => (
                          <SelectItem key={enrollment.id} value={enrollment.id}>
                            {enrollment.student?.first_name} {enrollment.student?.last_name} -{" "}
                            {enrollment.syllabus?.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Select the student enrollment for this flight session</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lesson_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a lesson" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lessons.map((lesson) => (
                          <SelectItem key={lesson.id} value={lesson.id}>
                            {lesson.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Select the lesson for this flight session</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an instructor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {instructors.map((instructor) => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            {instructor.first_name} {instructor.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Select the instructor for this flight session</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aircraft_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aircraft</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an aircraft" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {aircraft.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.tail_number} ({a.make} {a.model})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Select the aircraft for this flight session</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hobbs_start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hobbs Start</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hobbs_end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hobbs End</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                        <SelectItem value="no_show">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any notes about this flight session"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Weather Conditions</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="weather_conditions.wind"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wind</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 240 at 10 knots" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weather_conditions.visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 10 SM" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weather_conditions.ceiling"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ceiling</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., BKN 5500" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weather_conditions.temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 22°C" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weather_conditions.altimeter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Altimeter</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 29.92" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weather_conditions.conditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conditions</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Clear, VFR" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/schedule")}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : initialData ? "Update Flight Session" : "Create Flight Session"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
