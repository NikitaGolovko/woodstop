import { useEffect, useState } from 'react';
import { Discovery } from './Discovery';
import logo from '../../../assets/woodstop-logo-256.png';
import { getStand } from './stand-data';
import { captureDraft } from './drafts';
import { navigate } from './navigation';
import { DraftEditor, DraftList } from './DraftPages';
import { AccountPage } from './AccountPage';
import { MySubmissions, ReviewQueue } from './SubmissionPages';

export type Stand = {
  id: string; slug?: string; name: string; description: string; town: string; state: string;
  latitude: number; longitude: number; accessNotes: string | null; operatingStatus: string;
  price: number | null; priceUnit: string | null; currency: string; priceObservedAt: string | null;
  paymentMethods: string | null; paymentObservedAt: string | null; locationVerifiedAt: string; isDemo: boolean;
  hours?: string | null; photoUrls?: string[];
};
const date = (value: string) => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value));
const copyrightYear = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'America/New_York' }).format(new Date());
const directions = (s: Stand) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${s.latitude},${s.longitude}`)}`;

export function StandPage({ stand: s }: { stand: Stand }) {
  return <>
    <section className="stand-heading"><span className="eyebrow">ROADSIDE FIREWOOD</span>
      <h1>{s.name}</h1>{(s.town || s.state || s.operatingStatus === 'seasonal') && <p className="location">{[s.town, s.state].filter(Boolean).join(', ')}{s.operatingStatus === 'seasonal' && ' · Seasonal stand'}</p>}
      <p className="intro">{s.description}</p>
      {s.photoUrls && s.photoUrls.length > 0 && <div className="photo-grid">{s.photoUrls.map((url, index) => <img key={url} src={url} alt={`${s.name}, photo ${index + 1}`} />)}</div>}
    </section>
    <div className="details-grid"><section className="card"><h2>Before you stop</h2>
      <dl><div><dt>Price</dt><dd>{s.price === null ? 'Price unknown' : `${new Intl.NumberFormat('en-US', { style: 'currency', currency: s.currency }).format(s.price)} per ${s.priceUnit}`}</dd>
        {s.priceObservedAt && <small>Observed <time dateTime={s.priceObservedAt}>{date(s.priceObservedAt)}</time></small>}</div>
      <div><dt>Payment</dt><dd>{s.paymentMethods ?? 'Payment methods unknown'}</dd>{s.paymentObservedAt && <small>Observed <time dateTime={s.paymentObservedAt}>{date(s.paymentObservedAt)}</time></small>}</div>
      <div><dt>Availability</dt><dd>Current stock unknown</dd><small>Stock and prices can change. No inventory is guaranteed.</small></div></dl>
    </section><section className="card visit"><h2>Find the stand</h2>
      <p>{s.accessNotes ?? 'Access details and opening hours are unknown.'}</p>
      {s.hours && <p>Hours: {s.hours}</p>}
      <p className="coordinates">{s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}</p>
      <small>{s.isDemo ? 'Example location date' : 'Location reported'} <time dateTime={s.locationVerifiedAt}>{date(s.locationVerifiedAt)}</time></small>
      <a className="button" href={directions(s)} target="_blank" rel="noreferrer">{s.isDemo ? 'Preview directions link ↗' : 'Get directions ↗'}</a>
      <small>Opens Google Maps. Navigation may need a connection.</small>
    </section></div>
  </>;
}

export function App() {
  const [path, setPath] = useState(window.location.pathname);
  const id = /^\/stands\/([^/]+)\/?$/.exec(path)?.[1];
  const draftId = /^\/drafts\/([^/]+)\/?$/.exec(path)?.[1];
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState('');
  const [stand, setStand] = useState<Stand | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const changed = () => setPath(window.location.pathname);
    const clicked = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest?.('a');
      if (!link || link.target || link.hasAttribute('download')) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || url.pathname.startsWith('/api/') || url.hash && url.pathname === location.pathname) return;
      event.preventDefault(); navigate(url.pathname + url.search + url.hash); window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', changed); document.addEventListener('click', clicked);
    return () => { window.removeEventListener('popstate', changed); document.removeEventListener('click', clicked); };
  }, []);
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setState('loading');
    getStand(id, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      if (!result) { setState('missing'); return; }
      if (result.slug) window.history.replaceState(null, '', `/stands/${encodeURIComponent(result.slug)}${window.location.search}${window.location.hash}`);
      setStand(result); setState('ready');
    }).catch(error => { if (error.name !== 'AbortError') setState('error'); });
    return () => controller.abort();
  }, [id, attempt]);
  useEffect(() => { document.title = id && stand ? `${stand.name} | Woodstop` : 'Woodstop — Find firewood near you'; }, [id, stand]);
  return <><a className="skip" href="#main">Skip to content</a><header className="site-header"><a className="brand" href="/" aria-label="Woodstop home"><img src={logo} alt="woodstop" width="100" height="76" /></a><nav aria-label="Main navigation">{path !== '/' && <a href="/">Browse stands</a>}<a href="/drafts">My drafts</a><a href="/account">Account</a><button className="button" disabled={capturing} onClick={async () => {
      setCapturing(true); setCaptureError('');
      try { const draft = await captureDraft(); navigate(`/drafts/${draft.id}`); } catch (error) { setCaptureError((error as Error).message); } finally { setCapturing(false); }
    }}>{capturing ? 'Saving location…' : 'Save a stand'}</button></nav></header>
    <main id="main" className={path === '/' ? 'finder-main' : undefined}>{captureError && <p role="alert" className="form-error">{captureError}</p>}
      {draftId ? <DraftEditor key={draftId} id={draftId} /> : path === '/drafts' ? <DraftList /> : path === '/account' ? <AccountPage /> : path === '/submissions' ? <MySubmissions /> : path === '/review' ? <ReviewQueue /> : !id ? <Discovery /> :
      state === 'loading' ? <p role="status" className="message">Loading stand details…</p> :
      state === 'missing' ? <section className="message"><h1>Stand not found</h1><p>This listing may have been removed or is not publicly available.</p><a href="/">Back to Woodstop</a></section> :
      state === 'error' ? <section className="message" role="alert"><h1>We couldn’t load this stand</h1><p>Check your connection and try again.</p><button className="button" onClick={() => setAttempt(a => a + 1)}>Try again</button></section> :
      stand && <StandPage stand={stand}/>}
    </main><footer className="site-footer"><span className="copyright">© {copyrightYear} Woodstop</span><p>Listings may be incomplete or inaccurate. Buy local and check your destination’s firewood guidance.</p></footer></>;
}
