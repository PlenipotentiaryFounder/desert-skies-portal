import { createUser, getUserById } from "@/lib/user-service";
import { createEnrollment } from "@/lib/enrollment-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email-service";
import WelcomeStudentEmail from "@/app/emails/WelcomeStudentEmail";
import InstructorEnrollmentConfirmationEmail from "@/app/emails/InstructorEnrollmentConfirmationEmail";

export async function getInstructors() {
  // ...fetch instructors logic...
}

export async function adminAddStudentServerAction(data: any) {
  // ...all logic for adding a student, creating enrollment, sending emails...
} 