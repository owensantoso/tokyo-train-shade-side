const MIN_POLYLINE_SPACING = 1;
const MAX_POLYLINE_SAMPLES = 200;

export function normalizeBearing(value) {
  if (!Number.isFinite(value)) return null;
  return ((value % 360) + 360) % 360;
}

export function incomingLightBearing(solarAzimuth) {
  const normalized = normalizeBearing(solarAzimuth);
  return normalized === null ? null : normalizeBearing(normalized + 180);
}

export function unwrapBearing(previous, next) {
  const normalized = normalizeBearing(next);
  if (normalized === null) return null;
  if (previous === null) return normalized;
  if (!Number.isFinite(previous)) return null;

  const previousNormalized = normalizeBearing(previous);
  const delta = ((normalized - previousNormalized + 540) % 360) - 180;
  return previous + delta;
}

export function samplePolyline(points, spacing = 70, inset = 30) {
  if (
    !Array.isArray(points)
    || points.length < 2
    || !Number.isFinite(spacing)
    || spacing < MIN_POLYLINE_SPACING
    || !Number.isFinite(inset)
    || inset < 0
  ) {
    return [];
  }

  for (const point of points) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      return [];
    }
  }

  const segments = [];
  let totalLength = 0;

  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);

    if (!Number.isFinite(length)) return [];
    if (length === 0) continue;

    segments.push({
      start,
      dx,
      dy,
      length,
      routeStart: totalLength,
      routeEnd: totalLength + length,
    });
    totalLength += length;
    if (!Number.isFinite(totalLength)) return [];
  }

  const usableLength = totalLength - inset * 2;
  if (usableLength <= 0 || segments.length === 0) return [];

  const sampleCount = Math.min(
    MAX_POLYLINE_SAMPLES,
    Math.max(1, Math.round(usableLength / spacing)),
  );
  const sampleInterval = usableLength / sampleCount;

  return Array.from({ length: sampleCount }, (_, index) => {
    const target = inset + sampleInterval * (index + 0.5);
    const segment = segments.find(({ routeEnd }) => target <= routeEnd)
      ?? segments.at(-1);
    const progress = (target - segment.routeStart) / segment.length;

    return {
      x: segment.start.x + segment.dx * progress,
      y: segment.start.y + segment.dy * progress,
      angle: normalizeBearing(
        Math.atan2(segment.dx, -segment.dy) * 180 / Math.PI,
      ),
    };
  });
}
