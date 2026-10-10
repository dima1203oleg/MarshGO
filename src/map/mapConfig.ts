import type { StyleSpecification } from 'maplibre-gl';
import type { MapTheme } from './MapAdapter';
import { buildFallbackStyle } from './style/buildStyle';
import { parseMapAssetManifest } from './style/manifest';

const styleUrl = (import.meta.env.VITE_MAP_STYLE_URL as string | undefined)?.trim();
const tileUrl = (import.meta.env.VITE_MAP_TILE_URL as string | undefined)?.trim();
const attribution = (import.meta.env.VITE_MAP_TILE_ATTRIBUTION as string | undefined)?.trim() || '© OpenStreetMap contributors';
const manifestUrl = (import.meta.env.VITE_MAP_STYLE_MANIFEST_URL as string | undefined)?.trim();

const defaultVectorStyle = 'https://tiles.openfreemap.org/styles/bright';
// An owned raster tile URL must stay authoritative. If we expose the public
// vector style here, styleForLayer() replaces the fixture/owned style before
// MapLibre initializes and deployments silently fetch unrelated tiles.
export const configuredMapStyleUrl = styleUrl || (tileUrl ? '' : defaultVectorStyle);
export const mapAttribution = attribution;

/** Prefer the versioned MARSHGO style manifest. Raster URL remains a compatibility path for owned tile services. */
export function createFallbackMapStyle(): StyleSpecification {
  return buildFallbackStyle('MARSHGO_NAVIGATION_LIGHT', tileUrl || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution);
}

export function mapTilesConfigured(): boolean { return true; }

export async function resolveMapAssets(theme: MapTheme) {
  if (manifestUrl) {
    const response = await fetch(manifestUrl, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error('MAP_MANIFEST_UNAVAILABLE');
    const manifest = parseMapAssetManifest(await response.json());
    const style = manifest.styles[theme];
    if (!style) throw new Error('MAP_STYLE_MISSING');
    return { style, styles: manifest.styles, mapDataVersion: manifest.mapDataVersion, styleVersion: manifest.styleVersion };
  }
  // Honour an explicitly configured raster source when there is no hosted style.
  // This keeps owned tile services and isolated map fixtures usable without
  // silently falling back to the public OpenFreeMap style.
  const style = styleUrl || (tileUrl ? createFallbackMapStyle() : defaultVectorStyle);
  return { style, styles: undefined, mapDataVersion: undefined, styleVersion: undefined };
}
