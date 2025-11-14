"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Mail, CheckCircle } from "lucide-react"
import { sendStudentInvitation } from "@/lib/admin-student-service"

const inviteStudentSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  personal_message: z.string().optional(),
})

type InviteStudentForm = z.infer<typeof inviteStudentSchema>

interface InviteStudentDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function InviteStudentDialog({ isOpen, onClose, onSuccess }: InviteStudentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  
  const form = useForm<InviteStudentForm>({
    resolver: zodResolver(inviteStudentSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      personal_message: "",
    },
  })

  async function onSubmit(data: InviteStudentForm) {
    setIsSubmitting(true)
    
    try {
      const result = await sendStudentInvitation(
        data.email,
        data.first_name,
        data.last_name
      )
      
      if (result.success) {
        setEmailSent(true)
        toast.success("Invitation sent successfully", {
          description: `An email invitation has been sent to ${data.email}`
        })
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          handleClose()
        }, 2000)
      } else {
        throw new Error(result.error || "Failed to send invitation")
      }
    } catch (error) {
      console.error("Error sending invitation:", error)
      toast.error("Failed to send invitation", {
        description: error instanceof Error ? error.message : "An error occurred"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setEmailSent(false)
    form.reset()
    onClose()
    if (emailSent) {
      onSuccess()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Student
          </DialogTitle>
          <DialogDescription>
            Send a professional email invitation to join Desert Skies Aviation
          </DialogDescription>
        </DialogHeader>
        
        {emailSent ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Invitation Sent!</h3>
            <p className="text-muted-foreground">
              An email invitation has been sent to {form.getValues("email")}
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Student will receive an invitation to create their account
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="personal_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Message (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add a personal note to the invitation email..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This message will be included in the email invitation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">Email Preview</h4>
                <p className="text-sm text-muted-foreground">
                  The student will receive a professionally designed HTML email with:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Welcome message from Desert Skies Aviation</li>
                  <li>Overview of portal features</li>
                  <li>Secure registration link</li>
                  <li>Contact information for support</li>
                </ul>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose} 
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

