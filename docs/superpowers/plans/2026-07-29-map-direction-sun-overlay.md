# Map Direction and Sun Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add directional route chevrons, automatic route framing, result-to-map endpoint highlighting, and a smoothly time-driven three-ray sunlight overlay to the existing Leaflet station map.

**Architecture:** Pure pixel-geometry helpers calculate arrow samples, incoming-light direction, and continuous azimuth rotation. `StationMap` owns Leaflet layers, framing, marker highlights, and overlay DOM; `app.js` supplies recommendation state and binds result endpoint interactions.

**Tech Stack:** Static ES modules, Leaflet 1.9, SVG/CSS overlays, Node test runner, GitHub Pages.

---

### Task 1: Pure Overlay Geometry

**Files:**
- Create: `map-overlay-geometry.js`
- Create: `map-overlay-geometry.test.js`

- [ ] **Step 1: Write failing tests for angle and direction helpers**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { incomingLightBearing, unwrapBearing } from "./map-overlay-geometry.js";

test("incoming light travels opposite the direction toward the sun", () => {
  assert.equal(incomingLightBearing(245), 65);
  assert.equal(incomingLightBearing(350), 170);
});

test("unwraps bearings across north using the shortest rotation", () => {
  assert.equal(unwrapBearing(359, 1), 361);
  assert.equal(unwrapBearing(1, 359), -1);
  assert.equal(unwrapBearing(null, 245), 245);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --test map-overlay-geometry.test.js`

Expected: FAIL because `map-overlay-geometry.js` does not exist.

- [ ] **Step 3: Implement normalized incoming-light and continuous-bearing helpers**

```js
function normalizeBearing(value) {
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
```

- [ ] **Step 4: Add failing tests for route arrow sampling**

```js
import { samplePolyline } from "./map-overlay-geometry.js";

test("samples arrows in route order with screen-space headings", () => {
  assert.deepEqual(samplePolyline([{ x: 0, y: 0 }, { x: 200, y: 0 }], 70, 30), [
    { x: 65, y: 0, angle: 90 },
    { x: 135, y: 0, angle: 90 },
  ]);
  assert.deepEqual(samplePolyline([{ x: 200, y: 0 }, { x: 0, y: 0 }], 70, 30), [
    { x: 135, y: 0, angle: 270 },
    { x: 65, y: 0, angle: 270 },
  ]);
});
```

- [ ] **Step 5: Run the focused tests and verify RED**

Run: `node --test map-overlay-geometry.test.js`

Expected: FAIL because `samplePolyline` is not exported.

- [ ] **Step 6: Implement screen-space polyline sampling**

Implement `samplePolyline(points, spacing, inset)` by calculating segment lengths, total route length, evenly spaced target distances between both insets, and interpolated `{x, y, angle}` values. Define `angle` as a clockwise screen bearing where an upward-pointing chevron uses `0`, right uses `90`, down uses `180`, and left uses `270`.

- [ ] **Step 7: Run focused and full tests**

Run: `node --test map-overlay-geometry.test.js && npm test`

Expected: all tests pass.

- [ ] **Step 8: Commit geometry**

```bash
git add map-overlay-geometry.js map-overlay-geometry.test.js
git commit -m "test: define map overlay geometry"
```

### Task 2: Leaflet Route Framing and Direction Chevrons

**Files:**
- Modify: `station-map.js`
- Modify: `styles.css`
- Modify: `locale.js`
- Modify: `station-map.test.js`

- [ ] **Step 1: Add a route-signature unit test**

Export `routeSignature(lineId, origin, destination)` and assert:

```js
assert.equal(routeSignature("inokashira", { name: "Shibuya" }, { name: "Kichijoji" }), "inokashira|Shibuya|Kichijoji");
assert.equal(routeSignature("inokashira", { name: "Shibuya" }, null), "inokashira|Shibuya|");
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test station-map.test.js`

Expected: FAIL because `routeSignature` is not exported.

- [ ] **Step 3: Add route framing state**

In `StationMap`:

```js
this.lastRouteSignature = null;
this.routeStations = [];
this.directionLayer = this.L.layerGroup().addTo(this.map);
this.map.on("zoomend", () => this.renderDirectionArrows());
```

Update `render(lineId, origin, destination)` so:

- a completed route fits `route.stations` only when its route signature changes;
- an origin-only state fits a small bounds window containing the origin and adjacent stations;
- changing departure time does not call `fitBounds`;
- incomplete or changed routes clear direction markers.

- [ ] **Step 4: Render route-order chevrons**

Project route stations with `map.latLngToLayerPoint`, call `samplePolyline`, convert each sample back with `map.layerPointToLatLng`, and add non-interactive `L.marker` instances using:

```js
this.L.divIcon({
  className: "route-direction-marker",
  html: `<span style="--route-angle:${sample.angle}deg" aria-hidden="true"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});
```

- [ ] **Step 5: Add chevron and reduced-motion CSS**

Use a compact black chevron with a white keyline so it stays legible over the yellow route and map tiles. Ensure markers ignore pointer events and do not resize the Leaflet layout.

- [ ] **Step 6: Add localized map status copy**

Add locale keys for travel direction and sun direction labels used by the map overlay ARIA description.

- [ ] **Step 7: Run tests**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 8: Commit map direction**

```bash
git add station-map.js station-map.test.js styles.css locale.js
git commit -m "feat: show travel direction on station map"
```

### Task 3: Smooth Sun Overlay and Endpoint Linking

**Files:**
- Modify: `station-map.js`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `locale.js`

- [ ] **Step 1: Add the `StationMap` trip-overlay API**

Implement:

```js
updateTripOverlay({ routeLineId, routeStations, sunAzimuth, isNight }) {}
clearTripOverlay() {}
highlightEndpoint(role, active) {}
```

`updateTripOverlay` must reuse one non-interactive Leaflet `divIcon` marker at the route midpoint. Its HTML contains one sun icon, one strong center ray, two lighter outer rays, and three inward arrowheads. Set `--sun-map-angle` to an unwrapped solar azimuth so the sun stays on the correct compass side while the arrows point toward the route.

- [ ] **Step 2: Build stable overlay markup**

Use:

```html
<span class="map-sun-group">
  <span class="map-sun-icon"></span>
  <span class="map-sun-ray map-sun-ray-left"></span>
  <span class="map-sun-ray map-sun-ray-center"></span>
  <span class="map-sun-ray map-sun-ray-right"></span>
</span>
```

The group starts with the sun north of the midpoint and rays pointing inward. A clockwise rotation by solar azimuth places the sun on the correct map side. Ray arrowheads point from the sun toward the route.

- [ ] **Step 3: Add smooth, bounded styling**

The overlay is at most `min(260px, 70vw)` wide, uses `pointer-events:none`, and transitions `transform` and `opacity` over roughly 220 ms. In `prefers-reduced-motion`, set transition duration to near zero. Night state fades and removes the marker after transition; daylight recreates and fades it in.

- [ ] **Step 4: Pass recommendation state from `app.js`**

After `getRecommendation` and route code calculation:

```js
stationMap.updateTripOverlay({
  routeLineId,
  routeStations: recommendation.route.stations,
  sunAzimuth: recommendation.sun.azimuth,
  isNight: recommendation.isNight,
});
```

If the recommendation API does not expose route stations directly, call `getRoutePath(routeLineId, start.name, end.name).stations`. For incomplete or failed routes, call `stationMap.clearTripOverlay()`.

- [ ] **Step 5: Make result endpoints focusable map links**

Render each endpoint as:

```html
<span class="result-station-link" tabindex="0" data-map-endpoint="origin">Shibuya <span class="route-code">IN01</span></span>
```

Repeat for destination in day and night results.

- [ ] **Step 6: Bind endpoint hover and focus**

After result markup is inserted:

```js
document.querySelectorAll("[data-map-endpoint]").forEach((endpoint) => {
  const role = endpoint.dataset.mapEndpoint;
  endpoint.addEventListener("mouseenter", () => stationMap.highlightEndpoint(role, true));
  endpoint.addEventListener("mouseleave", () => stationMap.highlightEndpoint(role, false));
  endpoint.addEventListener("focus", () => stationMap.highlightEndpoint(role, true));
  endpoint.addEventListener("blur", () => stationMap.highlightEndpoint(role, false));
});
```

`highlightEndpoint` enlarges the selected marker, brings it to front, and opens its bilingual tooltip without changing route state.

- [ ] **Step 7: Run syntax and full tests**

Run: `Get-ChildItem -Filter *.js | ForEach-Object { node --check $_.FullName }; npm test`

Expected: all checks and tests pass.

- [ ] **Step 8: Commit overlay interactions**

```bash
git add station-map.js app.js styles.css locale.js
git commit -m "feat: link sunlight and route results to map"
```

### Task 4: Browser QA, Documentation, and Deployment

**Files:**
- Modify: `README.md`
- Modify: `index.html`

- [ ] **Step 1: Update documentation and cache versions**

Document directional chevrons, multi-ray sun orientation, smooth time updates, endpoint linking, and the explicit no-shadow limitation. Bump static asset query versions to `v0.14`.

- [ ] **Step 2: Run final automated verification**

Run:

```powershell
npm test
Get-ChildItem -Filter *.js | ForEach-Object { node --check $_.FullName }
git diff --check
```

Expected: all tests pass, syntax checks return no output, and `git diff --check` returns no errors.

- [ ] **Step 3: Run desktop browser checks**

Verify a shared daylight route:

- route segment is framed;
- chevrons point from origin to destination;
- endpoint hover and keyboard focus open the matching tooltip;
- moving the time slider changes rays without changing map bounds;
- crossing sunset removes the sun overlay;
- no console errors.

- [ ] **Step 4: Run mobile and Japanese browser checks**

At a 375 x 812 viewport, verify no horizontal overflow, map controls remain usable, rays do not cover route controls, Japanese endpoint labels render, and reduced screen size still shows travel direction.

- [ ] **Step 5: Commit release metadata**

```bash
git add README.md index.html
git commit -m "docs: describe map direction overlays"
```

- [ ] **Step 6: Push and verify Pages**

Run:

```bash
git push origin main
gh api repos/owensantoso/tokyo-train-shade-side/pages/builds/latest --jq '{status: .status, commit: .commit}'
```

Wait for the exact pushed commit to report `built`, then request the live URL with a cache-busting query and verify the `v0.14` assets are present.
