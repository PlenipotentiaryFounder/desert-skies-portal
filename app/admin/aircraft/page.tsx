import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AircraftList } from "@/components/admin/aircraft-list"

export default async function AircraftPage() {
  const supabase = createServerSupabaseClient()

  // Check if we have any aircraft in the database
  const { count } = await supabase.from("aircraft").select("*", { count: "exact", head: true })

  const hasAircraft = count && count > 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aircraft Management</h1>
          <p className="text-muted-foreground">Manage your flight school's aircraft fleet</p>
        </div>
        <div className="flex gap-2">
          {!hasAircraft && (
            <Button asChild variant="outline">
              <Link href="/admin/aircraft/seed">
                <Plus className="mr-2 h-4 w-4" />
                Seed Aircraft Data
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/admin/aircraft/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Aircraft
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aircraft Fleet</CardTitle>
          <CardDescription>View and manage all aircraft in your flight school</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <AircraftList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
