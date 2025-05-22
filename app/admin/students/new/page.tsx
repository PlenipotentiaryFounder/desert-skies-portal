import AdminAddStudentForm from "./AdminAddStudentForm";
import { adminAddStudentServerAction, getInstructors } from "./actions";

export default async function AdminAddStudentPage() {
  const instructors = await getInstructors();
  return <AdminAddStudentForm instructors={instructors} adminAddStudent={adminAddStudentServerAction} />;
} 