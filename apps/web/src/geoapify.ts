export const geoapifyKey = import.meta.env.VITE_GEOAPIFY_API_KEY?.trim() ?? '';

export type Destination = { label: string; latitude: number; longitude: number };

export async function searchDestinations(text: string, signal: AbortSignal): Promise<Destination[]> {
  if (!geoapifyKey) throw new Error('Destination search is unavailable. You can still use your location and browse the list.');
  const url = new URL('https://api.geoapify.com/v1/geocode/search');
  url.search = new URLSearchParams({ text, format: 'json', limit: '5', apiKey: geoapifyKey }).toString();
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('Destination search is unavailable. Please try again.');
  const data = await response.json();
  if (!Array.isArray(data.results)) throw new Error('Destination search returned an unexpected response.');
  return data.results.filter((r: { lat: number; lon: number; formatted: string }) =>
    Number.isFinite(r.lat) && Math.abs(r.lat) <= 90 && Number.isFinite(r.lon) && Math.abs(r.lon) <= 180 && typeof r.formatted === 'string'
  ).map((r: { lat: number; lon: number; formatted: string }) => ({ label: r.formatted, latitude: r.lat, longitude: r.lon }));
}
