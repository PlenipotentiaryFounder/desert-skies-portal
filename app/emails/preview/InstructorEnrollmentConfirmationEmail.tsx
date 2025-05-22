export default function InstructorEnrollmentConfirmationEmailPreview({ instructorName = "Instructor", studentName = "Student", syllabusTitle = "Syllabus", syllabusLink = "#" }: { instructorName?: string, studentName?: string, syllabusTitle?: string, syllabusLink?: string }) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#f8fafc', padding: 32, color: '#222' }}>
      <div style={{ background: '#fff', borderRadius: 8, maxWidth: 480, margin: '0 auto', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/BrandAssets/DesertSkies_Logo.png" alt="Desert Skies Logo" style={{ width: 80, height: 80, objectFit: 'contain', margin: '0 auto' }} />
        </div>
        <h2 style={{ textAlign: 'center', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          Student Enrolled Successfully!
        </h2>
        <p style={{ textAlign: 'center', fontSize: 16, marginBottom: 24 }}>
          Hi {instructorName},<br />
          <b>{studentName}</b> has been enrolled in the <b>{syllabusTitle}</b> syllabus.<br />
          <a href={syllabusLink} style={{ color: '#2563eb', textDecoration: 'underline' }}>View and manage this student's syllabus</a>.
        </p>
        <div style={{ textAlign: 'center', fontSize: 14, color: '#888' }}>
          Thank you for helping your students achieve their goals!<br />
          <br />
          <span style={{ fontWeight: 600 }}>Desert Skies Flight School</span>
        </div>
      </div>
    </div>
  )
} 