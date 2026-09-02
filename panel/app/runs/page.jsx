"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import ThemeToggle from "../../components/ThemeToggle";
import VerdictMark from "../../components/VerdictMark";
import { getRegistry } from "../../lib/live";

export default function Runs() {
  const [runs, setRuns] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    getRegistry()
      .then((r) => alive && setRuns(r))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

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

        {error && (
          <div className="card runs-empty">
            <p>The registry did not load. GitHub was unreachable or rate-limited.</p>
            <button type="button" className="btn btn-primary" onClick={() => location.reload()}>
              Try again
            </button>
          </div>
        )}

        {!error && !runs && (
          <div className="runs-list" aria-hidden="true">
            <div className="card run-card">
              {/* skeleton shaped like the card */}
              <div className="skeleton-line w-40" />
              <div className="skeleton-line w-80" />
              <div className="skeleton-line w-60" />
            </div>
          </div>
        )}

        {runs?.length === 0 && (
          <div className="card runs-empty">
            <p>No runs yet. Point Rushes at a task to record the first tape.</p>
            <Link className="btn btn-primary" href="/point">
              Point it at a task
            </Link>
          </div>
        )}

        {runs?.length > 0 && (
          <ul className="runs-list">
            {runs.map((r) => (
              <li key={r.serial}>
                <Link href={`/runs/${r.serial}`} className="card run-card">
                  <div className="run-card-head">
                    <span className="serial-stamp mono-num">{r.serial}</span>
                    <VerdictMark verdict={r.verdict} />
                  </div>
                  <p className="run-card-label">{r.summary ?? r.label}</p>
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
          Runs submitted from the {""}
          <Link href="/point" className="runs-all">
            task composer
          </Link>{" "}
          appear here automatically: the tape, manifest, and verdict are
          committed to the public repo as the receipt.
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
