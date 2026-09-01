# Rushes design brief

Status: FINAL, gates passed Sep 1 2026 · produced by the hackathon-design workflow · chains to semantic-tokens then ui-craft

## Direction

- **Consensus default (banned):** dark dev-tool dashboard · indigo/violet gradient hero · glassy bento cards with glow · fake terminal chrome · chat panel · emoji icons · "Powered by Solari" footer. This is what the AI-built fork pile converges on.
- **Axes pushed (3, each earned by the concept):**
  1. **Color: the light table, sponsor-native.** Solari's own bone paper (#E7E7E2) as the ground, their teal-black (#0F1514) as ink AND as the dark stage the film strip lies on, their amber (#F5B301) as THE accent: it is the grease pencil. Evidence on paper, footage on dark: the page is a light table with a strip of film lying on it.
  2. **Typography: mono-first, sponsor-sanctioned.** JetBrains Mono (Solari's own brand mono, verified in their CSS) for timecode, serials, manifest metadata, tracked-all-caps microcopy (+.1em minimum). Inter Display at weight 400, generous scale, for the few display moments. The product's atoms are timecode and serials: type is the interface.
  3. **Layout: document/ledger paradigm.** The run manifest IS the page: timecode-ruled rows, a slate stamp, the contact-sheet strip. No dashboard, no card grid. A receipt is a document.
- **Axes kept conventional:** editorial-airy density · hairline elevation only (their #2A3C3A at low alpha), no shadows, no glow · small radii (4-10px, their range) · near-total stillness: the only moving element on the whole site is the bench scrub.
- **Sponsor synthesis (mined, not eyeballed):** accent #F5B301 = their `--accent rgb(245,179,1)` · ink/film stage #0F1514 + hairline teal #2A3C3A from their border tokens · paper #E7E7E2 and #C8C8C3 from their light neutrals · JetBrains Mono + Fragment Mono from their font stack. Source: getsolari.com inline styles, curl + grep, Sep 1 2026. Structure is ours; we wear their accent; we never copy their layout.
- **Signature move: THE CUTTING BENCH.** A horizontal contact-sheet strip of one run: every frame is a real captured screenshot bound to its manifest step; scrubbing scrubs the evidence; the film slate (serial, date, duration, Solari replay URL) is clamped to its head; verdict marks are amber grease-pencil circles drawn ON frames. Mechanism test: it is the product ✓. Five-minute test: per-frame manifest binding + slate + replay stamp is not clonable from a component library ✓. Demo test: the money moment happens on it ✓. Interaction bar: interruptible always, drag momentum carries into the tape, detail panel morphs from the frame that opened it, plays once per run page, never loops.
- **Avoid-list:** everything in the consensus line · purple in any shade · emoji · glassmorphism · glow · fake terminals · auto-playing video · gradients · dark-mode-by-default.
- **Familiarity anchor:** plain top nav and a conventional runs table on inner screens; divergence budget is spent on the landing and the bench only.

## Gates passed

- Differs from the challenge consensus on 3 axes ✓
- Sponsor tokens verified from CSS, not eyeballed ✓ (getsolari.com, Sep 1 2026)
- Self-repetition diff vs last 3 ledger entries ✓ (claimcheck = cream #F7F1E8 + rust #9C3B24 + verdict greens; rushes = bone #E7E7E2 + amber #F5B301 + teal film stage; different paper, marks, structure, type)
- Signature passes mechanism + 5-minute + demo tests ✓
- One familiarity anchor kept ✓
- Ledger: Documents/hackathon-research/DESIGN_LEDGER.md, rushes is line 4

## Craft floor (encoded for the build)

- Body text 15-25px · line spacing 120-145% · line length 45-90 chars measured · all-caps under one line with +5-12% tracking · never indents AND paragraph spacing
- De-emphasize surroundings instead of enlarging the hero · fewer borders (background contrast and spacing first; when borders, amber-color one edge) · visual hierarchy before labels · start with too much whitespace · HSL shade ladder 50-900 defined upfront, greys carry the teal tint · shadows off (hairlines), consistent single source if ever used · never color alone to convey information · empty states designed, non-rectangular containers where the bench needs them
- Stillness doctrine: nothing animates except the scrub; a still page reads as confidence in a pile of animated gradients

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
