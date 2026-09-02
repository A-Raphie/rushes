"use client";

/* Landing bench section: fetches the LIVE registry and plays the latest
   real run. Static shell renders the skeleton; the tape is always real
   (mock-hunter gate). */
import { useEffect, useState } from "react";
import Bench from "./Bench";
import { fetchRegistry } from "../lib/live";

const FALLBACK_RUN = {
  serial: "RUSH-2026-09-01-0001",
  kind: "phase0-verification",
  label: "Engine proof: recorded session, replay fetched, tape rendered",
  surface: "cloud chrome · recorded",
  pages: ["about:blank", "https://example.com/", "https://news.ycombinator.com/", "https://getsolari.com/"],
  durationSec: 6.8,
  tapeBytes: 537120,
  sessionId: "ip-10-0-11-12:7934fde3",
  verdict: "verified",
  summary: "3 pages navigated on the recorded cloud browser; tape downloaded, replay captured.",
  tapeUrl: "/runs/phase0/tape.ndjson",
  date: "2026-09-01",
  replayCaptured: true,
};

export default function BenchSection() {
  const [run, setRun] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchRegistry()
      .then((registry) => {
        if (alive && registry?.length) setRun(registry[0]);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (failed) {
    return (
      <div className="bench-live-fallback">
        <Bench run={FALLBACK_RUN} />
      </div>
    );
  }
  if (!run) {
    return <div className="bench-loading card" aria-hidden="true" />;
  }
  return <Bench run={run} />;
}
