import { Suspense } from "react"
import Link from "next/link"
import { Download, FileText, Plus, Printer, ShieldCheck, Timer } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StudentDocumentsList } from "./student-documents-list"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "My Documents | Desert Skies",
  description: "Manage your documents for Desert Skies Flight School",
}

export default async function StudentDocumentsPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  // Fetch document stats for summary card
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", session.user.id)
  const totalDocs = documents?.length || 0
  const verifiedDocs = documents?.filter((d: any) => d.is_verified).length || 0
  const pendingDocs = documents?.filter((d: any) => !d.is_verified).length || 0
  const expiringDocs = documents?.filter((d: any) => d.expiration_date && new Date(d.expiration_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length || 0

  return (
    <div className="relative flex flex-col gap-6">
      {/* Glassmorphic summary card */}
      <div className="backdrop-blur-md bg-white/60 dark:bg-zinc-900/60 rounded-2xl shadow-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">My Documents</h1>
          <p className="text-muted-foreground">Manage your certificates, licenses, and other documents</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">{totalDocs}</span>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <div className="flex flex-col items-center">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <span className="text-xs text-muted-foreground">Verified: {verifiedDocs}</span>
          </div>
          <div className="flex flex-col items-center">
            <FileText className="h-5 w-5 text-yellow-600" />
            <span className="text-xs text-muted-foreground">Pending: {pendingDocs}</span>
          </div>
          <div className="flex flex-col items-center">
            <Timer className="h-5 w-5 text-red-600" />
            <span className="text-xs text-muted-foreground">Expiring: {expiringDocs}</span>
          </div>
          <Button variant="ghost" size="icon" aria-label="Export Documents">
            <Download className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Print Documents">
            <Printer className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Document List */}
      <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-xl" />}>
        <StudentDocumentsListWrapper userId={session.user.id} />
      </Suspense>

      {/* Floating Action Button for mobile */}
      <Button asChild size="icon" className="fixed bottom-6 right-6 z-50 md:hidden rounded-full shadow-2xl bg-primary text-white hover:scale-110 transition-transform" aria-label="Upload Document">
        <Link href="/student/documents/upload">
          <Plus className="h-6 w-6" />
        </Link>
      </Button>
    </div>
  )
}

async function StudentDocumentsListWrapper({ userId }: { userId: string }) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  return <StudentDocumentsList documents={documents || []} />
}
