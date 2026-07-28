import test from "node:test";
import assert from "node:assert/strict";

import { addRecentRoute, parseRecentRoutes } from "./recent-routes.js";

const route = (lineId, startName, endName, at) => ({
  lineId,
  startName,
  endName,
  at,
  viewedAt: `${at}:00+09:00`,
});

test("recent routes are newest first, deduplicated, and capped", () => {
  let routes = [];
  routes = addRecentRoute(routes, route("keio", "Shinjuku", "Meidaimae", "2026-07-29T10:00"), 2);
  routes = addRecentRoute(routes, route("inokashira", "Shibuya", "Kichijoji", "2026-07-29T11:00"), 2);
  routes = addRecentRoute(routes, route("keio", "Shinjuku", "Meidaimae", "2026-07-29T12:00"), 2);

  assert.equal(routes.length, 2);
  assert.equal(routes[0].lineId, "keio");
  assert.equal(routes[0].at, "2026-07-29T12:00");
  assert.equal(routes[1].lineId, "inokashira");
});

test("invalid stored history is discarded", () => {
  assert.deepEqual(parseRecentRoutes("not json"), []);
  assert.deepEqual(parseRecentRoutes('[{"lineId":"keio"}]'), []);
  assert.equal(parseRecentRoutes(JSON.stringify([
    route("keio", "Shinjuku", "Meidaimae", "2026-07-29T10:00"),
  ])).length, 1);
});
