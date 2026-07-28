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
        openTooltip() {},
        closeTooltip() {},
      });
      stationMarkers.push(marker);
      return marker;
    },
    divIcon(options) {
      return options;
    },
    marker(latLng, options) {
      const marker = createLayer("direction-marker", { latLng, options });
      markers.push(marker);
      return marker;
    },
  };

  return { L, maps, markers, polylines, stationMarkers };
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
