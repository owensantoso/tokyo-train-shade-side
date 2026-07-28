import { LINES, stationCodeFor } from "./shade.js";
import { normalizeBearing, samplePolyline, unwrapBearing } from "./map-overlay-geometry.js";

const LINE_COLORS = {
  keio: "#d51c57",
  inokashira: "#256ba6",
  shinjuku: "#6cbb5a",
  ginza: "#f39700",
  chuo: "#f15a24",
  yamanote: "#80c241",
  odakyu: "#1682c4",
  denentoshi: "#00a040",
};

function lineCoordinates(line) {
  const coordinates = line.stations.map(({ lat, lon }) => [lat, lon]);
  return line.circular && coordinates.length ? [...coordinates, coordinates[0]] : coordinates;
}

function routeMidpoint(stations) {
  if (!Array.isArray(stations) || stations.length < 2) return null;
  const segments = [];
  let totalLength = 0;

  for (let index = 1; index < stations.length; index += 1) {
    const start = stations[index - 1];
    const end = stations[index];
    if (![start?.lat, start?.lon, end?.lat, end?.lon].every(Number.isFinite)) return null;
    const length = Math.hypot(end.lat - start.lat, end.lon - start.lon);
    if (length === 0) continue;
    segments.push({ start, end, length, routeStart: totalLength });
    totalLength += length;
  }

  if (!segments.length) return null;
  const target = totalLength / 2;
  const segment = segments.find(({ routeStart, length }) => target <= routeStart + length) ?? segments.at(-1);
  const progress = (target - segment.routeStart) / segment.length;
  return {
    lat: segment.start.lat + (segment.end.lat - segment.start.lat) * progress,
    lng: segment.start.lon + (segment.end.lon - segment.start.lon) * progress,
  };
}

export function routeSignature(lineId, origin, destination, resolvedLineId) {
  return `${resolvedLineId ?? lineId}|${origin?.name ?? ""}|${destination?.name ?? ""}`;
}

export function nearestPointIndex(points, target, maxDistance) {
  let nearestIndex = -1;
  let nearestDistance = maxDistance;
  points.forEach((point, index) => {
    const distance = Math.hypot(point.x - target.x, point.y - target.y);
    if (distance <= nearestDistance) {
      nearestIndex = index;
      nearestDistance = distance;
    }
  });
  return nearestIndex;
}

export class StationMap {
  constructor({
    container,
    status,
    getRoutePath,
    getStationOptions,
    onStationSelect,
    getText = (key) => key,
    getStationLabel = (station) => station?.name ?? "",
  }) {
    this.container = container;
    this.status = status;
    this.getRoutePath = getRoutePath;
    this.getStationOptions = getStationOptions;
    this.onStationSelect = onStationSelect;
    this.getText = getText;
    this.getStationLabel = getStationLabel;
    this.lastRouteSignature = null;
    this.routeStations = [];
    this.layers = new Map();
    this.routeSelectionLayer = null;
    this.directionLayer = null;
    this.tripOverlayMarker = null;
    this.tripOverlayRemovalTimer = null;
    this.tripOverlayToken = 0;
    this.sunMapAngle = null;
    this.endpointLineId = null;
    this.endpointNames = { origin: null, destination: null };
    this.highlightedEndpoint = null;
    this.activeLineId = "all";
    this.hoveredMarker = null;

    const L = window.L;
    if (!L) {
      this.status.textContent = this.getText("mapUnavailable");
      this.container.innerHTML = `<p class="schematic-empty">${this.getText("mapLoadFailed")}</p>`;
      return;
    }

    this.L = L;
    this.map = L.map(container, {
      center: [35.66, 139.67],
      zoom: 9,
      zoomControl: false,
      scrollWheelZoom: false,
      preferCanvas: true,
    });
    L.control.zoom({ position: "bottomright" }).addTo(this.map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    }).addTo(this.map);
    this.map.on("click", (event) => this.selectNearestStation(event.containerPoint));
    this.map.on("mousemove", (event) => this.previewNearestStation(event.containerPoint));
    this.map.on("mouseout", () => this.clearStationPreview());
    this.map.on("zoomend", () => this.renderDirectionArrows());

    Object.entries(LINES).forEach(([lineId, line]) => {
      const routeLayer = L.layerGroup();
      const stationLayer = L.layerGroup();
      const coordinates = lineCoordinates(line);
      L.polyline(coordinates, {
        color: "#ffffff",
        weight: 9,
        opacity: 0.9,
        lineJoin: "round",
      }).addTo(routeLayer);
      L.polyline(coordinates, {
        color: LINE_COLORS[lineId],
        weight: 5,
        opacity: 0.96,
        lineJoin: "round",
      }).addTo(routeLayer);

      const options = getStationOptions(lineId);
      const markers = new Map();
      options.forEach((option) => {
        const code = stationCodeFor(lineId, option.name);
        const marker = L.circleMarker([option.lat, option.lon], {
          radius: 3,
          color: "#ffffff",
          weight: 1,
          fillColor: LINE_COLORS[lineId],
          fillOpacity: 1,
          interactive: false,
        });
        marker.bindTooltip(
          `<strong>${option.name}</strong><br><span lang="ja">${option.nameJa}</span> · ${code}`,
          { direction: "top", offset: [0, -7] },
        );
        marker.addTo(stationLayer);
        markers.set(option.name, { marker, option });
      });
      this.layers.set(lineId, { routeLayer, stationLayer, markers });
    });
    this.directionLayer = this.L.layerGroup().addTo(this.map);

    window.requestAnimationFrame(() => this.map.invalidateSize());
  }

  render(lineId, origin, destination, resolvedLineId) {
    if (!this.map) return;
    const effectiveLineId = resolvedLineId ?? (lineId === "all" ? null : lineId);
    const signature = routeSignature(lineId, origin, destination, resolvedLineId);
    const routeChanged = signature !== this.lastRouteSignature;
    const hasCompleteRoute = Boolean(
      effectiveLineId
      && this.layers.has(effectiveLineId)
      && origin
      && destination
      && origin.name !== destination.name,
    );

    this.layers.forEach(({ routeLayer, stationLayer, markers }, id) => {
      this.map.removeLayer(routeLayer);
      this.map.removeLayer(stationLayer);
      markers.forEach(({ marker }, stationName) => {
        marker.closeTooltip();
        const state = origin?.name === stationName ? "origin" : destination?.name === stationName ? "destination" : "";
        marker.setRadius(state ? 7 : 3);
        marker.setStyle({
          color: state ? "#141918" : "#ffffff",
          weight: state ? 3 : 1,
          fillColor: state === "origin" ? "#ffd43b" : LINE_COLORS[id],
        });
      });
    });
    if (this.routeSelectionLayer) {
      this.map.removeLayer(this.routeSelectionLayer);
      this.routeSelectionLayer = null;
    }
    this.routeStations = [];
    this.directionLayer.clearLayers();
    this.highlightedEndpoint = null;
    this.endpointLineId = hasCompleteRoute ? effectiveLineId : null;
    this.endpointNames = {
      origin: hasCompleteRoute ? origin.name : null,
      destination: hasCompleteRoute ? destination.name : null,
    };

    if (lineId === "all") {
      this.layers.forEach(({ routeLayer }) => routeLayer.addTo(this.map));
      if (effectiveLineId) this.layers.get(effectiveLineId)?.stationLayer.addTo(this.map);
    } else {
      const { routeLayer, stationLayer } = this.layers.get(lineId);
      routeLayer.addTo(this.map);
      stationLayer.addTo(this.map);
    }

    if (hasCompleteRoute) {
      const route = this.getRoutePath(effectiveLineId, origin.name, destination.name);
      this.routeStations = route.stations;
      this.routeSelectionLayer = this.L.polyline(
        route.stations.map(({ lat, lon }) => [lat, lon]),
        { color: "#ffd43b", weight: 7, opacity: 1, lineJoin: "round" },
      ).addTo(this.map);
      this.renderDirectionArrows();
      this.status.textContent = `${stationCodeFor(effectiveLineId, origin.name)} → ${stationCodeFor(effectiveLineId, destination.name)}`;
      this.container.setAttribute(
        "aria-label",
        this.getText("mapTravelDirection", {
          origin: this.getStationLabel(origin),
          destination: this.getStationLabel(destination),
        }),
      );
    } else {
      this.container.setAttribute("aria-label", this.getText("mapAria"));
      this.status.textContent = lineId === "all"
        ? this.getText("chooseLineMap")
        : origin
          ? this.getText("destinationUnset", { code: stationCodeFor(lineId, origin.name) })
          : this.getText("clickOrigin");
    }

    if (routeChanged) {
      if (this.routeStations.length) {
        this.fitStations(this.routeStations, { padding: [32, 32], maxZoom: 15 });
      } else if (origin) {
        this.fitStations(this.originContextStations(lineId, origin, effectiveLineId), {
          padding: [32, 32],
          maxZoom: 15,
        });
      } else {
        this.fitStations(
          lineId === "all" ? Object.values(LINES).flatMap(({ stations }) => stations) : LINES[lineId].stations,
        );
      }
    }

    window.requestAnimationFrame(() => this.map.invalidateSize());
    this.activeLineId = lineId;
    this.lastRouteSignature = signature;
  }

  updateTripOverlay({ routeLineId, routeStations, sunAzimuth, isNight }) {
    if (!this.map) return;
    this.tripOverlayToken += 1;
    if (this.tripOverlayRemovalTimer) {
      window.clearTimeout(this.tripOverlayRemovalTimer);
      this.tripOverlayRemovalTimer = null;
    }

    if (isNight) {
      const marker = this.tripOverlayMarker;
      if (!marker) return;
      marker.getElement()?.querySelector(".map-sun-group")?.classList.add("is-night");
      const token = this.tripOverlayToken;
      this.tripOverlayRemovalTimer = window.setTimeout(() => {
        if (token !== this.tripOverlayToken || marker !== this.tripOverlayMarker) return;
        this.map.removeLayer(marker);
        this.tripOverlayMarker = null;
        this.tripOverlayRemovalTimer = null;
      }, 240);
      return;
    }

    const midpoint = routeMidpoint(routeStations);
    const normalizedAzimuth = normalizeBearing(sunAzimuth);
    if (!this.layers.has(routeLineId) || !midpoint || normalizedAzimuth === null) {
      this.clearTripOverlay();
      return;
    }

    const angle = unwrapBearing(this.sunMapAngle, normalizedAzimuth);
    this.sunMapAngle = angle;
    let isNewMarker = false;

    if (!this.tripOverlayMarker) {
      this.tripOverlayMarker = this.L.marker(midpoint, {
        interactive: false,
        keyboard: false,
        zIndexOffset: 600,
        icon: this.L.divIcon({
          className: "map-sun-overlay",
          html: `
            <span class="map-sun-group is-entering" role="img">
              <span class="map-sun-icon" aria-hidden="true"></span>
              <span class="map-sun-ray map-sun-ray-left" aria-hidden="true"></span>
              <span class="map-sun-ray map-sun-ray-center" aria-hidden="true"></span>
              <span class="map-sun-ray map-sun-ray-right" aria-hidden="true"></span>
            </span>`,
          iconSize: [260, 260],
          iconAnchor: [130, 130],
        }),
      }).addTo(this.map);
      isNewMarker = true;
    } else {
      this.tripOverlayMarker.setLatLng(midpoint);
    }

    const group = this.tripOverlayMarker.getElement()?.querySelector(".map-sun-group");
    if (!group) return;
    group.style.setProperty("--sun-map-angle", `${angle}deg`);
    group.setAttribute(
      "aria-label",
      this.getText("mapSunDescription", { degrees: Math.round(normalizedAzimuth) }),
    );
    group.classList.remove("is-night");
    if (isNewMarker) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (this.tripOverlayMarker?.getElement()?.querySelector(".map-sun-group") === group) {
            group.classList.remove("is-entering");
          }
        });
      });
    } else {
      group.classList.remove("is-entering");
    }
  }

  clearTripOverlay() {
    this.tripOverlayToken += 1;
    if (this.tripOverlayRemovalTimer) {
      window.clearTimeout(this.tripOverlayRemovalTimer);
      this.tripOverlayRemovalTimer = null;
    }
    if (this.tripOverlayMarker && this.map) this.map.removeLayer(this.tripOverlayMarker);
    this.tripOverlayMarker = null;
    this.sunMapAngle = null;
  }

  highlightEndpoint(role, active) {
    if (!["origin", "destination"].includes(role) || !this.endpointLineId) return;
    const marker = this.layers.get(this.endpointLineId)?.markers.get(this.endpointNames[role])?.marker;
    if (!marker) return;

    if (active) {
      if (this.highlightedEndpoint && this.highlightedEndpoint.marker !== marker) {
        this.restoreEndpointMarker(this.highlightedEndpoint.role, this.highlightedEndpoint.marker);
      }
      marker.setRadius(10);
      marker.setStyle({
        color: "#141918",
        weight: 4,
        fillColor: role === "origin" ? "#ffd43b" : LINE_COLORS[this.endpointLineId],
      });
      marker.bringToFront();
      marker.openTooltip();
      this.highlightedEndpoint = { role, marker };
      return;
    }

    if (this.highlightedEndpoint?.marker !== marker) return;
    this.restoreEndpointMarker(role, marker);
    this.highlightedEndpoint = null;
  }

  restoreEndpointMarker(role, marker) {
    marker.setRadius(7);
    marker.setStyle({
      color: "#141918",
      weight: 3,
      fillColor: role === "origin" ? "#ffd43b" : LINE_COLORS[this.endpointLineId],
    });
    marker.closeTooltip();
  }

  originContextStations(lineId, origin, effectiveLineId) {
    const candidateLineIds = effectiveLineId
      ? [effectiveLineId]
      : lineId === "all"
        ? Object.keys(LINES).filter((id) => LINES[id].stations.some(({ name }) => name === origin.name))
        : [lineId];
    const stations = [];
    const seen = new Set();

    candidateLineIds.forEach((id) => {
      const line = LINES[id];
      const index = line?.stations.findIndex(({ name }) => name === origin.name) ?? -1;
      if (index < 0) return;
      const indexes = line.circular
        ? [(index - 1 + line.stations.length) % line.stations.length, index, (index + 1) % line.stations.length]
        : [index - 1, index, index + 1];
      indexes.forEach((stationIndex) => {
        const station = line.stations[stationIndex];
        if (!station) return;
        const key = `${station.lat}|${station.lon}`;
        if (!seen.has(key)) {
          seen.add(key);
          stations.push(station);
        }
      });
    });

    return stations;
  }

  renderDirectionArrows() {
    if (!this.map || !this.directionLayer) return;
    this.directionLayer.clearLayers();
    const points = this.routeStations.map(({ lat, lon }) => this.map.latLngToLayerPoint({ lat, lng: lon }));
    const insetSamples = samplePolyline(points);
    const samples = insetSamples.length ? insetSamples : samplePolyline(points, 70, 0);
    samples.forEach((sample) => {
      const marker = this.L.marker(this.map.layerPointToLatLng(sample), {
        interactive: false,
        keyboard: false,
        icon: this.L.divIcon({
          className: "route-direction-marker",
          html: `<span class="route-direction-chevron" style="--route-angle:${sample.angle}deg" aria-hidden="true"></span>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }),
      });
      this.directionLayer.addLayer(marker);
    });
  }

  fitStations(stations, options = { padding: [18, 18], maxZoom: 13 }) {
    if (!stations.length) return;
    this.map.fitBounds(
      stations.map(({ lat, lon }) => [lat, lon]),
      options,
    );
  }

  nearestStation(containerPoint, maxDistance = 22) {
    if (this.activeLineId === "all") return null;
    const entries = [...(this.layers.get(this.activeLineId)?.markers.values() ?? [])];
    const points = entries.map(({ marker }) => this.map.latLngToContainerPoint(marker.getLatLng()));
    const index = nearestPointIndex(points, containerPoint, maxDistance);
    return index >= 0 ? entries[index] : null;
  }

  selectNearestStation(containerPoint) {
    const nearest = this.nearestStation(containerPoint);
    if (nearest) this.onStationSelect(nearest.option);
  }

  previewNearestStation(containerPoint) {
    const nearest = this.nearestStation(containerPoint, 12);
    if (nearest?.marker === this.hoveredMarker) return;
    this.clearStationPreview();
    if (nearest) {
      nearest.marker.openTooltip();
      this.hoveredMarker = nearest.marker;
    }
  }

  clearStationPreview() {
    this.hoveredMarker?.closeTooltip();
    this.hoveredMarker = null;
  }
}
