// Aircraft service for fetching real-time aircraft data and status
// This integrates with flight sessions and aircraft maintenance data

export interface AircraftData {
  fuelLevel: number
  altitude: number
  speed: number
  heading: number
  engineHours: number
  oilTemp?: number
  oilPressure?: number
  voltage?: number
  nextMaintenance?: number
}

export interface AircraftStatus {
  id: string
  tailNumber: string
  status: 'airworthy' | 'maintenance' | 'grounded'
  location?: string
  lastSeen?: string
  utilizationRate?: number
  totalFlights?: number
  totalHours?: number
  revenueGenerated?: number
  maintenanceCosts?: number
}

/**
 * Fetch current aircraft data for active flight sessions
 * @returns Array of aircraft data for currently flying aircraft
 */
export async function getActiveAircraftData(): Promise<AircraftData[]> {
  try {
    // For now, return demo data since we need real-time aircraft sensors
    // In production, this would integrate with aircraft telemetry systems
    return [
      {
        fuelLevel: 85,
        altitude: 2500,
        speed: 120,
        heading: 270,
        engineHours: 2450,
        oilTemp: 180,
        oilPressure: 65,
        voltage: 14.2,
        nextMaintenance: 150
      }
    ]
  } catch (error) {
    console.error('Error fetching aircraft data:', error)
    return []
  }
}

/**
 * Fetch aircraft status information
 * @returns Array of aircraft status data
 */
export async function getAircraftStatusData(): Promise<AircraftStatus[]> {
  try {
    // TODO: Implement real aircraft status from maintenance_records and squawk_reports
    // For now, return demo data
    return [
      {
        id: "1",
        tailNumber: "N12345",
        status: "airworthy",
        location: "Phoenix Sky Harbor",
        lastSeen: new Date().toISOString(),
        utilizationRate: 75,
        totalFlights: 45,
        totalHours: 2450,
        revenueGenerated: 25000,
        maintenanceCosts: 5000
      }
    ]
  } catch (error) {
    console.error('Error fetching aircraft status:', error)
    return []
  }
}

/**
 * Calculate aircraft utilization metrics from flight sessions
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
