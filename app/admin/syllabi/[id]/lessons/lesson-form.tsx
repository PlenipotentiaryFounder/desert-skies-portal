"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type SyllabusLesson, createSyllabusLesson, updateSyllabusLesson } from "@/lib/syllabus-service"
import { useToast } from "@/hooks/use-toast"

const lessonFormSchema = z.object({
  title: z
    .string()
    .min(3, {
      message: "Title must be at least 3 characters.",
    })
    .max(100, {
      message: "Title must not exceed 100 characters.",
    }),
  description: z
    .string()
    .min(10, {
      message: "Description must be at least 10 characters.",
    })
    .max(500, {
      message: "Description must not exceed 500 characters.",
    }),
  order_index: z.coerce.number().int().positive({
    message: "Order must be a positive number.",
  }),
  lesson_type: z.string({
    required_error: "Please select a lesson type.",
  }),
  estimated_hours: z.coerce
    .number()
    .positive({
      message: "Hours must be a positive number.",
    })
    .max(24, {
      message: "Hours must not exceed 24.",
    }),
})

type LessonFormValues = z.infer<typeof lessonFormSchema>

interface LessonFormProps {
  syllabusId: string
  lesson?: SyllabusLesson
}

const LESSON_TYPES = ["Ground", "Flight", "Simulator", "Briefing", "Checkride Prep", "Exam", "Other"]

export function LessonForm({ syllabusId, lesson }: LessonFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const isEditing = !!lesson

  const defaultValues: Partial<LessonFormValues> = {
    title: lesson?.title || "",
    description: lesson?.description || "",
    order_index: lesson?.order_index || 1,
    lesson_type: lesson?.lesson_type || "",
    estimated_hours: lesson?.estimated_hours || 1,
  }

  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues,
  })

  async function onSubmit(data: LessonFormValues) {
    setIsSubmitting(true)

    try {
      let result

      if (isEditing && lesson) {
        result = await updateSyllabusLesson(lesson.id, {
          ...data,
          syllabus_id: syllabusId,
        })
      } else {
        result = await createSyllabusLesson({
          ...data,
          syllabus_id: syllabusId,
        })
      }

      if (result.success) {
        toast({
          title: isEditing ? "Lesson updated" : "Lesson created",
          description: isEditing
            ? `${data.title} has been updated successfully.`
            : `${data.title} has been created successfully.`,
        })

        router.push(`/admin/syllabi/${syllabusId}`)
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${isEditing ? "update" : "create"} lesson. Please try again.`,
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Introduction to Flight Controls" {...field} />
              </FormControl>
              <FormDescription>The name of the lesson.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="This lesson covers the basic flight controls and their functions..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>A detailed description of the lesson content and objectives.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="order_index"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormDescription>The sequence number of this lesson.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lesson_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lesson type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LESSON_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>The type of training activity.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimated_hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Hours</FormLabel>
                <FormControl>
                  <Input type="number" min="0.5" step="0.5" {...field} />
                </FormControl>
                <FormDescription>The expected duration in hours.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/syllabi/${syllabusId}`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Lesson" : "Create Lesson"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
