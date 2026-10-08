import type { Coordinate, Maneuver } from '../../shared/navigation/contracts';

/** Turn-by-turn guidance on the client: where the next manoeuvre is along the route and how to say it (Ukrainian). */
const EARTH_RADIUS_M = 6_371_000;
export function distanceBetween(a: Coordinate, b: Coordinate): number {
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad, dLon = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(Math.min(1, h)));
}

export interface PreparedGuidance { route: Coordinate[]; cumulative: number[]; steps: Array<Maneuver & { vertex: number }> }

function nearestVertex(route: Coordinate[], point: Coordinate, from = 0): number {
  let best = from, bestDistance = Infinity;
  for (let index = from; index < route.length; index++) {
    const distance = distanceBetween(route[index], point);
    if (distance < bestDistance) { bestDistance = distance; best = index; }
  }
  return best;
}

/** Ties every manoeuvre to its route vertex once per route version, so the per-GPS-fix work is a single scan. */
export function prepareGuidance(route: Coordinate[], maneuvers: Maneuver[]): PreparedGuidance {
  const cumulative = [0];
  for (let index = 1; index < route.length; index++) cumulative.push(cumulative[index - 1] + distanceBetween(route[index - 1], route[index]));
  let cursor = 0;
  const steps = maneuvers.map((maneuver) => { cursor = nearestVertex(route, maneuver.location, cursor); return { ...maneuver, vertex: cursor }; });
  return { route, cumulative, steps };
}

/** Index of the route vertex the driver has reached (the nearest one, never behind the previous). */
export function progressVertex(route: Coordinate[], position: Coordinate, from = 0): number {
  // Look only a bounded window ahead of the last progress, so a route that passes near itself cannot make the progress leap forward.
  let best = from, bestDistance = Infinity;
  for (let index = from; index < Math.min(route.length, from + 400); index++) {
    const distance = distanceBetween(route[index], position);
    if (distance < bestDistance) { bestDistance = distance; best = index; }
  }
  return best;
}

export function bearingBetween(a: Coordinate, b: Coordinate): number {
  const rad = Math.PI / 180, dLon = (b[0] - a[0]) * rad, lat1 = a[1] * rad, lat2 = b[1] * rad;
  const y = Math.sin(dLon) * Math.cos(lat2), x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) / rad) % 360 + 360) % 360;
}

/**
 * Direction of the planned road at the driver's place: from the position to a point `lookAheadMeters` further along the route.
 * Null when the driver is off the route (more than `maxOffsetMeters` away) or the route is finished.
 */
export function routeBearingAhead(route: Coordinate[], vertex: number, position: Coordinate, lookAheadMeters = 45, maxOffsetMeters = 80): number | null {
  if (route.length < 2) return null;
  // Re-find the driver's place on the road from the last known progress (the stored vertex can lag behind on long, sparse highway geometry).
  const start = Math.max(0, Math.min(vertex, route.length - 1) - 3);
  const nearest = progressVertex(route, position, start);
  if (nearest >= route.length - 1) return null;
  // The driver sits between vertex `nearest - 1` and `nearest + 1`: pick the closer of the two neighbouring segments' far ends.
  if (distanceBetween(route[nearest], position) > maxOffsetMeters) return null;
  let target = nearest + 1, travelled = distanceBetween(position, route[target]);
  // A vertex we have just passed (or are standing on) must not turn the arrow backwards: always look at a point ahead of it.
  while (travelled < lookAheadMeters && target < route.length - 1) { travelled += distanceBetween(route[target], route[target + 1]); target++; }
  return bearingBetween(route[nearest], route[target]);
}

export interface GuidanceState { next: Maneuver | null; distanceMeters: number; currentStreet: string | null; remainingMeters: number }

/** The next manoeuvre ahead of the driver and the distance to it, measured along the road (not as the crow flies). */
export function nextGuidance(prepared: PreparedGuidance, position: Coordinate): GuidanceState | null {
  const { route, cumulative, steps } = prepared;
  if (route.length < 2) return null;
  const current = nearestVertex(route, position);
  const offset = distanceBetween(position, route[current]);
  const along = cumulative[current];
  const total = cumulative[cumulative.length - 1];
  let previousStreet: string | null = null;
  for (const step of steps) {
    if (step.type === 'DEPART') { previousStreet = step.streetName ?? previousStreet; continue; }
    if (step.vertex > current || (step.type === 'ARRIVE' && step.vertex >= current)) {
      return { next: step, distanceMeters: Math.max(0, cumulative[step.vertex] - along - (step.vertex > current ? 0 : offset)), currentStreet: previousStreet, remainingMeters: Math.max(0, total - along) };
    }
    previousStreet = step.streetName ?? previousStreet;
  }
  return { next: null, distanceMeters: 0, currentStreet: previousStreet, remainingMeters: Math.max(0, total - along) };
}

export function formatGuidanceDistance(meters: number): string {
  if (meters < 30) return 'зараз';
  if (meters < 1000) { const rounded = meters < 200 ? Math.round(meters / 10) * 10 : Math.round(meters / 50) * 50; return `${rounded} м`; }
  const km = meters / 1000;
  return `${(km < 10 ? km.toFixed(1) : Math.round(km).toString()).replace('.', ',')} км`;
}

const sideText: Record<NonNullable<Maneuver['modifier']>, string> = {
  LEFT: 'ліворуч', SLIGHT_LEFT: 'плавно ліворуч', SHARP_LEFT: 'різко ліворуч',
  RIGHT: 'праворуч', SLIGHT_RIGHT: 'плавно праворуч', SHARP_RIGHT: 'різко праворуч', STRAIGHT: 'прямо', UTURN: 'на розворот',
};
const onStreet = (maneuver: Maneuver) => maneuver.streetName ? ` на ${maneuver.streetName}` : '';

/** Short instruction for the banner, e.g. «Поверніть праворуч на вулиця Городоцька». */
export function instructionText(maneuver: Maneuver): string {
  const side = maneuver.modifier ? sideText[maneuver.modifier] : null;
  switch (maneuver.type) {
    case 'ARRIVE': return 'Ви прибули до пункту призначення';
    case 'DEPART': return `Рушайте${onStreet(maneuver)}`;
    case 'UTURN': return 'Розверніться';
    case 'ROUNDABOUT': return `На колі ${maneuver.exitNumber ? `${maneuver.exitNumber}-й з’їзд` : 'з’їжджайте'}${onStreet(maneuver)}`;
    case 'EXIT': return `З’їжджайте ${side && side !== 'прямо' ? side : ''}${onStreet(maneuver)}`.replace(/\s+/g, ' ').trim();
    case 'MERGE': return `Перестройтеся ${side ?? ''}${onStreet(maneuver)}`.replace(/\s+/g, ' ').trim();
    case 'PICKUP': return 'Посадка пасажира';
    case 'DROPOFF': return 'Висадка пасажира';
    case 'CONTINUE': return side && side !== 'прямо' ? `Тримайтеся ${side.replace('плавно ', '')}${onStreet(maneuver)}` : `Продовжуйте прямо${onStreet(maneuver)}`;
    case 'TURN':
    default:
      if (maneuver.modifier === 'UTURN') return 'Розверніться';
      if (!side || side === 'прямо') return `Продовжуйте прямо${onStreet(maneuver)}`;
      return `Поверніть ${side}${onStreet(maneuver)}`;
  }
}

/** Spoken line: «Через 300 метрів поверніть праворуч…» or «Зараз поверніть…». */
export function voiceLine(maneuver: Maneuver, meters: number): string {
  const text = instructionText(maneuver);
  if (maneuver.type === 'ARRIVE' && meters < 40) return 'Ви прибули до пункту призначення';
  const lowered = text.charAt(0).toLowerCase() + text.slice(1);
  if (meters < 40) return `Зараз ${lowered}`;
  const distance = formatGuidanceDistance(meters).replace(' м', ' метрів').replace(' км', ' кілометра');
  return `Через ${distance} ${lowered}`;
}

/**
 * Announcement checkpoints (metres before the manoeuvre), spoken once each. Returns the checkpoint ids to mark as done —
 * the one being spoken plus any farther ones, so a late start never replays «through 800 m» after «through 200 m».
 */
export function dueAnnouncement(meters: number, alreadySpoken: ReadonlySet<string>, maneuverId: string): string[] | null {
  const checkpoints = [['now', 40], ['near', 200], ['far', 800]] as const;
  for (let index = 0; index < checkpoints.length; index++) {
    const [key, limit] = checkpoints[index];
    if (meters <= limit && !alreadySpoken.has(`${maneuverId}:${key}`)) return checkpoints.slice(index).map(([later]) => `${maneuverId}:${later}`);
  }
  return null;
}
