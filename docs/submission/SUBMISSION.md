# Submission copy (form-field shaped)

## One-liner

Rushes turns AI agent runs into public receipts: the tape, the manifest, a
verdict, and a replay hosted by the infrastructure that did the work.

## Inspiration / problem

Agent demos have a trust problem: a screenshot and a claim prove nothing.
Harry's own challenge post drew hundreds of builds and a top reply asking
whether any of them are real. We kept hitting the same wall ourselves: an
agent finishes, everyone asks "did it actually do that", and nobody can
answer without re-watching someone's screen recording.

## What it does

- Records the run: a Solari cloud browser executes the task, recorded from
  the first frame
- Writes the receipt: a serial-numbered manifest with every step, timing,
  page, and the cost in credits
- Commits itself: the tape, manifest, and registry entry are pushed to a
  public repo by GitHub Actions
- Verifies honestly: a verdict per run, grounded only in captured artifacts,
  including failures during the Sep 2 replay outage
- Accepts your tasks: a public composer at /point, no account needed

## How we built it

Solari is the engine, not a wrapper: recorded cloud Chrome sessions
(recording set at create), the replay URL polled after release (it only
exists post-release, presigned for 15 minutes), tape bytes downloaded and
rendered in-browser with rrweb, sandboxes and public preview URLs verified in
Phase 0. Submissions dispatch through GitHub Actions, which commits the
receipt to the repo. Verdict lines are written by gpt-oss-120b on Groq,
grounded only in captured artifacts, with a deterministic fallback. The site
is Next.js on Vercel; the palette is mined from Solari's own CSS.

## Challenges

Solari's replay generation went down on Sep 2 (their side, reported). Every
run after that executed its checks but captured no tape. The engine now polls
teardown state and the replay URL for up to two minutes, and the registry
lists those runs as failed with the reason: a receipts product that hides an
outage would not be a receipts product.

## Accomplishments (numbers)

- 7 runs on the public record, including 4 with playable tapes
- 2 runs with interaction steps proven in their committed manifests
- Total spend: under $0.05 of the free tier's $3.00 monthly credits
- 0 console errors across every page on the final pass
- 8/8 checks passing in the CLI-QA harness (engine/smoke.js)

## What's next

Sandbox task types (clone, run, verify output) and desktop capture on the
paid tier. The registry and composer stay public: the receipts are the
product, and they compound.

## Criteria mapping (Harry's post)

- **Solves a problem you have:** the trust problem this challenge created:
  259 forks, zero way to prove a run happened. We are our own first user;
  the landing bench plays our own runs.
- **Genuine use, turnable into a product:** every Solari builder needs proof
  of runs. The composer is public, receipts are public, and the engine is
  spec-driven: new task types are additive.
- **Uses Solari centrally:** recording, hosted replay, cloud browser
  execution, sandbox verification. Remove Solari and the evidence collapses
  into someone's screen recording.
- **Built with AI:** built end to end with AI on AI infrastructure, receipts
  written by gpt-oss-120b.
