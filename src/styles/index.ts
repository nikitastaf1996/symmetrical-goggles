/**
 * Shared color palette for trck (O8 — extracted from App.tsx).
 *
 * Light, minimalist palette inspired by minimalist running watches.
 * Deep navy is the accent for all numerals; gray for labels; very light
 * gray for dividers. The pause / signal-lost / saved / error colors are
 * used by both the inline banners in App.tsx and the extracted components.
 *
 * Keep this file dependency-free (no React / react-native imports) so it
 * can be imported from anywhere — components, hooks, utilities.
 */

export const COLOR = {
  bg: '#FFFFFF',
  primary: '#0A2463',        // deep navy — for all numerals
  secondary: '#6B7280',      // medium gray — for labels
  divider: '#E5E7EB',        // very light gray — for dividers
  accentStart: '#0A2463',    // navy — START button
  accentStop: '#DC2626',     // red — STOP button
  accentStopping: '#9CA3AF', // gray — STOPPING state
  // Phase 6: auto-pause / signal-lost palette.
  pauseAccent: '#D97706',    // amber — auto-paused indicator
  pauseBg: '#FFFBEB',        // light amber background for pause banner
  pauseBorder: '#FDE68A',    // amber border for pause banner
  signalLostAccent: '#DC2626', // red — signal-lost banner
  signalLostBg: '#FEF2F2',     // light red background for signal-lost banner
  signalLostBorder: '#FECACA', // red border for signal-lost banner
  gnssGreen: '#16A34A',
  gnssAmber: '#D97706',
  gnssRed: '#DC2626',
  gnssGray: '#9CA3AF',
  errorBg: '#FEF2F2',
  errorBorder: '#FECACA',
  errorText: '#991B1B',
  savedBg: '#F0FDF4',
  savedBorder: '#BBF7D0',
  savedText: '#166534',
} as const;

/**
 * Shared formatting helpers (O8 — extracted from App.tsx).
 *
 * `pad2`, `pluralRu`, `formatDuration`, `formatDistance`, `computeAvgPace`,
 * `computeCurrentPace` are pure functions used by both App.tsx and the
 * extracted components. They are also tested in `__tests__/` (see O12).
 */

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * U5: Russian plural-forms helper.
 *
 * Russian has three plural forms:
 *   - 1, 21, 31, …  → forms[0]  ("точка")
 *   - 2, 3, 4, 22, 23, 24, …  → forms[1]  ("точки")
 *   - 0, 5–20, 25–30, …  → forms[2]  ("точек")
 *
 * The 11–14 exception is handled by the mod100 check (11–14 all share the
 * same form as 5–20). The helper works for any noun — pass the three forms
 * in [one, few, many] order.
 */
export function pluralRu(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

// O24: This is duplicated in GpsRecorderService.kt (formatDuration). The two
// MUST stay in sync — if you change the format here, change the Kotlin
// version too. See CHANGELOG.md / TODO 4, O24 for context.
export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${pad2(m)}:${pad2(s)}`;
}

/**
 * Formats a distance in meters as a runner-friendly string with the unit
 * separated, so the UI can render the number largely and the unit small:
 *   - < 1500 m   -> { value: "123", unit: "m" }   (was: < 1000 m)
 *   - < 10000 m  -> { value: "1.50", unit: "km" } (2-decimal km)
 *   - >= 10000 m -> { value: "10.0", unit: "km" } (1-decimal km)
 *
 * U11: changed the m→km boundary from 1000 m to 1500 m so that 1000 m →
 * "1000 m" (not "1.00 km" — an abrupt precision drop). The 1500 m threshold
 * keeps the unit consistent within a typical short-run distance band and
 * only switches to km once 1.50 km reads cleaner than 1500 m.
 *
 * U11: also added a NaN / Infinity / negative guard so a buggy distance
 * accumulator can't render "NaN km" or "Infinity km" — falls back to "0 m".
 */
export function formatDistance(distanceM: number): { value: string; unit: string } {
  if (!Number.isFinite(distanceM) || distanceM < 0) return { value: '0', unit: 'm' };
  if (distanceM < 1500) return { value: String(Math.round(distanceM)), unit: 'm' };
  if (distanceM < 10000) return { value: (distanceM / 1000).toFixed(2), unit: 'km' };
  return { value: (distanceM / 1000).toFixed(1), unit: 'km' };
}

/**
 * Average pace from elapsed time and total distance, in "M:SS" per km.
 * Returns null if there is no measurable distance or elapsed time yet.
 *
 * Phase 6: when auto-pause is enabled, callers should pass the active moving
 * time (movingMs) instead of wall-clock elapsed time so paused intervals
 * don't inflate the displayed average pace.
 */
export function computeAvgPace(elapsedMs: number, distanceM: number): string | null {
  if (!distanceM || distanceM < 1) return null;
  if (!elapsedMs || elapsedMs < 1000) return null;
  const minutesTotal = elapsedMs / 60000.0;
  const km = distanceM / 1000.0;
  const pace = minutesTotal / km;
  if (!isFinite(pace) || pace <= 0) return null;
  const wholeMin = Math.floor(pace);
  const sec = Math.round((pace - wholeMin) * 60);
  if (sec === 60) return `${wholeMin + 1}:00`;
  return `${wholeMin}:${pad2(sec)}`;
}

/**
 * Current (instantaneous) pace from GPS speed (m/s), in "M:SS" per km.
 * Returns null if speed is missing or below the standing-still threshold.
 *
 * The threshold is 0.5 m/s (~1.8 km/h) — a slow shuffle. Anything below
 * this is either genuinely standing still or GPS noise around a stationary
 * user, and showing a "33:00 /km" pace in those moments is more confusing
 * than just showing "—".
 */
export function computeCurrentPace(speedMps: number | null | undefined): string | null {
  if (speedMps == null || speedMps <= 0.5) return null;  // ignore < 1.8 km/h (standing still / GPS noise)
  const paceSecPerKm = 1000 / speedMps;                  // seconds per km
  const wholeMin = Math.floor(paceSecPerKm / 60);
  const sec = Math.round(paceSecPerKm % 60);
  if (sec === 60) return `${wholeMin + 1}:00`;
  return `${wholeMin}:${pad2(sec)}`;
}

/**
 * Recording lifecycle state — same as App.tsx's RecordingState. Extracted
 * here so any future hooks / components can share the type.
 */
export type RecordingState = 'idle' | 'recording' | 'stopping';
