import Nav from "../components/Nav";
import BenchSection from "../components/BenchSection";
import RunsTeaser from "../components/RunsTeaser";
import ThemeToggle from "../components/ThemeToggle";
import { runs } from "../lib/runs";

/* Fold-draw, ui-craft Step 2 (logged in DESIGN.md ## Folds used):
   paper hero, then the film stage with the live bench. The hero leads at
   full editorial scale (his call); the bench begins at the fold line. */

export default function Landing() {
  const first = runs[0];

  return (
    <>
      <Nav />
      <main>
        <section className="hero">
          <p className="micro hero-kicker">Proof of work for agent runs</p>
          <h1 className="hero-h1">
            Your agent
            <br />
            did the work.
            <br />
            Here is the tape.
          </h1>
          <p className="hero-sub">
            Rushes runs your task on Solari and hands back the receipt: the
            clip, the manifest, a verdict, and a replay hosted on Solari&apos;s
            own servers. Not your screen recording. Not your claim.
          </p>
          <div className="hero-ctas">
            <a className="btn btn-primary btn-lg" href="/point">
              Point it at a task
            </a>
            <a className="btn btn-ghost btn-lg" href="#bench">
              Watch the first tape
            </a>
          </div>
        </section>

        <section className="film-stage" id="bench" aria-label="The cutting bench">
          <p className="micro bench-kicker">
            The cutting bench · the latest run, recorded by Solari, unedited
          </p>
          <BenchSection />
        </section>

        <section className="beats" aria-label="How it works">
          <h2 className="beats-h2">One run, three beats</h2>
          <ol className="beats-list">
            <li className="beat">
              <span className="mono-num beat-tc">00:00.0</span>
              <p>
                <strong>You point it.</strong> Hand Rushes a task: up to five
                pages to visit and what should be on them.
              </p>
            </li>
            <li className="beat">
              <span className="mono-num beat-tc">00:06.8</span>
              <p>
                <strong>It runs on Solari.</strong> A real cloud browser
                executes the task, recorded from the first frame.
              </p>
            </li>
            <li className="beat">
              <span className="mono-num beat-tc">00:19.7</span>
              <p>
                <strong>You hold the tape.</strong> The manifest, the replay
                link, the serial. 19.7 seconds includes the replay fetch. If
                anyone doubts the run, the tape answers.
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

        <RunsTeaser />
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
