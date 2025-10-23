import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Plus, DollarSign, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

async function InstructorRatesList() {
  const supabase = await createClient(await cookies())
  
  const { data: rates } = await supabase
    .from('instructor_payout_rates')
    .select(`
      *,
      profiles!instructor_id(id, first_name, last_name, email)
    `)
    .eq('is_active', true)
    .order('effective_date', { ascending: false })
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Active Instructor Payout Rates</CardTitle>
            <CardDescription>Current compensation rates for all instructors</CardDescription>
          </div>
          <Link href="/admin/billing/instructor-rates/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Rate
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {rates && rates.length > 0 ? (
          <div className="space-y-4">
            {rates.map((rate: any) => {
              const instructor = rate.profiles
              const flightRate = rate.flight_instruction_payout_cents / 100
              const groundRate = rate.ground_instruction_payout_cents / 100
              
              return (
                <div key={rate.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">
                          {instructor?.first_name} {instructor?.last_name}
                        </h3>
                        <Badge variant="default">Active</Badge>
                        {rate.instant_payout_enabled && (
                          <Badge variant="secondary">Instant Payout</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{instructor?.email}</p>
                      
                      <div className="mt-3 grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">Flight Instruction</div>
                          <div className="text-lg font-semibold text-green-600">
                            ${flightRate.toFixed(2)}/hr
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Ground Instruction</div>
                          <div className="text-lg font-semibold text-blue-600">
                            ${groundRate.toFixed(2)}/hr
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Payout Model</div>
                          <div className="text-sm font-medium capitalize">
                            {rate.payout_model}
                          </div>
                        </div>
                      </div>
                      
                      {rate.instant_payout_fee_covered_by_dsa && (
                        <div className="mt-2 text-xs text-gray-500">
                          ⚡ Instant payout fees covered by DSA
                        </div>
                      )}
                      
                      <div className="mt-2 text-xs text-gray-400">
                        Effective: {new Date(rate.effective_date).toLocaleDateString()}
                      </div>
                      
                      {rate.notes && (
                        <div className="mt-2 text-sm text-gray-600 italic">
                          {rate.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Link href={`/admin/billing/instructor-rates/${rate.id}/edit`}>
                        <Button variant="outline" size="sm">Edit</Button>
                      </Link>
                      <Link href={`/admin/billing/instructor-rates/${rate.id}/history`}>
                        <Button variant="ghost" size="sm">History</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No instructor payout rates configured</p>
            <p className="text-sm mt-1">Add rates to start tracking instructor compensation</p>
            <Link href="/admin/billing/instructor-rates/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add First Rate
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

async function RateStatistics() {
  const supabase = await createClient(await cookies())
  
  const { data: rates } = await supabase
    .from('instructor_payout_rates')
    .select('flight_instruction_payout_cents, ground_instruction_payout_cents')
    .eq('is_active', true)
  
  if (!rates || rates.length === 0) {
    return null
  }
  
  const avgFlightRate = rates.reduce((sum, r) => sum + r.flight_instruction_payout_cents, 0) / rates.length / 100
  const avgGroundRate = rates.reduce((sum, r) => sum + r.ground_instruction_payout_cents, 0) / rates.length / 100
  const maxFlightRate = Math.max(...rates.map(r => r.flight_instruction_payout_cents)) / 100
  const minFlightRate = Math.min(...rates.map(r => r.flight_instruction_payout_cents)) / 100
  
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Flight Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${avgFlightRate.toFixed(2)}/hr</div>
          <p className="text-xs text-muted-foreground mt-1">
            Across all instructors
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Ground Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${avgGroundRate.toFixed(2)}/hr</div>
          <p className="text-xs text-muted-foreground mt-1">
            Across all instructors
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Flight Rate Range</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${minFlightRate.toFixed(2)} - ${maxFlightRate.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Min to max rates
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function InstructorRatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Instructor Payout Rates</h1>
        <p className="text-gray-600 mt-2">
          Manage instructor compensation rates separate from student billing rates
        </p>
      </div>
      
      <Suspense fallback={<div>Loading statistics...</div>}>
        <RateStatistics />
      </Suspense>
      
      <Suspense fallback={<div>Loading instructor rates...</div>}>
        <InstructorRatesList />
      </Suspense>
      
      <Card>
        <CardHeader>
          <CardTitle>About Instructor Payout Rates</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <strong>Separate from Student Rates:</strong> Instructor payout rates are independent from 
              what students are charged, allowing for flexible margin management.
            </li>
            <li>
              <strong>Instant Payouts:</strong> Enable instant payouts for instructors to receive funds 
              immediately after flight completion (subject to 1% Stripe fee).
            </li>
            <li>
              <strong>Rate History:</strong> All rate changes are tracked with audit logs for compliance 
              and transparency.
            </li>
            <li>
              <strong>Effective Dating:</strong> Future-date rate changes to ensure smooth transitions 
              and proper billing calculations.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

