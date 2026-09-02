/**
 * GET /api/registry: proxies the committed run registry from the repo so
 * the composer can poll without cross-origin cache issues.
 */
import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function GET() {
  const token = process.env.GH_TOKEN;
  const res = await fetch(
    "https://api.github.com/repos/A-Raphie/rushes/contents/panel/data/runs.json",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "rushes-dispatcher",
      },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    return NextResponse.json({ error: `registry ${res.status}` }, { status: 502 });
  }
  return NextResponse.json(await res.json());
}
