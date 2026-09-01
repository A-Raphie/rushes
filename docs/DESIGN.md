# Rushes design brief

Status: FINAL v2 (proven-effect catalog pass added) · gates passed Sep 1 2026 · produced by the hackathon-design workflow · chains to semantic-tokens then ui-craft

## Direction

- **Consensus default (banned):** dark dev-tool dashboard · indigo/violet gradient hero · glassy bento cards with glow · fake terminal chrome · chat panel · emoji icons · "Powered by Solari" footer. This is what the AI-built fork pile converges on.
- **Axes pushed (3, each earned by the concept):**
  1. **Color: the light table, sponsor-native.** Solari's own bone paper (#E7E7E2) as the ground, their teal-black (#0F1514) as ink AND as the dark stage the film strip lies on, their amber (#F5B301) as THE accent: it is the grease pencil. Evidence on paper, footage on dark.
  2. **Typography: mono-first, sponsor-sanctioned.** JetBrains Mono (Solari's own brand mono, verified in their CSS) for timecode, serials, manifest metadata, tracked-all-caps microcopy (+.1em minimum). Inter Display weight 400 at generous scale for display moments.
  3. **Layout: document/ledger paradigm.** The run manifest IS the page: timecode-ruled rows, a slate stamp, the contact-sheet strip. No dashboard, no card grid. A receipt is a document.
- **Axes kept conventional:** editorial-airy density · hairline elevation only (their #2A3C3A at low alpha) · small radii (4-10px, their range) · stillness: nothing moves unless the user moves it. Scroll-linked and drag-linked motion is allowed (it is the user's own input carried forward, interruptible by construction); autonomous animation is banned.
- **Sponsor synthesis (mined, not eyeballed):** accent #F5B301 = their --accent rgb(245,179,1) · ink/film stage #0F1514 + hairline teal #2A3C3A from their border tokens · paper #E7E7E2 and #C8C8C3 from their light neutrals · JetBrains Mono + Fragment Mono from their font stack. Source: getsolari.com inline styles, curl + grep, Sep 1 2026. Structure is ours; we wear their accent; never their layout.
- **Familiarity anchor:** plain top nav and a conventional runs table on inner screens; the amaze budget goes to the landing and the bench only. Attention is zero-sum: exactly ONE amber-marked element per screen.

## Signature move: THE CUTTING BENCH (now also the landing demo)

A horizontal contact-sheet strip of one run: every frame is a real captured screenshot bound to its manifest step; scrubbing scrubs the evidence; the film slate (serial, date, duration, Solari replay URL) is clamped to its head; verdict marks are amber grease-pencil circles drawn ON frames.

v2 upgrade via the catalog's interactive-product-screenshot effect: **the landing hero IS the Cutting Bench itself, fed by a real run, fully clickable.** Landing and panel consume the same UI package from one monorepo (panel/ exports the bench component; the landing imports it), so the product demo on the marketing page can never go stale and answers the visitor's one question, "is this for me," before any click. Not a screenshot, not a video: the actual component running the actual latest run's manifest.

Tests: mechanism ✓ (it is the product) · 5-minute ✓ (per-frame manifest binding + slate + replay stamp, real data) · demo ✓ (the money moment happens on it) · interaction bar: interruptible always, drag momentum carries into the tape, the detail panel morphs from the frame that opened it, plays once, never loops.

## Proven-effect adoption (blume.codes catalog, patterns not pixels)

- **ADOPTED, fused into the signature: interactive product screenshot.** Above. Highest-effort, highest-credibility effect, and it merges landing and product into one artifact.
- **ADOPTED for the landing: the scroll-journey film line.** A vector film strip draws itself across the page as the visitor scrolls: the drawn length is the run's timeline, section markers are timecode, and the three how-it-works beats (you point it · it runs on Solari · you get the tape) sit on frames of the strip. "The site should work like a song": input-driven, interruptible, compatible with the stillness doctrine because it only moves when the visitor does. Decorated with the run's real artifacts (frame thumbnails seeded from the manifest), not generic ornaments.
- **ADOPTED as the easter egg: light table / screening room toggle.** Full-page theme switch including all page graphics: paper mode (bone, amber pencil) flips to projection mode (teal-black, frames glowing). Deliberately off the main flow. It proves the product's own duality: evidence reads as a document or as footage, and the landing demonstrates both.
- **REJECTED: multi-layer parallax hero.** Beautiful, but autonomous-feeling background motion contradicts the stillness axis and spends attention the bench needs. Explicitly off-list.

## Olav ideation pass (recorded)

- Wow right now? The bench scrubs real footage above the fold, before any scroll.
- Existing element made special with a small change? Runs-table rows each carry a mini contact strip of their run's frames instead of text-only.
- Brand theme running through the page? Film-leader timecode as section markers; the amber grease pencil as the recurring mark language.
- Product experience exposed pre-signup? The tape: scrub a real run on the landing.
- The bar: the goal is not simply to convince, but to amaze. Amaze budget: the bench. Everything else quiet.

## Avoid-list

Everything in the consensus line · purple in any shade · emoji · glassmorphism · glow · fake terminals · auto-playing video · gradients · parallax · autonomous animation of any kind · dark-mode-by-default.

## Gates passed

- Differs from challenge consensus on 3 axes ✓
- Sponsor tokens verified from CSS ✓ (getsolari.com, Sep 1 2026)
- Self-repetition diff vs last 3 ledger entries ✓ (claimcheck cream #F7F1E8 + rust #9C3B24 vs rushes bone #E7E7E2 + amber #F5B301 + teal film stage)
- Signature passes mechanism + 5-minute + demo tests, catalog consulted, interaction bar met ✓
- One familiarity anchor kept ✓
- Ledger: Documents/hackathon-research/DESIGN_LEDGER.md, rushes is line 4

## Craft floor (encoded for the build)

- Body text 15-25px · line spacing 120-145% · line length 45-90 chars measured · all-caps under one line with +5-12% tracking · never indents AND paragraph spacing
- De-emphasize surroundings instead of enlarging the hero · fewer borders (contrast and spacing first; when borders, amber-color one edge) · visual hierarchy before labels · start with too much whitespace · HSL ladder 50-900 upfront, greys carry the teal tint · no shadows (hairlines) · never color alone · designed empty states, non-rectangular containers where the bench needs them
- Stillness doctrine: scroll/drag-linked motion only; a still page reads as confidence in a pile of animated gradients

## Token seeds for semantic-tokens

| Token | Value | Source |
|---|---|---|
| accent / grease pencil | #F5B301 | their --accent |
| paper | #E7E7E2 | their light neutral (33 uses) |
| paper-quiet | #C8C8C3 | their secondary light |
| ink / film stage | #0F1514 | their dark neutral |
| ink-raise | #151E1D, #2A3C3A | their dark borders |
| paper-bright | #F9FBFA | their near-white |
| grey | #939599, #878787 | their greys |
| mono | JetBrains Mono, Fragment Mono | their font stack |
| sans | Inter / Inter Display | their font stack |
| radius | 4 / 6 / 10 px | their border-radius histogram |
