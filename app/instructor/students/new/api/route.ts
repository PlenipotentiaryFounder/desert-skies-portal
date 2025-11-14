import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserById } from "@/lib/user-service";
import { createEnrollment } from "@/lib/enrollment-service";
import { getSyllabusById } from "@/lib/syllabus-service";
import { sendEmail } from "@/lib/email-service";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

function isUser(obj: any): obj is { id: string } {
  return obj && typeof obj === 'object' && typeof obj.id === 'string';
}

export async function POST(req: NextRequest) {
  try {
    // Initialize Supabase client
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);
    
    const data = await req.json();
    const { email, firstName, lastName, phone, syllabusId, instructorId } = data;
    let studentId = null;
    let isNewStudent = false;

    // 1. Check if student exists
    let student = null;
    try {
      student = await getUserById(email); // Try by email (if getUserById supports it)
    } catch (err) {
      console.error("Error in getUserById(email):", err);
    }
    if (!isUser(student)) {
      // Try to find by email in profiles
      try {
        const { data: found, error } = await supabase.from("profiles").select("*").eq("email", email).single();
        if (error) console.error("Error in profiles lookup:", error);
        if (isUser(found)) student = found;
      } catch (err) {
        console.error("Error in profiles lookup:", err);
      }
    }

    // 2. If not found, create new user/profile
    if (!isUser(student)) {
      isNewStudent = true;
      try {
        const createRes = await createUser({
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          status: "active"
        });
        if (!createRes.success || !createRes.userId) throw new Error(createRes.error || "Failed to create user");
        studentId = createRes.userId;
        // Assign student role in user_roles table
        const { data: roleRow, error: roleLookupError } = await supabase
          .from("roles")
          .select("id")
          .eq("name", "student")
          .single();
        if (!roleLookupError && roleRow) {
          await supabase.from("user_roles").insert({ user_id: studentId, role_id: roleRow.id });
        }
      } catch (err) {
        console.error("Error creating user:", err);
        return NextResponse.json({ success: false, error: "Failed to create user: " + (err?.message || err) }, { status: 500 });
      }
    } else {
      studentId = student.id;
    }

    // 3. Create enrollment
    const today = new Date().toISOString().slice(0, 10);
    let enrollRes;
    try {
      enrollRes = await createEnrollment({
        student_id: studentId,
        syllabus_id: syllabusId,
        instructor_id: instructorId,
        start_date: today,
        status: "active"
      });
      if (!enrollRes.success) throw new Error(enrollRes.error || "Failed to create enrollment");
    } catch (err) {
      console.error("Error creating enrollment:", err);
      return NextResponse.json({ success: false, error: "Failed to create enrollment: " + (err?.message || err) }, { status: 500 });
    }

    // 4. Get syllabus info for emails
    let syllabus;
    try {
      syllabus = await getSyllabusById(syllabusId);
    } catch (err) {
      console.error("Error fetching syllabus:", err);
      return NextResponse.json({ success: false, error: "Failed to fetch syllabus: " + (err?.message || err) }, { status: 500 });
    }

    // 5. Render and send welcome email to student
    try {
      const { renderToStaticMarkup } = await import("react-dom/server");
      const { default: WelcomeStudentEmail } = await import("@/app/emails/WelcomeStudentEmail");
      const studentEmailHtml = renderToStaticMarkup(
        WelcomeStudentEmail({
          studentName: `${firstName} ${lastName}`,
          syllabusTitle: syllabus?.title,
          syllabusLink: `/student/syllabus/${syllabusId}`
        })
      );
      await sendEmail({
        to: email,
        subject: `Welcome to Desert Skies: ${syllabus?.title || "Syllabus"}`,
        html: studentEmailHtml
      });
    } catch (err) {
      console.error("Error sending welcome email:", err);
      return NextResponse.json({ success: false, error: "Failed to send welcome email: " + (err?.message || err) }, { status: 500 });
    }

    // 6. Render and send confirmation email to instructor
    try {
      let instructor = null;
      try {
        instructor = await getUserById(instructorId);
      } catch (err) {
        console.error("Error fetching instructor:", err);
      }
      const { renderToStaticMarkup } = await import("react-dom/server");
      const { default: InstructorEnrollmentConfirmationEmail } = await import("@/app/emails/InstructorEnrollmentConfirmationEmail");
      const instructorEmailHtml = renderToStaticMarkup(
        InstructorEnrollmentConfirmationEmail({
          instructorName: instructor ? `${instructor.first_name} ${instructor.last_name}` : "Instructor",
          studentName: `${firstName} ${lastName}`,
          syllabusTitle: syllabus?.title,
          syllabusLink: `/instructor/students/${studentId}/syllabus/${syllabusId}`
        })
      );
      await sendEmail({
        to: instructor?.email || "",
        subject: `Student Enrolled: ${firstName} ${lastName}`,
        html: instructorEmailHtml
      });
    } catch (err) {
      console.error("Error sending instructor confirmation email:", err);
      // Do not fail the whole process if instructor email fails
    }

    return NextResponse.json({ success: true, isNewStudent, studentId });
  } catch (error: any) {
    console.error("API route error:", error);
    return NextResponse.json({ success: false, error: error.message || "Unknown error" }, { status: 500 });
  }
} 
