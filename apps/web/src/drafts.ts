export type DraftPhoto = { id: string; blob: Blob };
export type Draft = {
  id: string; latitude: number | null; longitude: number | null; name: string; description: string;
  price: string; currency: string; priceUnit: string; paymentMethods: string; hours: string; accessNotes: string;
  photos: DraftPhoto[]; createdAt: string; updatedAt: string; sourceSubmissionId?: string; withdrawalPending?: boolean;
};

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('woodstop-local', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Device storage is unavailable. Keep this page open and try again.'));
    request.onblocked = () => reject(new Error('Close other Woodstop tabs and try again.'));
  });
}

export async function saveDraft(draft: Draft): Promise<void> {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('drafts', 'readwrite');
      transaction.objectStore('drafts').put(draft);
      transaction.oncomplete = () => resolve();
      transaction.onerror = transaction.onabort = () => reject(new Error('Could not save this draft. Device storage may be full. Keep this page open and try again.'));
    });
  } finally { db.close(); }
}

export async function listDrafts(): Promise<Draft[]> {
  const db = await database();
  try {
    return await new Promise<Draft[]>((resolve, reject) => {
      const request = db.transaction('drafts').objectStore('drafts').getAll();
      request.onsuccess = () => resolve((request.result as Draft[]).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      request.onerror = () => reject(new Error('Could not read your saved drafts.'));
    });
  } finally { db.close(); }
}

export async function removeDraft(id: string) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('drafts', 'readwrite');
      transaction.objectStore('drafts').delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = transaction.onabort = () => reject(new Error('Submission received, but the local draft could not be removed. Retry cleanup from this page.'));
    });
  } finally { db.close(); }
}

export async function captureDraft(): Promise<Draft> {
  const now = new Date().toISOString();
  const draft: Draft = { id: crypto.randomUUID(), latitude: null, longitude: null, name: '', description: '', price: '', currency: '',
    priceUnit: '', paymentMethods: '', hours: '', accessNotes: '', photos: [], createdAt: now, updatedAt: now };
  if (navigator.geolocation) {
    const position = await new Promise<GeolocationPosition | null>(resolve => navigator.geolocation.getCurrentPosition(resolve, () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }));
    if (position) { draft.latitude = position.coords.latitude; draft.longitude = position.coords.longitude; }
  }
  await saveDraft(draft);
  return draft;
}

export async function resizePhoto(file: File): Promise<DraftPhoto> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 30 * 1024 * 1024)
    throw new Error('Choose a JPEG, PNG or WebP photo under 30 MB.');
  const image = await createImageBitmap(file).catch(() => { throw new Error('This photo could not be opened. Try a JPEG or PNG.'); });
  try {
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Photo processing is unavailable.');
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.8, 0.65, 0.5, 0.4]) {
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('Could not resize photo.')), 'image/jpeg', quality));
      if (blob.size <= 1048576) return { id: crypto.randomUUID(), blob };
    }
    throw new Error('This photo is still too large after resizing. Choose a smaller image.');
  } finally { image.close(); }
}

export function photoBase64(photo: DraftPhoto): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('A saved photo could not be read.')); reader.readAsDataURL(photo.blob);
  });
}
