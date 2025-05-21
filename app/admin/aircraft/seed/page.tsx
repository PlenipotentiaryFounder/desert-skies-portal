"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, Plane, Plus } from "lucide-react"
import type { Database } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

const sampleAircraft = [
  {
    tail_number: "N12345",
    make: "Cessna",
    model: "172S Skyhawk",
    year: 2018,
    category: "Airplane",
    class: "Single Engine Land",
    is_complex: false,
    is_high_performance: false,
    is_tailwheel: false,
    is_active: true,
    hobbs_time: 1250.4,
    last_inspection_date: "2023-04-15",
  },
  {
    tail_number: "N54321",
    make: "Piper",
    model: "PA-28 Cherokee",
    year: 2015,
    category: "Airplane",
    class: "Single Engine Land",
    is_complex: false,
    is_high_performance: false,
    is_tailwheel: false,
    is_active: true,
    hobbs_time: 2340.8,
    last_inspection_date: "2023-05-20",
  },
  {
    tail_number: "N98765",
    make: "Diamond",
    model: "DA40 Star",
    year: 2020,
    category: "Airplane",
    class: "Single Engine Land",
    is_complex: false,
    is_high_performance: false,
    is_tailwheel: false,
    is_active: true,
    hobbs_time: 890.2,
    last_inspection_date: "2023-06-10",
  },
  {
    tail_number: "N76543",
    make: "Cirrus",
    model: "SR22",
    year: 2019,
    category: "Airplane",
    class: "Single Engine Land",
    is_complex: false,
    is_high_performance: true,
    is_tailwheel: false,
    is_active: true,
    hobbs_time: 1120.6,
    last_inspection_date: "2023-03-25",
  },
  {
    tail_number: "N24680",
    make: "Beechcraft",
    model: "Bonanza G36",
    year: 2017,
    category: "Airplane",
    class: "Single Engine Land",
    is_complex: true,
    is_high_performance: true,
    is_tailwheel: false,
    is_active: true,
    hobbs_time: 1560.3,
    last_inspection_date: "2023-02-18",
  },
  {
    tail_number: "N13579",
    make: "Piper",
    model: "PA-18 Super Cub",
    year: 1975,
    category: "Airplane",
    class: "Single Engine Land",
    is_complex: false,
    is_high_performance: false,
    is_tailwheel: true,
    is_active: true,
    hobbs_time: 5430.7,
    last_inspection_date: "2023-01-30",
  },
]

export default function SeedAircraftPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [aircraftCount, setAircraftCount] = useState(0)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient<Database>()

  const handleSeedAircraft = async () => {
    setIsSeeding(true)
    setAircraftCount(0)

    try {
      // Check if we already have aircraft in the database
      const { count } = await supabase.from("aircraft").select("*", { count: "exact", head: true })

      if (count && count > 0) {
        toast({
          title: "Aircraft already exist",
          description: `Found ${count} aircraft in the database. Skipping seed operation.`,
          variant: "default",
        })
        setIsSeeding(false)
        return
      }

      // Insert sample aircraft
      for (const aircraft of sampleAircraft) {
        const { error } = await supabase.from("aircraft").insert({
          ...aircraft,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (error) {
          console.error("Error seeding aircraft:", error)
          toast({
            title: "Error",
            description: `Failed to seed aircraft: ${error.message}`,
            variant: "destructive",
          })
          setIsSeeding(false)
          return
        }

        setAircraftCount((prev) => prev + 1)
      }

      toast({
        title: "Success",
        description: `Successfully seeded ${sampleAircraft.length} aircraft into the database.`,
        variant: "default",
      })

      setIsComplete(true)
    } catch (error) {
      console.error("Error in seed operation:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred during the seed operation.",
        variant: "destructive",
      })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-6 w-6" />
            Seed Aircraft Data
          </CardTitle>
          <CardDescription>
            Populate your database with sample aircraft for testing and development purposes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4">
              <h3 className="mb-2 font-medium">This will add the following aircraft to your database:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {sampleAircraft.map((aircraft) => (
                  <li key={aircraft.tail_number}>
                    {aircraft.tail_number} - {aircraft.year} {aircraft.make} {aircraft.model}
                  </li>
                ))}
              </ul>
            </div>

            {isSeeding && (
              <div className="flex items-center justify-center p-4 space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p>
                  Seeding aircraft data... ({aircraftCount}/{sampleAircraft.length})
                </p>
              </div>
            )}

            {isComplete && (
              <div className="rounded-md bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <p className="font-medium">Aircraft data seeded successfully!</p>
                <p className="text-sm mt-1">{aircraftCount} aircraft have been added to your database.</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/admin/aircraft")}>
            Back to Aircraft
          </Button>
          <Button onClick={handleSeedAircraft} disabled={isSeeding || isComplete}>
            {isSeeding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding...
              </>
            ) : isComplete ? (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add More Aircraft
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Seed Aircraft Data
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
