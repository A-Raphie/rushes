"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Nav from "../../../components/Nav";
import Bench from "../../../components/Bench";
import ThemeToggle from "../../../components/ThemeToggle";
import VerdictMark from "../../../components/VerdictMark";
import { fetchManifest, getRegistry } from "../../../lib/live";

/* The receipt: the manifest as a document, the bench playing that run's
   tape. Data is fetched live from the run's committed manifest. */
export default function Receipt() {
  const { serial } = useParams();
  const [run, setRun] = useState(null); // manifest shape
  const [state, setState] = useState("loading"); // loading | missing | error | ready

  useEffect(() => {
    let alive = true;
    (async () => {
      let m = null;
      let fromRegistry = false;
      try {
        m = await fetchManifest(serial);
      } catch {
        m = null; // rate limit etc: the registry fallback below still applies
      }
      if (!m) {
        // manifest missing from the repo (pre-archive runs): fall back to the
        // registry copy of this run. Same facts, less detail.
        try {
          const registry = await getRegistry();
          const entry = registry.find((r) => r.serial === serial);
          if (entry) {
            m = {
              serial: entry.serial,
              task: { name: entry.label },
              createdAt: entry.date,
              steps: entry.pages.map((u) => ({ url: u })),
              verdict: { outcome: entry.verdict, summary: entry.summary },
              tapeBytes: entry.tapeBytes,
              tapeUrl: entry.tapeUrl,
              surface: { browser: { sessionId: entry.sessionId } },
              reconstructed: true,
            };
            fromRegistry = true;
          }
        } catch {
          if (alive) setState("error");
          return;
        }
      }
      if (!alive) return;
      if (!m) {
        setState("missing");
        return;
      }
      if (fromRegistry) m.reconstructed = true;
      setRun({
        serial: m.serial,
        kind: m.task?.kind ?? "url-flow",
        label: m.task?.name ?? m.serial,
        surface: "cloud chrome · recorded",
        pages: (m.steps ?? []).map((s) => s.url),
        durationSec:
          Math.round(
            ((new Date(m.steps?.at(-1)?.endedAt ?? m.createdAt) -
              new Date(m.steps?.[0]?.startedAt ?? m.createdAt)) /
              1000) *
              10,
          ) / 10 ||
          m.cost?.minutesBySurface?.browser * 60 ||
          m.durationSec ||
          0,
        tapeBytes: m.tapeBytes ?? 0,
        sessionId: m.surface?.browser?.sessionId ?? "",
        verdict: m.verdict?.outcome ?? "pending",
        summary: m.verdict?.summary ?? "",
        tapeUrl: m.tapeUrl,
        date: (m.createdAt ?? "").slice(0, 10),
        replayCaptured: Boolean(m.surface?.browser?.replayUrl),
      });
      setState("ready");
    })();
    return () => {
      alive = false;
    };
  }, [serial]);

  return (
    <>
      <Nav />
      <main className="runs-main">
        <p className="caption breadcrumb">
          <Link href="/" className="runs-all">
            Rushes
          </Link>{" "}
          /{" "}
          <Link href="/runs" className="runs-all">
            All runs
          </Link>{" "}
          / {serial}
        </p>

        {state === "loading" && (
          <div className="card runs-empty" aria-hidden="true">
            <div className="skeleton-line w-60" />
            <div className="skeleton-line w-80" />
          </div>
        )}

        {state === "missing" && (
          <div className="card runs-empty">
            <p>No run with serial {serial} exists in the public registry.</p>
            <Link className="btn btn-primary" href="/runs">
              See all runs
            </Link>
          </div>
        )}

        {state === "error" && (
          <div className="card runs-empty">
            <p>The manifest did not load (GitHub unreachable or rate-limited).</p>
            <button type="button" className="btn btn-primary" onClick={() => location.reload()}>
              Try again
            </button>
          </div>
        )}

        {state === "ready" && run && (
          <>
            <h1 className="beats-h2">{run.label}</h1>
            <section aria-label="The cutting bench for this run">
              <Bench run={run} />
            </section>
            <section className="card receipt" aria-label="Run manifest">
              <h2 className="micro receipt-key">Manifest · {run.serial}</h2>
              <dl className="receipt-grid">
                <div>
                  <dt className="micro">Surface</dt>
                  <dd className="receipt-val">{run.surface}</dd>
                </div>
                <div>
                  <dt className="micro">Duration</dt>
                  <dd className="receipt-val mono-num">{run.durationSec}s</dd>
                </div>
                <div>
                  <dt className="micro">Tape</dt>
                  <dd className="receipt-val mono-num">{(run.tapeBytes / 1024).toFixed(0)} KB</dd>
                </div>
                <div>
                  <dt className="micro">Frames</dt>
                  <dd className="receipt-val mono-num">{run.pages.length} pages</dd>
                </div>
                <div>
                  <dt className="micro">Date</dt>
                  <dd className="receipt-val mono-num">{run.date}</dd>
                </div>
                <div>
                  <dt className="micro">Replay</dt>
                  <dd className="receipt-val">{run.replayCaptured ? "captured" : "not resolved"}</dd>
                </div>
              </dl>
              <hr className="divider" />
              <p className="receipt-verdict">
                <VerdictMark verdict={run.verdict} tapeBytes={run.tapeBytes} tone="amber" />
                <span className="receipt-summary">{run.summary}</span>
              </p>
              <hr className="divider" />
              <p className="caption">
                Pages visited:{" "}
                {run.pages
                  .filter((p) => !p.startsWith("about:"))
                  .map((p) => p.replace(/^https?:\/\/(www\.)?/, ""))
                  .join(" · ")}
              </p>
            </section>
            <p className="caption runs-note">
              The tape is rendered from the bytes committed at run time; the
              replay original is notarized on Solari&apos;s servers. Presigned
              replay links expire in 15 minutes and are re-fetched live via the
              Solari API.
            </p>
          </>
        )}
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
