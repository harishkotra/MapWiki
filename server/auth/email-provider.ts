import type { EmailConfig, EmailUserConfig, SendVerificationRequestParams } from "next-auth/providers/email";

function text({ url, host }: { url: string; host: string }) {
  return `Sign in to ${host}\n${url}\n\n`;
}

function html({ url, host }: { url: string; host: string }) {
  const escapedHost = host.replace(/\./g, "&#8203;.");
  return `
<body style="background: #f7f8f8;">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: #ffffff; max-width: 600px; margin: auto; border-radius: 8px;">
    <tr>
      <td align="center"
        style="padding: 18px 0 8px; font-size: 22px; font-family: Arial, sans-serif; color: #1f2937;">
        Sign in to <strong>${escapedHost}</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <a href="${url}" target="_blank"
          style="font-size: 16px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 6px; padding: 10px 18px; background: #0f766e; display: inline-block; font-weight: 600;">
          Sign in
        </a>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0 24px 18px; font-size: 14px; line-height: 20px; font-family: Arial, sans-serif; color: #4b5563;">
        If you did not request this email, you can safely ignore it.
      </td>
    </tr>
  </table>
</body>
`;
}

async function sendVerificationRequest({ identifier, url, provider }: SendVerificationRequestParams) {
  const { host } = new URL(url);
  const endpoint = process.env.EMAIL_HTTP_ENDPOINT;

  if (!endpoint) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`MapWiki email sign-in link for ${identifier}: ${url}`);
      return;
    }

    throw new Error("EMAIL_HTTP_ENDPOINT is required to send email login links in production.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.EMAIL_HTTP_TOKEN ? { authorization: `Bearer ${process.env.EMAIL_HTTP_TOKEN}` } : {})
    },
    body: JSON.stringify({
      to: identifier,
      from: provider.from,
      subject: `Sign in to ${host}`,
      text: text({ url, host }),
      html: html({ url, host })
    })
  });

  if (!response.ok) {
    throw new Error(`Email provider request failed with ${response.status}.`);
  }
}

export function MapWikiEmailProvider(options: EmailUserConfig): EmailConfig {
  return {
    id: "email",
    type: "email",
    name: "Email",
    server: options.server ?? process.env.EMAIL_HTTP_ENDPOINT ?? "mapwiki-http-email",
    from: options.from ?? "MapWiki <noreply@example.com>",
    maxAge: options.maxAge ?? 24 * 60 * 60,
    sendVerificationRequest: options.sendVerificationRequest ?? sendVerificationRequest,
    options
  };
}

