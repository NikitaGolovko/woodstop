import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import type { Stand } from './App';
import { searchDestinations, type Destination } from './geoapify';
const StandMap = lazy(() => import('./StandMap').then(module => ({ default: module.StandMap })));

export type NearbyStand = { stand: Stand; distanceMiles: number };
const initialCenter: [number, number] = [-70.44, 43.68];

export function Discovery() {
  const [center, setCenter] = useState<[number, number]>(initialCenter);
  const [area, setArea] = useState('Southern Maine');
  const [radius, setRadius] = useState(10);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [query, setQuery] = useState('');
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [searchState, setSearchState] = useState('');
  const [searching, setSearching] = useState(false);
  const searchRequest = useRef<AbortController | null>(null);
  const [items, setItems] = useState<NearbyStand[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [truncated, setTruncated] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [locationStatus, setLocationStatus] = useState('');
  const [locating, setLocating] = useState(false);
  const locationRequest = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    setState('loading'); setItems([]); setSelected(null); setTruncated(false);
    const params = new URLSearchParams({ longitude: String(center[0]), latitude: String(center[1]), radiusMiles: String(radius) });
    fetch(`/api/stands?${params}`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Unavailable');
      const data = await response.json();
      setItems(data.items); setTruncated(data.truncated); setState('ready');
    }).catch(error => { if (error.name !== 'AbortError') setState('error'); });
    return () => controller.abort();
  }, [center, radius, attempt]);
  useEffect(() => () => { searchRequest.current?.abort(); locationRequest.current++; }, []);

  function explore(point: [number, number], label: string) {
    locationRequest.current++; setLocating(false);
    setCenter(point); setArea(label); setDestinations([]); setSearchState('');
  }
  async function search(event: FormEvent) {
    event.preventDefault();
    searchRequest.current?.abort();
    const controller = new AbortController(); searchRequest.current = controller;
    setSearching(true); setSearchState('Searching destinations…'); setDestinations([]);
    try {
      const matches = await searchDestinations(query.trim(), controller.signal);
      if (controller.signal.aborted) return;
      setDestinations(matches); setSearchState(matches.length ? 'Choose a destination.' : 'No destinations found. Try a nearby town or a fuller address.');
    } catch (error) {
      if (!controller.signal.aborted) setSearchState(error instanceof Error ? error.message : 'Search failed. Please try again.');
    } finally { if (!controller.signal.aborted) setSearching(false); }
  }
  function locate() {
    if (!navigator.geolocation) { setLocationStatus('Location is unavailable. Search for a destination or move the map instead.'); return; }
    const request = ++locationRequest.current;
    setLocating(true); setLocationStatus('Finding your location…');
    navigator.geolocation.getCurrentPosition(position => {
      if (request !== locationRequest.current) return;
      explore([position.coords.longitude, position.coords.latitude], 'Your location'); setLocationStatus('');
    }, () => {
      if (request !== locationRequest.current) return;
      setLocating(false); setLocationStatus('We couldn’t access your location. Search for a destination or move the map instead.');
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }
  return <section className="discovery">
    <div className="finder-heading"><span className="eyebrow">YOUR NEXT FIREWOOD STOP</span><h1>Find firewood near you.</h1><p>Explore roadside stands near your next stop.</p></div>
    <form className="destination-search" onSubmit={search}>
      <label htmlFor="destination">Where are you headed?</label>
      <div className="search-row"><input id="destination" type="search" placeholder="Town, campsite, park or address" value={query} maxLength={200} required onChange={event => {
        setQuery(event.target.value); searchRequest.current?.abort(); setSearching(false); setDestinations([]); setSearchState('');
      }} /><button className="button" disabled={searching}>Search</button></div>
      {searchState && <p role="status">{searchState}</p>}
      {destinations.length > 0 && <ul className="destination-results">{destinations.map((destination, index) => <li key={index}><button type="button" onClick={() => {
        explore([destination.longitude, destination.latitude], destination.label);
      }}>{destination.label}</button></li>)}</ul>}
    </form>
    <div className="finder-controls"><button className="secondary" onClick={locate} disabled={locating}>Use my location</button>
      <label className="radius">Within <select value={radius} onChange={event => setRadius(Number(event.target.value))}>{[10, 25, 50, 100].map(value => <option key={value} value={value}>{value} miles</option>)}</select></label>
      <div className="view-switch" role="group" aria-label="Results view"><button aria-pressed={view === 'map'} onClick={() => setView('map')}>Map</button><button aria-pressed={view === 'list'} onClick={() => setView('list')}>List</button></div>
    </div>
    {locationStatus && <p role="status">{locationStatus}</p>}
    <p className="coverage">{area} · Coverage is growing; listings may be incomplete.</p>
    {view === 'map' && <Suspense fallback={<p role="status">Loading map…</p>}><StandMap center={center} items={items} onSelect={setSelected} onExplore={point => explore(point, 'Map area')} /></Suspense>}
    <section className="nearby-results" aria-label="Nearby stands" aria-busy={state === 'loading'}>
      <h2>Nearby stands</h2><p className="muted">Nearest first · Straight-line distances</p>
      {state === 'loading' && <p role="status">Looking for nearby stands…</p>}
      {state === 'error' && <div role="alert"><p>We couldn’t load nearby stands. Check your connection and try again.</p><button className="secondary" onClick={() => setAttempt(value => value + 1)}>Try again</button></div>}
      {state === 'ready' && items.length === 0 && <div className="empty-results"><h3>No listed stands within {radius} miles</h3><p>Try a wider radius or another destination. This doesn’t mean there are no stands in the area.</p></div>}
      {truncated && <p role="status">Showing the nearest 200 stands. Narrow your radius to see a smaller area.</p>}
      <ul className="nearby-list">{items.map(({ stand, distanceMiles }) => <li key={stand.id} className={stand.id === selected ? 'selected' : ''}>
        <div><h3><a href={`/stands/${stand.id}`}>{stand.name}</a></h3><p>{[stand.town, stand.state].filter(Boolean).join(', ')} · {distanceMiles.toFixed(1)} miles straight-line</p>
        <p>{stand.price === null ? 'Price unknown' : `${new Intl.NumberFormat('en-US', { style: 'currency', currency: stand.currency }).format(stand.price)} per ${stand.priceUnit}`} · Stock unknown</p>
        {stand.operatingStatus === 'seasonal' && <p>Seasonal · Dates unknown</p>}
        {stand.isDemo && <p className="demo-label">Fictional demo stand. Do not travel to this location.</p>}</div>
        <a className="secondary" href={`/stands/${stand.id}`}>View stand</a>
      </li>)}</ul>
    </section>
    <aside className="guidance"><strong>Buy near where you burn.</strong><p>Check your destination’s firewood guidance. Listings do not guarantee stock or that wood is permitted at your destination.</p></aside>
  </section>;
}
