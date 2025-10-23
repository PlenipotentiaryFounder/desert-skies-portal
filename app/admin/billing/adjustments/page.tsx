import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  getAdjustmentsRequiringApproval,
  approveAdjustment
} from "@/lib/flight-adjustment-service"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { AlertCircle, CheckCircle, Clock, DollarSign, XCircle } from "lucide-react"
import { Suspense } from "react"
import Link from "next/link"

async function AdjustmentsRequiringApproval() {
  const adjustments = await getAdjustmentsRequiringApproval()
  
  const adjustmentTypeConfig = {
    overpayment: {
      variant: 'destructive' as const,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      label: 'OVERPAYMENT'
    },
    underpayment: {
      variant: 'default' as const,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      label: 'UNDERPAYMENT'
    },
    clawback: {
      variant: 'destructive' as const,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      label: 'CLAWBACK'
    },
    bonus: {
      variant: 'default' as const,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      label: 'BONUS'
    },
    penalty: {
      variant: 'destructive' as const,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      label: 'PENALTY'
    }
  }
  
  if (adjustments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>Adjustments requiring admin approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">No adjustments pending approval</p>
            <p className="text-sm mt-1">All adjustments have been processed</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Approvals ({adjustments.length})</CardTitle>
        <CardDescription>Review and approve instructor billing adjustments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {adjustments.map((adjustment: any) => {
            const config = adjustmentTypeConfig[adjustment.adjustment_type as keyof typeof adjustmentTypeConfig]
            const instructor = adjustment.profiles
            
            return (
              <div key={adjustment.id} className={`border rounded-lg p-4 ${config.bgColor}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">
                        {instructor?.first_name} {instructor?.last_name}
                      </h3>
                      <Badge variant={config.variant}>{config.label}</Badge>
                      {adjustment.requires_approval && (
                        <Badge variant="secondary">REQUIRES APPROVAL</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <div className="text-xs text-gray-500">Adjustment Amount</div>
                        <div className={`text-lg font-bold ${config.color}`}>
                          {adjustment.amount_cents > 0 ? '+' : ''}${(adjustment.amount_cents / 100).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Created</div>
                        <div className="font-medium">
                          {new Date(adjustment.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <Alert className="mb-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Reason</AlertTitle>
                      <AlertDescription>{adjustment.adjustment_reason}</AlertDescription>
                    </Alert>
                    
                    {adjustment.original_flight_session_id && (
                      <Link 
                        href={`/admin/schedule/${adjustment.original_flight_session_id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View original flight session →
                      </Link>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <form action={async () => {
                      "use server"
                      // This would be handled by a server action
                      // For now, just a placeholder
                    }}>
                      <Button variant="default" size="sm" type="submit">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </form>
                    <Button variant="outline" size="sm">
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
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

async function AllAdjustments() {
  const supabase = await createClient(await cookies())
  
  const { data: adjustments } = await supabase
    .from('instructor_adjustments')
    .select(`
      *,
      profiles!instructor_id(first_name, last_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(20)
  
  const statusConfig = {
    pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending' },
    settled: { variant: 'default' as const, icon: CheckCircle, label: 'Settled' },
    forgiven: { variant: 'outline' as const, icon: CheckCircle, label: 'Forgiven' },
    written_off: { variant: 'destructive' as const, icon: XCircle, label: 'Written Off' }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Adjustments</CardTitle>
        <CardDescription>Latest 20 instructor billing adjustments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {adjustments && adjustments.length > 0 ? (
            adjustments.map((adjustment: any) => {
              const config = statusConfig[adjustment.settlement_status as keyof typeof statusConfig]
              const Icon = config.icon
              const instructor = adjustment.profiles
              
              return (
                <div key={adjustment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {instructor?.first_name} {instructor?.last_name}
                      </span>
                      <Badge variant={config.variant}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {adjustment.adjustment_type}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {adjustment.adjustment_reason}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(adjustment.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      adjustment.amount_cents > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {adjustment.amount_cents > 0 ? '+' : ''}${(adjustment.amount_cents / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              No adjustments found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

async function AdjustmentStatistics() {
  const supabase = await createClient(await cookies())
  
  const { data: pendingAdjustments } = await supabase
    .from('instructor_adjustments')
    .select('amount_cents')
    .eq('settlement_status', 'pending')
  
  const { data: settledAdjustments } = await supabase
    .from('instructor_adjustments')
    .select('amount_cents')
    .eq('settlement_status', 'settled')
  
  const pendingTotal = pendingAdjustments?.reduce((sum, a) => sum + a.amount_cents, 0) || 0
  const settledTotal = settledAdjustments?.reduce((sum, a) => sum + a.amount_cents, 0) || 0
  const pendingCount = pendingAdjustments?.length || 0
  
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${Math.abs(pendingTotal / 100).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {pendingCount} adjustments
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Settled (Lifetime)</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${Math.abs(settledTotal / 100).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            All time settlements
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Impact</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            (pendingTotal + settledTotal) > 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {(pendingTotal + settledTotal) > 0 ? '+' : ''}${((pendingTotal + settledTotal) / 100).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            To/from instructors
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function AdjustmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Flight Adjustments & Clawbacks</h1>
        <p className="text-gray-600 mt-2">
          Manage billing corrections, instructor adjustments, and transfer clawbacks
        </p>
      </div>
      
      <Suspense fallback={<div>Loading statistics...</div>}>
        <AdjustmentStatistics />
      </Suspense>
      
      <Suspense fallback={<div>Loading pending approvals...</div>}>
        <AdjustmentsRequiringApproval />
      </Suspense>
      
      <Suspense fallback={<div>Loading adjustments...</div>}>
        <AllAdjustments />
      </Suspense>
      
      <Card>
        <CardHeader>
          <CardTitle>About Adjustments & Clawbacks</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <strong>Clawback Window:</strong> Transfers can be reversed within 72 hours (T+72h) 
              if errors are detected quickly.
            </li>
            <li>
              <strong>Approval Thresholds:</strong> Adjustments over $50 require admin approval 
              before settlement.
            </li>
            <li>
              <strong>Settlement Methods:</strong> Adjustments can be settled via future payout offset, 
              manual check, or Stripe reversal.
            </li>
            <li>
              <strong>Audit Trail:</strong> All adjustments are tracked with full history for compliance 
              and dispute resolution.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

