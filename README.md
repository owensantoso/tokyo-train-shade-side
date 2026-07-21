# Tokyo Train Shade Side

Small static prototype for recommending the shadier side of a Tokyo train.

## Scope

- Website only.
- Supports Keio Line / Keio New Line, Inokashira Line, Toei Shinjuku Line,
  Tokyo Metro Ginza Line, the JR Chuo Rapid corridor from Tokyo to Takao,
  and the JR Yamanote Line.
- User searches for an origin and destination, optionally filtering by line first.
- Search accepts English or Japanese station names and shows both in suggestions.
- All-lines search shows compact line-code badges and distinguishes shared stations.
- Arrow keys move through station suggestions, Enter selects, and Escape closes the list.
- Choosing an origin establishes its line and opens destination suggestions automatically.
- Swap origin and destination with one button.
- Optionally choose the closest origin station on the selected line using browser location.
- Uses approximate station coordinates and approximate sun position.
- Explains train and sun bearings with 16-point compass labels while preserving raw degrees.
- No maps, route planning, transfers, live train data, car layout data, or building shadows.

## Route assumptions

- Each supported line is modeled as one ordered corridor using approximate station coordinates.
- Keio and Toei Shinjuku through-services are shown as separate lines. Cross-operator journeys are not calculated.
- Chuo Rapid stopping patterns vary by service. This prototype treats every listed Tokyo-Takao station as one continuous corridor and does not model train categories or timetables.
- Yamanote trips use the shorter arc around the loop and the departure direction at the origin. The train curves, so the sunnier side may change during longer trips.
- Line colors and codes are visual identifiers only; this is not an official railway app.

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
