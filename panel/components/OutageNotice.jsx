"use client";

/* SELF-CLEARING outage notice: renders only while the newest run in the
   public registry has no captured tape. The first run that captures one
   proves Solari recovered and the notice disappears on its own. */
import { useEffect, useState } from "react";
import { getRegistry } from "../lib/live";

export default function OutageNotice() {
  const [outage, setOutage] = useState(false);

  useEffect(() => {
    let alive = true;
    getRegistry()
      .then((registry) => {
        if (!alive || !registry?.length) return;
        setOutage(registry[0].replayCaptured === false);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!outage) return null;

  return (
    <div className="card point-notice" role="status">
      <span className="micro point-notice-key">Heads up · since Sep 2</span>
      <p className="caption runs-intro" style={{ margin: "8px 0 0" }}>
        Solari&apos;s replay generation is down (reported to them). Runs still
        execute every check and commit their manifest and verdict, but the tape
        may read no tape until recovery. This notice clears itself the moment a
        run captures a tape again.
      </p>
    </div>
  );
}
