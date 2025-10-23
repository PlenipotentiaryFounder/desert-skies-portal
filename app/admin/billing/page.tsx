import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getStudentInstructorRates } from "@/lib/instructor-billing-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DollarSign, 
  CreditCard, 
  Receipt, 
  TrendingUp,
  Plus,
  Settings,
  Users,
  Plane,
  Clock,
  Activity,
  BarChart3,
  AlertCircle,
  Shield
} from "lucide-react"
import Link from "next/link"
import { StudentRateManager } from "./rates/student-rate-manager"
import { StudentAccountsOverview } from "./student-accounts-overview"
import { InvoiceManagement } from "./invoice-management"

export const metadata = {
  title: "Billing Management | Desert Skies Aviation",
  description: "Manage billing, rates, invoices, and student accounts",
}

async function getBillingStats() {
  const supabase = await createClient(await cookies())

  // Get billing overview stats
  const [
    { data: studentAccounts },
    { data: pendingInvoices },
    { data: recentPayments },
    { data: unbilledSessions }
  ] = await Promise.all([
    supabase.from('student_instructor_accounts').select('id').eq('status', 'active'),
    supabase.from('instructor_invoices').select('id, total_amount').in('status', ['sent', 'overdue']),
    supabase.from('instructor_billing_transactions').select('cash_amount')
      .eq('transaction_type', 'cash_credit')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('flight_session_billing').select('total_cost').eq('billing_status', 'pending')
  ])

  const pendingAmount = pendingInvoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0
  const monthlyRevenue = recentPayments?.reduce((sum, pay) => sum + pay.cash_amount, 0) || 0
  const unbilledAmount = unbilledSessions?.reduce((sum, session) => sum + session.total_cost, 0) || 0

  return {
    totalStudentAccounts: studentAccounts?.length || 0,
    pendingAmount,
    monthlyRevenue,
    unbilledAmount,
    pendingInvoicesCount: pendingInvoices?.length || 0,
    unbilledSessionsCount: unbilledSessions?.length || 0
  }
}

export default async function AdminBillingPage() {
  const supabase = await createClient(await cookies())

  // Get all students and instructors
  const [{ data: students }, { data: instructors }] = await Promise.all([
    supabase
      .from('profiles')
      .select(`
        id, first_name, last_name, email,
        user_roles!inner(
          roles!inner(name)
        )
      `)
      .eq('user_roles.roles.name', 'student'),
    supabase
      .from('profiles')
      .select(`
        id, first_name, last_name, email,
        user_roles!inner(
          roles!inner(name)
        )
      `)
      .eq('user_roles.roles.name', 'instructor')
  ])

  const [stats, rates] = await Promise.all([
    getBillingStats(),
    getStudentInstructorRates(undefined, undefined, { is_active: true })
  ])

  // Calculate rate statistics
  const totalRates = rates.length
  const defaultRates = rates.filter(r => r.flight_instruction_rate === 75 && r.ground_instruction_rate === 75).length
  const customRates = totalRates - defaultRates
  const avgFlightRate = rates.reduce((sum, r) => sum + r.flight_instruction_rate, 0) / (totalRates || 1)
  const avgGroundRate = rates.reduce((sum, r) => sum + r.ground_instruction_rate, 0) / (totalRates || 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Management</h1>
          <p className="text-muted-foreground">
            Manage instructor rates, student accounts, and payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/billing/rates">
              <Settings className="w-4 h-4 mr-2" />
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

      {/* Advanced Billing Features - NEW */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Advanced Billing & Financial Controls
          </CardTitle>
          <CardDescription>
            Monitor reserves, track margins, manage instructor payouts, and control student credit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-3">
            <Link href="/admin/billing/reserve-monitoring">
              <Button variant="outline" className="w-full h-auto flex-col items-start p-4 hover:bg-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Reserve Monitoring</span>
                </div>
                <span className="text-xs text-gray-600 text-left">
                  Track platform cash reserves and reconciliation status
                </span>
              </Button>
            </Link>
            
            <Link href="/admin/billing/margin-analytics">
              <Button variant="outline" className="w-full h-auto flex-col items-start p-4 hover:bg-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Margin Analytics</span>
                </div>
                <span className="text-xs text-gray-600 text-left">
                  View platform revenue and margin performance
                </span>
              </Button>
            </Link>
            
            <Link href="/admin/billing/instructor-rates">
              <Button variant="outline" className="w-full h-auto flex-col items-start p-4 hover:bg-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold">Instructor Rates</span>
                </div>
                <span className="text-xs text-gray-600 text-left">
                  Manage instructor payout rates and instant payouts
                </span>
              </Button>
            </Link>
            
            <Link href="/admin/billing/credit-limits">
              <Button variant="outline" className="w-full h-auto flex-col items-start p-4 hover:bg-yellow-100">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold">Credit Limits</span>
                </div>
                <span className="text-xs text-gray-600 text-left">
                  Monitor and adjust student credit limits
                </span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudentAccounts}</div>
            <p className="text-xs text-muted-foreground">Student accounts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pendingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingInvoicesCount} invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unbilled Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.unbilledAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{stats.unbilledSessionsCount} sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Rate Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Rates</p>
                <p className="text-2xl font-bold">{totalRates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Default Rates</p>
                <p className="text-2xl font-bold">{defaultRates}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Custom Rates</p>
                <p className="text-2xl font-bold">{customRates}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Flight Rate</p>
                <p className="text-2xl font-bold">${avgFlightRate.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Ground Rate</p>
                <p className="text-2xl font-bold">${avgGroundRate.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Default Rate Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800">Default Rate: $75.00/hour</p>
              <p className="text-sm text-blue-600">
                All students default to $75/hour for both flight and ground instruction unless custom rates are set.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="rates" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rates">Student Rates</TabsTrigger>
          <TabsTrigger value="accounts">Student Accounts</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="rates" className="space-y-4">
          <Suspense fallback={<div>Loading rates...</div>}>
            <StudentRateManager 
              students={students || []}
              instructors={instructors || []}
              existingRates={rates || []}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <Suspense fallback={<div>Loading student accounts...</div>}>
            <StudentAccountsOverview />
          </Suspense>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Suspense fallback={<div>Loading invoices...</div>}>
            <InvoiceManagement />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}