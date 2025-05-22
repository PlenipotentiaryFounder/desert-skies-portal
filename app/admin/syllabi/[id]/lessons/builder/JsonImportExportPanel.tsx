import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"

export default function JsonImportExportPanel({
  lessonInfo,
  maneuvers,
  coreTopics,
  resources,
  whatToBring,
  feedback_fields,
  feedback_instructions,
  onImport
}: {
  lessonInfo: any,
  maneuvers: any[],
  coreTopics: any[],
  resources: any[],
  whatToBring: any[],
  feedback_fields?: string,
  feedback_instructions?: string,
  onImport: (data: any) => void
}) {
  const [importValue, setImportValue] = useState("")
  const [error, setError] = useState("")
  const [exported, setExported] = useState(false)

  function handleExport() {
    const data = {
      lessonInfo,
      maneuvers,
      coreTopics,
      resources,
      whatToBring,
      feedback_fields,
      feedback_instructions
    }
    setImportValue(JSON.stringify(data, null, 2))
    setExported(true)
    setError("")
  }

  function handleImport() {
    try {
      const data = JSON.parse(importValue)
      onImport(data)
      setError("")
    } catch (e) {
      setError("Invalid JSON format.")
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex gap-2">
        <Button onClick={handleExport}>Export as JSON</Button>
        <Button variant="secondary" onClick={handleImport}>Import JSON</Button>
      </div>
      <Textarea
        className="w-full min-h-[200px] font-mono"
        value={importValue}
        onChange={e => { setImportValue(e.target.value); setExported(false); }}
        placeholder="Paste lesson JSON here to import, or click Export to get current lesson as JSON."
      />
      {error && <div className="text-red-500">{error}</div>}
      {exported && <div className="text-green-600">Exported current lesson as JSON!</div>}
    </Card>
  )
} 