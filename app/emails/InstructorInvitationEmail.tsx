export default function InstructorInvitationEmail({ 
  instructorName = "Instructor", 
  inviteUrl = "#", 
  expiresAt = "",
  invitedBy = "Desert Skies Aviation"
}: { 
  instructorName?: string
  inviteUrl?: string
  expiresAt?: string
  invitedBy?: string
}) {
  const expirationDate = expiresAt ? new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : ''

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', padding: 40, borderRadius: '8px 8px 0 0', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 28, fontWeight: 'bold' }}>
          🛩️ Desert Skies Aviation
        </h1>
        <p style={{ color: '#e0e7ff', margin: '8px 0 0 0', fontSize: 16 }}>
          Flight Training Excellence
        </p>
      </div>
      
      <div style={{ background: '#fff', padding: 40, borderRadius: '0 0 8px 8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#1e293b', marginTop: 0, fontSize: 24 }}>
          You're Invited to Join Our Team!
        </h2>
        
        <p style={{ color: '#475569', fontSize: 16, lineHeight: 1.6 }}>
          Dear {instructorName},
        </p>
        
        <p style={{ color: '#475569', fontSize: 16, lineHeight: 1.6 }}>
          {invitedBy} has invited you to join <strong>Desert Skies Aviation</strong> as a Certified Flight Instructor. 
          We're excited to have you as part of our team!
        </p>
        
        <div style={{ background: '#f1f5f9', padding: 24, borderRadius: 8, margin: '24px 0' }}>
          <h3 style={{ color: '#1e293b', marginTop: 0, fontSize: 18 }}>
            What's Next?
          </h3>
          <ul style={{ color: '#475569', fontSize: 15, lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Click the button below to accept your invitation</li>
            <li>Create your account with a secure password</li>
            <li>Complete our quick onboarding process (3-5 minutes)</li>
            <li>Upload your credentials and documents</li>
            <li>Set up your payment information via Stripe Connect</li>
            <li>Connect your calendar for seamless scheduling</li>
          </ul>
        </div>
        
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <a
            href={inviteUrl}
            style={{
              display: 'inline-block',
              background: '#2563eb',
              color: '#fff',
              padding: '16px 48px',
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: 18,
              boxShadow: '0 4px 6px rgba(37, 99, 235, 0.3)'
            }}
          >
            Accept Invitation
          </a>
        </div>
        
        {expirationDate && (
          <p style={{ color: '#ef4444', fontSize: 14, textAlign: 'center', margin: '16px 0' }}>
            ⏰ This invitation expires on {expirationDate}
          </p>
        )}
        
        <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', padding: 16, borderRadius: 8, margin: '24px 0' }}>
          <p style={{ color: '#92400e', fontSize: 14, margin: 0 }}>
            <strong>🔒 Security Note:</strong> If you didn't expect this invitation or don't recognize Desert Skies Aviation, 
            please ignore this email. The invitation link will expire automatically.
          </p>
        </div>
        
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 24, marginTop: 32 }}>
          <h3 style={{ color: '#1e293b', fontSize: 18, marginTop: 0 }}>
            What You'll Get:
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <p style={{ color: '#2563eb', fontWeight: 'bold', margin: '0 0 4px 0', fontSize: 15 }}>
                ✈️ Modern Platform
              </p>
              <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                Intuitive scheduling and student management
              </p>
            </div>
            <div>
              <p style={{ color: '#2563eb', fontWeight: 'bold', margin: '0 0 4px 0', fontSize: 15 }}>
                💰 Easy Payments
              </p>
              <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                Direct deposits via Stripe Connect
              </p>
            </div>
            <div>
              <p style={{ color: '#2563eb', fontWeight: 'bold', margin: '0 0 4px 0', fontSize: 15 }}>
                📅 Calendar Sync
              </p>
              <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                Google/Outlook integration
              </p>
            </div>
            <div>
              <p style={{ color: '#2563eb', fontWeight: 'bold', margin: '0 0 4px 0', fontSize: 15 }}>
                📊 Progress Tracking
              </p>
              <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                ACS-aligned student monitoring
              </p>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid #e2e8f0' }}>
          <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 8px 0' }}>
            Questions? Contact us at:
          </p>
          <p style={{ color: '#2563eb', fontSize: 14, margin: 0 }}>
            <a href="mailto:support@desertskiesaviationaz.com" style={{ color: '#2563eb', textDecoration: 'none' }}>
              support@desertskiesaviationaz.com
            </a>
          </p>
          <p style={{ color: '#94a3b8', fontSize: 12, margin: '16px 0 0 0' }}>
            © {new Date().getFullYear()} Desert Skies Aviation. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

