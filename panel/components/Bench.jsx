"use client";

/* THE CUTTING BENCH: the signature (docs/DESIGN.md).
   A contact-sheet strip of one run: every cell is a real frame bound to the
   tape's own Meta events; the slate is clamped to its head; scrubbing seeks
   the actual recorded evidence. Plays once, never loops, only moves when
   the user moves it (stillness doctrine). */
import { useEffect, useRef, useState } from "react";
import VerdictMark from "./VerdictMark";

function hostOf(href) {
  try {
    return new URL(href).host.replace(/^www\./, "");
  } catch {
    return href;
  }
}

function tc(ms) {
  const s = ms / 1000;
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${(s % 60).toFixed(1).padStart(4, "0")}`;
}

export default function Bench({ run }) {
  const mountRef = useRef(null);
  const playerRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [frames, setFrames] = useState([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(run.tapeUrl);
        const text = await res.text();
        const events = text
          .split("\n")
          .filter((l) => l.trim())
          .map((l) => JSON.parse(l));
        if (!alive) return;

        const t0 = events.find((e) => e.timestamp)?.timestamp ?? 0;
        const metas = events
          .filter((e) => e.type === 4)
          .map((e) => ({ t: e.timestamp - t0, href: e.data?.href ?? "" }));
        setFrames(metas);

        const mod = await import("rrweb-player");
        const Player = mod.default ?? mod.Player;
        import("rrweb-player/dist/style.css");

        playerRef.current = new Player({
          target: mountRef.current,
          props: {
            events,
            autoPlay: false,   // stillness: nothing moves until the user moves it
            speed: 1,
            width: 960,
            showController: true,
          },
        });
        if (alive) setStatus("ready");
      } catch (err) {
        console.error(err);
        if (alive) setStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [run.tapeUrl]);

  function seek(i) {
    setActive(i);
    const inst = playerRef.current;
    if (!inst) return;
    const ms = frames[i]?.t ?? 0;
    // 2.x exposes the replayer indirectly; every path guarded so a missed
    // seek still updates the readout instead of dying silently.
    try {
      if (typeof inst.goto === "function") return void inst.goto(ms);
      const rp = typeof inst.getReplayer === "function" ? inst.getReplayer() : null;
      if (rp && typeof rp.pause === "function") return void rp.pause(ms);
      if (rp && typeof rp.play === "function") return void (rp.pause(0), rp.pause(ms));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <figure className="bench" aria-label={`Cutting bench: run ${run.serial}`}>
      <Slate run={run} />

      <div className="bench-stage">
        {status === "loading" && (
          <div className="bench-skeleton" aria-hidden="true">
            {/* skeleton shaped like the player, not a spinner */}
            <div />
          </div>
        )}
        {status === "error" && (
          <p className="bench-error">
            The tape did not load. It lives at <code>{run.tapeUrl}</code>: reload, or read{" "}
            <a href="https://github.com/A-Raphie/rushes/tree/main/docs">the run docs</a>.
          </p>
        )}
        <div ref={mountRef} className="bench-mount" />

        <figcaption className="bench-strip">
          <span className="micro bench-strip-label">Frames · {frames.length}</span>
          {frames.map((f, i) => (
            <button
              key={i}
              type="button"
              className={`frame-cell${i === active ? " is-active" : ""}`}
              onClick={() => seek(i)}
              aria-label={`Frame ${i + 1}: ${hostOf(f.href)} at ${tc(f.t)}`}
            >
              <span className="mono-num frame-tc">{tc(f.t)}</span>
              <span className="frame-host">{hostOf(f.href) || "blank"}</span>
            </button>
          ))}
        </figcaption>
      </div>
    </figure>
  );
}

function Slate({ run }) {
  return (
    <div className="slate card">
      <div className="slate-row">
        <SerialStamp serial={run.serial} />
        <VerdictMark verdict={run.verdict} />
      </div>
      <div className="slate-grid">
        <div>
          <span className="micro slate-key">Surface</span>
          <span className="slate-val">{run.surface}</span>
        </div>
        <div>
          <span className="micro slate-key">Duration</span>
          <span className="slate-val mono-num">{run.durationSec}s</span>
        </div>
        <div>
          <span className="micro slate-key">Tape</span>
          <span className="slate-val mono-num">{(run.tapeBytes / 1024).toFixed(0)} KB</span>
        </div>
        <div>
          <span className="micro slate-key">Date</span>
          <span className="slate-val mono-num">{run.date}</span>
        </div>
      </div>
      <p className="slate-note caption">
        Recorded by the Solari cloud browser. The replay is notarized on Solari&apos;s
        servers; presigned links expire in 15 minutes and are re-fetched by the engine.
      </p>
    </div>
  );
}

function SerialStamp({ serial }) {
  return (
    <span className="serial-stamp mono-num" aria-label={`Serial ${serial}`}>
      {serial}
    </span>
  );
}
