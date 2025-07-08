import { Resend } from 'resend';

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!html) throw new Error('No email HTML provided');
  
  // Initialize Resend only when needed, not at module level
  const apiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY || process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    // During build time, API keys might not be available
    // Log warning but don't fail the build
    console.warn('Resend API key not found. Email functionality will not work.');
    return;
  }
  
  const resend = new Resend(apiKey);
  
  await resend.emails.send({
    from: 'noreply@desertskiesaviationaz.com',
    to,
    subject,
    html,
  });
}