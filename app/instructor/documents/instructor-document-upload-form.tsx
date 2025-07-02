"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { createDocument, type DocumentType, uploadDocumentFile } from "@/lib/document-service"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { cn, formatDate } from "@/lib/utils"
import { CalendarIcon, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface InstructorDocumentUploadFormProps {
  userId: string
}

const documentTypes: { value: DocumentType; label: string }[] = [
  { value: "medical_certificate", label: "Medical Certificate" },
  { value: "pilot_license", label: "Pilot License" },
  { value: "photo_id", label: "Photo ID" },
  { value: "logbook", label: "Logbook" },
  { value: "training_record", label: "Training Record" },
  { value: "endorsement", label: "Endorsement" },
  { value: "certificate", label: "Certificate" },
  { value: "other", label: "Other" },
]

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters",
  }),
  description: z.string().optional(),
  document_type: z.string({
    required_error: "Please select a document type",
  }),
  expiration_date: z.date().optional(),
  file: z.instanceof(FileList).refine((files) => files.length > 0, {
    message: "Please select a file",
  }),
})

export async function InstructorDocumentUploadForm({ userId }: InstructorDocumentUploadFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      document_type: "",
    },
  })

  const supabase = await createClient()

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const file = values.file[0]
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      // Upload file to storage
      await uploadDocumentFile(file, filePath)

      // Create document record
      await createDocument({
        user_id: userId,
        title: values.title,
        description: values.description,
        file_path: filePath,
        file_type: file.type,
        document_type: values.document_type as DocumentType,
        expiration_date: values.expiration_date ? values.expiration_date.toISOString() : undefined,
        is_verified: true, // Instructor uploads are auto-verified
      })

      toast({
        title: "Document uploaded",
        description: "Your document has been successfully uploaded.",
      })

      router.push("/instructor/documents")
      router.refresh()
    } catch (error) {
      console.error("Error uploading document:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter document title" {...field} />
              </FormControl>
              <FormDescription>A descriptive title for your document</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="document_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a document type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>The type of document you are uploading</FormDescription>
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
                <Textarea placeholder="Enter document description (optional)" {...field} />
              </FormControl>
              <FormDescription>Additional details about your document</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expiration_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Expiration Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      {field.value ? formatDate(field.value.toISOString()) : "Select expiration date"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>When the document expires (if applicable)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="file"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Document File</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => onChange(e.target.files)}
                  {...fieldProps}
                />
              </FormControl>
              <FormDescription>Upload the document file (PDF, image, or document)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload Document
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/instructor/documents")}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
