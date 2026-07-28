function validRoute(route) {
  return route
    && typeof route.lineId === "string"
    && typeof route.startName === "string"
    && typeof route.endName === "string"
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(route.at ?? "")
    && typeof route.viewedAt === "string";
}

export function parseRecentRoutes(raw) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(validRoute) : [];
  } catch {
    return [];
  }
}

export function addRecentRoute(routes, route, limit = 5) {
  if (!validRoute(route)) return [...routes];
  const key = `${route.lineId}|${route.startName}|${route.endName}`;
  return [
    route,
    ...routes.filter((item) => `${item.lineId}|${item.startName}|${item.endName}` !== key),
  ].slice(0, limit);
}
