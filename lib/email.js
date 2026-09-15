import { Resend } from 'resend';

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set. Add it to your environment variables.');
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function fmt(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export async function sendManagerApprovalEmail({ token, employeeName, leaveTime, expectedReturnTime, reason }) {
  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) throw new Error('APP_BASE_URL is not set.');

  const managerEmails = (process.env.MANAGER_EMAIL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (managerEmails.length === 0) throw new Error('MANAGER_EMAIL is not set.');

  const approveUrl = `${baseUrl}/api/decision?token=${token}&action=approve`;
  const declineUrl = `${baseUrl}/api/decision?token=${token}&action=decline`;

  const html = `
  <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
    <h2 style="margin-bottom: 4px;">Out-of-office request</h2>
    <p style="color:#555; margin-top:0;">${employeeName} is asking to step out of the office.</p>
    <table style="width:100%; border-collapse: collapse; font-size:14px; margin: 16px 0;">
      <tr><td style="padding:6px 0; color:#888; width:120px;">Leaving</td><td style="padding:6px 0;">${fmt(leaveTime)}</td></tr>
      <tr><td style="padding:6px 0; color:#888;">Back by</td><td style="padding:6px 0;">${fmt(expectedReturnTime)}</td></tr>
      <tr><td style="padding:6px 0; color:#888; vertical-align:top;">Reason</td><td style="padding:6px 0;">${reason}</td></tr>
    </table>
    <div>
      <a href="${approveUrl}" style="display:inline-block; background:#1a7f37; color:#fff; text-decoration:none; padding:10px 22px; border-radius:8px; font-weight:600; margin-right:10px;">Approve</a>
      <a href="${declineUrl}" style="display:inline-block; background:#c0392b; color:#fff; text-decoration:none; padding:10px 22px; border-radius:8px; font-weight:600;">Decline</a>
    </div>
    <p style="color:#999; font-size:12px; margin-top:24px;">One click is all it takes &mdash; no login needed.</p>
  </div>`;

  await getResend().emails.send({
    from: process.env.FROM_EMAIL,
    to: managerEmails,
    subject: `Out-of-office request: ${employeeName}`,
    html,
  });
}

export async function sendEmployeeDecisionEmail({ employeeEmail, employeeName, status, leaveTime, expectedReturnTime }) {
  if (!employeeEmail) return;

  const verb = status === 'approved' ? 'approved' : 'declined';
  const color = status === 'approved' ? '#1a7f37' : '#c0392b';

  const html = `
  <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
    <h2 style="color:${color};">Your request was ${verb}</h2>
    <p style="color:#555;">Hi ${employeeName}, your out-of-office request (${fmt(leaveTime)} &ndash; ${fmt(expectedReturnTime)}) was ${verb} by your manager.</p>
  </div>`;

  try {
    await getResend().emails.send({
      from: process.env.FROM_EMAIL,
      to: employeeEmail,
      subject: `Your out-of-office request was ${verb}`,
      html,
    });
  } catch (err) {
    console.error('Failed to send employee decision email', err);
  }
}
