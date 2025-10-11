import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { 
  getStudentInstructorAccount,
  getInstructorInvoices,
  getFlightSessionBilling,
  getStudentInstructorRates
} from "@/lib/instructor-billing-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  DollarSign, 
  CreditCard, 
  Receipt, 
  TrendingUp,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  FileText
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"

export const metadata = {
  title: "My Account & Billing | Desert Skies Aviation",
  description: "View your account balance, billing history, and payment options",
}

function InstructorAccountCard({ account, rates }: { account: any, rates: any }) {
  const isLowBalance = account.account_balance < account.low_balance_threshold
  const isLowFlightHours = account.prepaid_flight_hours < 2.0 // Less than 2 hours
  const isLowGroundHours = account.prepaid_ground_hours < 1.0 // Less than 1 hour

  return (
    <Card className={isLowBalance ? "border-warning" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Instructor Account - {account.instructor?.first_name} {account.instructor?.last_name}
          {(isLowBalance || isLowFlightHours || isLowGroundHours) && <AlertTriangle className="w-4 h-4 text-warning" />}
        </CardTitle>
        <CardDescription>
          Your prepaid hours and account balance with your instructor
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Account Balance */}
        <div className="text-center p-4 bg-primary/10 rounded-lg">
          <div className="text-3xl font-bold text-primary">
            ${account.account_balance.toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">Account Balance</p>
        </div>

        {/* Prepaid Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {account.prepaid_flight_hours.toFixed(1)}
            </div>
            <p className="text-sm text-muted-foreground">Flight Hours</p>
            <p className="text-xs text-muted-foreground">
              ${rates?.flight_instruction_rate?.toFixed(2) || '65.00'}/hr
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {account.prepaid_ground_hours.toFixed(1)}
            </div>
            <p className="text-sm text-muted-foreground">Ground Hours</p>
            <p className="text-xs text-muted-foreground">
              ${rates?.ground_instruction_rate?.toFixed(2) || '45.00'}/hr
            </p>
          </div>
        </div>

        {/* Low Balance Warnings */}
        {(isLowBalance || isLowFlightHours || isLowGroundHours) && (
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="font-medium text-warning">Low Balance Alert</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              {isLowBalance && <li>• Account balance is below ${account.low_balance_threshold.toFixed(2)}</li>}
              {isLowFlightHours && <li>• Flight hours are running low</li>}
              {isLowGroundHours && <li>• Ground instruction hours are running low</li>}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button className="flex-1" asChild>
            <Link href="/student/billing/purchase-hours">
              <Plus className="w-4 h-4 mr-2" />
              Purchase Hours
            </Link>
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/student/billing/pay-balance">
              <CreditCard className="w-4 h-4 mr-2" />
              Pay Outstanding Balance
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function RecentSessionBillingCard({ sessions }: { sessions: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Recent Flight Sessions
        </CardTitle>
        <CardDescription>
          Your latest flight session billing
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No flight sessions billed yet. Complete your first flight session to see billing details here.
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">
                      Flight Session - {session.flight_hours?.toFixed(1) || '0.0'}h flight
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ground: {((session.prebrief_hours || 0) + (session.postbrief_hours || 0)).toFixed(1)}h
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ${session.total_cost?.toFixed(2) || '0.00'}
                  </p>
                  <Badge variant={
                    session.billing_status === 'paid' ? 'default' : 
                    session.billing_status === 'pending' ? 'secondary' : 'outline'
                  }>
                    {session.billing_status || 'pending'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        {sessions.length > 5 && (
          <div className="mt-4">
            <Button variant="outline" className="w-full">
              View All Sessions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function InvoicesCard({ invoices }: { invoices: any[] }) {
  const pendingInvoices = invoices.filter(inv => ['sent', 'overdue'].includes(inv.status))
  const paidInvoices = invoices.filter(inv => inv.status === 'paid')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Invoices
        </CardTitle>
        <CardDescription>
          Your billing statements and payment history
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No invoices yet
          </p>
        ) : (
          <div className="space-y-4">
            {pendingInvoices.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-orange-600">Pending Payment</h4>
                <div className="space-y-2">
                  {pendingInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">
                          Due: {formatDate(invoice.due_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-orange-600">
                          ${invoice.net_amount.toFixed(2)}
                        </p>
                        <Badge variant={invoice.status === 'overdue' ? 'destructive' : 'secondary'}>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {paidInvoices.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-green-600">Recent Payments</h4>
                <div className="space-y-2">
                  {paidInvoices.slice(0, 3).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">
                          Paid: {formatDate(invoice.paid_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          ${invoice.net_amount.toFixed(2)}
                        </p>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Paid
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {invoices.length > 0 && (
          <div className="mt-4">
            <Button variant="outline" className="w-full">
              View All Invoices
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default async function StudentBillingPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get the default instructor (Thomas Ferrier) - in a real app, this would be based on student's enrollment
  const { data: instructorProfile } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .eq('email', 'thomas@desertskiesaviationaz.com')
    .single()

  if (!instructorProfile) {
    return <div>Instructor not found</div>
  }

  // Fetch billing data for this student-instructor pair
  let account, rates, invoices, sessionBilling
  
  try {
    [account, rates, invoices, sessionBilling] = await Promise.all([
      getStudentInstructorAccount(user.id, instructorProfile.id),
      getStudentInstructorRates(user.id, instructorProfile.id, { is_active: true }),
      getInstructorInvoices(user.id, instructorProfile.id),
      getFlightSessionBilling(undefined, user.id, instructorProfile.id)
    ])
  } catch (error) {
    console.error('Error fetching billing data:', error)
    // Provide fallback data for new students
    account = {
      student_id: user.id,
      instructor_id: instructorProfile.id,
      prepaid_flight_hours: 0.0,
      prepaid_ground_hours: 0.0,
      account_balance: 0.00,
      low_balance_threshold: 50.00,
      instructor: instructorProfile
    }
    rates = []
    invoices = []
    sessionBilling = []
  }

  const currentRate = rates?.[0] || null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Account & Billing</h1>
          <p className="text-muted-foreground">
            Manage your account balance, view invoices, and make payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/student/billing/pay-balance">
              <CreditCard className="w-4 h-4 mr-2" />
              Pay Outstanding Balance
            </Link>
          </Button>
          <Button asChild>
            <Link href="/student/billing/purchase-hours">
              <Plus className="w-4 h-4 mr-2" />
              Purchase Hours
            </Link>
          </Button>
        </div>
      </div>

      {/* Instructor Account */}
      <InstructorAccountCard account={account} rates={currentRate} />

      {/* Content Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="settings">Account Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <RecentSessionBillingCard sessions={sessionBilling || []} />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <InvoicesCard invoices={invoices} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your billing preferences and payment settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Auto-Charge</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Automatically charge your payment method when balance is low
                    </p>
                    <Badge variant={account?.auto_charge_enabled ? "default" : "secondary"}>
                      {account?.auto_charge_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Low Balance Alert</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Get notified when balance drops below threshold
                    </p>
                    <p className="text-sm font-medium">
                      ${account?.low_balance_threshold?.toFixed(2) || '0.00'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">
                  Update Settings
                </Button>
                <Button variant="outline">
                  Download Statements
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
