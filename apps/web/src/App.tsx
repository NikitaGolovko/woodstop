import { useEffect, useState } from 'react';

export type Stand = {
  id: string; name: string; description: string; town: string; state: string;
  latitude: number; longitude: number; accessNotes: string | null; operatingStatus: string;
  price: number | null; priceUnit: string | null; currency: string; priceObservedAt: string | null;
  paymentMethods: string | null; paymentObservedAt: string | null; locationVerifiedAt: string; isDemo: boolean;
};
const demoId = '11111111-1111-4111-8111-111111111111';
const date = (value: string) => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value));
const directions = (s: Stand) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${s.latitude},${s.longitude}`)}`;

export function StandPage({ stand: s }: { stand: Stand }) {
  return <>
    {s.isDemo && <aside className="demo">Development preview · Fictional stand. Do not travel to this location.</aside>}
    <section className="stand-heading"><span className="eyebrow">ROADSIDE FIREWOOD</span>
      <h1>{s.name}</h1><p className="location">{s.town}, {s.state}{s.operatingStatus === 'seasonal' && ' · Seasonal stand'}</p>
      <p className="intro">{s.description}</p>
    </section>
    <div className="details-grid"><section className="card"><h2>Before you stop</h2>
      <dl><div><dt>Price</dt><dd>{s.price === null ? 'Price unknown' : `${new Intl.NumberFormat('en-US', { style: 'currency', currency: s.currency }).format(s.price)} per ${s.priceUnit}`}</dd>
        {s.priceObservedAt && <small>Observed {date(s.priceObservedAt)}</small>}</div>
      <div><dt>Payment</dt><dd>{s.paymentMethods ?? 'Payment methods unknown'}</dd>{s.paymentObservedAt && <small>Observed {date(s.paymentObservedAt)}</small>}</div>
      <div><dt>Availability</dt><dd>Current stock unknown</dd><small>Stock and prices can change. No inventory is guaranteed.</small></div></dl>
    </section><section className="card visit"><h2>Find the stand</h2>
      <p>{s.accessNotes ?? 'Access details and opening hours are unknown.'}</p>
      <p className="coordinates">{s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}</p>
      <small>{s.isDemo ? 'Example location date' : 'Location verified'} {date(s.locationVerifiedAt)}</small>
      <a className="button" href={directions(s)} target="_blank" rel="noreferrer">{s.isDemo ? 'Preview directions link ↗' : 'Get directions ↗'}</a>
      <small>Opens Google Maps. Navigation may need a connection.</small>
    </section></div>
    <aside className="guidance"><strong>Buy near where you burn.</strong><p>Check your destination’s firewood guidance before you travel. A nearby stand does not establish that wood is permitted at your destination.</p></aside>
  </>;
}

export function App() {
  const match = /^\/stands\/([0-9a-f-]{36})\/?$/i.exec(window.location.pathname);
  const id = match?.[1];
  const [stand, setStand] = useState<Stand | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setState('loading');
    fetch(`/api/stands/${id}`, { signal: controller.signal }).then(async response => {
      if (response.status === 404) { setState('missing'); return; }
      if (!response.ok) throw new Error('Request failed');
      setStand(await response.json()); setState('ready');
    }).catch(error => { if (error.name !== 'AbortError') setState('error'); });
    return () => controller.abort();
  }, [id, attempt]);
  useEffect(() => { document.title = stand ? `${stand.name} | Woodstop` : 'Woodstop — Find firewood near you'; }, [stand]);
  return <><a className="skip" href="#main">Skip to content</a><header><a className="brand" href="/">woodstop<span>●</span></a><span>Find firewood near you.</span></header>
    <main id="main">{!id ? <section className="welcome"><span className="eyebrow">YOUR NEXT FIREWOOD STOP</span><h1>A good fire starts nearby.</h1><p>We’re building a simpler way to find roadside firewood. Explore the first stand detail preview.</p><a className="button" href={`/stands/${demoId}`}>View demo stand →</a><p className="muted">Development preview. Nearby search and real listings are coming later.</p></section> :
      state === 'loading' ? <p role="status" className="message">Loading stand details…</p> :
      state === 'missing' ? <section className="message"><h1>Stand not found</h1><p>This listing may have been removed or is not publicly available.</p><a href="/">Back to Woodstop</a></section> :
      state === 'error' ? <section className="message" role="alert"><h1>We couldn’t load this stand</h1><p>Check your connection and try again.</p><button className="button" onClick={() => setAttempt(a => a + 1)}>Try again</button></section> :
      stand && <StandPage stand={stand}/>}
    </main><footer>woodstop · Less searching. More time by the fire.</footer></>;
}
