"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3, Book, Calendar, FileText, Plane, Users, Home, UserCheck, BookOpen, GraduationCap, ClipboardCheck, User, Settings
} from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const iconMap = {
  barChart3: BarChart3,
  book: Book,
  calendar: Calendar,
  fileText: FileText,
  plane: Plane,
  users: Users,
  home: Home,
  userCheck: UserCheck,
  bookOpen: BookOpen,
  graduationCap: GraduationCap,
  clipboardCheck: ClipboardCheck,
  user: User,
  settings: Settings,
}

interface DashboardNavProps {
  items: {
    title: string
    href: string
    icon: string
  }[]
}

export function DashboardNav({ items }: DashboardNavProps) {
  const pathname = usePathname()
  return (
    <nav className="grid items-start gap-2">
      {items.map((item) => {
        const Icon = iconMap[item.icon]
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: active ? "default" : "ghost", size: "sm" }),
              active ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "",
              "justify-start",
            )}
          >
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
