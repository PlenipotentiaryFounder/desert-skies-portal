"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"

const formSchema = z.object({
  tail_number: z.string().min(1, "Tail number is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce
    .number()
    .int()
    .min(1900, "Year must be 1900 or later")
    .max(new Date().getFullYear(), "Year cannot be in the future"),
  category: z.string().min(1, "Category is required"),
  class: z.string().min(1, "Class is required"),
  is_complex: z.boolean().default(false),
  is_high_performance: z.boolean().default(false),
  is_tailwheel: z.boolean().default(false),
  is_active: z.boolean().default(true),
  hobbs_time: z.coerce.number().min(0, "Hobbs time must be a positive number"),
  last_inspection_date: z.string().min(1, "Last inspection date is required"),
})

export default function EditAircraftPage({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tail_number: "",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      category: "Airplane",
      class: "Single Engine Land",
      is_complex: false,
      is_high_performance: false,
      is_tailwheel: false,
      is_active: true,
      hobbs_time: 0,
      last_inspection_date: new Date().toISOString().split("T")[0],
    },
  })

  useEffect(() => {
    async function fetchAircraft() {
      try {
        const { data, error } = await supabase.from("aircraft").select("*").eq("id", params.id).single()

        if (error) {
          throw error
        }

        if (data) {
          // Format the date for the date input
          const formattedDate = data.last_inspection_date
            ? new Date(data.last_inspection_date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0]

          form.reset({
            ...data,
            last_inspection_date: formattedDate,
          })
        }
      } catch (error) {
        console.error("Error fetching aircraft:", error)
        toast({
          title: "Error",
          description: "Failed to load aircraft data. Please try again.",
          variant: "destructive",
        })
        router.push("/admin/aircraft")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAircraft()
  }, [supabase, params.id, form, router, toast])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from("aircraft")
        .update({
          ...values,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (error) {
        throw error
      }

      toast({
        title: "Aircraft updated",
        description: `${values.year} ${values.make} ${values.model} (${values.tail_number}) has been updated successfully.`,
      })

      router.push("/admin/aircraft")
      router.refresh()
    } catch (error: any) {
      console.error("Error updating aircraft:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update aircraft. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Edit Aircraft</CardTitle>
          <CardDescription>Update aircraft information in your fleet</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="tail_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tail Number</FormLabel>
                      <FormControl>
                        <Input placeholder="N12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make</FormLabel>
                      <FormControl>
                        <Input placeholder="Cessna" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="172S Skyhawk" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Airplane">Airplane</SelectItem>
                          <SelectItem value="Rotorcraft">Rotorcraft</SelectItem>
                          <SelectItem value="Glider">Glider</SelectItem>
                          <SelectItem value="Lighter-than-air">Lighter-than-air</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="class"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Single Engine Land">Single Engine Land</SelectItem>
                          <SelectItem value="Single Engine Sea">Single Engine Sea</SelectItem>
                          <SelectItem value="Multi Engine Land">Multi Engine Land</SelectItem>
                          <SelectItem value="Multi Engine Sea">Multi Engine Sea</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hobbs_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hobbs Time</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormDescription>Current Hobbs meter reading in hours</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_inspection_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Inspection Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="is_complex"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Complex</FormLabel>
                        <FormDescription>
                          Aircraft has flaps, retractable landing gear, and a controllable pitch propeller
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_high_performance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>High Performance</FormLabel>
                        <FormDescription>Aircraft has an engine of more than 200 horsepower</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_tailwheel"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Tailwheel</FormLabel>
                        <FormDescription>Aircraft has a tailwheel configuration</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>Aircraft is currently active and available for flight training</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.push("/admin/aircraft")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
