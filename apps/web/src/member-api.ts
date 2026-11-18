
export type Member = { email: string; displayName: string; emailConfirmed: boolean; isAdmin: boolean; developmentVerification: boolean };
export type AccountState = { member: Member | null; googleEnabled: boolean; emailRegistrationEnabled: boolean };

export async function api<T>(path: string, data?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (data !== undefined) {
    headers['X-Woodstop-Request'] = '1';
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(path, { method: data === undefined ? 'GET' : 'POST', headers, credentials: 'same-origin', cache: 'no-store',
    ...(data === undefined ? {} : { body: JSON.stringify(data) }) }).catch(() => { throw new Error('Couldn’t reach Woodstop. Check your connection and try again.'); });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.detail || (response.status === 401 ? 'Sign in to continue.' : response.status === 429 ? 'Too many attempts. Please try again later.' : 'The request failed. Your draft is still saved.'));
  }
  if (response.headers.get('content-type')?.includes('application/json')) return response.json();
  const body = await response.text();
  if (body.trim()) throw new Error('The submission service is unavailable.');
  return undefined as T;
}

export async function account(): Promise<AccountState> {
  return api('/api/account');
}
