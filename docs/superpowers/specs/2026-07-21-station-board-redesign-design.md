# Station Board Redesign

## Goal

Turn the prototype into a fast, mobile-first commuter utility while adding route reversal and line-aware nearest-station selection.

## Approved Direction

Use the bright “station board” direction from the visual mockup. The interface should feel like a dependable Tokyo transit tool: flat surfaces, crisp typography, strong hierarchy, Keio pink and Inokashira blue as functional line identifiers, a yellow swap control, and a deep green answer panel.

## Interaction Design

- Present Keio/New Line and Inokashira as a segmented line selector.
- Stack origin and destination fields with a circular swap button positioned between them.
- Swapping exchanges the two selected station values and immediately recalculates the recommendation.
- “Use closest station on this line” requests browser location, compares the user’s coordinates only with stations on the selected line, and sets the origin to the nearest station.
- Location states are explicit: locating, success with station and approximate distance, permission denied, unavailable, and unsupported browser.
- Departure time defaults to now. A compact Now / Pick time control progressively reveals the date-time field.
- Keep the recommendation visible beneath the controls. Lead with side and confidence; place headings and solar measurements inside a collapsible explanation.

## Technical Design

Keep the static HTML/CSS/JavaScript architecture and GitHub Pages deployment. Add pure geographic helpers to `shade.js` so nearest-station logic can be tested without browser APIs. Keep browser geolocation and DOM updates in `app.js`.

## Accessibility And Responsive Behavior

- All interactive controls have visible labels, keyboard focus, and a minimum 44px touch target.
- The icon-only swap button has an accessible name and inline SVG icon.
- Status changes use an ARIA live region without stealing focus.
- Color never carries the recommendation or confidence by itself.
- The layout is one column on phones and becomes a balanced two-column tool/result layout on wider screens.
- Motion is limited to short color and transform feedback and respects reduced-motion preferences.

## Error Handling

The nearest-station action never blocks manual station selection. Geolocation errors appear next to the action with a retry path. Identical origin and destination values continue to produce a clear inline result error.

## Verification

Automated tests cover distance calculation and line-scoped nearest-station selection. Existing sun-side tests remain green. Browser QA covers swap, time mode, location error handling, keyboard labels, console errors, and layout at phone and desktop widths.

