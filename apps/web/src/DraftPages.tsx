import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { listDrafts, photoBase64, removeDraft, resizePhoto, saveDraft, type Draft, type DraftPhoto } from './drafts';
import { account, api, type Member } from './member-api';
import { getNearbyStands, standUrl, type NearbyStand } from './stand-data';
import { navigate } from './navigation';
const LocationPicker = lazy(() => import('./LocationPicker').then(module => ({ default: module.LocationPicker })));

export function DraftList() {
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { listDrafts().then(setDrafts).catch(error => setError(error.message)); }, []);
  return <section className="contribution-page"><h1>My drafts</h1><p className="muted">Saved on this device. Browser storage can be cleared or run out.</p>
    {error && <p role="alert" className="form-error">{error}</p>}
    {!drafts && !error && <p role="status">Loading drafts…</p>}
    {drafts?.length === 0 && <p>No drafts yet. Choose <strong>Save a stand</strong> to capture a location.</p>}
    <ul className="draft-list">{drafts?.map(draft => <li key={draft.id}><a href={`/drafts/${draft.id}`}>{draft.name || draft.description.slice(0, 70) || 'Untitled stand'}</a>
      <p className="muted">{draft.photos.length} {draft.photos.length === 1 ? 'photo' : 'photos'} · Edited <time dateTime={draft.updatedAt}>{new Date(draft.updatedAt).toLocaleDateString()}</time></p>
      {draft.withdrawalPending && <p className="form-error">Withdrawal needs confirmation before resubmitting.</p>}
    </li>)}</ul>
  </section>;
}

export function PhotoPreviews({ photos, onRemove }: { photos: DraftPhoto[]; onRemove?: (id: string) => void }) {
  const [urls, setUrls] = useState<{ id: string; url: string }[]>([]);
  useEffect(() => {
    const next = photos.map(photo => ({ id: photo.id, url: URL.createObjectURL(photo.blob) })); setUrls(next);
    return () => next.forEach(photo => URL.revokeObjectURL(photo.url));
  }, [photos]);
  return <div className="photo-grid">{urls.map((photo, index) => <figure key={photo.id}><img src={photo.url} alt={`Stand photo ${index + 1}`} />
    {onRemove && <button type="button" className="secondary" onClick={() => onRemove(photo.id)}>Remove photo {index + 1}</button>}</figure>)}</div>;
}

export function DraftEditor({ id }: { id: string }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [accountError, setAccountError] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [nearby, setNearby] = useState<NearbyStand[]>([]);
  const [nearbyState, setNearbyState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [nearbyAttempt, setNearbyAttempt] = useState(0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const latest = useRef<Draft | null>(null); latest.current = draft;
  useEffect(() => {
    setLoaded(false); setDraft(null); setError('');
    listDrafts().then(drafts => { setDraft(drafts.find(draft => draft.id === id) ?? null); setLoaded(true); }).catch(error => { setError(error.message); setLoaded(true); });
    account().then(state => setMember(state.member)).catch(error => setAccountError(error.message));
  }, [id]);
  useEffect(() => {
    const changed = () => setOnline(navigator.onLine);
    window.addEventListener('online', changed); window.addEventListener('offline', changed);
    return () => { window.removeEventListener('online', changed); window.removeEventListener('offline', changed); };
  }, []);
  useEffect(() => {
    if (!draft || sending) return;
    setSaving(true); setSaved('Saving…');
    queue.current = queue.current.catch(() => {}).then(() => saveDraft(draft));
    queue.current.then(() => { if (latest.current === draft) { setSaved('Saved on this device'); setSaving(false); } })
      .catch(error => { if (latest.current === draft) { setError(error.message); setSaved('Not saved'); setSaving(false); } });
  }, [draft, sending]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (saving || saved === 'Not saved') { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', beforeUnload); return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [saving, saved]);
  useEffect(() => {
    if (draft?.latitude == null || draft.longitude == null || !Number.isFinite(draft.latitude) || !Number.isFinite(draft.longitude)
      || Math.abs(draft.latitude) > 90 || Math.abs(draft.longitude) > 180) { setNearbyState('idle'); return; }
    const controller = new AbortController(); setNearbyState('loading');
    getNearbyStands([draft.longitude, draft.latitude], 1, controller.signal).then(result => {
      if (!controller.signal.aborted) { setNearby(result.items); setNearbyState('ready'); }
    }).catch(() => { if (!controller.signal.aborted) setNearbyState('error'); });
    return () => controller.abort();
  }, [draft?.latitude, draft?.longitude, nearbyAttempt]);
  function change(patch: Partial<Draft>) { setError(''); setDraft(current => current ? { ...current, ...patch, updatedAt: new Date().toISOString() } : null); }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!draft) return;
    setError('');
    if (draft.latitude === null || draft.longitude === null) { setError('Place a location pin first.'); return; }
    if (!draft.name.trim() && !draft.description.trim()) { setError('Add a name or short description before submitting.'); return; }
    if (draft.price && (!Number.isFinite(Number(draft.price)) || Number(draft.price) < 0 || !/^[A-Za-z]{3}$/.test(draft.currency) || !draft.priceUnit.trim())) {
      setError('Price needs an amount, three-letter currency and sale unit.'); return;
    }
    setSending(true);
    try {
      await queue.current.catch(() => {}); await saveDraft(draft);
      await api('/api/submissions', { id: draft.id, sourceSubmissionId: draft.sourceSubmissionId ?? null,
        content: { latitude: draft.latitude, longitude: draft.longitude, name: draft.name.trim(), description: draft.description.trim(),
          price: draft.price === '' ? null : Number(draft.price), currency: draft.currency || null, priceUnit: draft.priceUnit || null,
          paymentMethods: draft.paymentMethods || null, hours: draft.hours || null, accessNotes: draft.accessNotes || null },
        photos: await Promise.all(draft.photos.map(async photo => ({ id: photo.id, contentType: 'image/jpeg', base64: await photoBase64(photo) }))) });
      await removeDraft(draft.id); navigate('/submissions');
    } catch (error) { setError((error as Error).message); setSending(false); }
  }
  if (!loaded) return <p role="status">Loading draft…</p>;
  if (!draft) return <section><h1>Draft unavailable</h1><p>{error || 'It may have been submitted or removed from this browser.'}</p><a href="/drafts">My drafts</a></section>;
  return <section className="contribution-page"><div className="page-heading"><h1>Save a stand</h1><span className="muted" role="status">{saved}</span></div>
    <p className="muted">Private until you submit it. Nothing appears on the public map before review.</p>
    {error && <div className="form-error" role="alert">{error}{saved === 'Not saved' && <button className="secondary" onClick={() => change({})}>Try saving again</button>}</div>}
    <form className="contribution-form" onSubmit={submit}><fieldset disabled={sending || processing}>
      <h2>Location</h2><p className="muted">Tap the map or drag the pin. You can also enter coordinates.</p>
      <Suspense fallback={<p>Loading map…</p>}><LocationPicker latitude={draft.latitude} longitude={draft.longitude} onChange={(latitude, longitude) => change({ latitude, longitude })} /></Suspense>
      <div className="field-pair"><label>Latitude<input type="number" step="any" min="-90" max="90" value={draft.latitude ?? ''} onChange={event => change({ latitude: event.target.value === '' ? null : Number(event.target.value) })} /></label>
        <label>Longitude<input type="number" step="any" min="-180" max="180" value={draft.longitude ?? ''} onChange={event => change({ longitude: event.target.value === '' ? null : Number(event.target.value) })} /></label></div>
      <h2>Stand details</h2>
      <label>Name<input maxLength={160} value={draft.name} onChange={event => change({ name: event.target.value })} /></label>
      <label>Short description<textarea rows={3} maxLength={2000} value={draft.description} onChange={event => change({ description: event.target.value })} /></label>
      <p className="muted">A name or description is enough. Everything below is optional.</p>
      <details><summary>Price, payment and access</summary><div className="optional-fields">
        <div className="field-pair"><label>Price amount<input type="number" min="0" max="99999999" step="0.01" value={draft.price} onChange={event => change({ price: event.target.value })} /></label>
          <label>Currency<input maxLength={3} placeholder="USD, CAD, EUR…" value={draft.currency} onChange={event => change({ currency: event.target.value.toUpperCase() })} /></label></div>
        <label>Sale unit<input maxLength={80} placeholder="bundle, bag…" value={draft.priceUnit} onChange={event => change({ priceUnit: event.target.value })} /></label>
        <label>Payment methods<input maxLength={300} value={draft.paymentMethods} onChange={event => change({ paymentMethods: event.target.value })} /></label>
        <label>Hours<input maxLength={500} value={draft.hours} onChange={event => change({ hours: event.target.value })} /></label>
        <label>Access notes<textarea maxLength={2000} rows={2} value={draft.accessNotes} onChange={event => change({ accessNotes: event.target.value })} /></label>
      </div></details>
      <h2>Photos <span className="muted">{draft.photos.length}/5</span></h2>
      <PhotoPreviews photos={draft.photos} onRemove={id => change({ photos: draft.photos.filter(photo => photo.id !== id) })} />
      <label>Add photos<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={draft.photos.length >= 5} onChange={async event => {
        const files = Array.from(event.target.files ?? []); event.target.value = '';
        if (draft.photos.length + files.length > 5) { setError('Use up to five photos per submission.'); return; }
        setProcessing(true); setError('');
        try { const photos = []; for (const file of files) photos.push(await resizePhoto(file)); change({ photos: [...draft.photos, ...photos] }); }
        catch (error) { setError((error as Error).message); } finally { setProcessing(false); }
      }} /></label><p className="muted">Photos are resized and kept with your draft until you submit.</p>
      {nearbyState === 'loading' && <p role="status">Checking nearby listings…</p>}
      {nearbyState === 'ready' && <aside className="nearby-check"><h2>Already listed nearby?</h2>{nearby.length ? <><p>Check these before adding a new stand.</p><ul>{nearby.map(item => <li key={item.stand.id}><a href={standUrl(item.stand)} target="_blank" rel="noreferrer">{item.stand.name}</a></li>)}</ul></> : <p>No listings within 1 mile. A separate nearby stand can still be submitted.</p>}</aside>}
      {nearbyState === 'error' && <p>Couldn’t check nearby listings. <button type="button" className="text-button" onClick={() => setNearbyAttempt(value => value + 1)}>Try again</button></p>}
      {!online ? <p role="status">You’re offline. Keep editing; submit when connected.</p> : draft.withdrawalPending ? <p className="form-error">Confirm withdrawal in My submissions before sending this draft again.</p> : member?.emailConfirmed && member.displayName ?
        <button className="button" disabled={saving || sending || processing || nearbyState !== 'ready'}>{sending ? 'Submitting…' : 'Submit for review'}</button> :
        <div><p>{accountError || (member ? 'Verify your email and choose a display name before submitting.' : 'Sign in to submit this draft for review.')}</p><a className="secondary" href="/account">{member ? 'Your account' : 'Sign in'}</a></div>}
    </fieldset></form>
    <p><a href="/drafts">Back to my drafts</a></p>
  </section>;
}
