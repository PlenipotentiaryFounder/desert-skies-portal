"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { cn, formatDate } from "@/lib/utils"
import { type Enrollment, createEnrollment, updateEnrollment } from "@/lib/enrollment-service"
import type { User } from "@/lib/user-service"
import type { Syllabus } from "@/lib/syllabus-service"
import { CalendarIcon } from "lucide-react"

const enrollmentFormSchema = z.object({
  student_id: z.string({
    required_error: "Please select a student.",
  }),
  syllabus_id: z.string({
    required_error: "Please select a syllabus.",
  }),
  instructor_id: z.string({
    required_error: "Please select an instructor.",
  }),
  start_date: z.date({
    required_error: "Please select a start date.",
  }),
  target_completion_date: z.date().optional().nullable(),
  status: z.enum(["active", "completed", "withdrawn", "on_hold"], {
    required_error: "Please select a status.",
  }),
})

type EnrollmentFormValues = z.infer<typeof enrollmentFormSchema>

interface EnrollmentFormProps {
  enrollment?: Enrollment
  students: User[]
  instructors: User[]
  syllabi: Syllabus[]
}

export function EnrollmentForm({ enrollment, students, instructors, syllabi }: EnrollmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const isEditing = !!enrollment

  const defaultValues: Partial<EnrollmentFormValues> = {
    student_id: enrollment?.student_id || "",
    syllabus_id: enrollment?.syllabus_id || "",
    instructor_id: enrollment?.instructor_id || "",
    start_date: enrollment?.start_date ? new Date(enrollment.start_date) : new Date(),
    target_completion_date: enrollment?.target_completion_date ? new Date(enrollment.target_completion_date) : null,
    status: (enrollment?.status as "active" | "completed" | "withdrawn" | "on_hold") || "active",
  }

  const form = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues,
  })

  async function onSubmit(values: EnrollmentFormValues) {
    setIsSubmitting(true)

    try {
      // Convert dates to ISO strings
      const formData = {
        ...values,
        start_date: values.start_date.toISOString().split("T")[0],
        target_completion_date: values.target_completion_date
          ? values.target_completion_date.toISOString().split("T")[0]
          : null,
      }

      let result

      if (isEditing && enrollment) {
        result = await updateEnrollment(enrollment.id, formData)
      } else {
        result = await createEnrollment(formData)
      }

      if (result.success) {
        toast({
          title: isEditing ? "Enrollment updated" : "Enrollment created",
          description: isEditing
            ? `The enrollment has been updated successfully.`
            : `The enrollment has been created successfully.`,
        })

        router.push("/admin/enrollments")
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${isEditing ? "update" : "create"} enrollment. Please try again.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="student_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>The student to enroll in the training program.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="syllabus_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Training Program</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a training program" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {syllabi.map((syllabus) => (
                    <SelectItem key={syllabus.id} value={syllabus.id}>
                      {syllabus.title} ({syllabus.faa_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>The training program to enroll the student in.</FormDescription>
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
              <FormDescription>The instructor assigned to this student.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? formatDate(field.value.toISOString()) : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>The date when the training program starts.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="target_completion_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Target Completion Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? formatDate(field.value.toISOString()) : <span>Pick a date (optional)</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>The target date for completing the training program.</FormDescription>
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>The current status of this enrollment.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/enrollments")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Enrollment" : "Create Enrollment"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
