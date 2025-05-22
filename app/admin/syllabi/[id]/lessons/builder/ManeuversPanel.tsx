import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ManeuversPanel({ value, onChange }: {
  value: any[],
  onChange: (v: any[]) => void
}) {
  const [allManeuvers, setAllManeuvers] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<any[]>(value || [])

  useEffect(() => {
    fetch("/api/admin/maneuvers")
      .then(r => r.json())
      .then(data => setAllManeuvers(data.maneuvers || []))
  }, [])

  function handleSelect(maneuver: any) {
    if (selected.find((m) => m.id === maneuver.id)) return
    const next = [...selected, { ...maneuver, is_required: true, default_score: 0, instructor_notes: "" }]
    setSelected(next)
    onChange(next)
  }
  function handleRemove(id: string) {
    const next = selected.filter((m) => m.id !== id)
    setSelected(next)
    onChange(next)
  }
  function handleChange(id: string, field: string, val: any) {
    const next = selected.map((m) => m.id === id ? { ...m, [field]: val } : m)
    setSelected(next)
    onChange(next)
  }
  const filtered = allManeuvers.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="space-y-6">
      <div>
        <Input
          placeholder="Search maneuvers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {filtered.map((m) => (
            <Button key={m.id} size="sm" variant="outline" onClick={() => handleSelect(m)} disabled={!!selected.find(s => s.id === m.id)}>
              {m.name}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Selected Maneuvers</h3>
        {selected.length === 0 && <div className="text-gray-400">No maneuvers selected.</div>}
        <div className="space-y-4">
          {selected.map((m) => (
            <div key={m.id} className="border rounded p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{m.name}</div>
                <Button size="icon" variant="ghost" onClick={() => handleRemove(m.id)}>
                  ✕
                </Button>
              </div>
              <div className="flex gap-4 items-center mb-2">
                <Badge variant={m.is_required ? "default" : "secondary"} onClick={() => handleChange(m.id, "is_required", !m.is_required)}>
                  {m.is_required ? "Required" : "Optional"}
                </Badge>
                <Input
                  type="number"
                  min={0}
                  max={5}
                  step={0.5}
                  className="w-24"
                  value={m.default_score}
                  onChange={e => handleChange(m.id, "default_score", e.target.value)}
                  placeholder="Score"
                />
              </div>
              <Textarea
                placeholder="Instructor notes for this maneuver"
                value={m.instructor_notes}
                onChange={e => handleChange(m.id, "instructor_notes", e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 