/* Live registry: the site reads run data straight from the repo, so new
   runs appear without a rebuild. api.github.com serves fresh (no cache);
   raw.githubusercontent is fine for the heavier tape bytes. */
const REGISTRY_URL =
  "https://api.github.com/repos/A-Raphie/rushes/contents/panel/data/runs.json";

function b64ToUtf8(b64) {
  const bin = atob(b64.replace(/\s/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function fetchRegistry() {
  const res = await fetch(`${REGISTRY_URL}?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`registry ${res.status}`);
  const file = await res.json();
  return JSON.parse(b64ToUtf8(file.content));
}

let registryPromise = null;
/* One fetch per page view, shared by every client section on the page. */
export function getRegistry() {
  registryPromise ??= fetchRegistry().catch((e) => {
    registryPromise = null;
    throw e;
  });
  return registryPromise;
}

export async function fetchManifest(serial) {
  const safe = encodeURIComponent(serial);
  const res = await fetch(
    `https://api.github.com/repos/A-Raphie/rushes/contents/panel/public/runs/${safe}/manifest.json?t=${Date.now()}`,
    { cache: "no-store" },
  );
  if (res.status === 404) return null; // genuinely no manifest for this serial
  if (!res.ok) throw new Error(`manifest ${res.status}`); // rate limit etc: retryable
  const file = await res.json();
  return JSON.parse(b64ToUtf8(file.content));
}
