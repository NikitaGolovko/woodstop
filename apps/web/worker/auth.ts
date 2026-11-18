import { betterAuth } from 'better-auth';
import type { Env } from './types';

export const localDevelopment = (env: Env, url: URL) => env.LOCAL_DEVELOPMENT === 'true' && ['localhost', '127.0.0.1'].includes(url.hostname);
export function createAuth(env: Env, url: URL) {
  const local = localDevelopment(env, url);
  const origin = env.APP_ORIGIN!;
  const emailEnabled = local || !!(env.RESEND_API_KEY && env.EMAIL_FROM);
  async function sendMail(email: string, subject: string, link: string) {
    if (local) {
      await env.INBOX_DB!.prepare('INSERT OR REPLACE INTO dev_mail (email, url) VALUES (?, ?)').bind(email, link).run();
      return;
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: email, subject, text: `${subject}\n\n${link}\n\nIf you did not request this, you can ignore this email.` })
    });
    if (!response.ok) throw new Error('Could not deliver account email.');
  }
  return betterAuth({
    appName: 'Woodstop', baseURL: origin, secret: env.BETTER_AUTH_SECRET!, database: env.INBOX_DB!,
    trustedOrigins: [origin],
    user: { additionalFields: { displayName: { type: 'string', required: false, defaultValue: '' } } },
    account: { accountLinking: { enabled: false } },
    session: { expiresIn: 60 * 60 * 24 * 7, cookieCache: { enabled: false } },
    emailAndPassword: { enabled: emailEnabled, minPasswordLength: 10, maxPasswordLength: 128, requireEmailVerification: !local,
      sendResetPassword: async ({ user, url }) => sendMail(user.email, 'Reset your Woodstop password', url) },
    emailVerification: { sendOnSignUp: true, autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => sendMail(user.email, 'Verify your Woodstop email', url) },
    socialProviders: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? { google: {
      clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET
    } } : {},
    rateLimit: { enabled: !local, storage: 'database', window: 60, max: 50 },
    advanced: { useSecureCookies: !local, ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] } }
  });
}
