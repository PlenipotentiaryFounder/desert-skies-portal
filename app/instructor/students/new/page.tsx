// New Student Enrollment Page
// 1. Multi-step form: email, name, syllabus, etc.
// 2. On submit, call server action to create user, profile, enrollment, and send email
// 3. Show progress and errors 

import EnrollNewStudentForm from "./EnrollNewStudentForm";
import { enrollStudentServerAction, getSyllabi, getStudentsForInstructor } from "./actions";
import { getCurrentInstructor } from "@/lib/user-service";

export default async function EnrollNewStudentPage() {
  const syllabi = await getSyllabi();
  const students = await getStudentsForInstructor();
  const instructor = await getCurrentInstructor();
  return <EnrollNewStudentForm syllabi={syllabi} students={students} instructor={instructor} />;
} 