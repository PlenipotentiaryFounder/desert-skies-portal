"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"
import type { Database } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

// Sample maneuvers data
const sampleManeuvers = [
  // Preflight Procedures
  {
    name: "Preflight Inspection",
    description: "Complete aircraft preflight inspection including checklist procedures",
    faa_reference: "FAA-H-8083-3B Ch.2",
    category: "preflight procedures",
  },
  {
    name: "Cockpit Management",
    description: "Proper arrangement and securing of materials and equipment in the cockpit",
    faa_reference: "FAA-H-8083-3B Ch.2",
    category: "preflight procedures",
  },
  {
    name: "Engine Starting",
    description: "Proper engine starting procedures including appropriate checklist items",
    faa_reference: "FAA-H-8083-3B Ch.2",
    category: "preflight procedures",
  },
  {
    name: "Taxiing",
    description: "Safe aircraft taxiing in various wind conditions",
    faa_reference: "FAA-H-8083-3B Ch.2",
    category: "preflight procedures",
  },
  {
    name: "Before Takeoff Check",
    description: "Completion of appropriate checklist items before takeoff",
    faa_reference: "FAA-H-8083-3B Ch.2",
    category: "preflight procedures",
  },

  // Airport Operations
  {
    name: "Radio Communications",
    description: "Proper radio communications procedures and ATC instructions",
    faa_reference: "FAA-H-8083-25B Ch.4",
    category: "airport operations",
  },
  {
    name: "Traffic Pattern Operations",
    description: "Proper entry and exit from traffic patterns",
    faa_reference: "FAA-H-8083-3B Ch.7",
    category: "airport operations",
  },
  {
    name: "Airport Runway Markings and Lighting",
    description: "Knowledge and identification of airport markings and lighting",
    faa_reference: "FAA-H-8083-25B Ch.2",
    category: "airport operations",
  },

  // Takeoffs, Landings, and Go-Arounds
  {
    name: "Normal Takeoff and Climb",
    description: "Proper takeoff procedures and initial climb",
    faa_reference: "FAA-H-8083-3B Ch.5",
    category: "takeoffs and landings",
  },
  {
    name: "Normal Approach and Landing",
    description: "Proper approach and landing procedures",
    faa_reference: "FAA-H-8083-3B Ch.8",
    category: "takeoffs and landings",
  },
  {
    name: "Soft-Field Takeoff and Climb",
    description: "Proper soft-field takeoff and climb procedures",
    faa_reference: "FAA-H-8083-3B Ch.5",
    category: "takeoffs and landings",
  },
  {
    name: "Soft-Field Approach and Landing",
    description: "Proper soft-field approach and landing procedures",
    faa_reference: "FAA-H-8083-3B Ch.8",
    category: "takeoffs and landings",
  },
  {
    name: "Short-Field Takeoff and Climb",
    description: "Proper short-field takeoff and maximum performance climb",
    faa_reference: "FAA-H-8083-3B Ch.5",
    category: "takeoffs and landings",
  },
  {
    name: "Short-Field Approach and Landing",
    description: "Proper short-field approach and landing procedures",
    faa_reference: "FAA-H-8083-3B Ch.8",
    category: "takeoffs and landings",
  },
  {
    name: "Forward Slip to Landing",
    description: "Proper forward slip to landing procedures",
    faa_reference: "FAA-H-8083-3B Ch.8",
    category: "takeoffs and landings",
  },
  {
    name: "Go-Around/Rejected Landing",
    description: "Proper go-around procedures from various approach phases",
    faa_reference: "FAA-H-8083-3B Ch.8",
    category: "takeoffs and landings",
  },

  // Performance Maneuvers
  {
    name: "Steep Turns",
    description: "Coordinated steep turns with 45° bank angle",
    faa_reference: "FAA-H-8083-3B Ch.9",
    category: "performance maneuvers",
  },

  // Ground Reference Maneuvers
  {
    name: "Rectangular Course",
    description: "Proper planning and execution of rectangular course ground reference maneuver",
    faa_reference: "FAA-H-8083-3B Ch.6",
    category: "ground reference maneuvers",
  },
  {
    name: "S-Turns",
    description: "Proper planning and execution of S-turns across a road",
    faa_reference: "FAA-H-8083-3B Ch.6",
    category: "ground reference maneuvers",
  },
  {
    name: "Turns Around a Point",
    description: "Proper planning and execution of turns around a point",
    faa_reference: "FAA-H-8083-3B Ch.6",
    category: "ground reference maneuvers",
  },

  // Navigation
  {
    name: "Pilotage and Dead Reckoning",
    description: "Navigation by reference to landmarks and computed headings",
    faa_reference: "FAA-H-8083-25B Ch.16",
    category: "navigation",
  },
  {
    name: "Navigation Systems and Radar Services",
    description: "Use of navigation systems and ATC radar services",
    faa_reference: "FAA-H-8083-25B Ch.16",
    category: "navigation",
  },
  {
    name: "Diversion",
    description: "Planning and execution of diversion to alternate airport",
    faa_reference: "FAA-H-8083-25B Ch.16",
    category: "navigation",
  },
  {
    name: "Lost Procedures",
    description: "Proper procedures when uncertain of position",
    faa_reference: "FAA-H-8083-25B Ch.16",
    category: "navigation",
  },

  // Slow Flight and Stalls
  {
    name: "Maneuvering During Slow Flight",
    description: "Flight at approach speeds in various configurations",
    faa_reference: "FAA-H-8083-3B Ch.4",
    category: "slow flight and stalls",
  },
  {
    name: "Power-Off Stalls",
    description: "Proper recognition and recovery from power-off stalls",
    faa_reference: "FAA-H-8083-3B Ch.4",
    category: "slow flight and stalls",
  },
  {
    name: "Power-On Stalls",
    description: "Proper recognition and recovery from power-on stalls",
    faa_reference: "FAA-H-8083-3B Ch.4",
    category: "slow flight and stalls",
  },
  {
    name: "Spin Awareness",
    description: "Knowledge of spin entry, recognition, and recovery techniques",
    faa_reference: "FAA-H-8083-3B Ch.4",
    category: "slow flight and stalls",
  },

  // Basic Instrument Maneuvers
  {
    name: "Straight-and-Level Flight",
    description: "Maintaining straight-and-level flight solely by reference to instruments",
    faa_reference: "FAA-H-8083-15B Ch.6",
    category: "basic instrument maneuvers",
  },
  {
    name: "Constant Airspeed Climbs",
    description: "Performing constant airspeed climbs solely by reference to instruments",
    faa_reference: "FAA-H-8083-15B Ch.6",
    category: "basic instrument maneuvers",
  },
  {
    name: "Constant Airspeed Descents",
    description: "Performing constant airspeed descents solely by reference to instruments",
    faa_reference: "FAA-H-8083-15B Ch.6",
    category: "basic instrument maneuvers",
  },
  {
    name: "Turns to Headings",
    description: "Performing turns to headings solely by reference to instruments",
    faa_reference: "FAA-H-8083-15B Ch.6",
    category: "basic instrument maneuvers",
  },
  {
    name: "Recovery from Unusual Flight Attitudes",
    description: "Proper recovery from unusual flight attitudes solely by reference to instruments",
    faa_reference: "FAA-H-8083-15B Ch.6",
    category: "basic instrument maneuvers",
  },

  // Emergency Operations
  {
    name: "Emergency Approach and Landing",
    description: "Proper procedures for simulated engine failure and emergency landing",
    faa_reference: "FAA-H-8083-3B Ch.16",
    category: "emergency operations",
  },
  {
    name: "Systems and Equipment Malfunctions",
    description: "Recognition and proper procedures for various systems and equipment malfunctions",
    faa_reference: "FAA-H-8083-3B Ch.16",
    category: "emergency operations",
  },
  {
    name: "Emergency Equipment and Survival Gear",
    description: "Knowledge of emergency equipment operation and survival gear",
    faa_reference: "FAA-H-8083-3B Ch.16",
    category: "emergency operations",
  },

  // Night Operations
  {
    name: "Night Preparation",
    description: "Proper preparation for night flight",
    faa_reference: "FAA-H-8083-3B Ch.17",
    category: "night operations",
  },
  {
    name: "Night Flight",
    description: "Proper control during night flight",
    faa_reference: "FAA-H-8083-3B Ch.17",
    category: "night operations",
  },

  // Postflight Procedures
  {
    name: "After Landing, Parking and Securing",
    description: "Proper after landing, parking, and securing procedures",
    faa_reference: "FAA-H-8083-3B Ch.2",
    category: "postflight procedures",
  },
]

export default function SeedManeuversPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [progress, setProgress] = useState(0)
  const router = useRouter()

  const handleSeedManeuvers = async () => {
    setIsSeeding(true)
    setProgress(0)

    try {
      // Check if maneuvers already exist
      const { count } = await supabase.from("maneuvers").select("*", { count: "exact", head: true })

      if (count && count > 0) {
        toast({
          title: "Maneuvers already exist",
          description: `Found ${count} existing maneuvers. Skipping seeding to prevent duplicates.`,
        })
        setIsSeeding(false)
        return
      }

      // Insert maneuvers in batches
      const batchSize = 5
      const totalManeuvers = sampleManeuvers.length

      for (let i = 0; i < totalManeuvers; i += batchSize) {
        const batch = sampleManeuvers.slice(i, i + batchSize)

        const { error } = await supabase.from("maneuvers").insert(batch)

        if (error) {
          throw new Error(`Error inserting maneuvers: ${error.message}`)
        }

        // Update progress
        const newProgress = Math.min(Math.round(((i + batch.length) / totalManeuvers) * 100), 100)
        setProgress(newProgress)

        // Small delay to prevent rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      setIsComplete(true)
      toast({
        title: "Maneuvers seeded successfully",
        description: `${totalManeuvers} maneuvers have been added to the database.`,
      })
    } catch (error) {
      console.error("Error seeding maneuvers:", error)
      toast({
        title: "Error",
        description: "Failed to seed maneuvers. See console for details.",
        variant: "destructive",
      })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Seed Maneuvers Data</h1>
        <p className="text-muted-foreground">Populate the database with sample flight maneuvers</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flight Maneuvers</CardTitle>
          <CardDescription>
            This will add {sampleManeuvers.length} standard flight maneuvers to the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-2">
              {Object.entries(
                sampleManeuvers.reduce(
                  (acc, maneuver) => {
                    if (!acc[maneuver.category]) {
                      acc[maneuver.category] = 0
                    }
                    acc[maneuver.category]++
                    return acc
                  },
                  {} as Record<string, number>,
                ),
              ).map(([category, count]) => (
                <div key={category} className="flex justify-between rounded-lg border p-3">
                  <div className="font-medium capitalize">{category}</div>
                  <div className="text-muted-foreground">{count} maneuvers</div>
                </div>
              ))}
            </div>

            {isSeeding && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Seeding maneuvers...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {isComplete && (
              <div className="flex items-center justify-center rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
                <CheckCircle2 className="mr-2 h-5 w-5" />
                <span>All maneuvers have been successfully added to the database!</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/admin/maneuvers")}>
            Back to Maneuvers
          </Button>
          <Button onClick={handleSeedManeuvers} disabled={isSeeding || isComplete}>
            {isSeeding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding Maneuvers...
              </>
            ) : isComplete ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Completed
              </>
            ) : (
              "Seed Maneuvers Data"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
