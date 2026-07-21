# Station Autocomplete And Direction Explanation

## Goal

Replace station dropdowns with fast, accessible search while making the recommendation’s direction and solar data understandable without hiding the raw values.

## Station Search

- Add an explicit All lines state and make it the initial line selection.
- Origin and Destination become ARIA comboboxes with filtered listboxes.
- In All lines, suggestions include every supported station and a colored line badge. Shared stations such as Meidaimae appear once per line.
- With Keio/New Line or Inokashira selected, suggestions are limited to that line.
- Search is case-insensitive and matches station names by prefix first, then substring.
- Arrow Up and Arrow Down move through suggestions, Enter selects, Escape closes, and mouse/touch selection works.
- Selecting Origin establishes its line, focuses Destination, and opens Destination suggestions immediately.
- Selecting a line manually clears incompatible route selections, focuses Origin, and opens suggestions for that line.
- Typed text is not a valid station until a suggestion is selected.
- Swap exchanges two valid station selections and retains the established line.
- Closest station searches all supported lines in All lines mode and otherwise searches only the selected line. A location result establishes the selected line and hands focus to Destination.

## Human Direction Explanation

- Convert bearings to one of 16 compass points, with a short code and full label. For example, 239 degrees becomes WSW / West-southwest.
- Describe sun azimuth as a compass direction and elevation as below horizon, low, mid-sky, high, or nearly overhead.
- Keep the main recommendation concise.
- Under “Why this result,” show a functional top-down compass with separate train and sun indicators.
- Present human labels first and raw data second: “West-southwest” followed by “239 degrees from north.”
- Explain elevation as both a phrase and raw angle, such as “Mid-sky · 34 degrees above the horizon.”

## Visual Refinement

- Move from generic soft cards to Tokyo wayfinding: white and cool-gray ground, near-black ink, crisp 2px borders, restrained 4px corners, and line colors only for line identity.
- Use a narrow technical type treatment for labels and raw bearings while keeping readable system sans-serif for controls and prose.
- Add a thin dual-line rail stripe near the brand as a recognizable product signal.
- Render the route controls as a compact station board instead of a floating card.
- Rebuild the swap control with a centered two-arrow SVG inside a stable square target.
- Avoid decorative animation; use only short state transitions and respect reduced motion.

## Architecture

- Keep station data and pure filtering/compass helpers in `shade.js` so Node tests cover behavior.
- Add `station-combobox.js` as a focused DOM component handling listbox rendering, keyboard navigation, selected state, and focus/open commands.
- Keep route orchestration, line changes, geolocation, time, and result rendering in `app.js`.

## Error Handling And Accessibility

- Empty or uncommitted text yields a clear route prompt rather than a stale recommendation.
- The combobox maintains `aria-expanded`, `aria-controls`, `aria-activedescendant`, `role=option`, and selected state.
- Suggestions stay within the viewport, have 44px minimum targets, and do not depend on color alone.
- Focus moves only after an explicit selection, never while typing.

## Verification

- Unit tests cover all-lines flattening, selected-line filtering, query ranking, duplicate shared stations, all-lines nearest lookup, compass boundaries, and elevation descriptions.
- Browser QA covers mouse and keyboard selection, automatic focus handoff, open Destination suggestions, line changes, swap, closest-station UI states, details disclosure, responsive layouts, focus order, and console errors.

