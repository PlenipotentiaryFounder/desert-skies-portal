"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Search, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  student_id: z.string().min(1, "Please select a student"),
  instructor_id: z.string().min(1, "Please select an instructor"),
  pre_briefing_time: z.coerce.number().min(0, "Pre-briefing time must be 0 or greater"),
  flight_time: z.coerce.number().min(0, "Flight time must be 0 or greater"),
  ground_time: z.coerce.number().min(0, "Ground time must be 0 or greater"),
  post_briefing_time: z.coerce.number().min(0, "Post-briefing time must be 0 or greater"),
  due_date: z.date({
    required_error: "Please select a due date",
  }),
  notes: z.string().optional(),
})

type Student = {
  id: string
  first_name: string
  last_name: string
  email: string
}

type Instructor = {
  id: string
  first_name: string
  last_name: string
  email: string
}

type Rate = {
  flight_instruction_rate: number
  ground_instruction_rate: number
}

export function CreateInvoiceForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [rates, setRates] = useState<Rate | null>(null)
  const [isStudentSearchOpen, setIsStudentSearchOpen] = useState(false)
  const [isInstructorSearchOpen, setIsInstructorSearchOpen] = useState(false)
  const [searchingStudents, setSearchingStudents] = useState(false)
  const [searchingInstructors, setSearchingInstructors] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      student_id: "",
      instructor_id: "",
      pre_briefing_time: 0.5,
      flight_time: 1.0,
      ground_time: 0.5,
      post_briefing_time: 0.5,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: "",
    },
  })

  const watchedStudentId = form.watch("student_id")
  const watchedInstructorId = form.watch("instructor_id")
  const watchedPreBriefing = form.watch("pre_briefing_time")
  const watchedFlightTime = form.watch("flight_time")
  const watchedGroundTime = form.watch("ground_time")
  const watchedPostBriefing = form.watch("post_briefing_time")

  useEffect(() => {
    loadStudents()
    loadInstructors()
  }, [])

  useEffect(() => {
    if (watchedStudentId && watchedInstructorId) {
      loadRates(watchedStudentId, watchedInstructorId)
    }
  }, [watchedStudentId, watchedInstructorId])

  async function loadStudents() {
    try {
      setSearchingStudents(true)
      const response = await fetch('/api/admin/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setSearchingStudents(false)
    }
  }

  async function loadInstructors() {
    try {
      setSearchingInstructors(true)
      const response = await fetch('/api/admin/instructors')
      if (response.ok) {
        const data = await response.json()
        setInstructors(data)
      }
    } catch (error) {
      console.error('Error loading instructors:', error)
    } finally {
      setSearchingInstructors(false)
    }
  }

  async function loadRates(studentId: string, instructorId: string) {
    try {
      const response = await fetch(`/api/admin/billing/rates?student_id=${studentId}&instructor_id=${instructorId}`)
      if (response.ok) {
        const data = await response.json()
        setRates(data)
      } else {
        // Use default rates if no custom rates found
        setRates({
          flight_instruction_rate: 75.00,
          ground_instruction_rate: 75.00
        })
      }
    } catch (error) {
      console.error('Error loading rates:', error)
      setRates({
        flight_instruction_rate: 75.00,
        ground_instruction_rate: 75.00
      })
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      const response = await fetch('/api/admin/billing/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          due_date: values.due_date.toISOString().split('T')[0],
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Invoice created successfully",
          description: `Invoice #${result.invoice_number} has been created.`,
        })
        router.push(`/admin/billing/invoices/${result.invoice_id}`)
      } else {
        throw new Error(result.error || "Failed to create invoice")
      }
    } catch (error) {
      console.error("Error creating invoice:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create invoice",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedStudent = students.find(s => s.id === watchedStudentId)
  const selectedInstructor = instructors.find(i => i.id === watchedInstructorId)

  // Calculate totals
  const totalFlightTime = watchedFlightTime + watchedPreBriefing + watchedPostBriefing
  const totalGroundTime = watchedGroundTime
  const flightAmount = rates ? totalFlightTime * rates.flight_instruction_rate : 0
  const groundAmount = rates ? totalGroundTime * rates.ground_instruction_rate : 0
  const totalAmount = flightAmount + groundAmount

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Student Selection */}
            <FormField
              control={form.control}
              name="student_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Student</FormLabel>
                  <Popover open={isStudentSearchOpen} onOpenChange={setIsStudentSearchOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between text-foreground",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {selectedStudent
                            ? `${selectedStudent.first_name} ${selectedStudent.last_name}`
                            : "Select student..."}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search students..." />
                        <CommandList>
                          <CommandEmpty>
                            {searchingStudents ? "Loading..." : "No students found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {students.map((student) => (
                              <CommandItem
                                key={student.id}
                                value={`${student.first_name} ${student.last_name} ${student.email}`}
                                onSelect={() => {
                                  form.setValue("student_id", student.id)
                                  setIsStudentSearchOpen(false)
                                }}
                                className="cursor-pointer"
                              >
                                <div className="flex flex-col">
                                  <span className="text-foreground font-medium">{student.first_name} {student.last_name}</span>
                                  <span className="text-sm text-muted-foreground">{student.email}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Search and select the student for this invoice
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Instructor Selection */}
            <FormField
              control={form.control}
              name="instructor_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Instructor</FormLabel>
                  <Popover open={isInstructorSearchOpen} onOpenChange={setIsInstructorSearchOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between text-foreground",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {selectedInstructor
                            ? `${selectedInstructor.first_name} ${selectedInstructor.last_name}`
                            : "Select instructor..."}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search instructors..." />
                        <CommandList>
                          <CommandEmpty>
                            {searchingInstructors ? "Loading..." : "No instructors found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {instructors.map((instructor) => (
                              <CommandItem
                                key={instructor.id}
                                value={`${instructor.first_name} ${instructor.last_name} ${instructor.email}`}
                                onSelect={() => {
                                  form.setValue("instructor_id", instructor.id)
                                  setIsInstructorSearchOpen(false)
                                }}
                                className="cursor-pointer"
                              >
                                <div className="flex flex-col">
                                  <span className="text-foreground font-medium">{instructor.first_name} {instructor.last_name}</span>
                                  <span className="text-sm text-muted-foreground">{instructor.email}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Search and select the instructor for this invoice
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Time Inputs */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Time Breakdown</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <FormField
                control={form.control}
                name="pre_briefing_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pre-briefing (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.5"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="flight_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flight Time (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="1.0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ground_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ground Time (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.5"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="post_briefing_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post-briefing (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.5"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Rates and Calculation */}
          {rates && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Rate Calculation</h3>
              <div className="bg-muted/50 p-4 rounded-lg space-y-3 border">
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Flight Instruction</p>
                    <p className="text-sm text-foreground/80">
                      {totalFlightTime.toFixed(1)} hours × ${rates.flight_instruction_rate.toFixed(2)} = ${flightAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Ground Instruction</p>
                    <p className="text-sm text-foreground/80">
                      {totalGroundTime.toFixed(1)} hours × ${rates.ground_instruction_rate.toFixed(2)} = ${groundAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-lg font-semibold text-foreground">
                    Total Amount: ${totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Due Date and Notes */}
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
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
                          date < new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When payment is due for this invoice
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
                    <Textarea
                      placeholder="Add any additional notes for this invoice..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes that will appear on the invoice
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/billing/invoices')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !rates}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Invoice...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
