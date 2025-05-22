import { Button } from "@/components/ui/button"

export function Sidebar({ panels, selected, onSelect }: { panels: string[], selected: string, onSelect: (p: string) => void }) {
  return (
    <aside className="w-64 bg-muted/50 border-r flex flex-col py-8 px-4">
      <div className="font-bold text-lg mb-6">Lesson Builder</div>
      <nav className="flex flex-col gap-2">
        {panels.map((p) => (
          <Button
            key={p}
            variant={selected === p ? "default" : "ghost"}
            className="justify-start"
            onClick={() => onSelect(p)}
          >
            {p}
          </Button>
        ))}
      </nav>
    </aside>
  )
} 