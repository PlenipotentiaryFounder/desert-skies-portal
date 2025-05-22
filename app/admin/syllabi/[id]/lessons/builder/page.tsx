import { Sidebar } from "./Sidebar"
import { useState } from "react"

const PANELS = [
  "Lesson Info",
  "Maneuvers",
  "Core Topics",
  "Resources",
  "What to Bring",
  "Preview/Email",
  "JSON Import/Export",
]

export default function LessonBuilderWorkstation() {
  const [panel, setPanel] = useState(PANELS[0])
  return (
    <div className="flex h-screen">
      <Sidebar panels={PANELS} selected={panel} onSelect={setPanel} />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">Ultimate Lesson Builder</h1>
        <div className="bg-white rounded shadow p-6 min-h-[400px]">
          <h2 className="text-xl font-semibold mb-2">{panel}</h2>
          <div className="text-gray-500">Panel content for {panel} goes here.</div>
        </div>
      </main>
    </div>
  )
} 