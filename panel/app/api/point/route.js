/**
 * POST /api/point: the thin dispatcher behind "Point it at a task".
 * Validates the task, fires a run-request dispatch that the public
 * rushes-run workflow executes on Solari, and returns { queued: true }.
 * The receipt is committed to the repo by the workflow; the composer polls
 * the registry for the new serial and redirects to it.
 */
import { NextResponse } from "next/server";

export const maxDuration = 30;

const GH = "https://api.github.com";
const REPO = "A-Raphie/rushes";

export async function POST(request) {
  const token = process.env.GH_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "The dispatcher is not configured." }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const name = String(body?.name ?? "").trim().slice(0, 80) || "Unnamed task";
  const raw = Array.isArray(body?.steps) ? body.steps : [];
  if (raw.length < 1 || raw.length > 5) {
    return NextResponse.json({ error: "A task needs 1 to 5 steps." }, { status: 400 });
  }
  const steps = [];
  for (const [i, s] of raw.entries()) {
    const url = String(s?.url ?? "").trim();
    if (!/^https:\/\//.test(url)) {
      return NextResponse.json(
        { error: `Step ${i + 1}: only https URLs are supported.` },
        { status: 400 },
      );
    }
    steps.push({
      label: String(s?.label ?? `step ${i + 1}`).slice(0, 60),
      url: url.slice(0, 300),
      expect: s?.expect ? String(s.expect).slice(0, 60) : null,
      dwellMs: Math.min(3000, Math.max(800, Number(s?.dwellMs) || 2000)),
    });
  }

  const res = await fetch(`${GH}/repos/${REPO}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "rushes-dispatcher",
    },
    body: JSON.stringify({
      event_type: "run-request",
      client_payload: {
        spec: { kind: "url-flow", name, steps },
        requestedAt: new Date().toISOString(),
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { error: `The dispatcher refused the task: ${res.status} ${text.slice(0, 120)}` },
      { status: 502 },
    );
  }

  return NextResponse.json({ queued: true });
}
