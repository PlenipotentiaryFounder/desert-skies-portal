import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { createNotification } from "./notification-service"

// Check for documents expiring soon
export async function checkDocumentExpirations() {
  const supabase = await createClient(await cookies())

  // Get documents expiring in the next 30 days
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const { data: documents, error } = await supabase
    .from("documents")
    .select("id, title, expiration_date, user_id")
    .lt("expiration_date", thirtyDaysFromNow.toISOString())
    .gt("expiration_date", new Date().toISOString())
    .eq("is_verified", true)

  if (error) {
    console.error("Error checking document expirations:", error)
    return
  }

  // Group documents by user
  const documentsByUser: Record<string, any[]> = {}

  documents.forEach((doc) => {
    if (!documentsByUser[doc.user_id]) {
      documentsByUser[doc.user_id] = []
    }
    documentsByUser[doc.user_id].push(doc)
  })

  // Create notifications for each user
  for (const userId in documentsByUser) {
    const userDocuments = documentsByUser[userId]

    for (const doc of userDocuments) {
      const daysUntilExpiration = Math.ceil(
        (new Date(doc.expiration_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      )

      // Only notify at 30, 14, 7, 3, and 1 days before expiration
      if (![30, 14, 7, 3, 1].includes(daysUntilExpiration)) continue

      // Check if we've already sent a notification for this document at this time
      const { data: existingNotifications } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("related_entity_id", doc.id)
        .eq("related_entity_type", "document")
        .eq("category", "document_expiration")
        .ilike("message", `%${daysUntilExpiration} day%`)
        .limit(1)

      if (existingNotifications && existingNotifications.length > 0) continue

      // Create notification
      await createNotification({
        userId,
        title: "Document Expiring Soon",
        message: `Your document "${doc.title}" will expire in ${daysUntilExpiration} day${daysUntilExpiration === 1 ? "" : "s"}.`,
        category: "document_expiration",
        link: `/student/documents/${doc.id}`,
        relatedEntityId: doc.id,
        relatedEntityType: "document",
      })
    }
  }
}

// Check for upcoming flight sessions
export async function checkUpcomingFlightSessions() {
  const supabase = await createClient(await cookies())

  // Get flight sessions in the next 24 hours
  const twentyFourHoursFromNow = new Date()
  twentyFourHoursFromNow.setHours(twentyFourHoursFromNow.getHours() + 24)

  const { data: sessions, error } = await supabase
    .from("flight_sessions")
    .select(`
      id, 
      start_time, 
      end_time, 
      student_id, 
      instructor_id,
      aircraft:aircraft_id (tail_number, make, model)
    `)
    .gt("start_time", new Date().toISOString())
    .lt("start_time", twentyFourHoursFromNow.toISOString())
    .eq("status", "scheduled")

  if (error) {
    console.error("Error checking upcoming flight sessions:", error)
    return
  }

  for (const session of sessions) {
    const startTime = new Date(session.start_time)
    const hoursUntilSession = Math.ceil((startTime.getTime() - new Date().getTime()) / (1000 * 60 * 60))

    // Only notify at 24, 12, 3, and 1 hours before session
    if (![24, 12, 3, 1].includes(hoursUntilSession)) continue

    // Notify student
    if (session.student_id) {
      // Check if we've already sent a notification for this session at this time
      const { data: existingStudentNotifications } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", session.student_id)
        .eq("related_entity_id", session.id)
        .eq("related_entity_type", "flight_session")
        .eq("category", "flight_reminder")
        .ilike("message", `%${hoursUntilSession} hour%`)
        .limit(1)

      if (!existingStudentNotifications || existingStudentNotifications.length === 0) {
        await createNotification({
          userId: session.student_id,
          title: "Upcoming Flight Session",
          message: `You have a flight session scheduled in ${hoursUntilSession} hour${hoursUntilSession === 1 ? "" : "s"} with aircraft ${(session.aircraft as any).tail_number} (${(session.aircraft as any).make} ${(session.aircraft as any).model}).`,
          category: "flight_reminder",
          link: `/student/schedule`,
          relatedEntityId: session.id,
          relatedEntityType: "flight_session",
        })
      }
    }

    // Notify instructor
    if (session.instructor_id) {
      // Check if we've already sent a notification for this session at this time
      const { data: existingInstructorNotifications } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", session.instructor_id)
        .eq("related_entity_id", session.id)
        .eq("related_entity_type", "flight_session")
        .eq("category", "flight_reminder")
        .ilike("message", `%${hoursUntilSession} hour%`)
        .limit(1)

      if (!existingInstructorNotifications || existingInstructorNotifications.length === 0) {
        // Get student name
        const { data: studentData } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", session.student_id)
          .single()

        const studentName = studentData ? `${studentData.first_name} ${studentData.last_name}` : "a student"

        await createNotification({
          userId: session.instructor_id,
          title: "Upcoming Flight Session",
          message: `You have a flight session with ${studentName} scheduled in ${hoursUntilSession} hour${hoursUntilSession === 1 ? "" : "s"} with aircraft ${(session.aircraft as any).tail_number}.`,
          category: "flight_reminder",
          link: `/instructor/schedule`,
          relatedEntityId: session.id,
          relatedEntityType: "flight_session",
        })
      }
    }
  }
}
