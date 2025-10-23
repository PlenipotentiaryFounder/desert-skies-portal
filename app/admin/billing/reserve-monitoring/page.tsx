import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  checkPlatformReserve, 
  getUnacknowledgedAlerts,
  getPlatformBalance,
  getStudentBalance,
  getInstructorBalance
} from "@/lib/reserve-monitoring-service"
import { AlertCircle, CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"
import { Suspense } from "react"

async function ReserveStatus() {
  const reserve = await checkPlatformReserve()
  
  const statusConfig = {
    healthy: {
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    warning: {
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    },
    critical: {
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    }
  }
  
  const config = statusConfig[reserve.status]
  const Icon = config.icon
  
  return (
    <Card className={`${config.borderColor} border-2`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={`h-8 w-8 ${config.color}`} />
            <div>
              <CardTitle>Platform Reserve Status</CardTitle>
              <CardDescription>Current cash position and health</CardDescription>
            </div>
          </div>
          <Badge variant={reserve.status === 'healthy' ? 'default' : reserve.status === 'warning' ? 'secondary' : 'destructive'}>
            {reserve.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg ${config.bgColor}`}>
            <div className="text-sm font-medium text-gray-600">Current Reserve</div>
            <div className={`text-2xl font-bold ${config.color}`}>
              ${(reserve.current_reserve_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50">
            <div className="text-sm font-medium text-gray-600">Minimum Required</div>
            <div className="text-2xl font-bold text-gray-900">
              ${(reserve.minimum_required_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        
        {reserve.drift_cents && Math.abs(reserve.drift_cents) > 1000 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Reconciliation Drift Detected</AlertTitle>
            <AlertDescription>
              Platform wallet differs from Stripe balance by ${(Math.abs(reserve.drift_cents) / 100).toFixed(2)}.
              This indicates a potential reconciliation issue.
            </AlertDescription>
          </Alert>
        )}
        
        <Alert className={config.bgColor}>
          <AlertDescription>{reserve.message}</AlertDescription>
        </Alert>
        
        {reserve.should_block_transfers && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Transfers Blocked</AlertTitle>
            <AlertDescription>
              Instructor payouts are currently blocked due to critical reserve levels.
              Add funds to the platform account to resume operations.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

async function ActiveAlerts() {
  const alerts = await getUnacknowledgedAlerts()
  
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>Recent reserve and reconciliation alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>No active alerts. System is running smoothly.</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Alerts ({alerts.length})</CardTitle>
        <CardDescription>Unacknowledged reserve and reconciliation alerts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert: any) => (
            <Alert 
              key={alert.id}
              variant={alert.severity === 'critical' ? 'destructive' : 'default'}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="capitalize">{alert.alert_type.replace(/_/g, ' ')}</AlertTitle>
              <AlertDescription>
                {alert.message}
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(alert.created_at).toLocaleString()}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

async function WalletBalances() {
  const platformBalance = await getPlatformBalance()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Balances</CardTitle>
        <CardDescription>Current ledger balances across all wallet types</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-600">Platform Wallet</div>
              <div className="text-xs text-gray-500">Total platform margin accumulated</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                ${(platformBalance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              {platformBalance > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 inline" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 inline" />
              )}
            </div>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            Note: Student and instructor wallet totals available in detailed reports
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function ReserveMonitoringPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reserve Monitoring</h1>
        <p className="text-gray-600 mt-2">
          Monitor platform cash reserves, reconciliation status, and financial health
        </p>
      </div>
      
      <Suspense fallback={<div>Loading reserve status...</div>}>
        <ReserveStatus />
      </Suspense>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Suspense fallback={<div>Loading alerts...</div>}>
          <ActiveAlerts />
        </Suspense>
        
        <Suspense fallback={<div>Loading balances...</div>}>
          <WalletBalances />
        </Suspense>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="outline">Run Reconciliation</Button>
          <Button variant="outline">View Reconciliation History</Button>
          <Button variant="outline">Configure Thresholds</Button>
        </CardContent>
      </Card>
    </div>
  )
}

