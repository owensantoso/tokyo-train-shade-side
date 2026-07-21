import {
  LINES,
  describeBearing,
  describeSunElevation,
  filterStationOptions,
  findClosestStation,
  getRecommendation,
  swapStations,
} from "./shade.js";
import { StationCombobox } from "./station-combobox.js";

const form = document.querySelector("#shade-form");
const swapButton = document.querySelector("#swap-stations");
const locateButton = document.querySelector("#locate-station");
const locationStatus = document.querySelector("#location-status");
const timeInput = document.querySelector("#time");
const specificTimeLabel = document.querySelector("#specific-time-label");
const nowLabel = document.querySelector("#now-label");
const routeLineLabel = document.querySelector("#route-line-label");
const result = document.querySelector("#result");
const assumption = document.querySelector("#assumption");

const origin = new StationCombobox({
  input: document.querySelector("#origin-input"),
  listbox: document.querySelector("#origin-suggestions"),
  getOptions: filterStationOptions,
  onSelect: handleOriginSelect,
  onInput: renderRecommendation,
});

const destination = new StationCombobox({
  input: document.querySelector("#destination-input"),
  listbox: document.querySelector("#destination-suggestions"),
  getOptions: filterStationOptions,
  onSelect: handleDestinationSelect,
  onInput: renderRecommendation,
});

function selectedLineId() {
  return form.elements.line.value;
}

function usesCurrentTime() {
  return form.elements["time-mode"].value === "now";
}

function toDatetimeLocalValue(date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function formatClockTime(date) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date);
}

function selectedDate() {
  return usesCurrentTime() || !timeInput.value ? new Date() : new Date(timeInput.value);
}

function setLine(lineId, { clearRoute = false } = {}) {
  const radio = form.querySelector(`input[name="line"][value="${lineId}"]`);
  if (radio) radio.checked = true;
  origin.setLine(lineId);
  destination.setLine(lineId);
  document.body.dataset.line = lineId;
  routeLineLabel.textContent = lineId === "all" ? "All supported lines" : LINES[lineId].name;
  assumption.textContent = lineId === "all"
    ? "Searches Keio Line / Keio New Line and Inokashira Line. Choosing an origin sets the line for the trip."
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
    : "Search all lines, or filter to Keio/New Line or Inokashira first.";

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

    result.dataset.state = "ready";
    result.dataset.side = recommendation.side;
    result.innerHTML = `
      <div class="result-heading">
        <span class="result-label">Best shade</span>
        <span class="line-badge line-badge-${start.lineId}">${LINES[start.lineId].shortName}</span>
      </div>
      <div class="answer">
        <span class="side-arrow" aria-hidden="true">${side.arrow}</span>
        <div><h2>${side.label}</h2><p>${recommendation.start.name} → ${recommendation.end.name}</p></div>
      </div>
      <div class="confidence-row">
        <span class="confidence confidence-${recommendation.confidence}">${recommendation.confidence} confidence</span>
        <span>${headingDirection.short} bound</span>
      </div>
      <p class="reason">${recommendation.reason}</p>
      <details class="result-details">
        <summary>Why this result</summary>
        <div class="orientation-layout">
          <div class="orientation-plot" style="--train-angle: ${headingDegrees}deg; --sun-angle: ${sunAzimuthDegrees}deg" role="img" aria-label="Top-down compass: train heading ${headingDirection.label}, sun toward ${sunDirection.label}">
            <span class="compass-label compass-n">N</span><span class="compass-label compass-e">E</span><span class="compass-label compass-s">S</span><span class="compass-label compass-w">W</span>
            <span class="compass-vector train-vector" aria-hidden="true"></span>
            <span class="compass-vector sun-vector" aria-hidden="true"></span>
            <span class="compass-center" aria-hidden="true"></span>
          </div>
          <div class="orientation-legend"><span><i class="train-key"></i>Train</span><span><i class="sun-key"></i>Sun</span></div>
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
  specificTimeLabel.hidden = !isSpecific;
  timeInput.disabled = !isSpecific;
  if (!isSpecific) timeInput.value = toDatetimeLocalValue(new Date());
  renderRecommendation();
}

function swapRoute() {
  const start = origin.getSelection();
  const end = destination.getSelection();
  if (!start || !end) {
    renderRoutePrompt();
    return;
  }
  const swapped = swapStations(start.name, end.name);
  origin.setSelection({ ...end, name: swapped.startName });
  destination.setSelection({ ...start, name: swapped.endName });
  renderRecommendation();
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
      setLine(closest.lineId);
      origin.setSelection(closest.station);
      destination.clear();
      locationStatus.dataset.state = "success";
      locationStatus.textContent = `Closest on ${LINES[closest.lineId].name}: ${closest.station.name} · about ${formatDistance(closest.distanceKm)} away.`;
      locateButton.disabled = false;
      delete locateButton.dataset.loading;
      renderRecommendation();
      window.requestAnimationFrame(() => destination.focusAndOpen());
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
timeInput.value = toDatetimeLocalValue(new Date());
renderRecommendation();

form.addEventListener("change", (event) => {
  if (event.target.name === "line") {
    setLine(event.target.value, { clearRoute: true });
    locationStatus.textContent = "";
    delete locationStatus.dataset.state;
    renderRecommendation();
    window.requestAnimationFrame(() => origin.focusAndOpen());
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
