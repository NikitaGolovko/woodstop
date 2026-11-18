import { createAuth, localDevelopment } from './auth';
import type { Content, Env, PhotoInput, SubmissionRow } from './types';
import published from '../src/sample/stands.json';

const guid = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const json = (data: unknown, status = 200, headers?: HeadersInit) => Response.json(data, { status, headers: {
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...Object.fromEntries(new Headers(headers))
} });
const message = (text: string, status = 400) => json({ message: text }, status);
const summary = (row: SubmissionRow) => ({ id: row.id, content: JSON.parse(row.content_json), status: row.status,
  published: published.some(stand => stand.id === row.id), rejectionReason: row.rejection_reason,
  revision: row.revision, createdAt: row.created_at, updatedAt: row.updated_at });

async function readBody(request: Request, limit: number): Promise<Request> {
  if (!request.body) return request;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    length += part.value.length;
    if (length > limit) { await reader.cancel(); throw new Error('body-limit'); }
    chunks.push(part.value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const part of chunks) { bytes.set(part, offset); offset += part.length; }
  return new Request(request, { body: bytes });
}

function parseContent(value: unknown): Content {
  if (!value || typeof value !== 'object') throw new Error('Place a location pin and add a name or description.');
  const c = value as Record<string, unknown>;
  if (typeof c.latitude !== 'number' || !Number.isFinite(c.latitude) || Math.abs(c.latitude) > 90
    || typeof c.longitude !== 'number' || !Number.isFinite(c.longitude) || Math.abs(c.longitude) > 180) throw new Error('Place a valid location pin.');
  const text = (key: string, max: number) => {
    const input = c[key];
    if (input == null || input === '') return null;
    if (typeof input !== 'string' || input.length > max) throw new Error(`${key} is too long or invalid.`);
    return input.trim() || null;
  };
  const name = text('name', 160) ?? '', description = text('description', 2000) ?? '';
  if (!name && !description) throw new Error('Add a name or short description.');
  const price = c.price == null ? null : c.price;
  const currency = text('currency', 3)?.toUpperCase() ?? null, priceUnit = text('priceUnit', 80);
  if (price !== null && (typeof price !== 'number' || !Number.isFinite(price) || price < 0 || price > 99999999
    || Math.round(price * 100) !== price * 100 && Math.abs(Math.round(price * 100) - price * 100) > 0.000001
    || !currency || !/^[A-Z]{3}$/.test(currency) || !priceUnit)) throw new Error('Price needs an amount, three-letter currency and sale unit.');
  if (price === null && (currency || priceUnit)) throw new Error('Include an amount with currency and sale unit, or leave all three blank.');
  return { latitude: c.latitude, longitude: c.longitude, name, description, price: price as number | null, currency, priceUnit,
    paymentMethods: text('paymentMethods', 300), hours: text('hours', 500), accessNotes: text('accessNotes', 2000) };
}

function jpegSize(bytes: Uint8Array): boolean {
  if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216 || bytes[bytes.length - 2] !== 255 || bytes[bytes.length - 1] !== 217) return false;
  let position = 2;
  while (position + 4 < bytes.length) {
    if (bytes[position++] !== 255) return false;
    while (bytes[position] === 255) position++;
    const marker = bytes[position++];
    if (marker === 218 || marker === 217) return false;
    const size = (bytes[position] << 8) + bytes[position + 1];
    if (size < 2 || position + size > bytes.length) return false;
    if ([192, 193, 194].includes(marker)) {
      if (size < 8) return false;
      const height = (bytes[position + 3] << 8) + bytes[position + 4], width = (bytes[position + 5] << 8) + bytes[position + 6];
      return width > 0 && height > 0 && width <= 1600 && height <= 1600;
    }
    position += size;
  }
  return false;
}

function parsePhotos(value: unknown): { input: PhotoInput; bytes: Uint8Array }[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 5) throw new Error('Use up to five photos.');
  const ids = new Set<string>();
  return value.map(photo => {
    if (!photo || !guid.test(photo.id) || ids.has(photo.id) || photo.contentType !== 'image/jpeg'
      || typeof photo.base64 !== 'string' || photo.base64.length > 1400000) throw new Error('A photo is invalid or too large.');
    ids.add(photo.id);
    const bytes = Uint8Array.from(atob(photo.base64), char => char.charCodeAt(0));
    if (bytes.length > 1048576 || !jpegSize(bytes)) throw new Error('Use JPEG photos up to 1600 pixels and 1 MB.');
    return { input: { id: photo.id, contentType: 'image/jpeg', base64: photo.base64 }, bytes };
  });
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url), path = url.pathname;
  const db = env.INBOX_DB;
  const configured = db && env.APP_ORIGIN && env.BETTER_AUTH_SECRET && env.BETTER_AUTH_SECRET.length >= 32;
  if (!configured) return message('Submissions are not connected yet. Your drafts are saved on this device.', 503);
  if (url.origin !== env.APP_ORIGIN) return message('The account service is not configured for this website address.', 503);
  request = await readBody(request, path === '/api/submissions' ? 8 * 1024 * 1024 : 32000);
  const auth = createAuth(env, url);
  if (path.startsWith('/api/auth/')) return auth.handler(request);
  const local = localDevelopment(env, url);
  const googleEnabled = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  const session = await auth.api.getSession({ headers: request.headers });
  const admin = !!session && (env.ADMIN_USER_IDS ?? '').split(',').map(id => id.trim()).includes(session.user.id);
  if (path === '/api/account' && request.method === 'GET') return json({
    member: session ? { email: session.user.email, displayName: session.user.displayName ?? '', emailConfirmed: session.user.emailVerified, isAdmin: admin, developmentVerification: local } : null,
    googleEnabled, emailRegistrationEnabled: local || !!(env.RESEND_API_KEY && env.EMAIL_FROM)
  });
  if (request.method === 'POST') {
    if (request.headers.get('Origin') !== env.APP_ORIGIN || request.headers.get('X-Woodstop-Request') !== '1'
      || !request.headers.get('Content-Type')?.startsWith('application/json')) return message('Refresh the page and try again.', 403);
  }
  const body = request.method === 'POST' ? await request.clone().json() as Record<string, unknown> : {};
  const authRequest = (endpoint: string, body: unknown) => {
    const headers = new Headers(request.headers); headers.delete('Content-Length');
    return auth.handler(new Request(`${url.origin}/api/auth/${endpoint}`, { method: 'POST', headers, body: JSON.stringify(body) }));
  };
  if (path === '/api/account/register' && request.method === 'POST') {
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
    if (!displayName || displayName.length > 60 || /[\x00-\x1f]/.test(displayName)) return message('Choose a display name of 1–60 characters.');
    return authRequest('sign-up/email', { email: body.email, password: body.password, name: displayName, displayName, callbackURL: `${url.origin}/account` });
  }
  if (path === '/api/account/login' && request.method === 'POST') return authRequest('sign-in/email', { email: body.email, password: body.password });
  if (path === '/api/account/logout' && request.method === 'POST') return authRequest('sign-out', {});
  if (path === '/api/account/google' && request.method === 'GET' && googleEnabled) {
    const headers = new Headers(request.headers); headers.set('Origin', url.origin); headers.set('Content-Type', 'application/json');
    const response = await auth.handler(new Request(`${url.origin}/api/auth/sign-in/social`, { method: 'POST', headers,
      body: JSON.stringify({ provider: 'google', callbackURL: `${url.origin}/account` }) }));
    const data = await response.json() as { url?: string };
    if (!response.ok || !data.url) return message('Google sign-in is unavailable.', 503);
    const resultHeaders = new Headers(response.headers); resultHeaders.set('Location', data.url); resultHeaders.delete('Content-Type');
    return new Response(null, { status: 302, headers: resultHeaders });
  }
  const publicPhoto = /^\/api\/listing-photos\/([\da-f-]+)\/([\da-f-]+)$/.exec(path);
  if (publicPhoto && request.method === 'GET') {
    if (!published.some(stand => stand.id === publicPhoto[1])) return message('Not found.', 404);
    const photo = await db.prepare(`SELECT p.bytes, p.content_type FROM submission_photos p JOIN submissions s ON s.id = p.submission_id
      WHERE p.submission_id = ? AND p.id = ? AND s.status = 'approved'`).bind(publicPhoto[1], publicPhoto[2]).first<{ bytes: ArrayBuffer; content_type: string }>();
    return photo ? new Response(photo.bytes, { headers: { 'Content-Type': photo.content_type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox" } }) : message('Not found.', 404);
  }
  if (!session) return message('Sign in to continue.', 401);
  if (path === '/api/account/profile' && request.method === 'POST') {
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
    if (!displayName || displayName.length > 60 || /[\x00-\x1f]/.test(displayName)) return message('Choose a display name of 1–60 characters.');
    return authRequest('update-user', { name: displayName, displayName });
  }
  if (path === '/api/account/development-verify' && request.method === 'POST' && local) {
    await auth.api.sendVerificationEmail({ body: { email: session.user.email, callbackURL: `${url.origin}/account` }, headers: request.headers });
    const mail = await db.prepare('SELECT url FROM dev_mail WHERE email = ?').bind(session.user.email).first<{ url: string }>();
    if (!mail) return message('Could not prepare local verification.', 500);
    const result = await auth.handler(new Request(mail.url, { headers: request.headers }));
    if (result.status >= 400) return message('Local verification failed.', 400);
    const headers = new Headers(); for (const cookie of result.headers.getSetCookie()) headers.append('Set-Cookie', cookie);
    return json({ ok: true }, 200, headers);
  }
  if (path === '/api/submissions' && request.method === 'GET') {
    const rows = await db.prepare('SELECT * FROM submissions WHERE user_id = ? ORDER BY created_at DESC').bind(session.user.id).all<SubmissionRow>();
    return json(rows.results.map(summary));
  }
  const detail = /^\/api\/submissions\/([\da-f-]+)$/.exec(path);
  if (detail && request.method === 'GET') {
    const row = await db.prepare('SELECT * FROM submissions WHERE id = ? AND (user_id = ? OR ? = 1)').bind(detail[1], session.user.id, admin ? 1 : 0).first<SubmissionRow>();
    if (!row) return message('Not found.', 404);
    const photos = await db.prepare('SELECT id, content_type, bytes FROM submission_photos WHERE submission_id = ? ORDER BY id').bind(row.id).all<{ id: string; content_type: string; bytes: number[] }>();
    return json({ ...summary(row), photos: photos.results.map(photo => ({ id: photo.id, contentType: photo.content_type,
      base64: btoa(Array.from(new Uint8Array(photo.bytes), byte => String.fromCharCode(byte)).join('')) })) });
  }
  if (path === '/api/submissions' && request.method === 'POST') {
    if (!session.user.emailVerified || !session.user.displayName?.trim() || session.user.displayName.length > 60 || /[\x00-\x1f]/.test(session.user.displayName))
      return message('Verify your email and choose a display name before submitting.', 403);
    if (typeof body.id !== 'string' || !guid.test(body.id)) return message('The draft identifier is invalid.');
    let content: Content, photos: ReturnType<typeof parsePhotos>;
    try { content = parseContent(body.content); photos = parsePhotos(body.photos); } catch (error) { return message((error as Error).message); }
    const source = body.sourceSubmissionId == null ? null : String(body.sourceSubmissionId);
    if (source && !guid.test(source)) return message('The previous submission identifier is invalid.');
    if (source) {
      const prior = await db.prepare("SELECT id FROM submissions WHERE id = ? AND user_id = ? AND status IN ('rejected', 'withdrawn')").bind(source, session.user.id).first();
      if (!prior) return message('The previous submission is still pending or cannot be revised.', 409);
    }
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ content, photos: photos.map(p => p.input), source })))), b => b.toString(16).padStart(2, '0')).join('');
    const existing = await db.prepare('SELECT * FROM submissions WHERE id = ?').bind(body.id).first<SubmissionRow>();
    if (existing) return existing.user_id === session.user.id && existing.content_hash === hash && existing.status !== 'withdrawn'
      ? json(summary(existing)) : message('This draft was already submitted with different content. Check My submissions.', 409);
    const recent = await db.prepare('SELECT COUNT(*) AS total FROM submissions WHERE user_id = ? AND created_at > ?').bind(session.user.id, new Date(Date.now() - 3600000).toISOString()).first<{ total: number }>();
    if ((recent?.total ?? 0) >= 20) return message('You’ve reached the hourly submission limit. Your draft is still saved.', 429);
    const now = new Date().toISOString();
    const insert = db.prepare('INSERT INTO submissions (id, user_id, content_json, content_hash, created_at, updated_at, source_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(body.id, session.user.id, JSON.stringify(content), hash, now, now, source);
    try {
      await db.batch([insert, ...photos.map(photo => db.prepare('INSERT INTO submission_photos (id, submission_id, content_type, bytes) VALUES (?, ?, ?, ?)')
        .bind(photo.input.id, body.id, photo.input.contentType, photo.bytes))]);
    } catch {
      const retry = await db.prepare('SELECT * FROM submissions WHERE id = ?').bind(body.id).first<SubmissionRow>();
      return retry && retry.user_id === session.user.id && retry.content_hash === hash ? json(summary(retry)) : message('Could not complete submission. Your local draft is safe; please retry.', 409);
    }
    return json(summary((await db.prepare('SELECT * FROM submissions WHERE id = ?').bind(body.id).first<SubmissionRow>())!));
  }
  const withdraw = /^\/api\/submissions\/([\da-f-]+)\/withdraw$/.exec(path);
  if (withdraw && request.method === 'POST') {
    const result = await db.prepare("UPDATE submissions SET status = 'withdrawn', revision = revision + 1, updated_at = ? WHERE id = ? AND user_id = ? AND status = 'pending' AND revision = ?")
      .bind(new Date().toISOString(), withdraw[1], session.user.id, body.revision).run();
    if (result.meta.changes === 1) return json({ ok: true });
    const prior = await db.prepare('SELECT status, revision FROM submissions WHERE id = ? AND user_id = ?').bind(withdraw[1], session.user.id).first<{ status: string; revision: number }>();
    return prior?.status === 'withdrawn' && prior.revision === Number(body.revision) + 1
      ? json({ ok: true }) : message('This submission changed. Refresh My submissions.', 409);
  }
  if (path.startsWith('/api/review')) {
    if (!admin) return message('Administrator access is required.', 403);
    if (path === '/api/review' && request.method === 'GET') {
      const rows = await db.prepare("SELECT * FROM submissions WHERE status = 'pending' ORDER BY created_at").all<SubmissionRow>();
      return json(rows.results.map(summary));
    }
    if (path === '/api/review/export' && request.method === 'GET') {
      const rows = await db.prepare("SELECT * FROM submissions WHERE status = 'approved' ORDER BY created_at").all<SubmissionRow>();
      const merged = new Map<string, unknown>(published.map(stand => [stand.id, stand]));
      for (const row of rows.results) {
        if (merged.has(row.id)) continue; // Preserve editorial changes to already published JSON.
        const c = JSON.parse(row.content_json) as Content;
        const photos = await db.prepare('SELECT id FROM submission_photos WHERE submission_id = ? ORDER BY id').bind(row.id).all<{ id: string }>();
        merged.set(row.id, { id: row.id, slug: row.approved_slug, name: c.name || c.description.slice(0, 80), description: c.description, town: '', state: '',
          latitude: c.latitude, longitude: c.longitude, accessNotes: c.accessNotes, hours: c.hours, operatingStatus: 'active', price: c.price,
          currency: c.currency ?? '', priceUnit: c.priceUnit, priceObservedAt: null, paymentMethods: c.paymentMethods, paymentObservedAt: null,
          locationVerifiedAt: row.created_at, isDemo: false, photoUrls: photos.results.map(photo => `/api/listing-photos/${row.id}/${photo.id}`) });
      }
      return json([...merged.values()], 200, { 'Content-Disposition': 'attachment; filename="stands.json"' });
    }
    const review = /^\/api\/review\/([\da-f-]+)$/.exec(path);
    if (review && request.method === 'POST') {
      const row = await db.prepare('SELECT * FROM submissions WHERE id = ?').bind(review[1]).first<SubmissionRow>();
      if (!row) return message('Not found.', 404);
      if (row.status !== 'pending' || row.revision !== body.revision) return message('This submission changed. Refresh the queue.', 409);
      if (typeof body.approve !== 'boolean') return message('Choose approve or reject.');
      const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
      if (!body.approve && (!reason || reason.length > 500)) return message('Provide a rejection reason of 1–500 characters.');
      const content = JSON.parse(row.content_json) as Content;
      const basis = (content.name || content.description.slice(0, 80)).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 180) || 'stand';
      let slug = basis, suffix = 2;
      if (body.approve) while (published.some(stand => stand.slug === slug) || await db.prepare('SELECT id FROM submissions WHERE approved_slug = ? AND id <> ?').bind(slug, row.id).first()) slug = `${basis}-${suffix++}`;
      const now = new Date().toISOString(), status = body.approve ? 'approved' : 'rejected';
      try {
        const results = await db.batch([
          db.prepare("UPDATE submissions SET status = ?, rejection_reason = ?, approved_slug = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND status = 'pending' AND revision = ?")
            .bind(status, body.approve ? null : reason, body.approve ? slug : null, now, row.id, row.revision),
          db.prepare('INSERT INTO moderation_actions (id, submission_id, admin_id, action, reason, created_at) SELECT ?, ?, ?, ?, ?, ? WHERE changes() = 1')
            .bind(crypto.randomUUID(), row.id, session.user.id, status, body.approve ? null : reason, now)
        ]);
        if (results[0].meta.changes !== 1) return message('Another review changed this submission. Refresh the queue.', 409);
      } catch { return message('Another listing took this URL. Refresh and retry the review.', 409); }
      return json({ ok: true });
    }
  }
  return message('Not found.', 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!new URL(request.url).pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      const response = await handleApi(request, env);
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-store'); headers.set('X-Content-Type-Options', 'nosniff');
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }
    catch (error) {
      if (error instanceof SyntaxError) return message('The request could not be read.');
      if ((error as Error).message === 'body-limit') return message('The submission is too large. Use up to five resized photos.', 413);
      console.error('Inbox request failed:', (error as Error).name);
      return message('The submission service is unavailable. Your draft is still saved; please retry.', 503);
    }
  }
};
