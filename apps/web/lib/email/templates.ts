import { escapeHtml } from "../escape";

export function gateNotificationEmail(params: {
  videoTitle: string;
  viewerEmail: string;
  workspaceName: string;
}): string {
  // All user-provided values are HTML-escaped to prevent stored XSS
  // when rendered in email clients.
  const title = escapeHtml(params.videoTitle);
  const email = escapeHtml(params.viewerEmail);
  const workspace = escapeHtml(params.workspaceName);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: sans-serif; padding: 24px;">
  <h2>New email captured</h2>
  <p>A viewer submitted their email to watch a gated video.</p>
  <table style="border-collapse: collapse;">
    <tr><td style="padding: 4px 12px; font-weight: bold;">Workspace</td><td style="padding: 4px 12px;">${workspace}</td></tr>
    <tr><td style="padding: 4px 12px; font-weight: bold;">Video</td><td style="padding: 4px 12px;">${title}</td></tr>
    <tr><td style="padding: 4px 12px; font-weight: bold;">Email</td><td style="padding: 4px 12px;">${email}</td></tr>
  </table>
</body>
</html>`.trim();
}
