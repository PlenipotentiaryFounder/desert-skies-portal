"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard,
  DollarSign, 
  ArrowLeft,
  Lock,
  CheckCircle,
  AlertTriangle,
  Receipt,
  Calendar
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Outstanding invoices will be fetched from the database

export default function PayBalancePage() {
  const router = useRouter()
  const [outstandingInvoices, setOutstandingInvoices] = useState<any[]>([])
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [paymentMethod, setPaymentMethod] = useState<string>("credit_card")
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function fetchOutstandingInvoices() {
      try {
        setLoading(true)
        setError(null)

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          throw new Error('User not authenticated')
        }

        // Fetch outstanding invoices for this student
        const { data: invoices, error: invoicesError } = await supabase
          .from('student_invoices')
          .select('*')
          .eq('student_id', user.id)
          .in('status', ['pending', 'overdue'])
          .order('due_date', { ascending: true })

        if (invoicesError) {
          throw new Error('Failed to fetch invoices')
        }

        setOutstandingInvoices(invoices || [])
        setSelectedInvoices(invoices?.map(inv => inv.id) || [])
      } catch (err) {
        console.error('Error fetching invoices:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch invoices')
      } finally {
        setLoading(false)
      }
    }

    fetchOutstandingInvoices()
  }, [supabase])

  const totalOutstanding = outstandingInvoices
    .filter(inv => selectedInvoices.includes(inv.id))
    .reduce((sum, inv) => sum + inv.total_amount, 0)

  const handleInvoiceToggle = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    )
  }

  const handleSelectAll = () => {
    setSelectedInvoices(outstandingInvoices.map(inv => inv.id))
  }

  const handleDeselectAll = () => {
    setSelectedInvoices([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false)
      // In a real implementation, this would integrate with Stripe
      alert(`Successfully paid $${totalOutstanding.toFixed(2)} for ${selectedInvoices.length} invoice(s)!`)
      router.push('/student/billing')
    }, 2000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'destructive'
      case 'due': return 'warning'
      default: return 'secondary'
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/student/billing">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Billing
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pay Outstanding Balance</h1>
          <p className="text-muted-foreground">
            Pay your outstanding invoices and training session fees
          </p>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your invoices...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Error Loading Invoices</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : outstandingInvoices.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Outstanding Balance</h3>
            <p className="text-muted-foreground mb-6">
              You're all caught up! All your invoices have been paid.
            </p>
            <Button asChild>
              <Link href="/student/billing">
                Return to Billing
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Outstanding Invoices */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Outstanding Invoices
                  </CardTitle>
                  <CardDescription>
                    Select which invoices you'd like to pay
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleDeselectAll}>
                    Deselect All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {outstandingInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedInvoices.includes(invoice.id) 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleInvoiceToggle(invoice.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => handleInvoiceToggle(invoice.id)}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">{invoice.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Due: {formatDate(invoice.due_date)}
                          </span>
                          <Badge variant={getStatusColor(invoice.status)} className="text-xs">
                            {invoice.status === 'overdue' && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">${invoice.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Selected Invoices:</span>
                  <span>{selectedInvoices.length} of {outstandingInvoices.length}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span>${totalOutstanding.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </CardTitle>
              <CardDescription>
                Select how you'd like to pay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="credit_card" id="credit_card" />
                  <Label htmlFor="credit_card" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Credit/Debit Card</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Secure payment via Stripe
                    </p>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 border rounded-lg opacity-50">
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" disabled />
                  <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Bank Transfer</span>
                      <span className="text-xs bg-muted px-2 py-1 rounded">Coming Soon</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Direct bank transfer (ACH)
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span>Your payment information is secure and encrypted</span>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={processing || selectedInvoices.length === 0 || totalOutstanding === 0}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Pay ${totalOutstanding.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Info */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">Payment Information</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Payments are processed immediately upon confirmation</li>
            <li>• You'll receive an email receipt once payment is complete</li>
            <li>• Overdue invoices may incur late fees if not paid promptly</li>
            <li>• Contact us if you have questions about any charges</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
