# Map Direction and Sun Overlay Design

## Goal

Make the selected map segment explain the journey at a glance:

- show which way the train travels;
- frame the map around the selected route;
- link result endpoint hover and focus states to map markers;
- show the direction incoming sunlight travels;
- update the sunlight overlay smoothly when departure time changes.

The overlay remains an orientation aid. It does not claim to model building shadows, sunlight intensity, weather, or carriage geometry.

## Selected Visual Direction

Use the approved "route arrows plus sun rays" treatment.

### Travel Direction

The selected route remains a yellow polyline. Small black chevrons repeat along it and point from origin toward destination. Chevrons are static rather than animated so they indicate direction without implying live train movement.

The origin marker remains yellow and the destination marker uses the selected line color. Both markers retain a dark outline.

### Sun Direction

Show a sun icon near the edge of the visible route frame on the side where the sun is located. Three parallel rays travel from the sun toward the route midpoint:

- one strong center ray provides the precise directional axis;
- two lighter outer rays make the overlay read as sunlight rather than another railway line;
- small arrowheads point in the direction the light travels.

The displayed sun bearing remains the azimuth toward the sun. The ray arrows point in the opposite direction because sunlight travels from the sun toward the route.

At night, remove the sun icon and rays entirely.

## Map Framing

Map framing responds to route completeness:

1. No selected stations: frame the selected line or the supported network.
2. Origin only: zoom to the origin and enough surrounding line context to choose a destination.
3. Origin and destination: fit the selected route segment with padding for endpoint markers and the sun icon.

Framing runs after station selection from autocomplete, map clicks, nearest-station selection, URL hydration, swaps, and recent-route restoration. Changing only departure time must not reframe the map.

The automatic fit uses a restrained maximum zoom so very short trips still show geographic context.

## Result-to-Map Linking

The origin and destination text in completed day and night results become focusable hover targets.

Hovering or focusing one endpoint:

- enlarges the corresponding map marker;
- raises it above nearby markers;
- opens its bilingual station tooltip.

Pointer exit or blur restores the normal selected marker. This interaction must not select or modify the route.

Touch devices retain the existing visible selected markers and do not depend on hover.

## Time-Driven Updates

`StationMap` receives a separate trip-overlay update after the recommendation is calculated. It includes:

- resolved route line;
- ordered route stations;
- train heading;
- solar azimuth;
- daylight/night state.

The result slider already recalculates on every input event. Each recalculation updates the map sun overlay without rebuilding base line layers or changing the map frame.

The sun group rotates around the route midpoint using a short CSS transition. Azimuth is unwrapped against the previous value so crossing from 359 degrees to 0 degrees follows the shortest rotation instead of spinning backward through a full circle.

The overlay fades in and out at the daylight boundary. Reduced-motion users receive immediate updates with no transition.

## Architecture

Keep Leaflet ownership inside `station-map.js`.

- A dedicated Leaflet SVG overlay pane owns route chevrons and sunlight graphics.
- Pure geometry helpers calculate arrow placement, continuous rotation, and ray orientation.
- `render(lineId, origin, destination)` continues to own visible line/station layers and automatic framing.
- `updateTripOverlay(data)` updates chevrons and sunlight without reframing.
- `highlightEndpoint(role, active)` owns result-to-map marker highlighting.
- `clearTripOverlay()` removes route-specific graphics for incomplete or invalid routes.

`app.js` remains responsible for recommendation calculation and binds result hover/focus events after rendering result markup.

## Accessibility and Localization

- Endpoint hover targets are keyboard focusable.
- Their accessible labels identify the station and whether it is the origin or destination.
- The map receives localized labels for travel direction, sun direction, and night state where visible text or ARIA descriptions are used.
- Direction remains understandable without color because chevrons and endpoint shapes provide independent cues.
- Sun rays do not intercept map pointer events.

## Testing

Add focused unit coverage for:

- route arrow placement follows station order;
- reversed trips reverse the arrow direction;
- sun ray travel direction is opposite the solar azimuth;
- azimuth unwrapping takes the shortest path across north;
- incomplete routes clear route-specific overlays.

Browser verification covers:

- autocomplete and map-click selections frame the selected segment;
- result endpoint hover/focus highlights the matching marker;
- time-slider movement rotates the sun overlay without map reframing;
- night removes the overlay and daylight restores it;
- desktop and narrow mobile layouts have no overflow or obstructed controls;
- English and Japanese result states remain functional.

## Limitations

- The route uses approximate station-to-station geometry rather than exact track alignment.
- Chevrons describe route order, not train position or speed.
- Sun rays describe incoming horizontal direction only; they do not visualize elevation, intensity, shadows, weather, or obstruction.
- Longer curved journeys can have local headings that differ from the single recommendation heading.
