# Rushes: concept lock

Status: LOCKED 2026-09-01 · Product name: Rushes · Entry: Pinetree Research $300K SWE intern challenge (no deadline, rolling review)

## Thesis

Every agent run owes the world a demo. Rushes pays up.

Point Rushes at any run (a Solari cloud browser session, a sandbox workload, a desktop computer-use task) and it returns: an auto-cut clip of what actually happened, a serial-numbered receipt manifest, and the Solari-hosted replay URL as the chain of custody. The recording lives on Solari's servers, timestamped. Not your ffmpeg. Not your claim.

Positioning one-liner: for agent builders who must prove their runs are real, Rushes is a proof-of-work engine that turns any Solari run into an auto-cut clip plus tamper-evident receipts, unlike screen recorders and hand-made demos, the tape is notarized by Solari's hosted replay.

Name layer: "rushes" is the film-industry term for dailies, the day's raw footage watched each evening to verify what was actually captured. Today's rushes: what your agents shot today.

## Why this wins

- Judging bar is Harry Chow's: ships great, understands PMF, uses AI to build. Rushes answers all three and its output is literally an X-ready post (he is Head of Growth).
- The challenge's own top reply (7.7K likes) is skepticism that builds get reviewed: proof-of-work for agents is a live, time-dated pain this exact week.
- Field check Sep 1: ~22 entries, zero use recordings/replay as the product, zero ship a shareable clip. Differentiated surface, receipts-native execution.

## Non-goals (v1)

No batch rendering. No web editor. No TTS narration (product feature later; shipped demo uses Raphie's VO or silence per VO rules). No stealth (free tier lacks it; not needed for recording). No multi-region. No LLM-driven agent loop for the run itself in v1: the run is a scripted task spec, the LLM (Groq gpt-oss-120b) writes verdict summaries and chapter titles only.

## Demo kill shot

The launch video is a Rushes output of a Rushes run: "this demo made itself." Kill moment: paste task, run executes in real Solari desktop over VNC, cut to finished clip with verdict overlay, serial burned in, replay link as tamper-proof receipt.

## Hard constraints

- Free tier: $3 monthly credits, 3 concurrent browsers, 1 sandbox, 1 desktop, 1-hour max session. Design every pipeline to fit inside 60 minutes.
- Costs: browser $0.15/hr, sandbox ~$0.086/hr (1 vCPU/2GB), desktop screen +$0.02/hr. Log every credit spent in the honesty table.
- Groq free plan quirks: 8K TPM on fresh accounts, 429s and DNS failures need retry.
- No em dash in any UI string, README, title, or doc. · for pairs, : for headings. Grep before ship.
- Eyes-on verification for every UI state; curl-only verification is banned.
- Pin SDK versions; the API is days old and churning.

## Judging map

Harry's stated criteria → Rushes' answer:

| Criterion | Answer |
|---|---|
| Ships something great | Fork of the cookbook with a working engine, live panel, real runs with receipts, demo video that renders itself |
| Product market fit / consumer needs | Agent builders must prove runs are real (trust crisis, this week); end users of agents get the tape of work done for them |
| Use AI to build | Built with AI end to end; AI in-product writes verdicts and chapters |
| Real use of Solari | Recording sessions, hosted replays, sandboxes run the workloads, desktops give computer-use capture: the sponsor IS the notary |
