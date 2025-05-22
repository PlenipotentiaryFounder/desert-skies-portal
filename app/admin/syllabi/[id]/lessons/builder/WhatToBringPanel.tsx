import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function WhatToBringPanel({ value, onChange }: {
  value: any[],
  onChange: (v: any[]) => void
}) {
  const [allItems, setAllItems] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<any[]>(value || [])

  useEffect(() => {
    fetch("/api/admin/what-to-bring")
      .then(r => r.json())
      .then(data => setAllItems(data.what_to_bring || []))
  }, [])

  function handleSelect(item: any) {
    if (selected.find((i) => i.id === item.id)) return
    const next = [...selected, { ...item, annotation: "" }]
    setSelected(next)
    onChange(next)
  }
  function handleRemove(id: string) {
    const next = selected.filter((i) => i.id !== id)
    setSelected(next)
    onChange(next)
  }
  function handleChange(id: string, val: string) {
    const next = selected.map((i) => i.id === id ? { ...i, annotation: val } : i)
    setSelected(next)
    onChange(next)
  }
  const filtered = allItems.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="space-y-6">
      <div>
        <Input
          placeholder="Search what to bring..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {filtered.map((i) => (
            <Button key={i.id} size="sm" variant="outline" onClick={() => handleSelect(i)} disabled={!!selected.find(s => s.id === i.id)}>
              {i.name}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Selected Items</h3>
        {selected.length === 0 && <div className="text-gray-400">No items selected.</div>}
        <div className="space-y-4">
          {selected.map((i) => (
            <div key={i.id} className="border rounded p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{i.name}</div>
                <Button size="icon" variant="ghost" onClick={() => handleRemove(i.id)}>
                  ✕
                </Button>
              </div>
              <Textarea
                placeholder="Annotation or notes for this item (optional)"
                value={i.annotation}
                onChange={e => handleChange(i.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 