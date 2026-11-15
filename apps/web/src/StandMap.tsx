import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { geoapifyKey } from './geoapify';
import type { NearbyStand } from './Discovery';

// Bundle the separate MapLibre worker rather than resolving it from Vite's dependency cache.
maplibregl.setWorkerUrl(workerUrl);

type Props = {
  center: [number, number]; items: NearbyStand[];
  onSelect: (id: string) => void; onExplore: (center: [number, number]) => void;
};

export function StandMap({ center, items, onSelect, onExplore }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const callbacks = useRef({ onSelect, onExplore });
  callbacks.current = { onSelect, onExplore };
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!container.current || !geoapifyKey) return;
    let instance: maplibregl.Map;
    try {
      instance = new maplibregl.Map({
        container: container.current,
        style: `https://maps.geoapify.com/v1/styles/osm-carto/style.json?apiKey=${encodeURIComponent(geoapifyKey)}`,
        center, zoom: 9, attributionControl: false
      });
    } catch { setError(true); return; }
    map.current = instance;
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    instance.addControl(new maplibregl.AttributionControl({ compact: false }), 'bottom-right');
    instance.on('error', () => setError(true));
    instance.on('load', () => {
      setError(false);
      instance.addSource('stands', { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, cluster: true, clusterRadius: 45, clusterMaxZoom: 13 });
      instance.addLayer({ id: 'clusters', type: 'circle', source: 'stands', filter: ['has', 'point_count'], paint: { 'circle-color': '#234d38', 'circle-radius': 23, 'circle-stroke-color': '#fffefa', 'circle-stroke-width': 2 } });
      instance.addLayer({ id: 'cluster-count', type: 'symbol', source: 'stands', filter: ['has', 'point_count'], layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 14 }, paint: { 'text-color': '#fffefa' } });
      instance.addLayer({ id: 'stand-pins', type: 'circle', source: 'stands', filter: ['!', ['has', 'point_count']], paint: { 'circle-color': '#99522f', 'circle-radius': 14, 'circle-stroke-width': 3, 'circle-stroke-color': '#fffefa' } });
      instance.on('click', 'stand-pins', event => {
        const id = event.features?.[0]?.properties?.id;
        if (id) callbacks.current.onSelect(String(id));
      });
      instance.on('click', 'clusters', async event => {
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== 'Point') return;
        try {
          const zoom = await (instance.getSource('stands') as GeoJSONSource).getClusterExpansionZoom(Number(feature.properties?.cluster_id));
          instance.easeTo({ center: feature.geometry.coordinates as [number, number], zoom });
        } catch { setError(true); }
      });
      for (const layer of ['stand-pins', 'clusters']) {
        instance.on('mouseenter', layer, () => { instance.getCanvas().style.cursor = 'pointer'; });
        instance.on('mouseleave', layer, () => { instance.getCanvas().style.cursor = ''; });
      }
      setReady(true);
    });
    return () => { instance.remove(); map.current = null; };
    // The map is created once; subsequent center/data changes use the effects below.
  }, []);
  useEffect(() => { map.current?.easeTo({ center }); }, [center]);
  useEffect(() => {
    if (!ready || !map.current) return;
    (map.current.getSource('stands') as GeoJSONSource).setData({ type: 'FeatureCollection', features: items.map(({ stand }) => ({
      type: 'Feature', properties: { id: stand.id }, geometry: { type: 'Point', coordinates: [stand.longitude, stand.latitude] }
    })) });
  }, [items, ready]);
  return <section className="map-panel" aria-label="Stand map">
    <div ref={container} className="stand-map" />
    {!geoapifyKey && <div className="map-notice"><h2>The map is unavailable</h2><p>You can still browse nearby stands in the list below.</p></div>}
    {error && <p className="map-error" role="status">The map could not fully load. You can still use the stand list.</p>}
    {ready && <button className="map-explore" onClick={() => {
      const point = map.current!.getCenter(); callbacks.current.onExplore([point.lng, point.lat]);
    }}>Search this area</button>}
    <a className="provider-credit" href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Powered by Geoapify</a>
  </section>;
}
