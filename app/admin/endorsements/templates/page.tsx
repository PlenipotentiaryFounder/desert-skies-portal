"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ExternalLink } from "lucide-react"

export default function EndorsementTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<any | null>(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true)
      const supabase = createClient()
      let query = supabase.from("endorsement_templates").select("*")
      if (category) query = query.eq("category", category)
      const { data } = await query
      setTemplates(data || [])
      setLoading(false)
    }
    fetchTemplates()
  }, [category])

  const filtered = templates.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Input placeholder="Search by code or title..." value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
        <Input placeholder="Filter by category..." value={category} onChange={e => setCategory(e.target.value)} className="w-48" />
        <Button variant="primary">+ New Template</Button>
      </div>
      {loading ? <div>Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(t => (
            <Card key={t.id}>
              <CardHeader>
                <CardTitle>{t.code} - {t.title}</CardTitle>
                <CardDescription>{t.explanation}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-2">
                  {t.category && <Badge>{t.category}</Badge>}
                  {t.tags && t.tags.map((tag: string) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
                <Button variant="outline" size="sm" onClick={() => setPreview(t)}>Preview</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-xl">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle>{preview.code} - {preview.title}</DialogTitle>
                <DialogDescription>{preview.explanation}</DialogDescription>
              </DialogHeader>
              <div className="whitespace-pre-line font-mono bg-muted p-4 rounded mb-4 text-sm">
                {preview.template_text}
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {preview.category && <Badge>{preview.category}</Badge>}
                {preview.tags && preview.tags.map((tag: string) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
              {preview.faa_reference && (
                <div className="mb-2 text-xs">
                  <span className="font-semibold">FAA Ref:</span> {preview.faa_reference}
                </div>
              )}
              {preview.ecfr_link && (
                <a href={preview.ecfr_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  View ECFR <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <DialogFooter>
                <Button variant="secondary" onClick={() => setPreview(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 