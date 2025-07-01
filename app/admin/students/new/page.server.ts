"use server"

import { createUser, getUserById } from "@/lib/user-service"
import { createEnrollment } from "@/lib/enrollment-service"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { sendEmail } from "@/lib/email-service"
import WelcomeStudentEmail from "@/app/emails/WelcomeStudentEmail"
import InstructorEnrollmentConfirmationEmail from "@/app/emails/InstructorEnrollmentConfirmationEmail"

export async function adminAddStudentServerAction({ email, firstName, lastName, instructorIds, instructors }: {
  email: string,
  firstName: string,
  lastName: string,
  instructorIds: string[],
  instructors: { id: string, name: string, email: string }[],
}) {
  try {
    // 1. Create the student user
    const password = Math.random().toString(36).slice(-8) + "!Aa1"
    const userResult = await createUser({
      email,
      first_name: firstName,
      last_name: lastName,
      role: "student",
      status: "active",
      password,
    })
    if (!userResult.success || !userResult.userId) {
      return { success: false, error: userResult.error || "Failed to create user" }
    }
    // 2. Generate a magic link for the student
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
    })
    const magicLink = magicLinkData?.properties?.action_link
    if (magicLinkError || !magicLink) {
      return { success: false, error: magicLinkError?.message || "Failed to generate magic link" }
    }
    // 3. Assign to each instructor
    for (const instructorId of instructorIds) {
      const enrollmentResult = await createEnrollment({
        student_id: userResult.userId,
        syllabus_id: null, // Admin flow: no syllabus yet
        instructor_id: instructorId,
        start_date: new Date().toISOString().split("T")[0],
        status: "active",
      })
      if (!enrollmentResult.success) {
        return { success: false, error: enrollmentResult.error || "Failed to assign instructor" }
      }
    }
    // 4. Send welcome email to student
    await sendEmail({
      to: email,
      subject: "Welcome to Desert Skies!",
      reactComponent: WelcomeStudentEmail,
      reactProps: {
        magicLink,
        studentName: `${firstName} ${lastName}`,
      },
    })
    // 5. Send confirmation email to each instructor
    for (const instructorId of instructorIds) {
      const instructor = instructors.find((i: any) => i.id === instructorId)
      if (instructor?.email) {
        await sendEmail({
          to: instructor.email,
          subject: "Student Assigned to You",
          reactComponent: InstructorEnrollmentConfirmationEmail,
          reactProps: {
            instructorName: instructor.name,
            studentName: `${firstName} ${lastName}`,
            syllabusTitle: "(Assigned by Admin)",
          },
        })
      }
    }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || "Unknown error" }
  }
} 