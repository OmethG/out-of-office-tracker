import { Resend } from 'resend';
import { describe } from './requests';

const BLUE = '#023ABE';
const PURPLE = '#470073';

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set. Add it to your environment variables.');
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function baseUrl() {
  return (process.env.APP_BASE_URL || '').replace(/\/+$/, '');
}

function shell(accent, inner) {
  const logo = baseUrl() ? `<img src="${baseUrl()}/brand/logo-email.png" width="72" alt="MethG" style="display:block;margin-bottom:18px;">` : '';
  return `
  <div style="background:#f5f6fa;padding:24px 12px;">
    <div style="font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;max-width:480px;margin:0 auto;background:#ffffff;border-radius:14px;padding:28px;border-top:4px solid ${accent};color:#10143a;">
      ${logo}
      ${inner}
      <p style="color:#8a8fab;font-size:12px;margin:26px 0 0;">MethG Staff</p>
    </div>
  </div>`;
}

function detailsTable(row, balance, medicalNote) {
  const d = describe(row);
  const line = (label, value) =>
    `<tr><td style="padding:7px 0;color:#6a6f8e;width:110px;vertical-align:top;">${label}</td><td style="padding:7px 0;">${value}</td></tr>`;
  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
      ${line('Type', esc(d.title) + (row.medical ? ' (medical)' : ''))}
      ${line('When', esc(d.when))}
      ${line('Reason', esc(row.reason))}
      ${row.certificate_name && baseUrl() ? line('Certificate', `<a href="${baseUrl()}/certificate/${row.id}" style="color:${BLUE};font-weight:600;">View certificate</a>`) : ''}
      ${medicalNote ? line('Medical', esc(medicalNote)) : ''}
      ${balance ? line('Balance', `<span style="font-weight:600;color:${balance.tone === 'over' ? '#b42318' : balance.tone === 'fine' ? PURPLE : '#6a6f8e'};">${esc(balance.text)}</span>`) : ''}
    </table>`;
}

function managerEmails() {
  const list = (process.env.MANAGER_EMAIL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) throw new Error('MANAGER_EMAIL is not set.');
  return list;
}

export async function sendManagerApprovalEmail(row, balance = null, medicalNote = null) {
  const url = baseUrl();
  if (!url) throw new Error('APP_BASE_URL is not set.');
  const d = describe(row);
  const leave = row.kind === 'leave';
  const accent = leave ? PURPLE : BLUE;
  const approveUrl = `${url}/api/decision?token=${row.decision_token}&action=approve`;
  const declineUrl = `${url}/api/decision?token=${row.decision_token}&action=decline`;
  const noun = leave ? (row.leave_type === 'short' ? 'short leave request' : 'leave request') : 'step-out request';

  const html = shell(
    accent,
    `
    <h2 style="margin:0 0 4px;font-size:20px;">New ${noun}</h2>
    <p style="color:#555a78;margin:0;">${esc(row.employee_name)} has asked ${leave ? 'for leave' : 'to step out of the office'}.</p>
    ${detailsTable(row, balance, medicalNote)}
    <div>
      <a href="${approveUrl}" style="display:inline-block;background:${BLUE};color:#ffffff;text-decoration:none;padding:11px 24px;border-radius:9px;font-weight:600;margin-right:10px;">Approve</a>
      <a href="${declineUrl}" style="display:inline-block;background:#fce6e4;color:#b42318;text-decoration:none;padding:11px 24px;border-radius:9px;font-weight:600;">Decline</a>
    </div>
    <p style="color:#8a8fab;font-size:12px;margin-top:20px;">One click is all it takes. You can also decide in the app: <a href="${url}/manager" style="color:${BLUE};">${url.replace(/^https?:\/\//, '')}/manager</a></p>`
  );

  await getResend().emails.send({
    from: process.env.FROM_EMAIL,
    to: managerEmails(),
    subject: `${leave ? (row.leave_type === 'short' ? 'Short leave' : 'Leave') : 'Step-out'} request: ${row.employee_name} · ${d.when}`,
    html,
  });
}

export async function sendEmployeeDecisionEmail(row) {
  if (!row.employee_email) return;
  const approved = row.status === 'approved';
  const leave = row.kind === 'leave';
  const noun = leave ? (row.leave_type === 'short' ? 'short leave request' : 'leave request') : 'step-out request';
  const verb = approved ? 'approved' : 'declined';
  const color = approved ? '#157347' : '#b42318';

  const html = shell(
    leave ? PURPLE : BLUE,
    `
    <h2 style="margin:0 0 4px;font-size:20px;color:${color};">Your ${noun} was ${verb}</h2>
    <p style="color:#555a78;margin:0;">Hi ${esc(row.employee_name)}, your manager has ${verb} this request.</p>
    ${detailsTable(row)}`
  );

  try {
    await getResend().emails.send({
      from: process.env.FROM_EMAIL,
      to: row.employee_email,
      subject: `Your ${noun} was ${verb}`,
      html,
    });
  } catch (err) {
    console.error('Failed to send employee decision email', err);
  }
}

// Tells the manager that leave (or a step out) they had approved was cancelled by the staff member.
export async function sendManagerCancelledEmail(row) {
  const d = describe(row);
  const leave = row.kind === 'leave';
  const noun = leave ? (row.leave_type === 'short' ? 'short leave' : 'leave') : 'step out';
  const days = leave && row.days != null && ['annual', 'casual'].includes(row.leave_category) ? ` The ${Number(row.days) === 0.5 ? 'half day is' : Number(row.days) === 1 ? 'day is' : `${Number(row.days)} days are`} back on ${esc(row.employee_name)}'s ${esc(row.leave_category)} leave.` : '';
  const html = shell(
    leave ? PURPLE : BLUE,
    `
    <h2 style="margin:0 0 4px;font-size:20px;">${esc(row.employee_name)} cancelled approved ${noun}</h2>
    <p style="color:#555a78;margin:0;">Nothing for you to do.${days}</p>
    ${detailsTable(row)}`
  );
  await getResend().emails.send({
    from: process.env.FROM_EMAIL,
    to: managerEmails(),
    subject: `Cancelled: ${row.employee_name} · ${d.title} · ${d.when}`,
    html,
  });
}
