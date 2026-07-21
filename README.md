# Tokyo Train Shade Side

Small static prototype for recommending the shadier side of a Tokyo train.

## Scope

- Website only.
- Supports Keio Line / Keio New Line and Inokashira Line.
- User searches for an origin and destination, optionally filtering by line first.
- All lines search shows line badges and distinguishes shared stations such as Meidaimae.
- Arrow keys move through station suggestions, Enter selects, and Escape closes the list.
- Choosing an origin establishes its line and opens destination suggestions automatically.
- Swap origin and destination with one button.
- Optionally choose the closest origin station on the selected line using browser location.
- Uses approximate station coordinates and approximate sun position.
- Explains train and sun bearings with 16-point compass labels while preserving raw degrees.
- No maps, route planning, transfers, live train data, car layout data, or building shadows.

## Run locally

Open `index.html` in a browser, or serve the folder with any static server.

The station-board interface recalculates immediately when the line, route, or departure time changes.

## Location assumptions

- Location is requested only after pressing the closest-station button.
- Coordinates stay in the browser and are not stored or sent to a server.
- Geolocation normally requires HTTPS or localhost; the GitHub Pages deployment uses HTTPS.
- Closest means straight-line distance to stations on the selected line, not walking distance.

## Test

```bash
npm test
```
