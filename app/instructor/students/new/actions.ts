import { getSyllabi } from "@/lib/syllabus-service";
import { getUserById, createUser, getCurrentInstructor } from "@/lib/user-service";
import { createEnrollment, getInstructorEnrollments } from "@/lib/enrollment-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email-service";
import WelcomeStudentEmail from "@/app/emails/WelcomeStudentEmail";
import InstructorEnrollmentConfirmationEmail from "@/app/emails/InstructorEnrollmentConfirmationEmail";

export { getSyllabi };

export async function getStudentsForInstructor() {
  const instructor = await getCurrentInstructor();
  if (!instructor) return [];
  const enrollments = await getInstructorEnrollments(instructor.id);
  const studentIds = enrollments.map(e => e.student_id);
  const supabase = await createServerSupabaseClient();
  if (studentIds.length === 0) return [];
  const { data, error } = await supabase.from("profiles").select("*").in("id", studentIds as any);
  if (error) {
    console.error("Error fetching students for instructor:", error);
    return [];
  }
  return data;
}

export async function enrollStudentServerAction(data: any) {
  // ...all logic for enrolling a student, creating enrollment, sending emails...
} 