import {
  LINES,
  calculateSolarEvents,
  departurePreset,
  describeBearing,
  describeSunElevation,
  filterStationOptions,
  findClosestStation,
  getRecommendation,
  getRoutePath,
  resolveRouteLine,
  stationCodeFor,
  stationOptions,
  swapStations,
} from "./shade.js";
import { shouldFocusOriginForTyping } from "./keyboard-shortcut.js?v=0.10";
import { PhoneCompassController, signedHeadingDifference } from "./phone-compass.js";
import { StationMap } from "./station-map.js";
import { StationCombobox } from "./station-combobox.js";
import {
  clockToMinutes,
  formatTokyoDateTime,
  minutesToClock,
  parseTokyoDateTime,
  parseTripState,
  serializeTripState,
} from "./trip-state.js";

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
const resultContent = document.querySelector("#result-content");
const resultTimeControl = document.querySelector("#result-time-control");
const resultTimeSlider = document.querySelector("#result-time-slider");
const resultTimeOutput = document.querySelector("#result-time-output");
const shareButton = document.querySelector("#share-result");
const shareStatus = document.querySelector("#share-status");
const assumption = document.querySelector("#assumption");
let activeTrainHeading = null;
let phoneCompassState = { status: "idle", heading: null };
const phoneCompass = new PhoneCompassController({ onState: handlePhoneCompassState });

const origin = new StationCombobox({
  input: document.querySelector("#origin-input"),
  listbox: document.querySelector("#origin-suggestions"),
  codeElement: document.querySelector("#origin-code"),
  clearButton: document.querySelector("#clear-origin"),
  getOptions: filterStationOptions,
  onSelect: handleOriginSelect,
  onInput: handleOriginInput,
  onClear: handleOriginInput,
});

const destination = new StationCombobox({
  input: document.querySelector("#destination-input"),
  listbox: document.querySelector("#destination-suggestions"),
  codeElement: document.querySelector("#destination-code"),
  clearButton: document.querySelector("#clear-destination"),
  getOptions: filterStationOptions,
  onSelect: handleDestinationSelect,
  onInput: handleDestinationInput,
  onClear: handleDestinationInput,
});

const stationMap = new StationMap({
  container: document.querySelector("#line-schematic"),
  status: document.querySelector("#schematic-status"),
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
  return formatTokyoDateTime(date).slice(0, 10);
}

function toTimeInputValue(date) {
  return formatTokyoDateTime(date).slice(11);
}

function setSpecificDate(date) {
  dateInput.value = toDateInputValue(date);
  timeInput.value = toTimeInputValue(date);
}

function formatClockTime(date) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatTokyoClockTime(date) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(date);
}

function formatResultTime(date) {
  return `${new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(date)} JST`;
}

function selectedDate() {
  if (usesCurrentTime() || !dateInput.value || !timeInput.value) return new Date();
  return parseTokyoDateTime(`${dateInput.value}T${timeInput.value}`) ?? new Date();
}

function setSpecificTimeControls(enabled) {
  specificTimePanel.hidden = !enabled;
  dateInput.disabled = !enabled;
  timeInput.disabled = !enabled;
}

function updateResultTimeControl(date, visible) {
  resultTimeControl.hidden = !visible;
  if (!visible) return;
  const timestamp = formatTokyoDateTime(date);
  resultTimeSlider.value = String(clockToMinutes(timestamp.slice(11)));
  resultTimeOutput.textContent = formatResultTime(date);
}

function syncTripUrl(date = null) {
  const query = serializeTripState({
    lineId: selectedLineId(),
    startName: origin.getSelection()?.name,
    endName: destination.getSelection()?.name,
    date,
  });
  const nextUrl = `${window.location.pathname}?${query}${window.location.hash}`;
  if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
    window.history.replaceState(null, "", nextUrl);
  }
}

function hydrateTripState() {
  const state = parseTripState(window.location.search, ["all", ...Object.keys(LINES)]);
  setLine(state.lineId);
  if (state.date) {
    form.elements["time-mode"].value = "specific";
    setSpecificDate(state.date);
    setSpecificTimeControls(true);
  }

  const options = stationOptions(state.lineId);
  const start = options.find(({ name }) => name === state.startName) ?? null;
  const end = options.find(({ name }) => name === state.endName) ?? null;
  if (start) origin.setSelection(start);
  if (end && (!start || resolveRouteLine(start, end, state.lineId))) destination.setSelection(end);
  syncStationScopes();
}

function setLine(lineId, { clearRoute = false } = {}) {
  const radio = form.querySelector(`input[name="line"][value="${lineId}"]`);
  if (radio) radio.checked = true;
  origin.setLine(lineId);
  destination.setLine(lineId);
  document.body.dataset.line = lineId;
  routeLineLabel.textContent = lineId === "all" ? "All supported lines" : LINES[lineId].name;
  assumption.textContent = lineId === "all"
    ? "Searches eight supported Tokyo corridors. Shared stations keep every available line until both endpoints identify a direct route; transfers are not modeled."
    : LINES[lineId].assumption;
  if (clearRoute) {
    origin.clear();
    destination.clear();
  }
}

function syncStationScopes() {
  const lineId = selectedLineId();
  const start = origin.getSelection();
  const end = destination.getSelection();
  origin.setLine(lineId === "all" && !start && end ? end.lineIds : lineId);
  destination.setLine(lineId === "all" && start ? start.lineIds : lineId);
}

function handleOriginSelect(option) {
  const destinationSelection = destination.getSelection();
  if (destinationSelection && !resolveRouteLine(option, destinationSelection, selectedLineId())) {
    destination.clear();
  }
  syncStationScopes();
  renderRecommendation();
  window.requestAnimationFrame(() => destination.focusAndOpen());
}

function handleOriginInput() {
  syncStationScopes();
  renderRecommendation();
}

function handleDestinationSelect(option) {
  syncStationScopes();
  renderRecommendation();
  if (!origin.getSelection()) window.requestAnimationFrame(() => origin.focusAndOpen());
}

function handleDestinationInput() {
  syncStationScopes();
  renderRecommendation();
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

function renderNightResult({ recommendation, routeLineId, routeDirection, startCode, endCode, departureDate }) {
  stopPhoneCompass();
  let relevantSunset = recommendation.solarEvents.sunset;
  if (recommendation.solarEvents.sunrise && departureDate < recommendation.solarEvents.sunrise) {
    relevantSunset = calculateSolarEvents(new Date(departureDate.getTime() - 86400000)).sunset;
  }
  const sunsetText = relevantSunset ? formatTokyoClockTime(relevantSunset) : "Unavailable";

  result.dataset.state = "night";
  delete result.dataset.side;
  resultContent.innerHTML = `
    <div class="result-heading">
      <span class="result-label">Night journey</span>
      <span class="line-badge line-badge-${routeLineId}" aria-label="${LINES[routeLineId].name}" title="${LINES[routeLineId].name}">${LINES[routeLineId].code}</span>
    </div>
    <div class="answer night-answer">
      <span class="side-arrow night-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"></path></svg>
      </span>
      <div><h2>It's night. No sun.</h2><p>${recommendation.start.name} <span class="route-code">${startCode}</span> → ${recommendation.end.name} <span class="route-code">${endCode}</span></p></div>
    </div>
    <div class="confidence-row night-meta">
      <span class="night-status">Sun below horizon</span>
      <span>${routeDirection}</span>
    </div>
    <p class="reason">There is no direct sunlight to avoid, so neither side has a shade advantage.</p>
    <div class="night-fact">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18h12M4 14h16M12 3v7M8.5 6.5 12 10l3.5-3.5"></path></svg>
      <div><span>Previous sunset</span><strong>${sunsetText}</strong><small>Calculated locally for Tokyo for this date.</small></div>
    </div>`;
}

function stopPhoneCompass() {
  activeTrainHeading = null;
  if (phoneCompass.listening) phoneCompass.stop();
}

function handlePhoneCompassState(state) {
  phoneCompassState = state;
  renderPhoneCompassState();
}

function phoneAlignmentText(trainHeading, phoneHeading) {
  const difference = signedHeadingDifference(trainHeading, phoneHeading);
  const absoluteDifference = Math.round(Math.abs(difference));
  if (absoluteDifference <= 5) return "Aligned with expected train direction";
  return `${absoluteDifference}° ${difference > 0 ? "right" : "left"} of expected train direction`;
}

function renderPhoneCompassState() {
  const button = document.querySelector("#phone-compass-button");
  if (!button) return;
  const buttonLabel = button.querySelector("span");
  const status = document.querySelector("#phone-compass-status");
  const vector = document.querySelector("#phone-vector");
  const legend = document.querySelector("#phone-legend");
  const row = document.querySelector("#phone-direction-row");
  const plot = document.querySelector(".orientation-plot");
  const isRunning = ["waiting", "active"].includes(phoneCompassState.status);
  const hasHeading = phoneCompassState.status === "active" && Number.isFinite(phoneCompassState.heading);

  button.disabled = phoneCompassState.status === "requesting" || phoneCompassState.status === "unsupported";
  button.dataset.active = String(isRunning);
  buttonLabel.textContent = phoneCompassState.status === "requesting"
    ? "Requesting compass"
    : isRunning ? "Stop phone compass" : phoneCompassState.status === "unsupported" ? "Compass unavailable" : "Use phone compass";

  const statusMessages = {
    idle: "",
    requesting: "Requesting sensor permission...",
    waiting: "Waiting for an absolute heading...",
    active: "Live phone heading",
    denied: "Compass permission was not granted.",
    unsupported: "Phone compass is unavailable in this browser.",
  };
  status.textContent = statusMessages[phoneCompassState.status] ?? "Phone compass is unavailable.";
  status.dataset.state = phoneCompassState.status;
  vector.hidden = !hasHeading;
  legend.hidden = !hasHeading;
  row.hidden = !hasHeading;

  if (!hasHeading || !Number.isFinite(activeTrainHeading)) {
    if (plot) plot.setAttribute("aria-label", plot.dataset.baseLabel);
    return;
  }

  const heading = phoneCompassState.heading;
  const direction = describeBearing(heading);
  const headingDegrees = Math.round(heading);
  vector.style.setProperty("--phone-angle", `${heading}deg`);
  document.querySelector("#phone-direction-label").innerHTML = `${direction.label} <span>${direction.short}</span>`;
  document.querySelector("#phone-direction-detail").textContent = `${headingDegrees}° clockwise from north · ${phoneAlignmentText(activeTrainHeading, heading)}`;
  plot.setAttribute("aria-label", `${plot.dataset.baseLabel}, phone toward ${direction.label}`);
}

function bindPhoneCompassControls() {
  const button = document.querySelector("#phone-compass-button");
  if (!button) return;
  button.addEventListener("click", () => {
    if (["waiting", "active"].includes(phoneCompassState.status)) phoneCompass.stop();
    else phoneCompass.start();
  });
  renderPhoneCompassState();
}

function renderRoutePrompt() {
  stopPhoneCompass();
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
  updateResultTimeControl(new Date(), false);
  resultContent.innerHTML = `
    <div class="result-heading"><span class="result-label">Shade recommendation</span><span class="result-step">01 → 02</span></div>
    <div class="empty-answer"><span class="empty-marker" aria-hidden="true">+</span><div><h2>${next}</h2><p>${detail}</p></div></div>`;
}

function renderRecommendation() {
  nowLabel.textContent = `Now · ${formatClockTime(new Date())}`;
  const start = origin.getSelection();
  const end = destination.getSelection();
  const routeLineId = resolveRouteLine(start, end, selectedLineId());
  stationMap.render(selectedLineId(), start, end);
  if (!start || !end || !routeLineId) {
    renderRoutePrompt();
    syncTripUrl();
    return;
  }

  try {
    const departureDate = selectedDate();
    const recommendation = getRecommendation({
      lineId: routeLineId,
      startName: start.name,
      endName: end.name,
      date: departureDate,
    });
    const side = sideContent(recommendation.side);
    const headingDirection = describeBearing(recommendation.heading);
    const sunDirection = describeBearing(recommendation.sun.azimuth);
    const sunHeight = describeSunElevation(recommendation.sun.elevation);
    const headingDegrees = Math.round(recommendation.heading);
    const sunAzimuthDegrees = Math.round(recommendation.sun.azimuth);
    const sunElevationDegrees = Math.round(recommendation.sun.elevation);
    const routeDirection = routeLineId === "yamanote"
      ? `${recommendation.direction.startsWith("clockwise") ? "Outer" : "Inner"} loop · ${headingDirection.short}`
      : `${headingDirection.short} bound`;
    const startCode = stationCodeFor(routeLineId, start.name);
    const endCode = stationCodeFor(routeLineId, end.name);
    updateResultTimeControl(departureDate, true);
    syncTripUrl(departureDate);

    if (recommendation.isNight) {
      renderNightResult({ recommendation, routeLineId, routeDirection, startCode, endCode, departureDate });
      return;
    }

    result.dataset.state = "ready";
    result.dataset.side = recommendation.side;
    resultContent.innerHTML = `
      <div class="result-heading">
        <span class="result-label">Best shade</span>
        <span class="line-badge line-badge-${routeLineId}" aria-label="${LINES[routeLineId].name}" title="${LINES[routeLineId].name}">${LINES[routeLineId].code}</span>
      </div>
      <div class="answer">
        <span class="side-arrow" aria-hidden="true">${side.arrow}</span>
        <div><h2>${side.label}</h2><p>${recommendation.start.name} <span class="route-code">${startCode}</span> → ${recommendation.end.name} <span class="route-code">${endCode}</span></p></div>
      </div>
      <div class="confidence-row">
        <span class="confidence confidence-${recommendation.confidence}">${recommendation.confidence} confidence</span>
        <span>${routeDirection}</span>
      </div>
      <p class="reason">${recommendation.reason}</p>
      <details class="result-details" open>
        <summary>Why this result</summary>
        <div class="orientation-layout">
          <div class="orientation-plot" style="--train-angle: ${headingDegrees}deg; --sun-angle: ${sunAzimuthDegrees}deg" role="img" data-base-label="Top-down compass: train heading ${headingDirection.label}, sun toward ${sunDirection.label}" aria-label="Top-down compass: train heading ${headingDirection.label}, sun toward ${sunDirection.label}">
            <span class="compass-label compass-n">N</span><span class="compass-label compass-e">E</span><span class="compass-label compass-s">S</span><span class="compass-label compass-w">W</span>
            <span class="compass-vector train-vector" aria-hidden="true">
              <svg class="vector-symbol" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="15" rx="3"></rect><path d="M8 7h8M8 12h.01M16 12h.01M8 18l-2 3M16 18l2 3"></path></svg>
            </span>
            <span class="compass-vector sun-vector" aria-hidden="true">
              <svg class="vector-symbol" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>
            </span>
            <span id="phone-vector" class="compass-vector phone-vector" aria-hidden="true" hidden>
              <svg class="vector-symbol" viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2"></rect><path d="M10 5h4M11 18.5h2"></path></svg>
            </span>
            <span class="compass-center" aria-hidden="true"></span>
          </div>
          <div class="orientation-side">
            <div class="orientation-legend">
              <span><svg class="legend-icon train-key" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="15" rx="3"></rect><path d="M8 7h8M8 12h.01M16 12h.01M8 18l-2 3M16 18l2 3"></path></svg>Train</span>
              <span><svg class="legend-icon sun-key" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>Sun</span>
              <span id="phone-legend" hidden><svg class="legend-icon phone-key" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"></rect><path d="M10 5h4M11 18.5h2"></path></svg>Phone</span>
            </div>
            <button id="phone-compass-button" class="phone-compass-button" type="button" data-active="false">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="m15 9-2 5-5 2 2-5 5-2Z"></path></svg>
              <span>Use phone compass</span>
            </button>
            <p id="phone-compass-status" class="phone-compass-status" aria-live="polite"></p>
          </div>
        </div>
        <dl class="direction-data">
          <div><dt>Train is heading</dt><dd><strong>${headingDirection.label} <span>${headingDirection.short}</span></strong><small>${headingDegrees}° clockwise from north</small></dd></div>
          <div><dt>Sun is toward</dt><dd><strong>${sunDirection.label} <span>${sunDirection.short}</span></strong><small>${sunAzimuthDegrees}° clockwise from north</small></dd></div>
          <div><dt>Sun height</dt><dd><strong>${sunHeight}</strong><small>${sunElevationDegrees}° above the horizon</small></dd></div>
          <div id="phone-direction-row" hidden><dt>Phone points</dt><dd><strong id="phone-direction-label"></strong><small id="phone-direction-detail"></small></dd></div>
        </dl>
        <p class="bearing-note">Compass bearings start at north (0°) and move clockwise: east is 90°, south is 180°, and west is 270°. Sun height measures upward from the horizon.</p>
      </details>`;
    activeTrainHeading = recommendation.heading;
    bindPhoneCompassControls();
  } catch (error) {
    stopPhoneCompass();
    result.dataset.state = "error";
    updateResultTimeControl(new Date(), false);
    resultContent.innerHTML = `<div class="result-heading"><span class="result-label">Route needed</span></div><div class="empty-answer"><span class="empty-marker" aria-hidden="true">!</span><div><h2>Choose two stations</h2><p>${error.message}</p></div></div>`;
  }
}

function setTimeMode() {
  const isSpecific = !usesCurrentTime();
  setSpecificTimeControls(isSpecific);
  renderRecommendation();
}

function applyTimePreset(preset) {
  form.elements["time-mode"].value = "specific";
  setSpecificDate(departurePreset(new Date(), preset));
  setTimeMode();
}

function applyResultSliderTime() {
  const baseDate = formatTokyoDateTime(selectedDate()).slice(0, 10);
  const date = parseTokyoDateTime(`${baseDate}T${minutesToClock(resultTimeSlider.value)}`);
  if (!date) return;
  form.elements["time-mode"].value = "specific";
  setSpecificDate(date);
  setSpecificTimeControls(true);
  shareStatus.textContent = "";
  renderRecommendation();
}

async function copyResultLink() {
  syncTripUrl(selectedDate());
  const link = window.location.href;
  let copied = false;
  try {
    await navigator.clipboard.writeText(link);
    copied = true;
  } catch {
    const temporary = document.createElement("textarea");
    temporary.value = link;
    temporary.setAttribute("readonly", "");
    temporary.style.position = "fixed";
    temporary.style.opacity = "0";
    document.body.append(temporary);
    temporary.select();
    copied = document.execCommand("copy");
    temporary.remove();
  }
  shareStatus.textContent = copied
    ? "Link copied. It includes this route and departure time."
    : "Could not copy automatically. Copy the current address from your browser.";
}

function swapRoute() {
  const start = origin.getSelection();
  const end = destination.getSelection();
  const swapped = swapStations(start?.name ?? null, end?.name ?? null);
  origin.setSelection(end ? { ...end, name: swapped.startName } : null);
  destination.setSelection(start ? { ...start, name: swapped.endName } : null);
  syncStationScopes();
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
      const requestedLineId = selectedLineId();
      const closest = findClosestStation(requestedLineId, coords.latitude, coords.longitude);
      const destinationSelection = destination.getSelection();
      origin.setSelection(closest.station);
      if (destinationSelection && !resolveRouteLine(closest.station, destinationSelection, requestedLineId)) {
        destination.clear();
      }
      syncStationScopes();
      locationStatus.dataset.state = "success";
      const locationContext = requestedLineId === "all"
        ? `Served by ${closest.station.stationCodes.join(", ")}`
        : LINES[requestedLineId].name;
      locationStatus.textContent = `Closest station: ${closest.station.name} (${closest.station.nameJa}) · ${locationContext} · about ${formatDistance(closest.distanceKm)} away.`;
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

setSpecificDate(new Date());
hydrateTripState();
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
resultTimeSlider.addEventListener("input", applyResultSliderTime);
shareButton.addEventListener("click", copyResultLink);
document.addEventListener("keydown", (event) => {
  if (!shouldFocusOriginForTyping(event, document.activeElement)) return;
  origin.input.focus();
  origin.input.select();
});
document.querySelectorAll("[data-time-preset]").forEach((button) => {
  button.addEventListener("click", () => applyTimePreset(button.dataset.timePreset));
});
