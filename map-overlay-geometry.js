export function normalizeBearing(value) {
  return ((Number(value) % 360) + 360) % 360;
}

export function incomingLightBearing(solarAzimuth) {
  return normalizeBearing(solarAzimuth + 180);
}

export function unwrapBearing(previous, next) {
  const normalized = normalizeBearing(next);
  if (!Number.isFinite(previous)) return normalized;

  const previousNormalized = normalizeBearing(previous);
  const delta = ((normalized - previousNormalized + 540) % 360) - 180;
  return previous + delta;
}

export function samplePolyline(points, spacing = 70, inset = 30) {
  if (!Array.isArray(points) || points.length < 2 || spacing <= 0 || inset < 0) {
    return [];
  }

  const segments = [];
  let totalLength = 0;

  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);

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
  }

  const usableLength = totalLength - inset * 2;
  if (usableLength <= 0 || segments.length === 0) return [];

  const sampleCount = Math.max(1, Math.round(usableLength / spacing));
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
