"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, CreditCard, Wallet, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  payment_method: z.enum(['stripe', 'account_balance', 'prepaid_hours', 'cash', 'check']),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  notes: z.string().optional(),
})

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: {
    id: string
    invoice_number: string
    student_id: string
    instructor_id: string
    total_amount: number
    status: string
    student?: {
      first_name: string
      last_name: string
      email: string
    }
  }
  accountBalance?: number
  prepaidHours?: {
    flight: number
    ground: number
  }
  onPaymentProcessed: () => void
}

export function PaymentModal({
  isOpen,
  onClose,
  invoice,
  accountBalance = 0,
  prepaidHours = { flight: 0, ground: 0 },
  onPaymentProcessed,
}: PaymentModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payment_method: 'stripe',
      amount: invoice.total_amount,
      notes: "",
    },
  })

  const watchedPaymentMethod = form.watch('payment_method')

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      let endpoint = ''
      let body = {}

      switch (values.payment_method) {
        case 'stripe':
          endpoint = `/api/admin/invoices/${invoice.id}/payment/stripe`
          body = {
            amount: values.amount,
            notes: values.notes
          }
          break
        case 'account_balance':
          endpoint = `/api/admin/invoices/${invoice.id}/payment/account-balance`
          body = { notes: values.notes }
          break
        case 'prepaid_hours':
          endpoint = `/api/admin/invoices/${invoice.id}/payment/prepaid-hours`
          body = { notes: values.notes }
          break
        case 'cash':
        case 'check':
          endpoint = `/api/admin/invoices/${invoice.id}/payment/manual`
          body = {
            payment_method: values.payment_method,
            amount: values.amount,
            notes: values.notes
          }
          break
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Payment processed successfully",
          description: result.message,
        })
        onPaymentProcessed()
        onClose()
      } else {
        throw new Error(result.error || result.message || "Payment failed")
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Failed to process payment",
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

  const canPayWithBalance = accountBalance >= invoice.total_amount
  const canPayWithHours = prepaidHours.flight >= 1 && prepaidHours.ground >= 0.5 // Rough estimate

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Process Payment
          </DialogTitle>
          <DialogDescription>
            Process payment for Invoice #{invoice.invoice_number} - ${invoice.total_amount.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Student: {invoice.student?.first_name} {invoice.student?.last_name}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-600" />
              <span>Balance: ${accountBalance.toFixed(2)}</span>
              {canPayWithBalance && <Badge variant="outline" className="text-green-600 border-green-600">✓</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Hours: {prepaidHours.flight.toFixed(1)}f / {prepaidHours.ground.toFixed(1)}g</span>
              {canPayWithHours && <Badge variant="outline" className="text-green-600 border-green-600">✓</Badge>}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="stripe">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Credit Card (Stripe)
                        </div>
                      </SelectItem>
                      <SelectItem value="account_balance" disabled={!canPayWithBalance}>
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          Account Balance
                          {!canPayWithBalance && <span className="text-red-500 text-xs">(Insufficient)</span>}
                        </div>
                      </SelectItem>
                      <SelectItem value="prepaid_hours" disabled={!canPayWithHours}>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Prepaid Hours
                          {!canPayWithHours && <span className="text-red-500 text-xs">(Insufficient)</span>}
                        </div>
                      </SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(watchedPaymentMethod === 'stripe' || watchedPaymentMethod === 'cash' || watchedPaymentMethod === 'check') && (
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Amount to charge (can be partial payment)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about this payment..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedPaymentMethod === 'account_balance' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Payment will be deducted from student's account balance.
                  New balance will be: ${(accountBalance - invoice.total_amount).toFixed(2)}
                </p>
              </div>
            )}

            {watchedPaymentMethod === 'prepaid_hours' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Payment will be deducted from student's prepaid hours.
                  This will use the flight and ground hours from the invoice.
                </p>
              </div>
            )}

            {watchedPaymentMethod === 'stripe' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Student will be redirected to secure payment page to complete transaction.
                </p>
              </div>
            )}

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
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Process Payment
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
