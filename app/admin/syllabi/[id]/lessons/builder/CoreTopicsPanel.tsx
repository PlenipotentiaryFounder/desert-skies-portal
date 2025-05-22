import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function CoreTopicsPanel({ value, onChange }: {
  value: any[],
  onChange: (v: any[]) => void
}) {
  const [allTopics, setAllTopics] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<any[]>(value || [])

  useEffect(() => {
    fetch("/api/admin/core-topics")
      .then(r => r.json())
      .then(data => setAllTopics(data.core_topics || []))
  }, [])

  function handleSelect(topic: any) {
    if (selected.find((t) => t.id === topic.id)) return
    const next = [...selected, { ...topic, annotation: "" }]
    setSelected(next)
    onChange(next)
  }
  function handleRemove(id: string) {
    const next = selected.filter((t) => t.id !== id)
    setSelected(next)
    onChange(next)
  }
  function handleChange(id: string, val: string) {
    const next = selected.map((t) => t.id === id ? { ...t, annotation: val } : t)
    setSelected(next)
    onChange(next)
  }
  const filtered = allTopics.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="space-y-6">
      <div>
        <Input
          placeholder="Search core topics..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {filtered.map((t) => (
            <Button key={t.id} size="sm" variant="outline" onClick={() => handleSelect(t)} disabled={!!selected.find(s => s.id === t.id)}>
              {t.name}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Selected Core Topics</h3>
        {selected.length === 0 && <div className="text-gray-400">No core topics selected.</div>}
        <div className="space-y-4">
          {selected.map((t) => (
            <div key={t.id} className="border rounded p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{t.name}</div>
                <Button size="icon" variant="ghost" onClick={() => handleRemove(t.id)}>
                  ✕
                </Button>
              </div>
              <Textarea
                placeholder="Annotation or notes for this topic (optional)"
                value={t.annotation}
                onChange={e => handleChange(t.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 