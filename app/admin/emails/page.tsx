'use client'
import { useState } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import WelcomeStudentEmailPreview from "@/app/emails/preview/WelcomeStudentEmail"
import InstructorEnrollmentConfirmationEmailPreview from "@/app/emails/preview/InstructorEnrollmentConfirmationEmail"

const EMAIL_TEMPLATES = [
  { label: "Welcome Student Email", value: "welcome-student", component: WelcomeStudentEmailPreview },
  { label: "Instructor Enrollment Confirmation", value: "instructor-enrollment", component: InstructorEnrollmentConfirmationEmailPreview },
  // Add more templates here as you create them
]

export default function AdminEmailPreviewPage() {
  const [selected, setSelected] = useState("welcome-student")
  const SelectedComponent = EMAIL_TEMPLATES.find(t => t.value === selected)?.component || (() => null)

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Image src="/BrandAssets/DesertSkies_Logo.png" alt="Desert Skies Logo" width={60} height={60} />
        <h1 className="text-3xl font-bold">Email Template Preview</h1>
      </div>
      <div className="mb-6">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger>
            <SelectValue placeholder="Select an email template" />
          </SelectTrigger>
          <SelectContent>
            {EMAIL_TEMPLATES.map((template) => (
              <SelectItem key={template.value} value={template.value}>{template.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Card className="p-8 bg-white border shadow-md">
        <SelectedComponent />
      </Card>
    </div>
  )
} 