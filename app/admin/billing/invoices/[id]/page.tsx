"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  ArrowLeftIcon,
  DownloadIcon,
  MailIcon,
  Loader2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { getInstructorInvoices } from "@/lib/instructor-billing-service"
import { SendInvoiceModal } from "@/components/admin/billing/send-invoice-modal"

type InvoiceLineItem = {
  id: string
  description: string
  item_type: string
  hours: number
  rate: number
  amount: number
  date: string
}

type Invoice = {
  id: string
  invoice_number: string
  student: {
    first_name: string
    last_name: string
    email: string
  }
  instructor: {
    first_name: string
    last_name: string
    email: string
  }
  flight_hours: number
  ground_hours: number
  flight_rate: number
  ground_rate: number
  flight_amount: number
  ground_amount: number
  total_amount: number
  status: string
  due_date: string
  paid_date?: string
  payment_method?: string
  notes?: string
  line_items: InvoiceLineItem[]
  created_at: string
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)

  useEffect(() => {
    loadInvoice()
  }, [params.id])

  async function loadInvoice() {
    try {
      setIsLoading(true)
      const invoices = await getInstructorInvoices()
      const foundInvoice = invoices.find((inv) => inv.id === params.id)
      
      if (!foundInvoice) {
        throw new Error("Invoice not found")
      }
      
      // Get line items (in a real app, this would be included in the invoice query)
      const lineItems: InvoiceLineItem[] = [
        {
          id: "1",
          description: `Flight Instruction - ${foundInvoice.flight_hours}h`,
          item_type: "flight_instruction",
          hours: foundInvoice.flight_hours,
          rate: foundInvoice.flight_rate,
          amount: foundInvoice.flight_amount,
          date: foundInvoice.created_at
        },
        {
          id: "2", 
          description: `Ground Instruction - ${foundInvoice.ground_hours}h`,
          item_type: "ground_instruction",
          hours: foundInvoice.ground_hours,
          rate: foundInvoice.ground_rate,
          amount: foundInvoice.ground_amount,
          date: foundInvoice.created_at
        }
      ].filter(item => item.hours > 0)
      
      setInvoice({
        ...foundInvoice,
        line_items: lineItems
      })
    } catch (error) {
      console.error("Error loading invoice:", error)
      toast({
        title: "Error",
        description: "Failed to load invoice details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDownloadPDF() {
    if (!invoice) return
    
    try {
      setIsDownloading(true)
      const response = await fetch(`/api/admin/invoices/${invoice.id}/pdf`)
      
      if (!response.ok) {
        throw new Error("Failed to generate PDF")
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Invoice-${invoice.invoice_number}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Success",
        description: "Invoice PDF downloaded successfully",
      })
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "draft":
        return "bg-gray-500"
      case "sent":
        return "bg-blue-500"
      case "paid":
        return "bg-green-500"
      case "overdue":
        return "bg-red-500"
      case "cancelled":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p>Invoice not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/billing/invoices")}
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">
            Invoice #{invoice.invoice_number}
          </h2>
          <Badge
            variant="secondary"
            className={getStatusColor(invoice.status)}
          >
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </Badge>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <DownloadIcon className="mr-2 h-4 w-4" />
            )}
            Download PDF
          </Button>
          <Button onClick={() => setIsSendModalOpen(true)}>
            <MailIcon className="mr-2 h-4 w-4" />
            Send to Student
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {invoice.student.first_name} {invoice.student.last_name}
              </p>
              <p className="text-sm text-gray-500">{invoice.student.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructor Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {invoice.instructor.first_name} {invoice.instructor.last_name}
              </p>
              <p className="text-sm text-gray-500">{invoice.instructor.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>
            Created on {format(new Date(invoice.created_at), "MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Line Items</h4>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left font-medium">Description</th>
                      <th className="p-2 text-left font-medium">Type</th>
                      <th className="p-2 text-right font-medium">Hours</th>
                      <th className="p-2 text-right font-medium">Rate</th>
                      <th className="p-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.line_items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-2">{item.description}</td>
                        <td className="p-2">
                          {item.item_type
                            .split("_")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" ")}
                        </td>
                        <td className="p-2 text-right">{item.hours.toFixed(1)}</td>
                        <td className="p-2 text-right">
                          ${item.rate.toFixed(2)}
                        </td>
                        <td className="p-2 text-right">
                          ${item.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Flight Hours Total</span>
                <span>${invoice.flight_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ground Hours Total</span>
                <span>${invoice.ground_amount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-medium">
                <span>Total Amount</span>
                <span>${invoice.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Due Date: {format(new Date(invoice.due_date), "MMMM d, yyyy")}
            </p>
            {invoice.paid_date && (
              <p className="text-sm text-gray-500">
                Paid on {format(new Date(invoice.paid_date), "MMMM d, yyyy")}
                {invoice.payment_method && ` via ${invoice.payment_method}`}
              </p>
            )}
          </div>
          {invoice.notes && (
            <p className="text-sm text-gray-500">Note: {invoice.notes}</p>
          )}
        </CardFooter>
      </Card>

      <SendInvoiceModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoice_number}
        defaultEmail={invoice.student.email}
        onEmailSent={() => {
          loadInvoice() // Refresh to update status
          toast({
            title: "Invoice sent",
            description: `Invoice ${invoice.invoice_number} has been sent successfully.`,
          })
        }}
      />
    </div>
  )
}
