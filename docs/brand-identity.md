# Woodstop brand identity and interface guidelines

**Status:** Founder-approved direction, 15 November 2026  
**Scope:** Public-facing identity and product presentation for Woodstop, a roadside firewood bundle locator. The product requirements in [mvp.md](mvp.md) remain authoritative for behavior.

## Brand foundation

Woodstop helps campers and travelers find nearby roadside firewood stands. It should feel like a useful local guide: outdoorsy, welcoming, clear, and dependable. Make the experience practical first, with warmth in the color, language, and small details.

**Brand attributes:** Grounded · neighborly · useful · warm · trustworthy  
**Primary line:** “Find firewood near you.”  
**Supporting line:** “Less searching. More time by the fire.”

The green, wood, and campfire palette is an aesthetic direction, not an environmental or sourcing claim. Never imply that listings are certified sustainable, that wood is locally harvested, that a stand has stock, or that wood may be transported or burned at a destination unless that information has been verified.

## Approved logo direction

The current preferred logo is a simple forest-green map pin with a cream flame-shaped negative-space cutout, paired with a plain lowercase **woodstop** wordmark in solid Ember Clay (`#BC6D3E`). The flame and pin share one compact mark. The wordmark is flat color, with no wood-grain texture, effects, or letter gimmicks. The mark should remain simple and readable at small sizes.

The approved PNG exports are in `assets/woodstop-logo-512.png`, `assets/woodstop-logo-256.png`, and `assets/woodstop-logo-128.png`. They use a warm cream background. Use these exports as the current visual source of truth. The existing SVG icon is an exploratory draft and is not an approved substitute; redraw a vector from the selected design before using an SVG in production.

Use the symbol alone where a compact app or map mark is needed. Use the full pin-and-wordmark lockup for the site identity. Do not add the separate firewood bundle illustration to the logo; bundles can appear as supporting product imagery when useful.

## Color system

| Token | Name | Hex | Primary use |
|---|---|---|---|
| `pine` | Pine | `#234D38` | Brand symbol, primary actions, links, selected navigation |
| `pine-deep` | Deep Pine | `#193B2B` | Pressed/hover action state and high-emphasis green |
| `clay` | Ember Clay | `#BC6D3E` | Wordmark, warm accents, selected highlights |
| `sienna` | Burnt Sienna | `#99522F` | Darker clay for filled controls if needed |
| `moss` | Moss | `#70794D` | Secondary outdoor details and restrained labels |
| `canvas` | Warm Canvas | `#F7F5EF` | Main page background |
| `cream` | Cream | `#FFFEFA` | Cards and raised surfaces |
| `sage` | Pale Sage | `#EAF0E3` | Quiet information surfaces |
| `oat` | Oat | `#F1E6CD` | Warm caution or notice surfaces |
| `ink` | Charcoal Pine | `#263C30` | Main body text |
| `muted` | Fieldstone | `#5C685E` | Secondary copy and metadata |
| `trail` | Trail | `#DBDFD5` | Borders and dividers |

### Color use

- Keep most screens light and calm: Warm Canvas behind Cream content surfaces, with Pine for the main action and navigation.
- Use Ember Clay as a clear but limited accent. The logo wordmark is the main Clay application; use Clay for selected emphasis rather than large background areas.
- Use white text on Pine controls. Use a darker Sienna if Clay is used as a filled action, and check contrast for every text size.
- Do not use green to imply current stock or safety. Do not use Clay alone to communicate an alert or error.
- Never communicate confirmation, season, moderation, freshness, or availability by color alone; pair color with a text label and, where useful, an icon.
- Keep map destinations visually distinct from stand pins and clusters. The Woodstop flame-pin marks firewood stands; use a separate shape or neutral treatment for curated destination anchors.

## Typography and content style

The current interface pairs **Manrope** for headings and the wordmark with **DM Sans** for body/interface text, using system sans-serif fallbacks. Keep this as the working UI type system. Use bold weights sparingly for hierarchy; do not make every label heavy. The logo wordmark uses the approved raster artwork and does not set the typeface precedent for body copy.

Write in plain, warm, direct language. Prefer familiar action labels and short explanations. Avoid sales pressure, faux-rustic phrasing, exaggerated claims, and unexplained jargon. Product copy should distinguish a listing, a community confirmation, and actual stock; none guarantees the others.

Examples:

- “Get directions” rather than a vague “Go.”
- “Price unknown” rather than leaving a blank that looks like an error.
- “Community confirmed” with its confirmation date, without implying current inventory.
- “Out of season · Reopens [date]” when a seasonal schedule is known.

## UI/UX principles

### 1. Make finding a stand the main job

The planned experience is map-first, with a clear list alternative. Put destination search and the nearest results in the visual hierarchy. Keep map controls quiet and legible; avoid decorative cards or competing calls to action over the map. A map marker should remain distinct at ordinary phone zoom levels.

### 2. Make the next step obvious

Use one prominent primary action per view. Pine-filled buttons are the default primary treatment. Keep secondary actions visually quieter. Use clear labels such as **Use my location**, **Save a stand**, **Get directions**, and **I've seen this stand**. Avoid icon-only actions when a short label fits.

### 3. Ask for location at the right moment

Do not request location on page load. Request it only after someone taps **Use my location** or **Save a stand**. Search and manual map use must remain available when location is denied or unavailable. Explain why permission is needed before the browser prompt when appropriate.

### 4. Make listing facts easy to scan

Show stand name, place, straight-line distance, confirmation/season status, price and observation date with clear grouping. Missing data should be described as unknown rather than guessed. Keep stock, hours, payment, access and price freshness distinct. Put **Get directions** where it is easy to find without hiding important qualifications.

### 5. Support safe, confident contributions

Keep browsing and published details open without sign-in. Explain the difference between saving a private draft and submitting it for review. Let contributors understand what is public, pending, or still local before they act. Use specific review states and short rejection explanations. Do not imply that submission means publication.

### 6. Design for mobile and varied access needs

Use a mobile-first layout, comfortable text sizes, generous touch targets, and one-hand reach for common map/list actions. Maintain visible keyboard focus and logical heading/focus order. Provide an accessible list alternative to map discovery. Ensure text and controls retain sufficient contrast on both light surfaces and map tiles. Do not rely on color, hover, or fine map detail alone.

### 7. Treat empty, error, and offline states as part of the product

Give useful, calm guidance when there are no nearby listings, a stand cannot load, location is denied, or a submission needs retry. Preserve local drafts after a failed submission. State honestly when a fresh search, map, or direction handoff needs a connection; do not promise offline behavior the product does not provide.

### 8. Use imagery with restraint

Use real, representative roadside stand or firewood imagery only when it helps identify a listing or explain a task. Do not use generic flames, forests, tents, or staged lifestyle photos as filler. Do not let illustrative imagery imply a specific stand's stock, price, access, or safety.

## Interface shape and spacing

- Favor open layouts, clear sections, and a small number of softly rounded surfaces. Keep cards simple; use borders and spacing before adding shadows.
- Use Trail borders and pale Sage/Oat surfaces as quiet structure, not decoration.
- Keep forms short at each step. Group related optional fields and explain why a field is useful without making optional information feel mandatory.
- Use consistent spacing, button heights, field labels, map controls, and status chips across screens. Design tap targets for touch, including on the map.

## Status and trust language

Use consistent labels and meaning:

| State | Meaning to communicate |
|---|---|
| Pending review | Private submission awaiting admin review |
| Published | Visible listing approved for public viewing |
| Community confirmed | At least two distinct members have recent active observations under the product rule; not a stock guarantee |
| In season / Out of season | Based on the stand's configured season, not daily hours or guaranteed stock |
| Price observed [date] | Price was reported on that date and may have changed |
| Stock unknown | No current inventory guarantee |

Keep confirmation separate from moderation, ownership, availability, and safety. Provide clear correction and removal paths.

## Implementation references

- Brand assets: `assets/woodstop-logo-*.png`
- Working UI styles: `apps/web/src/style.css`
- Browser theme color: `apps/web/index.html`
- Product behavior: [MVP requirements](mvp.md)

This guide documents the approved look and feel. It does not authorize implementing the planned MVP while development is paused.