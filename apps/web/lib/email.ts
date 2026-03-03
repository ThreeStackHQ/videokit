import { Resend } from "resend";
import { env } from "./env";

let _resend: Resend | undefined;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(env.RESEND_API_KEY);
  }
  return _resend;
}

/** XSS-safe HTML escaping */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const FROM = "VideoKit <noreply@videokit.io>";

// ---------------------------------------------------------------------------
// Magic Link
// ---------------------------------------------------------------------------

export async function sendMagicLinkEmail({
  to,
  url,
}: {
  to: string;
  url: string;
}): Promise<void> {
  const safeUrl = escapeHtml(url);
  const safeEmail = escapeHtml(to);

  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Sign in to VideoKit",
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Sign in to VideoKit</title></head>
<body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#1e293b;border-radius:12px;padding:40px;">
    <h1 style="color:#3b82f6;margin:0 0 8px;">VideoKit ⚡</h1>
    <p style="color:#94a3b8;margin:0 0 32px;font-size:14px;">Branded video hosting for indie SaaS</p>
    <p style="margin:0 0 24px;">Hey <strong>${safeEmail}</strong>,</p>
    <p style="margin:0 0 32px;color:#cbd5e1;">Click the button below to sign in to your VideoKit account. This link expires in 24 hours.</p>
    <a href="${safeUrl}"
       style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">
      Sign in to VideoKit
    </a>
    <p style="margin:32px 0 0;font-size:12px;color:#475569;">
      If you didn't request this, you can safely ignore this email.
      <br>This link will expire in 24 hours.
    </p>
  </div>
</body>
</html>`,
  });
}

// ---------------------------------------------------------------------------
// Welcome Email
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail({
  to,
  name,
  dashboardUrl,
}: {
  to: string;
  name: string;
  dashboardUrl: string;
}): Promise<void> {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(dashboardUrl);

  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Welcome to VideoKit! 🎬",
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Welcome to VideoKit</title></head>
<body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#1e293b;border-radius:12px;padding:40px;">
    <h1 style="color:#3b82f6;margin:0 0 8px;">Welcome to VideoKit ⚡</h1>
    <p style="color:#94a3b8;margin:0 0 32px;font-size:14px;">Branded video hosting for indie SaaS</p>
    <p style="margin:0 0 24px;">Hey ${safeName}! 👋</p>
    <p style="margin:0 0 16px;color:#cbd5e1;">You're now on the <strong>free plan</strong>. Here's what you get:</p>
    <ul style="color:#94a3b8;margin:0 0 32px;padding-left:20px;line-height:1.8;">
      <li>5 videos (up to 500 MB storage)</li>
      <li>Branded player — no ads, no watermarks</li>
      <li>Direct MP4 delivery via Cloudflare R2</li>
    </ul>
    <p style="margin:0 0 24px;color:#cbd5e1;">Upgrade to <strong>Indie ($9/mo)</strong> for CTA overlays, email gates &amp; analytics.</p>
    <a href="${safeUrl}"
       style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">
      Go to Dashboard
    </a>
  </div>
</body>
</html>`,
  });
}

// ---------------------------------------------------------------------------
// Weekly Digest
// ---------------------------------------------------------------------------

export interface DigestVideoStat {
  title: string;
  plays: number;
  completionRate: number;
}

export interface DigestData {
  workspaceName: string;
  topVideos: DigestVideoStat[];
  totalNewCaptures: number;
  unsubscribeUrl: string;
  period: string;
}

export async function sendWeeklyDigestEmail({
  to,
  data,
}: {
  to: string;
  data: DigestData;
}): Promise<void> {
  const safeName = escapeHtml(data.workspaceName);
  const safeUnsub = escapeHtml(data.unsubscribeUrl);
  const safePeriod = escapeHtml(data.period);

  const videoRows = data.topVideos
    .map(
      (v) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #334155;color:#e2e8f0;">${escapeHtml(v.title)}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #334155;color:#94a3b8;text-align:right;">${v.plays.toLocaleString()}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #334155;color:#94a3b8;text-align:right;">${(v.completionRate * 100).toFixed(0)}%</td>
    </tr>`,
    )
    .join("");

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `VideoKit Weekly Digest — ${data.period}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>VideoKit Weekly Digest</title></head>
<body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#1e293b;border-radius:12px;padding:40px;">
    <h1 style="color:#3b82f6;margin:0 0 4px;">VideoKit ⚡</h1>
    <p style="color:#94a3b8;margin:0 0 32px;font-size:13px;">Weekly Digest — ${safePeriod}</p>
    <p style="margin:0 0 24px;">Here's how <strong>${safeName}</strong> performed this week:</p>

    ${
      data.topVideos.length > 0
        ? `<table style="width:100%;border-collapse:collapse;margin:0 0 32px;">
      <thead>
        <tr style="background:#0f172a;">
          <th style="padding:10px 16px;text-align:left;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Video</th>
          <th style="padding:10px 16px;text-align:right;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Plays</th>
          <th style="padding:10px 16px;text-align:right;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Completion</th>
        </tr>
      </thead>
      <tbody>${videoRows}</tbody>
    </table>`
        : `<p style="color:#475569;margin:0 0 32px;">No video plays recorded this week.</p>`
    }

    <div style="background:#0f172a;border-radius:8px;padding:20px;margin:0 0 32px;">
      <p style="margin:0;color:#94a3b8;font-size:14px;">
        📧 <strong style="color:#e2e8f0;">${data.totalNewCaptures}</strong> new email captures this week
      </p>
    </div>

    <p style="margin:0;font-size:12px;color:#334155;">
      <a href="${safeUnsub}" style="color:#475569;">Unsubscribe from weekly digest</a>
    </p>
  </div>
</body>
</html>`,
  });
}
