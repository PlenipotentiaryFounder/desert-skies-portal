// Configuration service for fetching enum/configuration data
// Integrates with configuration tables

export interface DocumentType {
  id: string
  type_key: string
  display_name: string
  description?: string
  category: string
  is_active: boolean
  sort_order: number
}

export interface CitizenshipStatus {
  id: string
  status_key: string
  display_name: string
  description?: string
  requires_additional_docs: boolean
  is_active: boolean
  sort_order: number
}

/**
 * Fetch all active document types
 * @returns Array of document type configurations
 */
export async function getDocumentTypes(): Promise<DocumentType[]> {
  try {
    // TODO: Fetch from document_types table
    // For now, return hardcoded data that matches the database schema
    return [
      { id: "1", type_key: "medical_certificate", display_name: "Medical Certificate", description: "FAA medical certificate (1st, 2nd, or 3rd class)", category: "medical", is_active: true, sort_order: 1 },
      { id: "2", type_key: "pilot_license", display_name: "Pilot License", description: "Pilot certificate (Private, Commercial, ATP, etc.)", category: "certification", is_active: true, sort_order: 2 },
      { id: "3", type_key: "photo_id", display_name: "Photo ID", description: "Government-issued photo identification", category: "identification", is_active: true, sort_order: 3 },
      { id: "4", type_key: "logbook", display_name: "Logbook", description: "Pilot logbook or flight records", category: "training", is_active: true, sort_order: 4 },
      { id: "5", type_key: "endorsement", display_name: "Endorsement", description: "Instructor endorsement or recommendation", category: "training", is_active: true, sort_order: 5 },
      { id: "6", type_key: "certificate", display_name: "Certificate", description: "Other aviation certificates", category: "certification", is_active: true, sort_order: 6 },
      { id: "7", type_key: "other", display_name: "Other", description: "Other aviation-related documents", category: "other", is_active: true, sort_order: 7 }
    ]
  } catch (error) {
    console.error('Error fetching document types:', error)
    return []
  }
}

/**
 * Fetch all active citizenship statuses
 * @returns Array of citizenship status configurations
 */
export async function getCitizenshipStatuses(): Promise<CitizenshipStatus[]> {
  try {
    // TODO: Fetch from citizenship_statuses table
    // For now, return hardcoded data that matches the database schema
    return [
      { id: "1", status_key: "us_citizen", display_name: "U.S. Citizen", description: "United States citizen by birth or naturalization", requires_additional_docs: false, is_active: true, sort_order: 1 },
      { id: "2", status_key: "permanent_resident", display_name: "Permanent Resident", description: "Lawful permanent resident (Green Card holder)", requires_additional_docs: true, is_active: true, sort_order: 2 },
      { id: "3", status_key: "foreign_national", display_name: "Foreign National", description: "Citizen of another country (requires TSA approval)", requires_additional_docs: true, is_active: true, sort_order: 3 }
    ]
  } catch (error) {
    console.error('Error fetching citizenship statuses:', error)
    return []
  }
}

/**
 * Get document type options for dropdowns
 * @returns Array of options for document type dropdowns
 */
export async function getDocumentTypeOptions(): Promise<Array<{ value: string, label: string }>> {
  const types = await getDocumentTypes()
  return [
    { value: "all", label: "All Types" },
    ...types.map(type => ({ value: type.type_key, label: type.display_name }))
  ]
}

/**
 * Get citizenship status options for dropdowns
 * @returns Array of options for citizenship status dropdowns
 */
export async function getCitizenshipStatusOptions(): Promise<Array<{ value: string, label: string }>> {
  const statuses = await getCitizenshipStatuses()
  return statuses.map(status => ({ value: status.status_key, label: status.display_name }))
}
