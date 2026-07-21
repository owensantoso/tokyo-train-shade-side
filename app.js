import {
  LINES,
  departurePreset,
  describeBearing,
  describeSunElevation,
  filterStationOptions,
  findClosestStation,
  getRecommendation,
  getRoutePath,
  shouldPreserveDestination,
  stationOptions,
  swapStations,
} from "./shade.js";
import { LineSchematic } from "./line-schematic.js";
import { StationCombobox } from "./station-combobox.js";

const form = document.querySelector("#shade-form");
const swapButton = document.querySelector("#swap-stations");
const locateButton = document.querySelector("#locate-station");
const locationStatus = document.querySelector("#location-status");
const dateInput = document.querySelector("#departure-date");
const timeInput = document.querySelector("#departure-time");
const specificTimePanel = document.querySelector("#specific-time-panel");
const nowLabel = document.querySelector("#now-label");
const routeLineLabel = document.querySelector("#route-line-label");
const result = document.querySelector("#result");
const assumption = document.querySelector("#assumption");

const origin = new StationCombobox({
  input: document.querySelector("#origin-input"),
  listbox: document.querySelector("#origin-suggestions"),
  codeElement: document.querySelector("#origin-code"),
  getOptions: filterStationOptions,
  onSelect: handleOriginSelect,
  onInput: renderRecommendation,
});

const destination = new StationCombobox({
  input: document.querySelector("#destination-input"),
  listbox: document.querySelector("#destination-suggestions"),
  codeElement: document.querySelector("#destination-code"),
  getOptions: filterStationOptions,
  onSelect: handleDestinationSelect,
  onInput: renderRecommendation,
});

const lineSchematic = new LineSchematic({
  container: document.querySelector("#line-schematic"),
  status: document.querySelector("#schematic-status"),
  getLine: (lineId) => LINES[lineId],
  getRoutePath,
  getStationOptions: stationOptions,
  onStationSelect: handleSchematicStationSelect,
});

function selectedLineId() {
  return form.elements.line.value;
}

function usesCurrentTime() {
  return form.elements["time-mode"].value === "now";
}

function toDateInputValue(date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function toTimeInputValue(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function setSpecificDate(date) {
  dateInput.value = toDateInputValue(date);
  timeInput.value = toTimeInputValue(date);
}

function formatClockTime(date) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date);
}

function selectedDate() {
  if (usesCurrentTime() || !dateInput.value || !timeInput.value) return new Date();
  return new Date(`${dateInput.value}T${timeInput.value}`);
}

function setLine(lineId, { clearRoute = false } = {}) {
  const radio = form.querySelector(`input[name="line"][value="${lineId}"]`);
  if (radio) radio.checked = true;
  origin.setLine(lineId);
  destination.setLine(lineId);
  document.body.dataset.line = lineId;
  routeLineLabel.textContent = lineId === "all" ? "All supported lines" : LINES[lineId].name;
  assumption.textContent = lineId === "all"
    ? "Searches six supported Tokyo corridors. Choosing an origin sets the line for the trip; transfers and cross-line through services are not modeled."
    : LINES[lineId].assumption;
  if (clearRoute) {
    origin.clear();
    destination.clear();
  }
}

function handleOriginSelect(option) {
  setLine(option.lineId);
  const destinationSelection = destination.getSelection();
  if (destinationSelection && destinationSelection.lineId !== option.lineId) destination.clear();
  renderRecommendation();
  window.requestAnimationFrame(() => destination.focusAndOpen());
}

function handleDestinationSelect(option) {
  if (selectedLineId() === "all") {
    setLine(option.lineId);
    const originSelection = origin.getSelection();
    if (originSelection && originSelection.lineId !== option.lineId) origin.clear();
  }
  renderRecommendation();
  if (!origin.getSelection()) window.requestAnimationFrame(() => origin.focusAndOpen());
}

function handleSchematicStationSelect(option) {
  const start = origin.getSelection();
  const end = destination.getSelection();
  setLine(option.lineId);

  if (!start) {
    origin.setSelection(option);
    if (end && (end.lineId !== option.lineId || end.name === option.name)) destination.clear();
  } else if (!end) {
    if (start.name === option.name) return;
    destination.setSelection(option);
  } else {
    origin.setSelection(option);
    destination.clear();
  }
  renderRecommendation();
}

function sideContent(side) {
  if (side === "left") return { label: "Sit on the left", arrow: "←" };
  if (side === "right") return { label: "Sit on the right", arrow: "→" };
  return { label: "Either side is similar", arrow: "↔" };
}

function renderRoutePrompt() {
  const start = origin.getSelection();
  const end = destination.getSelection();
  const next = start ? "Choose a destination" : "Start with your origin";
  const detail = start
    ? "Type a station or pick one from the open suggestions."
    : "Search all supported lines, or use a line symbol above to narrow the station list.";

  origin.input.setAttribute("aria-invalid", String(Boolean(origin.input.value && !start)));
  destination.input.setAttribute("aria-invalid", String(Boolean(destination.input.value && !end)));
  result.dataset.state = "empty";
  delete result.dataset.side;
  result.innerHTML = `
    <div class="result-heading"><span class="result-label">Shade recommendation</span><span class="result-step">01 → 02</span></div>
    <div class="empty-answer"><span class="empty-marker" aria-hidden="true">+</span><div><h2>${next}</h2><p>${detail}</p></div></div>`;
}

function renderRecommendation() {
  nowLabel.textContent = `Now · ${formatClockTime(new Date())}`;
  const start = origin.getSelection();
  const end = destination.getSelection();
  lineSchematic.render(selectedLineId(), start, end);
  if (!start || !end || start.lineId !== end.lineId) {
    renderRoutePrompt();
    return;
  }

  try {
    const recommendation = getRecommendation({
      lineId: start.lineId,
      startName: start.name,
      endName: end.name,
      date: selectedDate(),
    });
    const side = sideContent(recommendation.side);
    const headingDirection = describeBearing(recommendation.heading);
    const sunDirection = describeBearing(recommendation.sun.azimuth);
    const sunHeight = describeSunElevation(recommendation.sun.elevation);
    const headingDegrees = Math.round(recommendation.heading);
    const sunAzimuthDegrees = Math.round(recommendation.sun.azimuth);
    const sunElevationDegrees = Math.round(recommendation.sun.elevation);
    const routeDirection = start.lineId === "yamanote"
      ? `${recommendation.direction.startsWith("clockwise") ? "Outer" : "Inner"} loop · ${headingDirection.short}`
      : `${headingDirection.short} bound`;

    result.dataset.state = "ready";
    result.dataset.side = recommendation.side;
    result.innerHTML = `
      <div class="result-heading">
        <span class="result-label">Best shade</span>
        <span class="line-badge line-badge-${start.lineId}" aria-label="${LINES[start.lineId].name}" title="${LINES[start.lineId].name}">${LINES[start.lineId].code}</span>
      </div>
      <div class="answer">
        <span class="side-arrow" aria-hidden="true">${side.arrow}</span>
        <div><h2>${side.label}</h2><p>${recommendation.start.name} <span class="route-code">${start.stationCode}</span> → ${recommendation.end.name} <span class="route-code">${end.stationCode}</span></p></div>
      </div>
      <div class="confidence-row">
        <span class="confidence confidence-${recommendation.confidence}">${recommendation.confidence} confidence</span>
        <span>${routeDirection}</span>
      </div>
      <p class="reason">${recommendation.reason}</p>
      <details class="result-details" open>
        <summary>Why this result</summary>
        <div class="orientation-layout">
          <div class="orientation-plot" style="--train-angle: ${headingDegrees}deg; --sun-angle: ${sunAzimuthDegrees}deg" role="img" aria-label="Top-down compass: train heading ${headingDirection.label}, sun toward ${sunDirection.label}">
            <span class="compass-label compass-n">N</span><span class="compass-label compass-e">E</span><span class="compass-label compass-s">S</span><span class="compass-label compass-w">W</span>
            <span class="compass-vector train-vector" aria-hidden="true">
              <svg class="vector-symbol" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="15" rx="3"></rect><path d="M8 7h8M8 12h.01M16 12h.01M8 18l-2 3M16 18l2 3"></path></svg>
            </span>
            <span class="compass-vector sun-vector" aria-hidden="true">
              <svg class="vector-symbol" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>
            </span>
            <span class="compass-center" aria-hidden="true"></span>
          </div>
          <div class="orientation-legend">
            <span><svg class="legend-icon train-key" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="15" rx="3"></rect><path d="M8 7h8M8 12h.01M16 12h.01M8 18l-2 3M16 18l2 3"></path></svg>Train</span>
            <span><svg class="legend-icon sun-key" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>Sun</span>
          </div>
        </div>
        <dl class="direction-data">
          <div><dt>Train is heading</dt><dd><strong>${headingDirection.label} <span>${headingDirection.short}</span></strong><small>${headingDegrees}° clockwise from north</small></dd></div>
          <div><dt>Sun is toward</dt><dd><strong>${sunDirection.label} <span>${sunDirection.short}</span></strong><small>${sunAzimuthDegrees}° clockwise from north</small></dd></div>
          <div><dt>Sun height</dt><dd><strong>${sunHeight}</strong><small>${sunElevationDegrees}° above the horizon</small></dd></div>
        </dl>
        <p class="bearing-note">Compass bearings start at north (0°) and move clockwise: east is 90°, south is 180°, and west is 270°. Sun height measures upward from the horizon.</p>
      </details>`;
  } catch (error) {
    result.dataset.state = "error";
    result.innerHTML = `<div class="result-heading"><span class="result-label">Route needed</span></div><div class="empty-answer"><span class="empty-marker" aria-hidden="true">!</span><div><h2>Choose two stations</h2><p>${error.message}</p></div></div>`;
  }
}

function setTimeMode() {
  const isSpecific = !usesCurrentTime();
  specificTimePanel.hidden = !isSpecific;
  dateInput.disabled = !isSpecific;
  timeInput.disabled = !isSpecific;
  renderRecommendation();
}

function applyTimePreset(preset) {
  form.elements["time-mode"].value = "specific";
  setSpecificDate(departurePreset(new Date(), preset));
  setTimeMode();
}

function swapRoute() {
  const start = origin.getSelection();
  const end = destination.getSelection();
  const swapped = swapStations(start?.name ?? null, end?.name ?? null);
  origin.setSelection(end ? { ...end, name: swapped.startName } : null);
  destination.setSelection(start ? { ...start, name: swapped.endName } : null);
  renderRecommendation();
  if (!origin.getSelection() || !destination.getSelection()) {
    const emptyCombobox = origin.getSelection() ? destination : origin;
    window.requestAnimationFrame(() => emptyCombobox.focusAndOpen());
  }
}

function formatDistance(distanceKm) {
  if (distanceKm < 1) return `${Math.max(10, Math.round(distanceKm * 1000 / 10) * 10)} m`;
  return `${distanceKm.toFixed(1)} km`;
}

function locationErrorMessage(error) {
  if (error.code === 1) return "Location access was denied. You can still search manually.";
  if (error.code === 2) return "Your location is unavailable right now. Try again or search manually.";
  if (error.code === 3) return "Location took too long. Try again or search manually.";
  return "Could not find your location. Try again or search manually.";
}

function useClosestStation() {
  if (!navigator.geolocation) {
    locationStatus.dataset.state = "error";
    locationStatus.textContent = "This browser does not support location. Search manually instead.";
    return;
  }
  locateButton.disabled = true;
  locateButton.dataset.loading = "true";
  locationStatus.dataset.state = "loading";
  locationStatus.textContent = "Finding your closest station…";
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const closest = findClosestStation(selectedLineId(), coords.latitude, coords.longitude);
      const destinationSelection = destination.getSelection();
      setLine(closest.lineId);
      origin.setSelection(closest.station);
      if (!shouldPreserveDestination(destinationSelection, closest.lineId)) destination.clear();
      locationStatus.dataset.state = "success";
      locationStatus.textContent = `Closest on ${LINES[closest.lineId].name}: ${closest.station.name} (${closest.station.nameJa}) · about ${formatDistance(closest.distanceKm)} away.`;
      locateButton.disabled = false;
      delete locateButton.dataset.loading;
      renderRecommendation();
      if (!destination.getSelection()) window.requestAnimationFrame(() => destination.focusAndOpen());
    },
    (error) => {
      locationStatus.dataset.state = "error";
      locationStatus.textContent = locationErrorMessage(error);
      locateButton.disabled = false;
      delete locateButton.dataset.loading;
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
  );
}

setLine("all");
setSpecificDate(new Date());
renderRecommendation();

form.addEventListener("change", (event) => {
  if (event.target.name === "line") {
    setLine(event.target.value, { clearRoute: true });
    locationStatus.textContent = "";
    delete locationStatus.dataset.state;
    renderRecommendation();
    return;
  }
  if (event.target.name === "time-mode") {
    setTimeMode();
    return;
  }
  renderRecommendation();
});
form.addEventListener("submit", (event) => event.preventDefault());
swapButton.addEventListener("click", swapRoute);
locateButton.addEventListener("click", useClosestStation);
document.querySelectorAll("[data-time-preset]").forEach((button) => {
  button.addEventListener("click", () => applyTimePreset(button.dataset.timePreset));
});
