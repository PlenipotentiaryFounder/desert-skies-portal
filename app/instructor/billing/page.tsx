import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { 
  getStudentInstructorRates,
  getInstructorInvoices,
  getFlightSessionBilling
} from "@/lib/instructor-billing-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DollarSign, 
  Receipt, 
  TrendingUp,
  Plus,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export const metadata = {
  title: "Instructor Billing | Desert Skies Aviation",
  description: "Manage your student billing, invoices, and rates",
}

function PendingApprovalsCard({ sessionBilling }: { sessionBilling: any[] }) {
  const pendingSessions = sessionBilling.filter(session => !session.instructor_approved)

  return (
    <Card className={pendingSessions.length > 0 ? "border-orange-200 bg-orange-50/50" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Pending Approvals
          {pendingSessions.length > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {pendingSessions.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Flight sessions awaiting your approval for billing
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingSessions.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">All sessions approved!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingSessions.slice(0, 5).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-card border border-orange-200/20 rounded-lg">
                <div>
                  <p className="font-medium">
                    {session.student?.first_name} {session.student?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {session.flight_hours}h flight + {(session.prebrief_hours + session.postbrief_hours)}h ground
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.flight_session?.date && format(new Date(session.flight_session.date), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-orange-600">
                    ${session.total_cost?.toFixed(2)}
                  </p>
                  <Button size="sm" className="mt-1">
                    Approve
                  </Button>
                </div>
              </div>
            ))}
            {pendingSessions.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                And {pendingSessions.length - 5} more...
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StudentAccountsCard({ accounts }: { accounts: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Student Accounts
        </CardTitle>
        <CardDescription>
          Overview of your student account balances and prepaid hours
        </CardDescription>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No student accounts yet
          </p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">
                    {account.student?.first_name} {account.student?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {account.prepaid_flight_hours.toFixed(1)}h flight • {account.prepaid_ground_hours.toFixed(1)}h ground
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ${account.account_balance.toFixed(2)}
                  </p>
                  <Badge variant={account.account_balance < account.low_balance_threshold ? "destructive" : "default"}>
                    {account.account_balance < account.low_balance_threshold ? "Low Balance" : "Good"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RecentInvoicesCard({ invoices }: { invoices: any[] }) {
  const recentInvoices = invoices.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Recent Invoices
        </CardTitle>
        <CardDescription>
          Your recently created invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentInvoices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No invoices created yet</p>
            <Button className="mt-4" asChild>
              <Link href="/admin/billing/invoices/new">
                <Plus className="w-4 h-4 mr-2" />
                Create First Invoice
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{invoice.invoice_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {invoice.student?.first_name} {invoice.student?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(invoice.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ${invoice.total_amount.toFixed(2)}
                  </p>
                  <Badge variant={
                    invoice.status === 'paid' ? 'default' : 
                    invoice.status === 'sent' ? 'secondary' : 
                    invoice.status === 'overdue' ? 'destructive' : 'outline'
                  }>
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        {invoices.length > 5 && (
          <div className="mt-4">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/admin/billing/invoices">
                View All Invoices
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default async function InstructorBillingPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch billing data for this instructor
  let rates, invoices, sessionBilling, accounts
  
  try {
    [rates, invoices, sessionBilling] = await Promise.all([
      getStudentInstructorRates(undefined, user.id, { is_active: true }),
      getInstructorInvoices(undefined, user.id),
      getFlightSessionBilling(undefined, undefined, user.id)
    ])

    // Get student accounts for this instructor
    const { data: studentAccounts } = await supabase
      .from('student_instructor_accounts')
      .select(`
        *,
        student:student_id(first_name, last_name, email)
      `)
      .eq('instructor_id', user.id)
    
    accounts = studentAccounts || []
  } catch (error) {
    console.error('Error fetching instructor billing data:', error)
    rates = []
    invoices = []
    sessionBilling = []
    accounts = []
  }

  // Calculate stats
  const totalStudents = rates.length
  const pendingApprovals = sessionBilling.filter(s => !s.instructor_approved).length
  const totalEarnings = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total_amount, 0)
  const pendingPayments = invoices
    .filter(inv => ['sent', 'overdue'].includes(inv.status))
    .reduce((sum, inv) => sum + inv.total_amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instructor Billing</h1>
          <p className="text-muted-foreground">
            Manage your student billing, invoices, and account settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/billing/rates">
              <DollarSign className="w-4 h-4 mr-2" />
              Manage Rates
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/billing/invoices/new">
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">With custom rates</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Sessions to review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From paid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingPayments.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Outstanding invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals - Always show prominently */}
      <PendingApprovalsCard sessionBilling={sessionBilling} />

      {/* Content Tabs */}
      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="accounts">Student Accounts</TabsTrigger>
          <TabsTrigger value="invoices">Recent Invoices</TabsTrigger>
          <TabsTrigger value="rates">Rate Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <StudentAccountsCard accounts={accounts} />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <RecentInvoicesCard invoices={invoices} />
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Rate Settings</CardTitle>
              <CardDescription>
                Manage your hourly rates for different students
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No custom rates set. Students will use default rates.
                  </p>
                  <Button asChild>
                    <Link href="/admin/billing/rates">
                      <Plus className="w-4 h-4 mr-2" />
                      Set Custom Rates
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rates.map((rate) => (
                    <div key={rate.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {rate.student?.first_name} {rate.student?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {rate.student?.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Flight: ${rate.flight_instruction_rate.toFixed(2)}/hr
                        </p>
                        <p className="text-sm font-medium">
                          Ground: ${rate.ground_instruction_rate.toFixed(2)}/hr
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/admin/billing/rates">
                        View All Rates
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
