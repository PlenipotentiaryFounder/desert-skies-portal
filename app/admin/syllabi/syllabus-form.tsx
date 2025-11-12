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
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { type Syllabus, createSyllabus, updateSyllabus } from "@/lib/syllabus-service"
import { useToast } from "@/hooks/use-toast"

const syllabusFormSchema = z.object({
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
  faa_type: z
    .string()
    .min(2, {
      message: "FAA type must be at least 2 characters.",
    })
    .max(50, {
      message: "FAA type must not exceed 50 characters.",
    }),
  version: z
    .string()
    .min(1, {
      message: "Version is required.",
    })
    .max(20, {
      message: "Version must not exceed 20 characters.",
    }),
  training_part: z.enum(["61", "141"]).default("61"),
  is_active: z.boolean().default(true),
})

type SyllabusFormValues = z.infer<typeof syllabusFormSchema>

interface SyllabusFormProps {
  syllabus?: Syllabus
}

export function SyllabusForm({ syllabus }: SyllabusFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const isEditing = !!syllabus

  const defaultValues: Partial<SyllabusFormValues> = {
    title: syllabus?.title || "",
    description: syllabus?.description || "",
    faa_type: syllabus?.faa_type || "",
    version: syllabus?.version || "",
    training_part: (syllabus as any)?.training_part || "61",
    is_active: syllabus?.is_active ?? true,
  }

  const form = useForm<SyllabusFormValues>({
    resolver: zodResolver(syllabusFormSchema),
    defaultValues,
  })

  async function onSubmit(data: SyllabusFormValues) {
    setIsSubmitting(true)

    try {
      let result

      if (isEditing && syllabus) {
        result = await updateSyllabus(syllabus.id, data)
      } else {
        result = await createSyllabus(data)
      }

      if (result.success) {
        toast({
          title: isEditing ? "Syllabus updated" : "Syllabus created",
          description: isEditing
            ? `${data.title} has been updated successfully.`
            : `${data.title} has been created successfully.`,
        })

        if (isEditing) {
          router.push(`/admin/syllabi/${syllabus!.id}`)
        } else {
          router.push("/admin/syllabi")
        }
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${isEditing ? "update" : "create"} syllabus. Please try again.`,
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
                <Input placeholder="Private Pilot Training" {...field} />
              </FormControl>
              <FormDescription>The name of the training syllabus.</FormDescription>
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
                  placeholder="A comprehensive training program for private pilot certification..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>A detailed description of the syllabus content and objectives.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="faa_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>FAA Type</FormLabel>
                <FormControl>
                  <Input placeholder="Private Pilot (PPL)" {...field} />
                </FormControl>
                <FormDescription>The FAA certificate or rating type.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="version"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Version</FormLabel>
                <FormControl>
                  <Input placeholder="1.0" {...field} />
                </FormControl>
                <FormDescription>The version number of this syllabus.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="training_part"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Training Regulation</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="61" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Part 61 (Traditional)
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="141" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Part 141 (Approved School)
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Part 61 is for traditional flight training, Part 141 is for FAA-approved flight schools with reduced hour requirements.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Set whether this syllabus is currently active and available for enrollment.
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/syllabi")} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Syllabus" : "Create Syllabus"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
