import { getSyllabi } from "@/lib/syllabus-service"
import { SyllabusList } from "./syllabus-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle, Database } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export default async function SyllabiPage() {
  const syllabi = await getSyllabi()
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

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
                <div className="flex items-center">
                  <Database className="mr-2 h-4 w-4" />
                  Seed Syllabi Data
                </div>
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
