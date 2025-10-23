import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { TrendingUp, DollarSign, Users, Calendar } from "lucide-react"
import { Suspense } from "react"

async function MarginOverview() {
  const supabase = await createClient(await cookies())
  
  // Get platform wallet balance (total margin accumulated)
  const { data: platformWallet } = await supabase
    .from('wallet_balances')
    .select('balance_cents')
    .eq('wallet_id', (await supabase
      .from('wallets')
      .select('id')
      .eq('owner_type', 'platform')
      .is('owner_id', null)
      .single()
    ).data?.id)
    .single()
  
  const totalMargin = platformWallet?.balance_cents || 0
  
  // Get recent journals with margin entries (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { data: recentMargins } = await supabase
    .from('ledger_entries')
    .select('amount_cents, created_at')
    .eq('ref_type', 'platform_margin')
    .gte('created_at', thirtyDaysAgo.toISOString())
  
  const monthlyMargin = recentMargins?.reduce((sum, entry) => sum + entry.amount_cents, 0) || 0
  const transactionCount = recentMargins?.length || 0
  const avgMarginPerTransaction = transactionCount > 0 ? monthlyMargin / transactionCount : 0
  
  return (
    <div className="grid md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Margin (All Time)</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${(totalMargin / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Accumulated platform revenue
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last 30 Days</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${(monthlyMargin / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Monthly margin revenue
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{transactionCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Completed flights (30 days)
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Margin/Flight</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${(avgMarginPerTransaction / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Per transaction average
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

async function TopInstructorsByMargin() {
  const supabase = await createClient(await cookies())
  
  // Get margin by instructor (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { data: margins } = await supabase
    .from('ledger_entries')
    .select(`
      amount_cents,
      metadata,
      journals!inner(event_id)
    `)
    .eq('ref_type', 'platform_margin')
    .gte('created_at', thirtyDaysAgo.toISOString())
  
  // Group by instructor (from metadata)
  const instructorMargins = margins?.reduce((acc: any, entry: any) => {
    const studentCharge = entry.metadata?.student_charge || 0
    const instructorPayout = entry.metadata?.instructor_payout || 0
    const margin = entry.amount_cents
    
    // We'd need to join with flight_sessions to get instructor_id
    // For now, show aggregate data
    return acc
  }, {})
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Margin by Instructor (Last 30 Days)</CardTitle>
        <CardDescription>Top performing instructors by margin generated</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <p>Coming soon: Detailed instructor margin breakdown</p>
          <p className="text-sm mt-2">Requires additional data aggregation</p>
        </div>
      </CardContent>
    </Card>
  )
}

async function RecentMarginTransactions() {
  const supabase = await createClient(await cookies())
  
  const { data: recentMargins } = await supabase
    .from('ledger_entries')
    .select(`
      *,
      journals(event_type, event_id, created_at)
    `)
    .eq('ref_type', 'platform_margin')
    .order('created_at', { ascending: false })
    .limit(10)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Margin Transactions</CardTitle>
        <CardDescription>Latest 10 platform margin entries</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentMargins && recentMargins.length > 0 ? (
            recentMargins.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    Flight {entry.journals?.event_id?.substring(0, 8)}...
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(entry.created_at).toLocaleString()}
                  </div>
                  {entry.metadata && (
                    <div className="text-xs text-gray-600 mt-1">
                      Student: ${(entry.metadata.student_charge / 100).toFixed(2)} • 
                      Instructor: ${(entry.metadata.instructor_payout / 100).toFixed(2)}
                    </div>
                  )}
                </div>
                <Badge variant="default" className="ml-3">
                  +${(entry.amount_cents / 100).toFixed(2)}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No margin transactions yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function MarginAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Margin Analytics</h1>
        <p className="text-gray-600 mt-2">
          Track platform revenue and margin performance across all flights
        </p>
      </div>
      
      <Suspense fallback={<div>Loading margin overview...</div>}>
        <MarginOverview />
      </Suspense>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Suspense fallback={<div>Loading instructor data...</div>}>
          <TopInstructorsByMargin />
        </Suspense>
        
        <Suspense fallback={<div>Loading recent transactions...</div>}>
          <RecentMarginTransactions />
        </Suspense>
      </div>
    </div>
  )
}

