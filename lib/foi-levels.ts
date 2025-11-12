/**
 * FAA Fundamentals of Instruction (FOI) Levels of Learning
 * Based on FAA-H-8083-9B Aviation Instructor's Handbook
 * 
 * These levels can be used in both client and server components
 */

export const FOI_PROFICIENCY_LEVELS = {
  1: {
    level: 1,
    name: "Rote",
    description: "Student can repeat back information but may not understand it",
    shortDesc: "Memorization only",
    color: "red",
    icon: "📝"
  },
  2: {
    level: 2,
    name: "Understanding",
    description: "Student understands the principles and can explain them",
    shortDesc: "Comprehension achieved",
    color: "orange", 
    icon: "💡"
  },
  3: {
    level: 3,
    name: "Application",
    description: "Student can perform the skill with instructor guidance",
    shortDesc: "Can do with guidance",
    color: "yellow",
    icon: "✈️"
  },
  4: {
    level: 4,
    name: "Correlation",
    description: "Student can perform independently and relate to other concepts",
    shortDesc: "Mastery & correlation",
    color: "green",
    icon: "🎯"
  }
} as const

export type FOIProficiencyLevel = 1 | 2 | 3 | 4

export type FOILevelInfo = typeof FOI_PROFICIENCY_LEVELS[FOIProficiencyLevel]



