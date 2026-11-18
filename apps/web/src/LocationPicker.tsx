import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { geoapifyKey } from './geoapify';
maplibregl.setWorkerUrl(workerUrl);

export function LocationPicker({ latitude, longitude, onChange, readOnly = false }: { latitude: number | null; longitude: number | null; onChange: (latitude: number, longitude: number) => void; readOnly?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const change = useRef(onChange); change.current = onChange;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!container.current || !geoapifyKey) return;
    let instance: maplibregl.Map;
    try {
      instance = new maplibregl.Map({ container: container.current, style: `https://maps.geoapify.com/v1/styles/osm-carto/style.json?apiKey=${encodeURIComponent(geoapifyKey)}`,
        center: [longitude ?? -70.44, latitude ?? 43.68], zoom: latitude === null ? 9 : 15, attributionControl: { compact: false } });
    } catch { setError(true); return; }
    map.current = instance;
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    instance.on('load', () => setReady(true));
    instance.on('error', () => setError(true));
    if (!readOnly) instance.on('click', event => change.current(event.lngLat.lat, event.lngLat.lng));
    return () => { marker.current?.remove(); marker.current = null; instance.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    if (!ready || !map.current || latitude === null || longitude === null || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return;
    if (!marker.current) {
      marker.current = new maplibregl.Marker({ draggable: !readOnly, color: '#234d38' }).setLngLat([longitude, latitude]).addTo(map.current);
      marker.current.on('dragend', () => { const point = marker.current!.getLngLat(); change.current(point.lat, point.lng); });
    } else marker.current.setLngLat([longitude, latitude]);
  }, [latitude, longitude, ready]);
  return <div className="map-panel"><div ref={container} className="draft-map" aria-label="Choose stand location on map" />
    {!geoapifyKey && <div className="map-notice"><p>Map unavailable. Enter the coordinates below.</p></div>}
    {error && <p className="map-error" role="status">Map unavailable. You can enter coordinates below.</p>}
    <a className="provider-credit" href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Powered by Geoapify</a>
  </div>;
}
