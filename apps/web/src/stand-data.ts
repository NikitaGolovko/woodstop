import type { Stand } from './App';

export const isSampleBuild = import.meta.env.MODE === 'sample';
export type NearbyStand = { stand: Stand; distanceMiles: number };
export const standUrl = (stand: Stand) => `/stands/${encodeURIComponent(stand.slug || stand.id)}`;

async function sampleStands(signal: AbortSignal): Promise<Stand[]> {
  const { default: stands } = await import('./sample/stands.json');
  signal.throwIfAborted();
  return stands as Stand[];
}

// Only the fictional static preview uses client-side great-circle distances.
// The normal app continues to query SQL Server geography through the API.
function sampleDistance(latitude: number, longitude: number, stand: Stand) {
  const radians = (value: number) => value * Math.PI / 180;
  const lat = radians(stand.latitude - latitude);
  const lon = radians(stand.longitude - longitude);
  const a = Math.sin(lat / 2) ** 2 + Math.cos(radians(latitude)) * Math.cos(radians(stand.latitude)) * Math.sin(lon / 2) ** 2;
  return 3958.7613 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
}

export async function getNearbyStands(center: [number, number], radius: number, signal: AbortSignal): Promise<{ items: NearbyStand[]; truncated: boolean }> {
  if (isSampleBuild) {
    const stands = await sampleStands(signal);
    return { items: stands.map(stand => ({ stand, distanceMiles: sampleDistance(center[1], center[0], stand) }))
      .filter(item => item.distanceMiles <= radius)
      .sort((a, b) => a.distanceMiles - b.distanceMiles || a.stand.id.localeCompare(b.stand.id)), truncated: false };
  }
  const params = new URLSearchParams({ longitude: String(center[0]), latitude: String(center[1]), radiusMiles: String(radius) });
  const response = await fetch(`/api/stands?${params}`, { signal });
  if (!response.ok) throw new Error('Could not load nearby stands.');
  return response.json();
}

export async function getStand(id: string, signal: AbortSignal): Promise<Stand | null> {
  if (isSampleBuild) return (await sampleStands(signal)).find(stand => stand.id.toLowerCase() === id.toLowerCase() || stand.slug?.toLowerCase() === id.toLowerCase()) ?? null;
  const path = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id) ? encodeURIComponent(id) : `by-slug/${encodeURIComponent(id)}`;
  const response = await fetch(`/api/stands/${path}`, { signal });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Could not load stand.');
  return response.json();
}
