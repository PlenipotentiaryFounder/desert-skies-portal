import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

export function formatTime(time: string) {
  const [hours, minutes] = time.split(":")
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`
}

export function calculateDuration(startTime: string, endTime: string) {
  const [startHours, startMinutes] = startTime.split(":").map(Number)
  const [endHours, endMinutes] = endTime.split(":").map(Number)

  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes

  const durationMinutes = endTotalMinutes - startTotalMinutes

  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60

  return `${hours}h ${minutes}m`
}

export function getScoreLabel(score: number) {
  if (score >= 4) return { label: "Excellent", color: "text-green-500" }
  if (score >= 3) return { label: "Proficient", color: "text-emerald-500" }
  if (score >= 2) return { label: "Developing", color: "text-amber-500" }
  return { label: "Unsatisfactory", color: "text-red-500" }
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}
