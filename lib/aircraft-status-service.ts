// Aircraft status service for determining aircraft availability
// Integrates with maintenance_records and squawk_reports tables

export type AircraftStatus = 'airworthy' | 'maintenance' | 'grounded'

export interface MaintenanceRecord {
  id: string
  aircraft_id: string
  maintenance_type: string
  status: string
  due_date: string
  is_airworthiness_affecting: boolean
  completed_date?: string
}

export interface SquawkReport {
  id: string
  aircraft_id: string
  requires_immediate_grounding: boolean
  status: string
  reported_at: string
}

/**
 * Get aircraft status based on maintenance and squawk data
 * @param aircraft - Aircraft object with id
 * @param maintenanceRecords - Array of maintenance records for this aircraft
 * @param squawkReports - Array of squawk reports for this aircraft
 * @returns Aircraft status: 'airworthy' | 'maintenance' | 'grounded'
 */
export function getAircraftStatus(
  aircraft: { id: string },
  maintenanceRecords: MaintenanceRecord[],
  squawkReports: SquawkReport[]
): AircraftStatus {
  // Check for critical squawks that require immediate grounding
  const criticalSquawks = squawkReports.filter(s =>
    s.aircraft_id === aircraft.id &&
    s.requires_immediate_grounding &&
    s.status !== 'resolved'
  )

  if (criticalSquawks.length > 0) {
    return 'grounded'
  }

  // Check for overdue maintenance that affects airworthiness
  const overdueMaintenance = maintenanceRecords.filter(m =>
    m.aircraft_id === aircraft.id &&
    m.status === 'overdue' &&
    m.is_airworthiness_affecting
  )

  if (overdueMaintenance.length > 0) {
    return 'maintenance'
  }

  // Check for scheduled maintenance (not overdue but in progress)
  const inProgressMaintenance = maintenanceRecords.filter(m =>
    m.aircraft_id === aircraft.id &&
    (m.status === 'in_progress' || m.status === 'scheduled') &&
    m.is_airworthiness_affecting
  )

  if (inProgressMaintenance.length > 0) {
    return 'maintenance'
  }

  return 'airworthy'
}

/**
 * Calculate next inspection date based on last inspection
 * @param lastInspection - Last inspection date string
 * @returns Next inspection date string
 */
export function calculateNextInspection(lastInspection: string): string {
  const lastDate = new Date(lastInspection)
  const nextDate = new Date(lastDate)
  nextDate.setFullYear(nextDate.getFullYear() + 1)
  return nextDate.toISOString().split('T')[0]
}

/**
 * Get aircraft utilization metrics
 * @param aircraftId - Aircraft ID to calculate utilization for
 * @returns Utilization metrics
 */
export async function calculateAircraftUtilization(aircraftId: string): Promise<{
  utilizationRate: number
  totalFlights: number
  totalHours: number
  revenueGenerated: number
}> {
  try {
    // TODO: Calculate from flight_sessions and billing data
    // For now, return demo data
    return {
      utilizationRate: Math.floor(Math.random() * 30) + 70,
      totalFlights: Math.floor(Math.random() * 100) + 50,
      totalHours: 2450,
      revenueGenerated: Math.floor(Math.random() * 50000) + 20000
    }
  } catch (error) {
    console.error('Error calculating aircraft utilization:', error)
    return {
      utilizationRate: 0,
      totalFlights: 0,
      totalHours: 0,
      revenueGenerated: 0
    }
  }
}
