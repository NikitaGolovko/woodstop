import { lazy, Suspense, useEffect, useState } from 'react';
import { api } from './member-api';
import { saveDraft, type Draft } from './drafts';
import { navigate } from './navigation';
import { PhotoPreviews } from './DraftPages';
const LocationPicker = lazy(() => import('./LocationPicker').then(module => ({ default: module.LocationPicker })));

type Content = { latitude: number; longitude: number; name: string; description: string; price: number | null; currency: string | null;
  priceUnit: string | null; paymentMethods: string | null; hours: string | null; accessNotes: string | null };
type Submission = { id: string; content: Content; status: 'pending' | 'approved' | 'rejected' | 'withdrawn'; published: boolean;
  rejectionReason: string | null; revision: number; createdAt: string; updatedAt: string;
  photos?: { id: string; contentType: string; base64: string }[] };
const title = (submission: Submission) => submission.content.name || submission.content.description.slice(0, 70);
const label = (submission: Submission) => submission.published ? 'Published' : ({ pending: 'Pending review', approved: 'Approved · Awaiting publication', rejected: 'Needs revision', withdrawn: 'Withdrawn' }[submission.status]);

function restore(submission: Submission, withdrawalPending: boolean): Draft {
  const c = submission.content, now = new Date().toISOString();
  return { id: crypto.randomUUID(), latitude: c.latitude, longitude: c.longitude, name: c.name, description: c.description,
    price: c.price === null ? '' : String(c.price), currency: c.currency ?? '', priceUnit: c.priceUnit ?? '', paymentMethods: c.paymentMethods ?? '',
    hours: c.hours ?? '', accessNotes: c.accessNotes ?? '', createdAt: now, updatedAt: now,
    sourceSubmissionId: submission.id, withdrawalPending,
    photos: (submission.photos ?? []).map(photo => ({ id: crypto.randomUUID(), blob: new Blob([Uint8Array.from(atob(photo.base64), char => char.charCodeAt(0))], { type: photo.contentType }) })) };
}

export function MySubmissions() {
  const [items, setItems] = useState<Submission[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState<{ submission: Submission; draft: Draft } | null>(null);
  const load = () => api<Submission[]>('/api/submissions').then(setItems).catch(error => setError(error.message));
  useEffect(() => { load(); }, []);
  async function revise(item: Submission, withdraw: boolean) {
    setBusy(true); setError('');
    try {
      const detail = await api<Submission>(`/api/submissions/${item.id}`);
      if (withdraw && detail.status !== 'pending' || !withdraw && detail.status !== 'rejected') throw new Error('This submission changed. Refresh the page.');
      const draft = restore(detail, withdraw);
      await saveDraft(draft); // Preserve content AND photos locally before changing server state.
      if (withdraw) { setWaiting({ submission: detail, draft }); await completeWithdrawal(detail, draft); }
      else navigate(`/drafts/${draft.id}`);
    } catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  async function completeWithdrawal(submission: Submission, draft: Draft) {
    await api(`/api/submissions/${submission.id}/withdraw`, { revision: submission.revision });
    const editable = { ...draft, withdrawalPending: false }; await saveDraft(editable); setWaiting(null); navigate(`/drafts/${draft.id}`);
  }
  return <section className="contribution-page"><h1>My submissions</h1><p><a href="/drafts">My drafts</a> · <a href="/account">Your account</a></p>
    {error && <div className="form-error" role="alert"><p>{error}</p>{waiting ? <><p>Your content was copied to a local draft. The original is retained until withdrawal completes.</p>
      <button className="secondary" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await completeWithdrawal(waiting.submission, waiting.draft); } catch (error) { setError((error as Error).message); } finally { setBusy(false); } }}>Retry withdrawal</button></> : <a href="/account">Sign in or check your account</a>}</div>}
    {!items && !error && <p role="status">Loading submissions…</p>}
    {items?.length === 0 && <p>No submissions yet. Save a stand to get started.</p>}
    <ul className="draft-list">{items?.map(item => <li key={item.id}><h2>{title(item)}</h2><span className="status-label">{label(item)}</span>
      <p className="muted">Submitted <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString()}</time></p>
      {item.rejectionReason && <p>{item.rejectionReason}</p>}
      {item.status === 'pending' && <button className="secondary" disabled={busy} onClick={() => revise(item, true)}>Withdraw to draft</button>}
      {item.status === 'rejected' && <button className="secondary" disabled={busy} onClick={() => revise(item, false)}>Revise and resubmit</button>}
    </li>)}</ul>
  </section>;
}

export function ReviewQueue() {
  const [items, setItems] = useState<Submission[] | null>(null);
  const [detail, setDetail] = useState<Submission | null>(null);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const load = () => api<Submission[]>('/api/review').then(setItems);
  useEffect(() => { load().catch(error => setError(error.message)); }, []);
  async function review(approve: boolean) {
    if (!detail) return;
    setBusy(true); setError('');
    try { await api(`/api/review/${detail.id}`, { revision: detail.revision, approve, reason }); setDetail(null); setReason(''); await load(); }
    catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  const photos = detail ? restore(detail, false).photos : [];
  return <section className="contribution-page"><h1>Review listings</h1>
    <p><a href="/account">Your account</a> · <a href="/api/review/export" download="stands.json">Download approved listings JSON</a></p>
    <p className="muted">Approval adds a listing to the export. Publish it by updating the site’s listings JSON and redeploying.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    {!items && !error && <p role="status">Loading review queue…</p>}
    {items?.length === 0 && <p>No listings awaiting review.</p>}
    <div className="review-layout"><ul className="draft-list">{items?.map(item => <li key={item.id}><button className="text-button" disabled={busy} onClick={async () => {
      setError(''); setReason(''); try { setDetail(await api<Submission>(`/api/submissions/${item.id}`)); } catch (error) { setError((error as Error).message); }
    }}>{title(item)}</button><p className="muted">{item.content.latitude.toFixed(5)}, {item.content.longitude.toFixed(5)}</p></li>)}</ul>
      {detail && <section className="review-detail"><h2>{title(detail)}</h2><p>{detail.content.description}</p>
        <p>Location: {detail.content.latitude.toFixed(5)}, {detail.content.longitude.toFixed(5)}</p>
        <Suspense fallback={<p>Loading map…</p>}><LocationPicker key={detail.id} latitude={detail.content.latitude} longitude={detail.content.longitude} readOnly onChange={() => {}} /></Suspense>
        <dl>{Object.entries(detail.content).filter(([key, value]) => !['name', 'description', 'latitude', 'longitude'].includes(key) && value !== null && value !== '').map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl>
        <PhotoPreviews photos={photos} />
        <label className="review-reason">Rejection reason<textarea maxLength={500} rows={3} value={reason} onChange={event => setReason(event.target.value)} /></label>
        <div className="actions"><button className="button" disabled={busy} onClick={() => review(true)}>Approve listing and photos</button><button className="secondary" disabled={busy || !reason.trim()} onClick={() => review(false)}>Reject with reason</button></div>
      </section>}
    </div>
  </section>;
}
