import { getSyllabi } from "@/lib/syllabus-service"
import { SyllabusList } from "./syllabus-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle, Database } from "lucide-react"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export default async function SyllabiPage() {
  const syllabi = await getSyllabi()
  const supabase = createServerSupabaseClient()

  // Check if we have any syllabi in the database
  const { count } = await supabase.from("syllabi").select("*", { count: "exact", head: true })
  const hasSyllabi = count && count > 0

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Training Syllabi</h1>
        <div className="flex gap-2">
          {!hasSyllabi && (
            <Button variant="outline" asChild>
              <Link href="/admin/syllabi/seed">
                <Database className="mr-2 h-4 w-4" />
                Seed Syllabi Data
              </Link>
            </Button>
          )}
          <Link href="/admin/syllabi/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Syllabus
            </Button>
          </Link>
        </div>
      </div>

      <SyllabusList syllabi={syllabi} />
    </div>
  )
}
