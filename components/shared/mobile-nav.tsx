"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Home, Users, UserCheck, BookOpen, GraduationCap, Plane, Calendar, FileText, ClipboardCheck, User, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface MobileNavProps {
  navItems: {
    title: string
    href: string
    icon: string
  }[]
  userRole: "admin" | "instructor" | "student"
}

const iconMap = {
  home: Home,
  users: Users,
  userCheck: UserCheck,
  bookOpen: BookOpen,
  graduationCap: GraduationCap,
  plane: Plane,
  calendar: Calendar,
  fileText: FileText,
  clipboardCheck: ClipboardCheck,
  user: User,
  settings: Settings,
}

export function MobileNav({ navItems, userRole }: MobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <div className="px-7">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M12 19l9 2-9-18-9 18 9-2z" />
            </svg>
            <span className="font-bold">Desert Skies Aviation</span>
          </Link>
        </div>
        <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="flex flex-col space-y-3">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon]
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href || pathname.startsWith(`${item.href}/`)
                      ? "bg-accent text-accent-foreground"
                      : "transparent",
                  )}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
