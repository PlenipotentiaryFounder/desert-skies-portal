"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { createDocument, type DocumentType, updateDocument, uploadDocumentFile } from "@/lib/document-service"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { cn, formatDate } from "@/lib/utils"
import { CalendarIcon, Loader2 } from "lucide-react"

interface User {
  id: string
  first_name: string
  last_name: string
  role: string
}

interface DocumentFormProps {
  users: User[]
  document?: any
  onSuccess?: () => void
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
  user_id: z.string({
    required_error: "Please select a user",
  }),
  title: z.string().min(2, {
    message: "Title must be at least 2 characters",
  }),
  description: z.string().optional(),
  document_type: z.string({
    required_error: "Please select a document type",
  }),
  expiration_date: z.date().optional(),
  is_verified: z.boolean().default(false),
  file: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, {
      message: "Please select a file",
    })
    .optional(),
})

export function DocumentForm({ users, document, onSuccess }: DocumentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: document
      ? {
          user_id: document.user_id,
          title: document.title,
          description: document.description || "",
          document_type: document.document_type,
          expiration_date: document.expiration_date ? new Date(document.expiration_date) : undefined,
          is_verified: document.is_verified,
        }
      : {
          user_id: "",
          title: "",
          description: "",
          document_type: "",
          is_verified: false,
        },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      if (document) {
        // Update existing document
        await updateDocument(document.id, {
          title: values.title,
          description: values.description,
          document_type: values.document_type as DocumentType,
          expiration_date: values.expiration_date ? values.expiration_date.toISOString() : undefined,
          is_verified: values.is_verified,
        })

        toast({
          title: "Document updated",
          description: "The document has been successfully updated.",
        })
      } else {
        // Create new document
        if (!values.file || values.file.length === 0) {
          throw new Error("Please select a file")
        }

        const file = values.file[0]
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${values.user_id}/${fileName}`

        // Upload file to storage
        await uploadDocumentFile(file, filePath)

        // Create document record
        await createDocument({
          user_id: values.user_id,
          title: values.title,
          description: values.description,
          file_path: filePath,
          file_type: file.type,
          document_type: values.document_type as DocumentType,
          expiration_date: values.expiration_date ? values.expiration_date.toISOString() : undefined,
          is_verified: values.is_verified,
        })

        toast({
          title: "Document created",
          description: "The document has been successfully created.",
        })
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/admin/documents")
        router.refresh()
      }
    } catch (error) {
      console.error("Error submitting document:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="user_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!document}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>The user this document belongs to</FormDescription>
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
                <FormDescription>The type of document being uploaded</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter document title" {...field} />
              </FormControl>
              <FormDescription>A descriptive title for the document</FormDescription>
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
              <FormDescription>Additional details about the document</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
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
            name="is_verified"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Verified</FormLabel>
                  <FormDescription>Mark this document as verified by an administrator</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {!document && (
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
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {document ? "Update Document" : "Upload Document"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/documents")}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
