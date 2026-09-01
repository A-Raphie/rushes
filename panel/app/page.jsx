import Link from "next/link";
import Nav from "../components/Nav";
import Bench from "../components/Bench";
import ThemeToggle from "../components/ThemeToggle";
import { runs } from "../lib/runs";

/* Fold-draw, ui-craft Step 2.
   Candidates: (A) paper hero, full-bleed film-stage band holding the bench,
   timecode beats under it. (B) centered split hero, text left bench right.
   (C) headline on the dark stage itself.
   Committed: A. Sacrifice: B is the model-default drift, rejected on sight;
   C's headline-on-dark was folded into A as one line only, because evidence
   reads on paper. Do not reuse A on the next screen without re-drawing. */

const first = runs[0];

export default function Landing() {
  return (
    <>
      <Nav />
      <main>
        <section className="hero">
          <p className="micro hero-kicker">Proof of work for agent runs</p>
          <h1 className="hero-h1">
            Your agent did the work.
            <br />
            Here is the tape.
          </h1>
          <p className="hero-sub">
            Point Rushes at a task. It runs on Solari and you get the receipt: an
            auto-cut clip, a serial-numbered manifest, and a replay hosted on
            Solari&apos;s own servers. Not your screen recording. Not your claim.
          </p>
          <div className="hero-ctas">
            <a className="btn btn-primary btn-lg" href="https://github.com/A-Raphie/rushes#try-it">
              Point it at a task
            </a>
            <a className="btn btn-ghost btn-lg" href="#bench">
              Watch the first tape
            </a>
          </div>
        </section>

        <section className="film-stage" id="bench" aria-label="The cutting bench">
          <p className="micro bench-kicker">
            The cutting bench · a real run, recorded by Solari, unedited
          </p>
          <Bench run={first} />
        </section>

        <section className="beats" aria-label="How it works">
          <h2 className="beats-h2">One run, three beats</h2>
          <ol className="beats-list">
            <li className="beat">
              <span className="mono-num beat-tc">00:00.0</span>
              <p>
                <strong>You point it.</strong> Hand Rushes a task: a repo and a
                command, or a flow to run through a browser.
              </p>
            </li>
            <li className="beat">
              <span className="mono-num beat-tc">00:06.8</span>
              <p>
                <strong>It runs on Solari.</strong> A real cloud browser executes
                the task, recorded from the first frame. This run took 6.8 seconds.
              </p>
            </li>
            <li className="beat">
              <span className="mono-num beat-tc">00:19.7</span>
              <p>
                <strong>You hold the tape.</strong> The manifest, the replay link,
                the serial. If anyone doubts the run, the tape answers.
              </p>
            </li>
          </ol>
        </section>

        <section className="works-with" aria-label="What it works with">
          <h2 className="beats-h2">What it works with</h2>
          <ul className="works-list">
            <li className="card work-chip">
              <span className="micro">Solari Cloud Chrome</span>
              <span className="caption">recorded · replay verified</span>
            </li>
            <li className="card work-chip">
              <span className="micro">Solari Sandboxes</span>
              <span className="caption">code runs · public preview verified</span>
            </li>
            <li className="card work-chip work-chip-pending">
              <span className="micro">Solari Desktops</span>
              <span className="caption">paid tier · on the roadmap</span>
            </li>
          </ul>
        </section>

        <section className="runs-teaser" aria-label="Latest runs">
          <div className="runs-teaser-head">
            <h2 className="beats-h2">Today&apos;s rushes</h2>
            <Link href="/runs" className="micro runs-all">
              All runs
            </Link>
          </div>
          <Link href="/runs" className="card run-row">
            <span className="serial-stamp mono-num">{first.serial}</span>
            <span className="run-row-label">{first.label}</span>
            <span className="caption mono-num">{first.durationSec}s · {(first.tapeBytes / 1024).toFixed(0)} KB</span>
          </Link>
        </section>
      </main>
      <footer className="footer">
        <span className="caption">
          Built on <a href="https://getsolari.com">Solari</a> · forked from the{" "}
          <a href="https://github.com/solari-sdk/solari-cookbook">solari-cookbook</a>
        </span>
        <ThemeToggle />
      </footer>
    </>
  );
}
