import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip } from "@/components/ui/tooltip"
import { UserPlus, CalendarPlus, Upload, BarChart2 } from "lucide-react"

const quickLinks = [
  {
    href: "/instructor/students/new",
    icon: <UserPlus className="h-6 w-6 text-primary" />,
    label: "Enroll Student",
    desc: "Add a new student to your roster."
  },
  {
    href: "/instructor/schedule/new",
    icon: <CalendarPlus className="h-6 w-6 text-primary" />,
    label: "Schedule Session",
    desc: "Book a new flight or ground session."
  },
  {
    href: "/instructor/documents/upload",
    icon: <Upload className="h-6 w-6 text-primary" />,
    label: "Upload Document",
    desc: "Add a document for a student or yourself."
  },
  {
    href: "/instructor/reports",
    icon: <BarChart2 className="h-6 w-6 text-primary" />,
    label: "View Reports",
    desc: "See analytics and student progress."
  }
]

export function InstructorQuickLinks() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {quickLinks.map(link => (
        <Card key={link.href} className="hover:shadow-lg transition-shadow group">
          <Link href={link.href} tabIndex={0} aria-label={link.label} className="block focus:outline-none focus:ring-2 focus:ring-primary/50 rounded">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="mb-2">{link.icon}</div>
              <div className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">{link.label}</div>
              <div className="text-xs text-muted-foreground text-center">{link.desc}</div>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  )
} 