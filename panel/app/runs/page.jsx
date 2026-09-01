import Link from "next/link";
import Nav from "../../components/Nav";
import ThemeToggle from "../../components/ThemeToggle";
import VerdictMark from "../../components/VerdictMark";
import { runs } from "../../lib/runs";

export const metadata = { title: "Runs · Rushes" };

export default function Runs() {
  return (
    <>
      <Nav />
      <main className="runs-main">
        <p className="caption breadcrumb">
          <Link href="/" className="runs-all">
            Rushes
          </Link>{" "}
          / Runs
        </p>
        <h1 className="beats-h2">Today&apos;s rushes</h1>
        <p className="caption runs-intro">
          Every run Rushes has executed, with its tape. A card per run: the
          serial, the surface, the verdict.
        </p>

        {runs.length === 0 ? (
          <div className="card runs-empty">
            <p>
              No runs yet. Point Rushes at a repo to record the first tape.
            </p>
            <a className="btn btn-primary" href="https://github.com/A-Raphie/rushes#try-it">
              Point it at a task
            </a>
          </div>
        ) : (
          <ul className="runs-list">
            {runs.map((r) => (
              <li key={r.serial}>
                <Link href={`/runs/${r.serial}`} className="card run-card">
                  <div className="run-card-head">
                    <span className="serial-stamp mono-num">{r.serial}</span>
                    <VerdictMark verdict={r.verdict} />
                  </div>
                  <p className="run-card-label">{r.label}</p>
                  <dl className="run-card-grid">
                    <div>
                      <dt className="micro">Surface</dt>
                      <dd>{r.surface}</dd>
                    </div>
                    <div>
                      <dt className="micro">Duration</dt>
                      <dd className="mono-num">{r.durationSec}s</dd>
                    </div>
                    <div>
                      <dt className="micro">Tape</dt>
                      <dd className="mono-num">{(r.tapeBytes / 1024).toFixed(0)} KB</dd>
                    </div>
                    <div>
                      <dt className="micro">Frames</dt>
                      <dd className="mono-num">{r.pages.length} pages</dd>
                    </div>
                  </dl>
                  <p className="caption run-card-pages">
                    {r.pages
                      .filter((p) => !p.startsWith("about:"))
                      .map((p) => p.replace(/^https?:\/\/(www\.)?/, ""))
                      .join(" · ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="caption runs-note">
          The engine lands next: fresh task runs will append here with live
          replay links. What you see now is the Phase 0 verification run that
          proved the recording pipeline end to end.
        </p>
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
