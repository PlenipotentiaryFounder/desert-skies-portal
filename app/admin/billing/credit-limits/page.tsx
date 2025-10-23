import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getStudentsNearCreditLimit } from "@/lib/credit-limit-service"
import { AlertCircle, AlertTriangle, CheckCircle, DollarSign, CreditCard } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

async function CreditLimitAlerts() {
  const students = await getStudentsNearCreditLimit()
  
  const exceeded = students.filter(s => s.status === 'exceeded')
  const urgent = students.filter(s => s.status === 'urgent')
  const warning = students.filter(s => s.status === 'warning')
  
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="border-red-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Limit Exceeded</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{exceeded.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Students over credit limit
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-yellow-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Urgent (95%+)</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{urgent.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Near credit limit
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Warning (80%+)</CardTitle>
          <AlertTriangle className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{warning.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Approaching limit
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

async function StudentsNearLimit() {
  const students = await getStudentsNearCreditLimit()
  
  const statusConfig = {
    exceeded: {
      variant: 'destructive' as const,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      label: 'EXCEEDED'
    },
    urgent: {
      variant: 'secondary' as const,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      label: 'URGENT'
    },
    warning: {
      variant: 'default' as const,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      label: 'WARNING'
    }
  }
  
  if (students.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Students Near Credit Limit</CardTitle>
          <CardDescription>Students approaching or exceeding their credit limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">All students within credit limits</p>
            <p className="text-sm mt-1">No action required at this time</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Students Near Credit Limit ({students.length})</CardTitle>
        <CardDescription>Requires attention or follow-up action</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {students.map((student: any) => {
            const config = statusConfig[student.status]
            const percentUsed = Math.abs((student.current_balance_cents / student.credit_limit_cents) * 100)
            
            return (
              <div key={student.student_id} className={`border rounded-lg p-4 ${config.bgColor}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{student.student_name}</h3>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-gray-500">Current Balance</div>
                        <div className={`font-semibold ${config.color}`}>
                          ${(student.current_balance_cents / 100).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Credit Limit</div>
                        <div className="font-medium">
                          ${(student.credit_limit_cents / 100).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Usage</div>
                        <div className={`font-semibold ${config.color}`}>
                          {percentUsed.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    {student.status === 'exceeded' && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          This student has exceeded their credit limit and may be unable to book flights.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Link href={`/admin/billing/credit-limits/${student.student_id}`}>
                      <Button variant="outline" size="sm">Adjust Limit</Button>
                    </Link>
                    <Link href={`/admin/users/${student.student_id}`}>
                      <Button variant="ghost" size="sm">View Profile</Button>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

async function CreditLimitSettings() {
  const supabase = await createClient(await cookies())
  
  const { data: limits } = await supabase
    .from('student_credit_limits')
    .select('*')
    .eq('status', 'active')
    .order('credit_limit_cents', { ascending: true })
    .limit(5)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Limit Configuration</CardTitle>
        <CardDescription>Default settings and policies</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-600">Default Limit</div>
            <div className="text-2xl font-bold">-$200.00</div>
            <p className="text-xs text-gray-500 mt-1">For new students</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-600">Warning Threshold</div>
            <div className="text-2xl font-bold">80%</div>
            <p className="text-xs text-gray-500 mt-1">Alert trigger point</p>
          </div>
        </div>
        
        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertTitle>Auto-Charge Available</AlertTitle>
          <AlertDescription>
            Students can enable automatic charging when their balance reaches a trigger point.
            This helps prevent service interruptions and improves cash flow.
          </AlertDescription>
        </Alert>
        
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Credit Limit Increase Criteria</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ Card on file for auto-charge</li>
            <li>✓ 90+ days dispute-free</li>
            <li>✓ $1,000+ lifetime prepaid</li>
            <li className="text-green-600 font-medium">→ Eligible for -$500 limit</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function CreditLimitsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Credit Limit Management</h1>
        <p className="text-gray-600 mt-2">
          Monitor and manage student credit limits to balance service quality with financial risk
        </p>
      </div>
      
      <Suspense fallback={<div>Loading alerts...</div>}>
        <CreditLimitAlerts />
      </Suspense>
      
      <Suspense fallback={<div>Loading students...</div>}>
        <StudentsNearLimit />
      </Suspense>
      
      <Suspense fallback={<div>Loading settings...</div>}>
        <CreditLimitSettings />
      </Suspense>
      
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="outline">
            <DollarSign className="h-4 w-4 mr-2" />
            Bulk Adjust Limits
          </Button>
          <Button variant="outline">
            <AlertCircle className="h-4 w-4 mr-2" />
            Send Dunning Emails
          </Button>
          <Button variant="outline">Configure Policies</Button>
        </CardContent>
      </Card>
    </div>
  )
}

