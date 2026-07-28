# Tokyo Train Shade Side

Small static prototype for recommending the shadier side of a Tokyo train.

## Scope

- Website only.
- Supports Keio Line / Keio New Line, Inokashira Line, Toei Shinjuku Line,
  Tokyo Metro Ginza Line, the JR Chuo Rapid corridor from Tokyo to Takao,
  the JR Yamanote Line, the Odakyu Odawara Line from Shinjuku to Odawara,
  and the Tokyu Den-en-toshi Line from Shibuya to Chuo-rinkan.
- User searches for an origin and destination, optionally filtering by line first.
- Typing while no control is focused automatically starts a search in Origin.
- Search accepts English or Japanese station names and shows both in suggestions.
- Station numbers are shown throughout and can be searched directly, such as `JY17` or `G09`.
- All-lines search groups shared stations into one place and shows every applicable line code.
- Selecting a line zooms the embedded geographic station map to that corridor; click one station for the origin and another for the destination.
- Arrow keys move through station suggestions, Enter selects, and Escape closes the list.
- Choosing a shared origin keeps every directly reachable line available; the line resolves after the destination is selected.
- Swap origin and destination with one button.
- Optionally choose the closest origin station using browser location, across all lines or within an explicit line filter.
- Uses approximate station coordinates and approximate sun position.
- Detects night after the calculated Tokyo sunset and removes the sun-side recommendation and compass.
- Sunrise and sunset are calculated locally for the selected date; no weather or astronomy API is called.
- Completed results include a live Tokyo-time slider that recalculates the shade recommendation while it moves.
- Route, endpoints, and exact Tokyo departure time are stored in the URL and can be copied with the result Share button.
- Explains train and sun bearings with 16-point compass labels while preserving raw degrees.
- On supported phones, an optional permission-gated compass needle compares the phone's absolute heading with the expected train direction.
- Phone compass readings stay in the browser, are not stored, and never override the calculated route bearing.
- No route planning, transfers, live train data, car layout data, or building shadows.
- The station map uses OpenStreetMap tiles and approximate line coordinates; it is a selection surface, not a route planner.
- `network-map-preview.html` is an isolated interactive basemap draft for evaluating a future map view.

## Route assumptions

- Each supported line is modeled as one ordered corridor using approximate station coordinates.
- Keio and Toei Shinjuku through-services are shown as separate lines. Cross-operator journeys are not calculated.
- Chuo Rapid stopping patterns vary by service. This prototype treats every listed Tokyo-Takao station as one continuous corridor and does not model train categories or timetables.
- Yamanote trips use the shorter arc around the loop and the departure direction at the origin. The train curves, so the sunnier side may change during longer trips.
- Odakyu Enoshima and Tama branches, through-services, and stopping patterns are not modeled.
- Den-en-toshi through-services and stopping patterns are not modeled.
- Line colors and codes are visual identifiers only; this is not an official railway app.
- Phone headings can be distorted by the train body, nearby electronics, tunnels, and device calibration.

## Run locally

Open `index.html` in a browser, or serve the folder with any static server.

The station-board interface recalculates immediately when the line, route, or departure time changes.

## Location assumptions

- Location is requested only after pressing the closest-station button.
- Coordinates stay in the browser and are not stored or sent to a server.
- Geolocation normally requires HTTPS or localhost; the GitHub Pages deployment uses HTTPS.
- Closest means straight-line distance across all supported lines, or within the explicit line filter; it is not walking distance.

## Test

```bash
npm test
```
