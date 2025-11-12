"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface PreBriefChecklistProps {
  items: string[]
  missionId: string
}

export function PreBriefChecklist({ items }: PreBriefChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(index)) {
      newChecked.delete(index)
    } else {
      newChecked.add(index)
    }
    setCheckedItems(newChecked)
  }

  const completedCount = checkedItems.size
  const totalCount = items.length
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Progress: {completedCount} of {totalCount}
        </span>
        <Badge variant={percentComplete === 100 ? "default" : "secondary"}>
          {percentComplete}%
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {items.map((item, index) => {
          const isChecked = checkedItems.has(index)
          return (
            <div 
              key={index}
              className={`flex items-start gap-3 p-3 border rounded transition-colors ${
                isChecked ? 'bg-muted/50' : 'bg-background'
              }`}
            >
              <Checkbox
                id={`checklist-${index}`}
                checked={isChecked}
                onCheckedChange={() => toggleItem(index)}
                className="mt-0.5"
              />
              <label
                htmlFor={`checklist-${index}`}
                className={`flex-1 text-sm leading-relaxed cursor-pointer ${
                  isChecked ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {item}
              </label>
            </div>
          )
        })}
      </div>

      {percentComplete === 100 && (
        <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded text-sm text-green-800 dark:text-green-400">
          ✓ All items completed!
        </div>
      )}
    </div>
  )
}

