import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
const isConfigured = apiKey && apiKey !== "your-sendgrid-api-key";

if (isConfigured) {
  sgMail.setApiKey(apiKey!);
}

export interface SendReplyParams {
  to: string;
  subject: string;
  body: string;
  emailThread?: string | null;
}

export async function sendReply({ to, subject, body, emailThread }: SendReplyParams) {
  if (!isConfigured) {
    console.log("[SendGrid] Not configured (SENDGRID_API_KEY missing or placeholder) — skipping outbound email");
    return;
  }

  const fromEmail = process.env.EMAIL_FROM || "support@yourapp.com";

  const headers: Record<string, string> = {};
  if (emailThread) {
    headers["In-Reply-To"] = `<${emailThread}>`;
    headers["References"] = `<${emailThread}>`;
  }

  const msg: sgMail.MailDataRequired = {
    to,
    from: fromEmail,
    subject: `Re: ${subject}`,
    text: body,
    html: body.replace(/\n/g, "<br>"),
    headers,
  };

  try {
    await sgMail.send(msg);
    console.log(`[SendGrid] Reply sent to ${to} regarding "${subject}"`);
  } catch (err: any) {
    const sgErr = err?.response?.body || err;
    console.error(`[SendGrid] Failed to send to ${to}:`, JSON.stringify(sgErr, null, 2));
    throw err;
  }
}
