"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { createStudentInstructorRate, updateStudentInstructorRate } from "@/lib/instructor-billing-service"
import type { StudentInstructorRate } from "@/lib/instructor-billing-service"

const formSchema = z.object({
  flight_instruction_rate: z.coerce
    .number()
    .min(0, "Rate must be greater than or equal to 0"),
  ground_instruction_rate: z.coerce
    .number()
    .min(0, "Rate must be greater than or equal to 0"),
  effective_date: z.date(),
  notes: z.string().optional(),
})

interface EditStudentRatesModalProps {
  isOpen: boolean
  onClose: () => void
  studentId: string
  instructorId: string
  currentRate?: StudentInstructorRate
  onRateUpdated: () => void
}

export function EditStudentRatesModal({
  isOpen,
  onClose,
  studentId,
  instructorId,
  currentRate,
  onRateUpdated,
}: EditStudentRatesModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      flight_instruction_rate: currentRate?.flight_instruction_rate || 75,
      ground_instruction_rate: currentRate?.ground_instruction_rate || 75,
      effective_date: currentRate?.effective_date 
        ? new Date(currentRate.effective_date) 
        : new Date(),
      notes: currentRate?.notes || "",
    },
  })

  // Reset form when currentRate changes
  useEffect(() => {
    if (currentRate) {
      form.reset({
        flight_instruction_rate: currentRate.flight_instruction_rate,
        ground_instruction_rate: currentRate.ground_instruction_rate,
        effective_date: new Date(currentRate.effective_date),
        notes: currentRate.notes || "",
      })
    } else {
      form.reset({
        flight_instruction_rate: 75,
        ground_instruction_rate: 75,
        effective_date: new Date(),
        notes: "",
      })
    }
  }, [currentRate, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      if (currentRate) {
        // Update existing rate
        await updateStudentInstructorRate(currentRate.id, {
          ...values,
          effective_date: values.effective_date.toISOString().split('T')[0],
          student_id: studentId,
          instructor_id: instructorId,
          is_active: true,
        })
      } else {
        // Create new rate
        await createStudentInstructorRate({
          ...values,
          effective_date: values.effective_date.toISOString().split('T')[0],
          student_id: studentId,
          instructor_id: instructorId,
          is_active: true,
        })
      }

      toast({
        title: "Success",
        description: currentRate 
          ? "Student rates have been updated successfully." 
          : "Student rates have been created successfully.",
      })

      onRateUpdated()
      onClose()
    } catch (error) {
      console.error("Error updating student rates:", error)
      toast({
        title: "Error",
        description: "Failed to update student rates. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      form.reset()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {currentRate ? "Edit Student Rates" : "Set Custom Rate"}
          </DialogTitle>
          <DialogDescription>
            {currentRate 
              ? "Update the flight and ground instruction rates for this student."
              : "Set custom hourly rates for this student-instructor pair."
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="flight_instruction_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flight Instruction Rate ($/hr)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="75.00"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Hourly rate for flight instruction
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ground_instruction_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ground Instruction Rate ($/hr)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="75.00"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Hourly rate for ground instruction and briefings
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="effective_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Effective Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When these rates should take effect
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Special rate for advanced student" {...field} />
                  </FormControl>
                  <FormDescription>
                    Add any notes about this rate setting
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {currentRate ? "Update Rate" : "Set Rate"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
