export default function WelcomeStudentEmailPreview({ magicLink = "#", studentName = "Student", syllabusTitle, syllabusLink = "/student/syllabus" }: { magicLink?: string, studentName?: string, syllabusTitle?: string, syllabusLink?: string }) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#f8fafc', padding: 32, color: '#222' }}>
      <div style={{ background: '#fff', borderRadius: 8, maxWidth: 480, margin: '0 auto', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/BrandAssets/DesertSkies_Logo.png" alt="Desert Skies Logo" style={{ width: 80, height: 80, objectFit: 'contain', margin: '0 auto' }} />
        </div>
        <h2 style={{ textAlign: 'center', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          {syllabusTitle ? `Congratulations, ${studentName}!` : `Welcome to Desert Skies, ${studentName}!`}
        </h2>
        {syllabusTitle ? (
          <p style={{ textAlign: 'center', fontSize: 16, marginBottom: 24 }}>
            You've been enrolled in the <b>{syllabusTitle}</b> syllabus.<br />
            <a href={syllabusLink} style={{ color: '#2563eb', textDecoration: 'underline' }}>View and manage your syllabus here</a>.
          </p>
        ) : (
          <p style={{ textAlign: 'center', fontSize: 16, marginBottom: 24 }}>
            We're excited to have you onboard. Click below to access your student portal and get started!
          </p>
        )}
        {magicLink && (
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <a
              href={magicLink}
              style={{
                display: 'inline-block',
                background: '#2563eb',
                color: '#fff',
                padding: '12px 32px',
                borderRadius: 6,
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: 16,
              }}
            >
              Login to Portal
            </a>
          </div>
        )}
        <div style={{ textAlign: 'center', fontSize: 14, color: '#888' }}>
          If you have questions, reply to this email or contact your instructor.<br />
          <br />
          <span style={{ fontWeight: 600 }}>Desert Skies Flight School</span>
        </div>
      </div>
    </div>
  )
} 