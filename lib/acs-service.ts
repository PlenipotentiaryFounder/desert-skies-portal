"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import fs from 'fs/promises'
import path from 'path'

export interface ACSDocument {
  id: string
  name: string
  certificate_type: string
  version: string
  url: string
  local_path?: string
  last_updated: string
  status: 'active' | 'deprecated' | 'pending'
}

export interface ACSAreaOfOperation {
  id: string
  document_id: string
  number: string
  title: string
  tasks: ACSTask[]
}

export interface ACSTask {
  id: string
  area_id: string
  code: string
  title: string
  references: string[]
  objectives: string[]
  knowledge_elements: string[]
  risk_management: string[]
  skill_elements: string[]
}

export interface StudentACSProgress {
  student_id: string
  document_id: string
  areas_of_operation: {
    area_id: string
    completion_percentage: number
    tasks_completed: number
    total_tasks: number
    last_updated: string
  }[]
  overall_completion: number
}

/**
 * Get all ACS documents from the monitoring system
 */
export async function getACSDocuments(): Promise<ACSDocument[]> {
  const supabase = createClient(await cookies())
  
  // First check if we have ACS documents in our database
  const { data: dbDocuments, error } = await supabase
    .from('acs_documents')
    .select('*')
    .order('last_updated', { ascending: false })

  if (!error && dbDocuments && dbDocuments.length > 0) {
    return dbDocuments
  }

  // If no documents in DB, return mock data for now
  // In production, this would read from the FAA monitoring system
  return [
    {
      id: '1',
      name: 'Private Pilot Airplane ACS',
      certificate_type: 'private_pilot',
      version: 'FAA-S-ACS-6B',
      url: 'https://www.faa.gov/training_testing/testing/acs/private_airplane_acs_6.pdf',
      last_updated: new Date().toISOString(),
      status: 'active'
    },
    {
      id: '2', 
      name: 'Commercial Pilot Airplane ACS',
      certificate_type: 'commercial_pilot',
      version: 'FAA-S-ACS-7B',
      url: 'https://www.faa.gov/training_testing/testing/acs/commercial_airplane_acs_7.pdf',
      last_updated: new Date().toISOString(),
      status: 'active'
    },
    {
      id: '3',
      name: 'Instrument Rating Airplane ACS', 
      certificate_type: 'instrument_rating',
      version: 'FAA-S-ACS-8C',
      url: 'https://www.faa.gov/training_testing/testing/acs/instrument_rating_acs_8.pdf',
      last_updated: new Date().toISOString(),
      status: 'active'
    }
  ]
}

/**
 * Get ACS document by certificate type
 */
export async function getACSDocumentByCertificateType(certificateType: string): Promise<ACSDocument | null> {
  const documents = await getACSDocuments()
  return documents.find(doc => doc.certificate_type === certificateType) || null
}

/**
 * Get Areas of Operation for an ACS document
 */
export async function getAreasOfOperation(documentId: string): Promise<ACSAreaOfOperation[]> {
  const supabase = createClient(await cookies())
  
  const { data, error } = await supabase
    .from('acs_areas_of_operation')
    .select(`
      *,
      tasks:acs_tasks(*)
    `)
    .eq('document_id', documentId)
    .order('number')

  if (!error && data) {
    return data
  }

  // Mock data for demonstration
  return [
    {
      id: '1',
      document_id: documentId,
      number: 'I',
      title: 'Preflight Preparation',
      tasks: [
        {
          id: '1',
          area_id: '1',
          code: 'PA.I.A',
          title: 'Pilot Qualifications',
          references: ['14 CFR part 61', '14 CFR part 68', 'AC 68-1'],
          objectives: ['To determine the applicant exhibits satisfactory knowledge, skill, and aeronautical experience'],
          knowledge_elements: ['Certification requirements', 'Currency requirements', 'Medical requirements'],
          risk_management: ['Personal minimums', 'Physiological factors'],
          skill_elements: ['Complete required logbook entries', 'Present required documents']
        },
        {
          id: '2', 
          area_id: '1',
          code: 'PA.I.B',
          title: 'Airworthiness Requirements',
          references: ['14 CFR part 91', '14 CFR part 43', 'AC 39-7'],
          objectives: ['To determine the applicant exhibits satisfactory knowledge of airworthiness requirements'],
          knowledge_elements: ['Airworthiness certificates', 'Required inspections', 'Airworthiness directives'],
          risk_management: ['Pre-flight inspection procedures', 'Identifying airworthiness issues'],
          skill_elements: ['Locate and explain airworthiness documents', 'Determine if aircraft is airworthy']
        }
      ]
    },
    {
      id: '2',
      document_id: documentId, 
      number: 'II',
      title: 'Preflight Procedures',
      tasks: [
        {
          id: '3',
          area_id: '2',
          code: 'PA.II.A',
          title: 'Preflight Assessment',
          references: ['14 CFR part 91', 'AIM', 'AC 91-92'],
          objectives: ['To determine the applicant exhibits satisfactory knowledge of preflight assessment'],
          knowledge_elements: ['Weather information sources', 'Cross-country flight planning', 'National airspace system'],
          risk_management: ['Weather considerations', 'Aeronautical decision making', 'Single pilot resource management'],
          skill_elements: ['Obtain and analyze weather information', 'Make go/no-go decisions']
        }
      ]
    }
  ]
}

/**
 * Get student's ACS progress
 */
export async function getStudentACSProgress(studentId: string, certificateType: string): Promise<StudentACSProgress | null> {
  const supabase = createClient(await cookies())
  
  const document = await getACSDocumentByCertificateType(certificateType)
  if (!document) return null

  const { data, error } = await supabase
    .from('student_acs_progress')
    .select('*')
    .eq('student_id', studentId)
    .eq('document_id', document.id)
    .single()

  if (!error && data) {
    return data
  }

  // Return mock progress for demonstration
  return {
    student_id: studentId,
    document_id: document.id,
    areas_of_operation: [
      {
        area_id: '1',
        completion_percentage: 75,
        tasks_completed: 2,
        total_tasks: 3,
        last_updated: new Date().toISOString()
      },
      {
        area_id: '2', 
        completion_percentage: 25,
        tasks_completed: 1,
        total_tasks: 4,
        last_updated: new Date().toISOString()
      }
    ],
    overall_completion: 50
  }
}

/**
 * Update student's ACS task progress
 */
export async function updateStudentACSProgress(
  studentId: string,
  taskId: string,
  completed: boolean,
  instructorId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(await cookies())

  try {
    const { error } = await supabase
      .from('student_acs_task_progress')
      .upsert({
        student_id: studentId,
        task_id: taskId,
        completed,
        completed_date: completed ? new Date().toISOString() : null,
        instructor_id: instructorId,
        updated_at: new Date().toISOString()
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update ACS progress' }
  }
}

/**
 * Get ACS standards for a specific lesson
 */
export async function getACSStandardsForLesson(lessonId: string): Promise<ACSTask[]> {
  const supabase = createClient(await cookies())
  
  const { data, error } = await supabase
    .from('lesson_acs_standards')
    .select(`
      acs_task:task_id(*)
    `)
    .eq('lesson_id', lessonId)

  if (!error && data) {
    return data.map(item => item.acs_task).filter(Boolean)
  }

  // Mock data for demonstration
  return [
    {
      id: '1',
      area_id: '1', 
      code: 'PA.I.A',
      title: 'Pilot Qualifications',
      references: ['14 CFR part 61'],
      objectives: ['To determine the applicant exhibits satisfactory knowledge, skill, and aeronautical experience'],
      knowledge_elements: ['Certification requirements', 'Currency requirements'],
      risk_management: ['Personal minimums'],
      skill_elements: ['Complete required logbook entries']
    }
  ]
}

/**
 * Link ACS standards to a lesson
 */
export async function linkACSStandardsToLesson(
  lessonId: string,
  taskIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(await cookies())

  try {
    // Remove existing links
    await supabase
      .from('lesson_acs_standards')
      .delete()
      .eq('lesson_id', lessonId)

    // Add new links
    if (taskIds.length > 0) {
      const links = taskIds.map(taskId => ({
        lesson_id: lessonId,
        task_id: taskId,
        created_at: new Date().toISOString()
      }))

      const { error } = await supabase
        .from('lesson_acs_standards')
        .insert(links)

      if (error) {
        return { success: false, error: error.message }
      }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to link ACS standards to lesson' }
  }
}

/**
 * Get ACS monitoring status from the external monitoring system
 */
export async function getACSMonitoringStatus(): Promise<{
  documentsMonitored: number
  lastCheck: string
  recentChanges: number
  status: 'active' | 'error' | 'pending'
}> {
  // In a real implementation, this would check the FAA monitoring system
  // For now, return mock status
  return {
    documentsMonitored: 12,
    lastCheck: new Date().toISOString(),
    recentChanges: 0,
    status: 'active'
  }
}

/**
 * Sync ACS data from monitoring system
 */
export async function syncACSData(): Promise<{ success: boolean; error?: string }> {
  try {
    // In production, this would:
    // 1. Read processed ACS data from the monitoring system
    // 2. Parse the structured data 
    // 3. Update the database with new standards
    // 4. Notify users of changes
    
    console.log('ACS data sync initiated...')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to sync ACS data' }
  }
} 