"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import ThemeToggle from "../../components/ThemeToggle";
import { getRegistry } from "../../lib/live";

/* Point it at a task: the composer. Submitting runs the recorded engine
   server-side and lands you on the fresh run's receipt. */
export default function Point() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [rows, setRows] = useState([{ url: "", expect: "", actions: [] }]);
  const [state, setState] = useState("idle"); // idle | running | error
  const [message, setMessage] = useState("");
  const [outage, setOutage] = useState(false); // Solari replay generation down

  // The outage notice is SELF-CLEARING: it renders only while the newest
  // run in the public registry has no captured tape. The first run that
  // captures one proves Solari recovered and the notice disappears.
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

  // Poll the live registry until a serial we have not seen appears: the
  // workflow commits the receipt, and the new serial IS the confirmation.
  async function waitForNewSerial(beforeSerials, tries = 40) {
    for (let i = 0; i < tries; i++) {
      await new Promise((r) => setTimeout(r, 6000));
      try {
        const res = await fetch("/api/registry?t=" + Date.now(), { cache: "no-store" });
        if (!res.ok) continue;
        const file = await res.json();
        const registry = JSON.parse(atob(file.content.replace(/\s/g, "")));
        const fresh = registry.find((r) => !beforeSerials.includes(r.serial));
        if (fresh) return fresh;
      } catch {
        /* keep polling */
      }
    }
    return null;
  }

  function setRow(i, key, value) {
    setRows((rows) => rows.map((r, j) => (i === j ? { ...r, [key]: value } : r)));
  }

  function addAction(i) {
    setRows((rows) =>
      rows.map((r, j) =>
        i === j && r.actions.length < 3
          ? { ...r, actions: [...r.actions, { kind: "click", target: "", value: "" }] }
          : r,
      ),
    );
  }

  function setAction(i, ai, key, value) {
    setRows((rows) =>
      rows.map((r, j) =>
        i === j
          ? { ...r, actions: r.actions.map((a, k) => (k === ai ? { ...a, [key]: value } : a)) }
          : r,
      ),
    );
  }

  function removeAction(i, ai) {
    setRows((rows) =>
      rows.map((r, j) => (i === j ? { ...r, actions: r.actions.filter((_, k) => k !== ai) } : r)),
    );
  }

  function addRow() {
    if (rows.length < 5) setRows((rows) => [...rows, { url: "", expect: "", actions: [] }]);
  }

  function removeRow(i) {
    if (rows.length > 1) setRows((rows) => rows.filter((_, j) => j !== i));
  }

  async function submit(e) {
    e.preventDefault();
    const steps = rows
      .map((r) => ({ url: r.url.trim(), expect: r.expect.trim(), dwellMs: 2000, actions: r.actions }))
      .filter((r) => r.url);
    if (steps.length === 0) {
      setState("error");
      setMessage("Add at least one page to visit.");
      return;
    }
    setState("running");
    setMessage("");
    try {
      const before = await fetch("/api/registry?t=" + Date.now(), { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : []))
        .then((f) => JSON.parse(atob(f.content.replace(/\s/g, ""))).map((r) => r.serial))
        .catch(() => []);

      const res = await fetch("/api/point", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "Unnamed task", steps }),
      });
      const data = await res.json();
      if (!data.queued) {
        setState("error");
        setMessage(data.error ?? "The dispatcher refused the task.");
        return;
      }

      setMessage("Recorded and committed. Waiting for the receipt to appear in the registry…");
      const fresh = await waitForNewSerial(before);
      if (fresh) {
        router.push(`/runs/${fresh.serial}`);
        return;
      }
      setState("error");
      setMessage(
        "The run is still processing. Check the runs page in a minute: the receipt appears there the moment it is committed."
      );
    } catch {
      setState("error");
      setMessage("The engine did not answer. Try again.");
    }
  }

  return (
    <>
      <Nav />
      <main className="runs-main">
        <p className="caption breadcrumb">
          <Link href="/" className="runs-all">
            ← Rushes
          </Link>
        </p>
        <h1 className="beats-h2">Point it at a task</h1>
        {outage && (
          <div className="card point-notice" role="status">
            <span className="micro point-notice-key">Heads up · since Sep 2</span>
            <p className="caption">
              Solari&apos;s replay generation is down (reported Sep 2). Runs still
              execute every check and commit their verdict; tapes may read no
              tape until recovery. Clears itself when a tape is captured.
            </p>
          </div>
        )}
        <p className="caption runs-intro">
          The first task type is a web flow: up to five pages, and the words
          that should be on them. The recorded cloud browser walks the flow,
          and the receipt commits itself to the public registry. Sandbox and
          desktop tasks ship next.
        </p>

        <form className="card point-form" onSubmit={submit}>
          <label className="point-label">
            <span className="micro point-key">Task name</span>
            <input
              className="input"
              type="text"
              value={name}
              maxLength={80}
              placeholder="Example: check my three landing pages"
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          {rows.map((row, i) => (
            <fieldset className="point-row" key={i}>
              <legend className="micro point-key">
                Page {i + 1}
                {i > 0 ? " · optional" : ""}
              </legend>
              <label className="point-field">
                <span className="micro">Visit</span>
                <input
                  className="input"
                  type="url"
                  required={i === 0}
                  value={row.url}
                  placeholder="https://example.com"
                  onChange={(e) => setRow(i, "url", e.target.value)}
                />
              </label>
              <label className="point-field">
                <span className="micro">Should contain</span>
                <input
                  className="input"
                  type="text"
                  value={row.expect}
                  placeholder="a word or phrase expected on the page"
                  onChange={(e) => setRow(i, "expect", e.target.value)}
                />
              </label>
              {(row.actions ?? []).map((a, ai) => (
                <div className="point-action" key={ai}>
                  <select
                    className="input point-action-kind"
                    value={a.kind}
                    onChange={(e) => setAction(i, ai, "kind", e.target.value)}
                    aria-label={`Action ${ai + 1} kind`}
                  >
                    <option value="click">Click</option>
                    <option value="type">Type</option>
                    <option value="press">Press key</option>
                  </select>
                  <input
                    className="input"
                    type="text"
                    value={a.target}
                    placeholder={a.kind === "click" ? "text of the link or button" : a.kind === "type" ? "field label or placeholder" : ""}
                    onChange={(e) => setAction(i, ai, "target", e.target.value)}
                    aria-label={`Action ${ai + 1} target`}
                  />
                  {a.kind === "type" && (
                    <input
                      className="input"
                      type="text"
                      value={a.value}
                      placeholder="text to type"
                      onChange={(e) => setAction(i, ai, "value", e.target.value)}
                      aria-label={`Action ${ai + 1} text`}
                    />
                  )}
                  <button
                    type="button"
                    className="point-remove"
                    onClick={() => removeAction(i, ai)}
                    aria-label={`Remove action ${ai + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
              {(row.actions ?? []).length < 3 && (
                <button type="button" className="point-addaction" onClick={() => addAction(i)}>
                  Add an action
                </button>
              )}

              {rows.length > 1 && (
                <button
                  type="button"
                  className="point-remove"
                  onClick={() => removeRow(i)}
                  aria-label={`Remove page ${i + 1}`}
                >
                  Remove this page
                </button>
              )}
            </fieldset>
          ))}

          <div className="point-foot">
            {rows.length < 5 && (
              <button type="button" className="btn btn-ghost" onClick={addRow}>
                Add a page
              </button>
            )}
            <button className="btn btn-primary btn-lg" type="submit" disabled={state === "running"}>
              {state === "running" ? "Running on Solari…" : "Run it on Solari"}
            </button>
          </div>

          <hr className="divider" />
          <div className="point-submit">
            <span className="caption">
              {state === "running"
                ? "A recorded cloud browser is executing your task. Typical run: ~20 seconds; the receipt lands within ~2 minutes."
                : "Typical run: ~20 seconds on the recorded browser · the receipt lands within ~2 minutes · committed to the public registry"}
            </span>
          </div>
          {state === "error" && (
            <p className="point-error" role="alert">
              {message}
            </p>
          )}
        </form>
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
