import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ResourcesPanel({ value, onChange }: {
  value: any[],
  onChange: (v: any[]) => void
}) {
  const [allResources, setAllResources] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<any[]>(value || [])

  useEffect(() => {
    fetch("/api/admin/resources")
      .then(r => r.json())
      .then(data => setAllResources(data.resources || []))
  }, [])

  function handleSelect(resource: any) {
    if (selected.find((r) => r.id === resource.id)) return
    const next = [...selected, { ...resource, annotation: "" }]
    setSelected(next)
    onChange(next)
  }
  function handleRemove(id: string) {
    const next = selected.filter((r) => r.id !== id)
    setSelected(next)
    onChange(next)
  }
  function handleChange(id: string, val: string) {
    const next = selected.map((r) => r.id === id ? { ...r, annotation: val } : r)
    setSelected(next)
    onChange(next)
  }
  const filtered = allResources.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="space-y-6">
      <div>
        <Input
          placeholder="Search resources..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {filtered.map((r) => (
            <Button key={r.id} size="sm" variant="outline" onClick={() => handleSelect(r)} disabled={!!selected.find(s => s.id === r.id)}>
              {r.name}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Selected Resources</h3>
        {selected.length === 0 && <div className="text-gray-400">No resources selected.</div>}
        <div className="space-y-4">
          {selected.map((r) => (
            <div key={r.id} className="border rounded p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{r.name}</div>
                <Button size="icon" variant="ghost" onClick={() => handleRemove(r.id)}>
                  ✕
                </Button>
              </div>
              <Textarea
                placeholder="Annotation or notes for this resource (optional)"
                value={r.annotation}
                onChange={e => handleChange(r.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 