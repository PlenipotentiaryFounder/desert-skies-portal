import { DiscoveryFlight } from './discovery-flight-service'

// =====================================================
// OUTLOOK PEOPLE API INTEGRATION
// =====================================================

export interface OutlookContact {
  givenName: string
  surname: string
  emailAddresses: Array<{
    address: string
    name?: string
  }>
  mobilePhone?: string
  businessPhones?: string[]
  personalNotes?: string
}

export async function createOutlookContact(
  discoveryFlight: DiscoveryFlight,
  accessToken: string
): Promise<{ success: boolean; contact_id?: string; error?: string }> {
  try {
    const contact: OutlookContact = {
      givenName: discoveryFlight.first_name,
      surname: discoveryFlight.last_name,
      emailAddresses: [
        {
          address: discoveryFlight.email,
          name: `${discoveryFlight.first_name} ${discoveryFlight.last_name}`,
        },
      ],
      mobilePhone: discoveryFlight.phone,
      personalNotes: `Discovery Flight Customer\nBooking Source: ${discoveryFlight.booking_source}\nBooked: ${discoveryFlight.created_at}\n${discoveryFlight.special_requests ? `Special Requests: ${discoveryFlight.special_requests}` : ''}`,
    }

    const response = await fetch('https://graph.microsoft.com/v1.0/me/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contact),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Outlook API error:', error)
      return { success: false, error: error.error?.message || 'Failed to create contact' }
    }

    const data = await response.json()
    return { success: true, contact_id: data.id }
  } catch (error) {
    console.error('Error creating Outlook contact:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function updateOutlookContact(
  contactId: string,
  discoveryFlight: DiscoveryFlight,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates: Partial<OutlookContact> = {
      givenName: discoveryFlight.first_name,
      surname: discoveryFlight.last_name,
      mobilePhone: discoveryFlight.phone,
      personalNotes: `Discovery Flight Customer\nBooking Source: ${discoveryFlight.booking_source}\nBooked: ${discoveryFlight.created_at}\nStatus: ${discoveryFlight.flight_status}\n${discoveryFlight.converted_to_student ? 'CONVERTED TO STUDENT ✓' : ''}\n${discoveryFlight.special_requests ? `Special Requests: ${discoveryFlight.special_requests}` : ''}`,
    }

    const response = await fetch(`https://graph.microsoft.com/v1.0/me/contacts/${contactId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Outlook API error:', error)
      return { success: false, error: error.error?.message || 'Failed to update contact' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating Outlook contact:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =====================================================
// APPLE CONTACTS (iCloud) INTEGRATION
// =====================================================

// Note: Apple Contacts API requires CloudKit JS or native iOS integration
// For server-side integration, we would use CardDAV protocol
// This is a placeholder for the implementation

export interface AppleContact {
  firstName: string
  lastName: string
  emailAddresses: string[]
  phoneNumbers: string[]
  note?: string
}

export async function createAppleContact(
  discoveryFlight: DiscoveryFlight,
  credentials: { username: string; password: string }
): Promise<{ success: boolean; contact_id?: string; error?: string }> {
  try {
    // This would use CardDAV protocol to sync with iCloud Contacts
    // Implementation requires:
    // 1. App-specific password from iCloud
    // 2. CardDAV client library
    // 3. vCard format generation

    // For now, return a placeholder
    console.log('Apple Contacts integration would create contact for:', discoveryFlight.email)
    
    return {
      success: false,
      error: 'Apple Contacts integration requires additional setup. Please configure CardDAV credentials.',
    }
  } catch (error) {
    console.error('Error creating Apple contact:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =====================================================
// CRM SYNC ORCHESTRATION
// =====================================================

export async function syncDiscoveryFlightToCRM(
  discoveryFlight: DiscoveryFlight,
  options: {
    outlookAccessToken?: string
    appleCredentials?: { username: string; password: string }
  }
): Promise<{
  outlook: { success: boolean; contact_id?: string; error?: string } | null
  apple: { success: boolean; contact_id?: string; error?: string } | null
}> {
  const results = {
    outlook: null as any,
    apple: null as any,
  }

  // Sync to Outlook if token provided
  if (options.outlookAccessToken) {
    if (discoveryFlight.outlook_contact_id) {
      results.outlook = await updateOutlookContact(
        discoveryFlight.outlook_contact_id,
        discoveryFlight,
        options.outlookAccessToken
      )
    } else {
      results.outlook = await createOutlookContact(
        discoveryFlight,
        options.outlookAccessToken
      )
    }
  }

  // Sync to Apple Contacts if credentials provided
  if (options.appleCredentials) {
    results.apple = await createAppleContact(
      discoveryFlight,
      options.appleCredentials
    )
  }

  return results
}

// =====================================================
// WEBHOOK HANDLERS FOR CRM SYNC
// =====================================================

export async function handleDiscoveryFlightCreated(discoveryFlightId: string): Promise<void> {
  // This would be called from a webhook or background job
  // to automatically sync new discovery flights to CRM
  
  // Implementation would:
  // 1. Get discovery flight from database
  // 2. Get CRM credentials from environment or database
  // 3. Call syncDiscoveryFlightToCRM
  // 4. Update discovery flight with CRM IDs
  
  console.log('CRM sync triggered for discovery flight:', discoveryFlightId)
}

export async function handleDiscoveryFlightUpdated(discoveryFlightId: string): Promise<void> {
  // Similar to above but for updates
  console.log('CRM update triggered for discovery flight:', discoveryFlightId)
}


