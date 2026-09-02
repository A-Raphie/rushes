"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRegistry } from "../lib/live";

/* Bottom teaser: the latest real run, linking to its receipt. */
export default function RunsTeaser() {
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    let alive = true;
    getRegistry()
      .then((registry) => {
        if (alive && registry?.length) setLatest(registry[0]);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="runs-teaser" aria-label="Latest runs">
      <div className="runs-teaser-head">
        <h2 className="beats-h2">Today&apos;s rushes</h2>
        <Link href="/runs" className="micro runs-all">
          All runs
        </Link>
      </div>
      {latest ? (
        <Link href={`/runs/${latest.serial}`} className="card run-row">
          <span className="serial-stamp mono-num">{latest.serial}</span>
          <span className="run-row-label">{latest.label}</span>
          <span className="caption mono-num">
            {latest.durationSec}s · {(latest.tapeBytes / 1024).toFixed(0)} KB
          </span>
        </Link>
      ) : (
        <div className="card run-row" aria-hidden="true">
          <span className="serial-stamp mono-num">RUSH-·· ·-···-</span>
          <span className="run-row-label caption">fetching the registry</span>
        </div>
      )}
    </section>
  );
}
