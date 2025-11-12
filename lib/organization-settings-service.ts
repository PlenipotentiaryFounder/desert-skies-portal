"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// ============================================================================
// TYPES
// ============================================================================

export interface OrganizationSettings {
  id: string
  organization_id: string | null
  organization_name: string | null
  
  // Pre-Brief & POA Settings
  require_poa_acknowledgement: boolean
  
  // Risk Assessment
  require_risk_assessment: boolean
  
  // Instructor Settings
  allow_instructor_self_approval: boolean
  auto_generate_poa: boolean
  
  // Notification Settings
  send_mission_reminders: boolean
  reminder_hours_before: number
  
  // Scheduling Settings
  min_scheduling_notice_hours: number
  max_daily_flight_hours: number
  
  // Billing Settings
  default_currency: string
  require_payment_before_flight: boolean
  
  // Metadata
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface OrganizationSettingsUpdate {
  require_poa_acknowledgement?: boolean
  require_risk_assessment?: boolean
  allow_instructor_self_approval?: boolean
  auto_generate_poa?: boolean
  send_mission_reminders?: boolean
  reminder_hours_before?: number
  min_scheduling_notice_hours?: number
  max_daily_flight_hours?: number
  default_currency?: string
  require_payment_before_flight?: boolean
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get organization settings
 * For single-tenant (Desert Skies), returns the first/only record
 * For multi-tenant, pass organization_id
 */
export async function getOrganizationSettings(
  organizationId?: string
): Promise<OrganizationSettings | null> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    let query = supabase
      .from("organization_settings")
      .select("*")

    if (organizationId) {
      query = query.eq("organization_id", organizationId)
    }

    const { data, error } = await query.single()

    if (error) {
      // If no settings exist, return null (we'll create default on first access)
      console.log("No organization settings found, will use defaults")
      return null
    }

    return data as OrganizationSettings
  } catch (error) {
    console.error("Error in getOrganizationSettings:", error)
    return null
  }
}

/**
 * Get settings or create default if none exist
 */
export async function getOrCreateOrganizationSettings(
  organizationId?: string
): Promise<OrganizationSettings> {
  let settings = await getOrganizationSettings(organizationId)
  
  if (!settings) {
    // Create default settings
    const result = await createDefaultOrganizationSettings(organizationId)
    if (result.success && result.data) {
      settings = result.data
    } else {
      // Return in-memory defaults if creation fails
      return getDefaultSettings()
    }
  }
  
  return settings
}

/**
 * Create default organization settings
 */
async function createDefaultOrganizationSettings(
  organizationId?: string
): Promise<{ success: boolean; data?: OrganizationSettings; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const defaultSettings = {
      organization_id: organizationId || null,
      organization_name: "Desert Skies Aviation",
      require_poa_acknowledgement: false,
      require_risk_assessment: true,
      allow_instructor_self_approval: false,
      auto_generate_poa: true,
      send_mission_reminders: true,
      reminder_hours_before: 24,
      min_scheduling_notice_hours: 24,
      max_daily_flight_hours: 8.0,
      default_currency: "USD",
      require_payment_before_flight: false,
      created_by: user?.id || null,
    }

    const { data, error } = await supabase
      .from("organization_settings")
      .insert(defaultSettings)
      .select()
      .single()

    if (error) {
      console.error("Error creating default settings:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as OrganizationSettings }
  } catch (error) {
    console.error("Error in createDefaultOrganizationSettings:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Update organization settings
 */
export async function updateOrganizationSettings(
  updates: OrganizationSettingsUpdate,
  organizationId?: string
): Promise<{ success: boolean; data?: OrganizationSettings; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    // Get existing settings first
    const existing = await getOrganizationSettings(organizationId)
    
    if (!existing) {
      // Create if doesn't exist
      return await createDefaultOrganizationSettings(organizationId)
    }

    const updateData = {
      ...updates,
      updated_by: user.id,
    }

    const { data, error } = await supabase
      .from("organization_settings")
      .update(updateData)
      .eq("id", existing.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating organization settings:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/settings")
    revalidatePath("/instructor")
    revalidatePath("/student")

    return { success: true, data: data as OrganizationSettings }
  } catch (error) {
    console.error("Error in updateOrganizationSettings:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Check if POA acknowledgement is required
 */
export async function getRequirePOAAcknowledgement(
  organizationId?: string
): Promise<boolean> {
  const settings = await getOrCreateOrganizationSettings(organizationId)
  return settings.require_poa_acknowledgement
}

/**
 * Check if risk assessment is required
 */
export async function getRequireRiskAssessment(
  organizationId?: string
): Promise<boolean> {
  const settings = await getOrCreateOrganizationSettings(organizationId)
  return settings.require_risk_assessment
}

/**
 * Check if auto-generate POA is enabled
 */
export async function getAutoGeneratePOA(
  organizationId?: string
): Promise<boolean> {
  const settings = await getOrCreateOrganizationSettings(organizationId)
  return settings.auto_generate_poa
}

/**
 * Get reminder hours before mission
 */
export async function getReminderHoursBefore(
  organizationId?: string
): Promise<number> {
  const settings = await getOrCreateOrganizationSettings(organizationId)
  return settings.reminder_hours_before
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get default settings (in-memory fallback)
 */
function getDefaultSettings(): OrganizationSettings {
  return {
    id: "default",
    organization_id: null,
    organization_name: "Desert Skies Aviation",
    require_poa_acknowledgement: false,
    require_risk_assessment: true,
    allow_instructor_self_approval: false,
    auto_generate_poa: true,
    send_mission_reminders: true,
    reminder_hours_before: 24,
    min_scheduling_notice_hours: 24,
    max_daily_flight_hours: 8.0,
    default_currency: "USD",
    require_payment_before_flight: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    updated_by: null,
  }
}

