"use client";

/* THE CUTTING BENCH: the signature (docs/DESIGN.md).
   A contact-sheet strip of one run: every cell is a real frame bound to the
   tape's own Meta events; the slate is clamped to its head; scrubbing seeks
   the actual recorded evidence. Plays once on arrival, never loops; the
   strip's active cell always reports the frame the tape is really on. */
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

function replayerOf(inst) {
  if (!inst) return null;
  try {
    return typeof inst.getReplayer === "function" ? inst.getReplayer() : null;
  } catch {
    return null;
  }
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

        // The tape fills the stage it is given, up to the recorded viewport
        // (1280). No floor above the container: a 640px floor overflowed 375px
        // phones and dragged the whole page wide (audit P0).
        const stageWidth = Math.min(1280, Math.max(280, mountRef.current?.clientWidth ?? 960));

        playerRef.current = new Player({
          target: mountRef.current,
          props: {
            events,
            // Stillness doctrine: the tape does not move on its own on load.
            // It posters on the run's final frame, then plays ONCE when the
            // bench scrolls into view (user-driven adjacency), and never
            // loops. Reduced-motion users get the poster, never the play.
            autoPlay: false,
            loop: false,
            speed: 1,
            width: stageWidth,
            showController: true,
          },
        });
        // Poster: park on the last frame so the bench never shows white.
        // The replayer initializes asynchronously, so retry until the seek
        // actually TOOK (verified by the replayer's own clock) — a single
        // immediate call silently no-ops, and checking that pause merely
        // exists clears the retry too early (audit + receipt pass).
        const target = metas.length ? metas[metas.length - 1].t : 0;
        let tries = 0;
        const posterTimer = setInterval(() => {
          tries += 1;
          const rp = replayerOf(playerRef.current);
          if (rp && typeof rp.pause === "function" && typeof rp.getCurrentTime === "function") {
            try {
              rp.pause(target);
              const now = rp.getCurrentTime();
              if (typeof now === "number" && Math.abs(now - target) < 2000) {
                clearInterval(posterTimer);
                return;
              }
            } catch {
              /* stays on the poster retry path */
            }
          }
          if (tries > 20) clearInterval(posterTimer);
        }, 300);
        // Play once when the bench becomes visible: rewind to the head so
        // the run plays from its real beginning, not from the poster. The
        // visitor's scroll is the trigger; reduced motion never plays.
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        const inst = playerRef.current;
        if (!reduced && typeof IntersectionObserver !== "undefined") {
          const io = new IntersectionObserver(
            (entries) => {
              if (entries.some((e) => e.isIntersecting)) {
                try {
                  inst?.goto?.(0);
                  inst?.play?.();
                } catch {
                  /* play is best-effort; the controller still works */
                }
                io.disconnect();
              }
            },
            { threshold: 0.35 },
          );
          io.observe(mountRef.current);
        }
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

  // The strip must agree with the tape: derive the active frame from the
  // replayer's real clock, not from clicks alone (the parked-at-end state
  // highlighted frame 1 while the tape sat on frame 4).
  useEffect(() => {
    if (status !== "ready" || frames.length === 0) return;
    const id = setInterval(() => {
      try {
        const t = replayerOf(playerRef.current)?.getCurrentTime?.();
        if (typeof t !== "number" || Number.isNaN(t)) return;
        let idx = 0;
        for (let i = 0; i < frames.length; i++) {
          if (frames[i].t <= t) idx = i;
        }
        setActive(idx);
      } catch {
        /* a missed poll keeps the last known frame */
      }
    }, 250);
    return () => clearInterval(id);
  }, [status, frames]);

  function seek(i) {
    setActive(i);
    const inst = playerRef.current;
    if (!inst) return;
    const ms = frames[i]?.t ?? 0;
    // Pause first so a user scrub holds the frame they chose. Every path
    // guarded: a missed seek still updates the readout instead of dying.
    try {
      if (typeof inst.pause === "function") inst.pause();
      if (typeof inst.goto === "function") return void inst.goto(ms);
      const rp = replayerOf(inst);
      if (rp && typeof rp.pause === "function") rp.pause(ms);
    } catch (err) {
      console.error(err);
    }
  }

  // Power users scrub with the keyboard: arrows walk the real frames.
  function onScrubKey(e) {
    if (e.key === "ArrowLeft" && active > 0) {
      e.preventDefault();
      seek(active - 1);
    } else if (e.key === "ArrowRight" && active < frames.length - 1) {
      e.preventDefault();
      seek(active + 1);
    }
  }

  return (
    <figure
      className="bench"
      aria-label={`Cutting bench: run ${run.serial}`}
      tabIndex={0}
      onKeyDown={onScrubKey}
    >
      <Slate run={run} tone="ink" />

      <div className="bench-stage">
        {status === "loading" && (
          <div className="bench-skeleton" aria-hidden="true">
            {/* skeleton shaped like the player, not a spinner */}
            <div />
          </div>
        )}
        {status === "error" && (
          <p className="bench-error">
            {run.replayCaptured === false
              ? "No tape was captured: the replay was not ready within the capture window, so the verdict is failed. Re-run the task."
              : "The tape did not load. It lives at "}
            {!run.replayCaptured === false && (
              <>
                <code>{run.tapeUrl}</code>: reload, or read{" "}
                <a href="https://github.com/A-Raphie/rushes/tree/main/docs">the run docs</a>.
              </>
            )}
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

        <p className="bench-note caption">
          Recorded by the Solari cloud browser. The replay is notarized on
          Solari&apos;s servers; presigned links expire in 15 minutes and are
          re-fetched by the engine.
        </p>
      </div>
    </figure>
  );
}

function Slate({ run, tone = "amber" }) {
  return (
    <div className="slate card">
      <div className="slate-row">
        <SerialStamp serial={run.serial} />
        <VerdictMark verdict={run.verdict} tone={tone} />
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
