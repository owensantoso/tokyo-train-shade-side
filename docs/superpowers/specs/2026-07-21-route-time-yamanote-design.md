# Route, Time, and Yamanote Design

## Goal

Improve partial-route interactions, add the JR Yamanote Line, make future departure selection easier, and show recommendation reasoning by default.

## Behavior

- Geolocation replaces only the origin. It preserves a destination when it belongs to the resolved line and clears it only when changing to an incompatible line.
- Swap exchanges origin and destination even when either side is empty.
- Yamanote uses the full JY station loop, bilingual station names, and the JR green visual identity. Recommendations follow the shorter clockwise or counterclockwise station arc and use its first-to-last path coordinates for the travel bearing.
- Departure controls retain `Now` and `Later` modes. `Later` exposes separate native date and time fields plus `+30 min`, `This evening`, and `Tomorrow morning` shortcuts. This keeps platform accessibility while avoiding a single opaque datetime picker.
- `Why this result` remains collapsible but renders open for every completed recommendation.

## Validation

Unit tests cover partial swaps, Yamanote data and loop direction, and time presets. Browser QA covers location state preservation through a stubbed geolocation response, partial swaps, responsive time controls, Yamanote selection, and expanded reasoning.
