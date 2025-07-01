"use server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"

export type DocumentType =
  | "medical_certificate"
  | "pilot_license"
  | "photo_id"
  | "logbook"
  | "training_record"
  | "endorsement"
  | "certificate"
  | "other"

export interface DocumentData {
  id?: string
  user_id: string
  title: string
  description?: string
  file_path: string
  file_type: string
  document_type: DocumentType
  expiration_date?: string
  is_verified?: boolean
}

export async function getDocuments(userId?: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  let query = supabase
    .from("documents")
    .select("*, profiles:user_id(first_name, last_name)")
    .order("created_at", { ascending: false })

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching documents:", error)
    throw new Error("Failed to fetch documents")
  }

  return data
}

export async function getDocumentById(id: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from("documents")
    .select("*, profiles:user_id(first_name, last_name)")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching document:", error)
    throw new Error("Failed to fetch document")
  }

  return data
}

export async function createDocument(document: DocumentData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from("documents")
    .insert({
      id: document.id || uuidv4(),
      user_id: document.user_id,
      title: document.title,
      description: document.description || null,
      file_path: document.file_path,
      file_type: document.file_type,
      document_type: document.document_type,
      expiration_date: document.expiration_date || null,
      is_verified: document.is_verified || false,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating document:", error)
    throw new Error("Failed to create document")
  }

  return data
}

export async function updateDocument(id: string, document: Partial<DocumentData>) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from("documents")
    .update({
      title: document.title,
      description: document.description,
      document_type: document.document_type,
      expiration_date: document.expiration_date,
      is_verified: document.is_verified,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating document:", error)
    throw new Error("Failed to update document")
  }

  return data
}

export async function deleteDocument(id: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from("documents").delete().eq("id", id)

  if (error) {
    console.error("Error deleting document:", error)
    throw new Error("Failed to delete document")
  }

  return true
}

export async function verifyDocument(id: string, isVerified: boolean) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from("documents")
    .update({
      is_verified: isVerified,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error verifying document:", error)
    throw new Error("Failed to verify document")
  }

  return data
}

export async function getExpiringDocuments(daysThreshold = 30) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Calculate the date threshold
  const today = new Date()
  const thresholdDate = new Date()
  thresholdDate.setDate(today.getDate() + daysThreshold)

  const { data, error } = await supabase
    .from("documents")
    .select("*, profiles:user_id(first_name, last_name)")
    .not("expiration_date", "is", null)
    .lte("expiration_date", thresholdDate.toISOString().split("T")[0])
    .gte("expiration_date", today.toISOString().split("T")[0])
    .order("expiration_date", { ascending: true })

  if (error) {
    console.error("Error fetching expiring documents:", error)
    throw new Error("Failed to fetch expiring documents")
  }

  return data
}

export async function getDocumentsByType(type: DocumentType, userId?: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  let query = supabase
    .from("documents")
    .select("*, profiles:user_id(first_name, last_name)")
    .eq("document_type", type)
    .order("created_at", { ascending: false })

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching documents by type:", error)
    throw new Error("Failed to fetch documents by type")
  }

  return data
}

export async function uploadDocumentFile(file: File, path: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase.storage.from("documents").upload(path, file)

  if (error) {
    console.error("Error uploading document file:", error)
    throw new Error("Failed to upload document file")
  }

  return data
}

export async function getDocumentFileUrl(path: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data } = await supabase.storage.from("documents").getPublicUrl(path)

  return data.publicUrl
}

export async function deleteDocumentFile(path: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.storage.from("documents").remove([path])

  if (error) {
    console.error("Error deleting document file:", error)
    throw new Error("Failed to delete document file")
  }

  return true
}
