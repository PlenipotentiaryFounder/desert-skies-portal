"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Edit, MoreHorizontal, Plane, Trash } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"

interface Aircraft {
  id: string
  tail_number: string
  make: string
  model: string
  year: number
  category: string
  class: string
  is_complex: boolean
  is_high_performance: boolean
  is_tailwheel: boolean
  is_active: boolean
  hobbs_time: number
  last_inspection_date: string
}

export function AircraftList() {
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    async function fetchAircraft() {
      try {
        const { data, error } = await supabase.from("aircraft").select("*").order("tail_number", { ascending: true })

        if (error) {
          throw error
        }

        setAircraft(data || [])
      } catch (error) {
        console.error("Error fetching aircraft:", error)
        toast({
          title: "Error",
          description: "Failed to load aircraft data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAircraft()
  }, [supabase, toast])

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("aircraft").delete().eq("id", id)

      if (error) {
        throw error
      }

      setAircraft((prev) => prev.filter((a) => a.id !== id))

      toast({
        title: "Aircraft deleted",
        description: "The aircraft has been successfully removed.",
      })
    } catch (error) {
      console.error("Error deleting aircraft:", error)
      toast({
        title: "Error",
        description: "Failed to delete aircraft. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-[400px]">Loading aircraft data...</div>
  }

  if (aircraft.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <Plane className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Aircraft Found</h3>
        <p className="text-muted-foreground mb-4">Your flight school doesn't have any aircraft in the system yet.</p>
        <Button onClick={() => router.push("/admin/aircraft/new")}>Add Your First Aircraft</Button>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b">
        <div className="col-span-2">Tail Number</div>
        <div className="col-span-3">Aircraft</div>
        <div className="col-span-2">Category/Class</div>
        <div className="col-span-2">Hobbs Time</div>
        <div className="col-span-2">Last Inspection</div>
        <div className="col-span-1">Status</div>
      </div>

      {aircraft.map((aircraft) => (
        <div key={aircraft.id} className="grid grid-cols-12 gap-4 p-4 items-center border-b last:border-0">
          <div className="col-span-2 font-medium">{aircraft.tail_number}</div>

          <div className="col-span-3">
            <div>
              {aircraft.year} {aircraft.make} {aircraft.model}
            </div>
            <div className="flex gap-1 mt-1">
              {aircraft.is_complex && (
                <Badge variant="outline" className="text-xs">
                  Complex
                </Badge>
              )}
              {aircraft.is_high_performance && (
                <Badge variant="outline" className="text-xs">
                  High Perf
                </Badge>
              )}
              {aircraft.is_tailwheel && (
                <Badge variant="outline" className="text-xs">
                  Tailwheel
                </Badge>
              )}
            </div>
          </div>

          <div className="col-span-2 text-muted-foreground">
            {aircraft.category} / {aircraft.class}
          </div>

          <div className="col-span-2">{aircraft.hobbs_time.toFixed(1)}</div>

          <div className="col-span-2">{formatDate(aircraft.last_inspection_date)}</div>

          <div className="col-span-1 flex justify-between items-center">
            <Badge variant={aircraft.is_active ? "default" : "secondary"}>
              {aircraft.is_active ? "Active" : "Inactive"}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(`/admin/aircraft/${aircraft.id}`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => handleDelete(aircraft.id)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  )
}
