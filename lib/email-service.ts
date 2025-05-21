import { Resend } from 'resend';

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY || process.env.RESEND_API_KEY);

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
  await resend.emails.send({
    from: 'noreply@desertskiesaviationaz.com',
    to,
    subject,
    html,
  });
} 