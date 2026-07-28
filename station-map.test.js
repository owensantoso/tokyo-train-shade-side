import test from "node:test";
import assert from "node:assert/strict";

import { translate } from "./locale.js";
import { LINES, getRoutePath } from "./shade.js";
import { nearestPointIndex, routeSignature, StationMap } from "./station-map.js";

function createLayer(kind, details = {}) {
  return {
    kind,
    ...details,
    layers: [],
    addTo(target) {
      target.addLayer(this);
      return this;
    },
    addLayer(layer) {
      this.layers.push(layer);
      return this;
    },
    clearLayers() {
      this.layers = [];
      return this;
    },
  };
}

function createLeafletHarness() {
  const maps = [];
  const polylines = [];
  const markers = [];
  const stationMarkers = [];
  const timers = [];

  function createOverlayElement() {
    const classes = new Set();
    const properties = new Map();
    const attributes = new Map();
    const group = {
      classList: {
        add(...names) {
          names.forEach((name) => classes.add(name));
        },
        remove(...names) {
          names.forEach((name) => classes.delete(name));
        },
        contains(name) {
          return classes.has(name);
        },
      },
      style: {
        setProperty(name, value) {
          properties.set(name, value);
        },
        getPropertyValue(name) {
          return properties.get(name) ?? "";
        },
      },
      setAttribute(name, value) {
        attributes.set(name, value);
      },
      getAttribute(name) {
        return attributes.get(name);
      },
    };
    return {
      querySelector(selector) {
        return selector === ".map-sun-group" ? group : null;
      },
      group,
    };
  }

  const L = {
    map() {
      const handlers = new Map();
      const map = {
        layers: new Set(),
        fitBoundsCalls: [],
        addLayer(layer) {
          this.layers.add(layer);
          return this;
        },
        removeLayer(layer) {
          this.layers.delete(layer);
          return this;
        },
        on(name, handler) {
          handlers.set(name, handler);
          return this;
        },
        fire(name, event = {}) {
          handlers.get(name)?.(event);
        },
        fitBounds(bounds, options) {
          this.fitBoundsCalls.push({ bounds, options });
        },
        invalidateSize() {},
        latLngToLayerPoint({ lat, lng, lon }) {
          return { x: (lng ?? lon) * 10000, y: lat * -10000 };
        },
        layerPointToLatLng({ x, y }) {
          return { lat: y / -10000, lng: x / 10000 };
        },
        latLngToContainerPoint({ lat, lng }) {
          return { x: lng * 10000, y: lat * -10000 };
        },
      };
      maps.push(map);
      return map;
    },
    control: {
      zoom() {
        return { addTo() {} };
      },
    },
    tileLayer() {
      return createLayer("tiles");
    },
    layerGroup() {
      return createLayer("group");
    },
    polyline(coordinates, options) {
      const layer = createLayer("polyline", { coordinates, options });
      polylines.push(layer);
      return layer;
    },
    circleMarker([lat, lng], options) {
      const marker = createLayer("station-marker", {
        latLng: { lat, lng },
        options,
        bindTooltip() {
          return this;
        },
        getLatLng() {
          return this.latLng;
        },
        setRadius(radius) {
          this.radius = radius;
        },
        setStyle(style) {
          this.style = style;
        },
        bringToFront() {
          this.broughtToFront = true;
        },
        openTooltip() {
          this.tooltipOpen = true;
        },
        closeTooltip() {
          this.tooltipOpen = false;
        },
      });
      stationMarkers.push(marker);
      return marker;
    },
    divIcon(options) {
      return options;
    },
    marker(latLng, options) {
      const element = createOverlayElement();
      const marker = createLayer("direction-marker", {
        latLng,
        options,
        element,
        getElement() {
          return this.element;
        },
        setLatLng(nextLatLng) {
          this.latLng = nextLatLng;
          return this;
        },
      });
      markers.push(marker);
      return marker;
    },
  };

  return { L, maps, markers, polylines, stationMarkers, timers };
}

function createStationMap({
  getStationLabel,
  getText = (key, replacements = {}) => {
    if (key !== "mapTravelDirection") return key;
    return `Travel direction: ${replacements.origin} to ${replacements.destination}`;
  },
} = {}) {
  const harness = createLeafletHarness();
  globalThis.window = {
    L: harness.L,
    requestAnimationFrame(callback) {
      callback();
    },
    setTimeout(callback) {
      const timer = { callback, cleared: false };
      harness.timers.push(timer);
      return timer;
    },
    clearTimeout(timer) {
      if (timer) timer.cleared = true;
    },
  };
  const stationMap = new StationMap({
    container: { innerHTML: "", setAttribute(name, value) { this[name] = value; } },
    status: { textContent: "" },
    getRoutePath,
    getStationOptions: (lineId) => LINES[lineId].stations,
    onStationSelect() {},
    getText,
    getStationLabel,
  });
  return { stationMap, ...harness };
}

test("builds a stable route signature from effective line and endpoint identity", () => {
  assert.equal(routeSignature("inokashira", { name: "Shibuya" }, { name: "Kichijoji" }), "inokashira|Shibuya|Kichijoji");
  assert.equal(routeSignature("inokashira", { name: "Shibuya" }, null), "inokashira|Shibuya|");
  assert.equal(
    routeSignature("all", { name: "Shibuya" }, { name: "Kichijoji" }, "inokashira"),
    "inokashira|Shibuya|Kichijoji",
  );
});

test("imports without a Leaflet browser global", () => {
  assert.equal(globalThis.window, undefined);
  assert.equal(typeof StationMap, "function");
});

test("selects the geographically nearest station when marker hit areas overlap", () => {
  const points = [
    { x: 10, y: 10 },
    { x: 15, y: 10 },
    { x: 30, y: 10 },
  ];

  assert.equal(nearestPointIndex(points, { x: 14, y: 10 }, 22), 1);
  assert.equal(nearestPointIndex(points, { x: 80, y: 80 }, 22), -1);
});

test("frames all-lines origin with adjacent station context without changing route state", () => {
  const { stationMap, maps } = createStationMap();
  const origin = { name: "Shibuya" };

  stationMap.render("all", origin, null);

  assert.equal(stationMap.activeLineId, "all");
  assert.equal(stationMap.routeStations.length, 0);
  assert.ok(maps[0].fitBoundsCalls.at(-1).bounds.length > 1);
  assert.ok(maps[0].fitBoundsCalls.at(-1).bounds.some(([lat, lon]) => lat === 35.658 && lon === 139.7016));
});

test("renders ordered route chevrons and only reframes when the route signature changes", () => {
  const { stationMap, maps } = createStationMap();
  const origin = { name: "Shibuya" };
  const destination = { name: "Kichijoji" };

  stationMap.render("inokashira", origin, destination);
  const fitCount = maps[0].fitBoundsCalls.length;
  const firstArrowHtml = stationMap.directionLayer.layers[0].options.icon.html;

  assert.deepEqual(
    stationMap.routeStations.map(({ name }) => name),
    getRoutePath("inokashira", "Shibuya", "Kichijoji").stations.map(({ name }) => name),
  );
  assert.ok(stationMap.directionLayer.layers.length > 1);
  assert.match(firstArrowHtml, /--route-angle:/);
  assert.equal(stationMap.container["aria-label"], "Travel direction: Shibuya to Kichijoji");
  assert.deepEqual(maps[0].fitBoundsCalls.at(-1).bounds, stationMap.routeStations.map(({ lat, lon }) => [lat, lon]));
  assert.equal(maps[0].fitBoundsCalls.at(-1).options.maxZoom, 15);

  stationMap.render("inokashira", origin, destination);
  assert.equal(maps[0].fitBoundsCalls.length, fitCount);

  const beforeZoomLayers = stationMap.directionLayer.layers;
  maps[0].fire("zoomend");
  assert.notEqual(stationMap.directionLayer.layers, beforeZoomLayers);
  assert.equal(maps[0].fitBoundsCalls.length, fitCount);
});

test("uses localized production station labels in Japanese route ARIA text", () => {
  const { stationMap } = createStationMap({
    getStationLabel: (station) => station.nameJa,
    getText: (key, replacements) => translate("ja", key, replacements),
  });
  const origin = { name: "Shibuya", nameJa: "渋谷" };
  const destination = { name: "Kichijoji", nameJa: "吉祥寺" };

  stationMap.render("inokashira", origin, destination);

  assert.equal(stationMap.container["aria-label"], "進行方向：渋谷から吉祥寺");
});

test("reverses chevrons for the reverse trip", () => {
  const { stationMap } = createStationMap();

  stationMap.render("inokashira", { name: "Shibuya" }, { name: "Kichijoji" });
  const outboundAngle = stationMap.directionLayer.layers[0].options.icon.html.match(/([\d.]+)deg/)[1];
  stationMap.render("inokashira", { name: "Kichijoji" }, { name: "Shibuya" });
  const inboundAngle = stationMap.directionLayer.layers[0].options.icon.html.match(/([\d.]+)deg/)[1];

  assert.notEqual(inboundAngle, outboundAngle);
});

test("renders a resolved all-lines route while preserving all-lines click behavior", () => {
  const { stationMap, maps } = createStationMap();

  stationMap.render("all", { name: "Shibuya" }, { name: "Kichijoji" }, "inokashira");

  assert.equal(stationMap.activeLineId, "all");
  assert.ok(maps[0].layers.has(stationMap.layers.get("inokashira").stationLayer));
  assert.equal(stationMap.nearestStation({ x: 0, y: 0 }), null);
  assert.deepEqual(
    stationMap.routeStations.map(({ name }) => name),
    getRoutePath("inokashira", "Shibuya", "Kichijoji").stations.map(({ name }) => name),
  );
  assert.ok(stationMap.directionLayer.layers.length > 0);
});

test("does not render arrows for a one-station or zero-length route", () => {
  const { stationMap } = createStationMap();
  stationMap.routeStations = [{ name: "Same", lat: 35.6, lon: 139.7 }];
  stationMap.renderDirectionArrows();
  assert.equal(stationMap.directionLayer.layers.length, 0);

  stationMap.routeStations = [
    { name: "A", lat: 35.6, lon: 139.7 },
    { name: "B", lat: 35.6, lon: 139.7 },
  ];
  stationMap.renderDirectionArrows();
  assert.equal(stationMap.directionLayer.layers.length, 0);
});

test("renders one direction chevron for a very short non-zero route", () => {
  const { stationMap } = createStationMap();
  stationMap.routeStations = [
    { name: "A", lat: 35.6, lon: 139.7 },
    { name: "B", lat: 35.6, lon: 139.701 },
  ];

  stationMap.renderDirectionArrows();

  assert.equal(stationMap.directionLayer.layers.length, 1);
});

test("preserves Yamanote route order across the circular seam", () => {
  const { stationMap } = createStationMap();

  stationMap.render("yamanote", { name: "Shinagawa" }, { name: "Osaki" });

  assert.deepEqual(stationMap.routeStations.map(({ name }) => name), ["Shinagawa", "Osaki"]);
  assert.ok(stationMap.directionLayer.layers.length > 0);
});

test("returns to network framing when a route is cleared", () => {
  const { stationMap, maps } = createStationMap();
  stationMap.render("inokashira", { name: "Shibuya" }, { name: "Kichijoji" });
  const routeFitCount = maps[0].fitBoundsCalls.length;

  stationMap.render("inokashira", null, null);

  assert.equal(maps[0].fitBoundsCalls.length, routeFitCount + 1);
  assert.deepEqual(
    maps[0].fitBoundsCalls.at(-1).bounds,
    LINES.inokashira.stations.map(({ lat, lon }) => [lat, lon]),
  );
});

test("reuses one sunlight marker and unwraps time updates across north without reframing", () => {
  const { stationMap, maps, markers } = createStationMap({
    getText: (key, replacements = {}) => key === "mapSunDescription"
      ? `Sun direction ${replacements.degrees} degrees`
      : key,
  });
  const routeStations = [
    { name: "A", lat: 35.6, lon: 139.6 },
    { name: "B", lat: 35.6, lon: 139.8 },
  ];
  const fitCount = maps[0].fitBoundsCalls.length;

  stationMap.updateTripOverlay({
    routeLineId: "inokashira",
    routeStations,
    sunAzimuth: 359,
    isNight: false,
  });
  const marker = stationMap.tripOverlayMarker;
  const group = marker.getElement().group;

  assert.equal(markers.length, 1);
  assert.equal(marker.options.interactive, false);
  assert.equal(marker.options.keyboard, false);
  assert.deepEqual(marker.latLng, { lat: 35.6, lng: 139.7 });
  assert.match(marker.options.icon.html, /map-sun-icon/);
  assert.match(marker.options.icon.html, /map-sun-ray-left/);
  assert.match(marker.options.icon.html, /map-sun-ray-center/);
  assert.match(marker.options.icon.html, /map-sun-ray-right/);
  assert.equal(group.style.getPropertyValue("--sun-map-angle"), "359deg");
  assert.equal(group.getAttribute("aria-label"), "Sun direction 359 degrees");

  stationMap.updateTripOverlay({
    routeLineId: "inokashira",
    routeStations,
    sunAzimuth: 1,
    isNight: false,
  });

  assert.equal(stationMap.tripOverlayMarker, marker);
  assert.equal(markers.length, 1);
  assert.equal(group.style.getPropertyValue("--sun-map-angle"), "361deg");
  assert.equal(maps[0].fitBoundsCalls.length, fitCount);
});

test("night removal timers cannot remove a restored daylight overlay", () => {
  const { stationMap, maps, timers } = createStationMap();
  const routeStations = [
    { name: "A", lat: 35.6, lon: 139.6 },
    { name: "B", lat: 35.7, lon: 139.8 },
  ];
  const daylight = {
    routeLineId: "inokashira",
    routeStations,
    sunAzimuth: 245,
    isNight: false,
  };

  stationMap.updateTripOverlay(daylight);
  const marker = stationMap.tripOverlayMarker;
  stationMap.updateTripOverlay({ ...daylight, isNight: true });
  const staleTimer = timers.at(-1);
  assert.equal(marker.getElement().group.classList.contains("is-night"), true);

  stationMap.updateTripOverlay({ ...daylight, sunAzimuth: 246 });
  staleTimer.callback();

  assert.equal(stationMap.tripOverlayMarker, marker);
  assert.equal(maps[0].layers.has(marker), true);
  assert.equal(marker.getElement().group.classList.contains("is-night"), false);

  stationMap.updateTripOverlay({ ...daylight, isNight: true });
  timers.at(-1).callback();
  assert.equal(stationMap.tripOverlayMarker, null);
  assert.equal(maps[0].layers.has(marker), false);
});

test("clearTripOverlay removes the marker and invalidates pending night cleanup", () => {
  const { stationMap, maps, timers } = createStationMap();
  const options = {
    routeLineId: "inokashira",
    routeStations: [
      { name: "A", lat: 35.6, lon: 139.6 },
      { name: "B", lat: 35.7, lon: 139.8 },
    ],
    sunAzimuth: 180,
    isNight: false,
  };

  stationMap.updateTripOverlay(options);
  const marker = stationMap.tripOverlayMarker;
  stationMap.updateTripOverlay({ ...options, isNight: true });
  const staleTimer = timers.at(-1);
  stationMap.clearTripOverlay();
  staleTimer.callback();

  assert.equal(stationMap.tripOverlayMarker, null);
  assert.equal(maps[0].layers.has(marker), false);
});

test("highlights endpoints on the resolved route line and restores route marker styling", () => {
  const { stationMap } = createStationMap();
  stationMap.render("all", { name: "Shibuya" }, { name: "Kichijoji" }, "inokashira");
  const resolvedOrigin = stationMap.layers.get("inokashira").markers.get("Shibuya").marker;
  const sharedOrigin = stationMap.layers.get("ginza").markers.get("Shibuya").marker;

  stationMap.highlightEndpoint("origin", true);

  assert.equal(resolvedOrigin.radius, 10);
  assert.equal(resolvedOrigin.style.weight, 4);
  assert.equal(resolvedOrigin.broughtToFront, true);
  assert.equal(resolvedOrigin.tooltipOpen, true);
  assert.notEqual(sharedOrigin.radius, 10);

  stationMap.highlightEndpoint("origin", false);

  assert.equal(resolvedOrigin.radius, 7);
  assert.equal(resolvedOrigin.style.weight, 3);
  assert.equal(resolvedOrigin.tooltipOpen, false);
  assert.deepEqual(
    stationMap.routeStations.map(({ name }) => name),
    getRoutePath("inokashira", "Shibuya", "Kichijoji").stations.map(({ name }) => name),
  );
});
