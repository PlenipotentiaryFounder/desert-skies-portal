/**
 * Mission Time Blocks Utility
 * 
 * Calculates and formats mission time blocks for different mission types:
 * - Flight (F): 30min pre-flight + 30min pre-brief + flight + 30min post-brief
 * - Ground (G): 30min pre-brief + ground + 30min post-brief
 * - Simulator (S): 30min pre-brief + sim + 30min post-brief
 */

export interface MissionTimeBlock {
  label: string
  startTime: string // "07:00"
  endTime: string   // "07:30"
  durationMinutes: number
  icon: string
  participants: ('student' | 'instructor')[]
  description?: string
}

export interface MissionTimeBreakdown {
  blocks: MissionTimeBlock[]
  totalStudentTime: number  // minutes
  totalInstructorTime: number  // minutes
  studentStartTime: string
  instructorStartTime: string
  endTime: string
}

// Standard time blocks for each mission type
const MISSION_TYPE_BLOCKS = {
  F: {  // Flight
    preFlight: 30,
    preBrief: 30,
    postBrief: 30
  },
  G: {  // Ground
    preFlight: 0,
    preBrief: 30,
    postBrief: 30
  },
  S: {  // Simulator
    preFlight: 0,
    preBrief: 30,
    postBrief: 30
  }
} as const

/**
 * Add minutes to a time string
 */
function addMinutes(timeString: string, minutes: number): string {
  const [hours, mins] = timeString.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60) % 24
  const newMins = totalMinutes % 60
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`
}

/**
 * Format time for display (e.g., "07:00" -> "7:00 AM")
 */
export function formatTimeForDisplay(timeString: string): string {
  const [hours, mins] = timeString.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`
}

/**
 * Calculate mission time blocks
 * 
 * @param missionType - 'F' (Flight), 'G' (Ground), or 'S' (Simulator)
 * @param startTime - Mission start time in 24hr format (e.g., "07:00")
 * @param activityDuration - Duration of main activity (flight/ground/sim) in minutes
 * @returns Complete breakdown of all time blocks
 */
export function calculateMissionTimeBlocks(
  missionType: 'F' | 'G' | 'S',
  startTime: string,
  activityDuration: number
): MissionTimeBreakdown {
  const config = MISSION_TYPE_BLOCKS[missionType]
  const blocks: MissionTimeBlock[] = []
  
  let currentTime = startTime
  let totalStudentTime = 0
  let totalInstructorTime = 0

  // Pre-flight (Flight missions only, student works alone)
  if (config.preFlight > 0) {
    blocks.push({
      label: 'Pre-Flight Inspection',
      startTime: currentTime,
      endTime: addMinutes(currentTime, config.preFlight),
      durationMinutes: config.preFlight,
      icon: '🔧',
      participants: ['student'],
      description: 'Student conducts aircraft pre-flight inspection'
    })
    currentTime = addMinutes(currentTime, config.preFlight)
    totalStudentTime += config.preFlight
  }

  const instructorStartTime = currentTime

  // Pre-brief (Both student and instructor)
  if (config.preBrief > 0) {
    blocks.push({
      label: 'Pre-Brief',
      startTime: currentTime,
      endTime: addMinutes(currentTime, config.preBrief),
      durationMinutes: config.preBrief,
      icon: '💬',
      participants: ['student', 'instructor'],
      description: 'Review objectives, weather, and safety considerations'
    })
    currentTime = addMinutes(currentTime, config.preBrief)
    totalStudentTime += config.preBrief
    totalInstructorTime += config.preBrief
  }

  // Main activity (Flight/Ground/Simulator)
  const activityConfig = {
    F: {
      label: 'Flight Training',
      icon: '✈️',
      description: 'Airborne training maneuvers and procedures'
    },
    G: {
      label: 'Ground Instruction',
      icon: '📚',
      description: 'Classroom instruction and knowledge building'
    },
    S: {
      label: 'Simulator Session',
      icon: '🎮',
      description: 'Simulator training and procedures practice'
    }
  }

  blocks.push({
    label: activityConfig[missionType].label,
    startTime: currentTime,
    endTime: addMinutes(currentTime, activityDuration),
    durationMinutes: activityDuration,
    icon: activityConfig[missionType].icon,
    participants: ['student', 'instructor'],
    description: activityConfig[missionType].description
  })
  currentTime = addMinutes(currentTime, activityDuration)
  totalStudentTime += activityDuration
  totalInstructorTime += activityDuration

  // Post-brief (Both student and instructor)
  if (config.postBrief > 0) {
    blocks.push({
      label: 'Post-Brief / Debrief',
      startTime: currentTime,
      endTime: addMinutes(currentTime, config.postBrief),
      durationMinutes: config.postBrief,
      icon: '📝',
      participants: ['student', 'instructor'],
      description: 'Review performance and key takeaways'
    })
    currentTime = addMinutes(currentTime, config.postBrief)
    totalStudentTime += config.postBrief
    totalInstructorTime += config.postBrief
  }

  return {
    blocks,
    totalStudentTime,
    totalInstructorTime,
    studentStartTime: startTime,
    instructorStartTime,
    endTime: currentTime
  }
}

/**
 * Get a human-readable duration string
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) {
    return `${mins} min`
  } else if (mins === 0) {
    return `${hours} hr`
  } else {
    return `${hours} hr ${mins} min`
  }
}

/**
 * Get mission type label
 */
export function getMissionTypeLabel(missionType: 'F' | 'G' | 'S'): string {
  const labels = {
    F: 'Flight',
    G: 'Ground',
    S: 'Simulator'
  }
  return labels[missionType]
}

/**
 * Calculate estimated end time for a mission
 */
export function calculateMissionEndTime(
  missionType: 'F' | 'G' | 'S',
  startTime: string,
  activityDuration: number
): string {
  const { endTime } = calculateMissionTimeBlocks(missionType, startTime, activityDuration)
  return endTime
}

/**
 * Get standard duration estimates for mission types
 */
export function getStandardDurations(missionType: 'F' | 'G' | 'S') {
  return {
    typical: missionType === 'F' ? 120 : missionType === 'G' ? 90 : 90, // minutes
    min: missionType === 'F' ? 60 : missionType === 'G' ? 60 : 60,
    max: missionType === 'F' ? 180 : missionType === 'G' ? 120 : 120
  }
}
