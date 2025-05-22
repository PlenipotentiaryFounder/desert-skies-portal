import { Sidebar } from "./Sidebar"
import { useState } from "react"
import LessonInfoPanel from "./LessonInfoPanel"
import ManeuversPanel from "./ManeuversPanel"

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
  const [lessonInfo, setLessonInfo] = useState({})
  const [maneuvers, setManeuvers] = useState([])
  return (
    <div className="flex h-screen">
      <Sidebar panels={PANELS} selected={panel} onSelect={setPanel} />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">Ultimate Lesson Builder</h1>
        <div className="bg-white rounded shadow p-6 min-h-[400px]">
          <h2 className="text-xl font-semibold mb-2">{panel}</h2>
          {panel === "Lesson Info" ? (
            <>
              <LessonInfoPanel value={lessonInfo} onChange={setLessonInfo} />
              <div className="mt-6 flex justify-end">
                <button className="btn btn-primary">Save Lesson Info</button>
              </div>
            </>
          ) : panel === "Maneuvers" ? (
            <>
              <ManeuversPanel value={maneuvers} onChange={setManeuvers} />
              <div className="mt-6 flex justify-end">
                <button className="btn btn-primary">Save Maneuvers</button>
              </div>
            </>
          ) : (
            <div className="text-gray-500">Panel content for {panel} goes here.</div>
          )}
        </div>
      </main>
    </div>
  )
} 