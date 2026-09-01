import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "../../../components/Nav";
import Bench from "../../../components/Bench";
import ThemeToggle from "../../../components/ThemeToggle";
import VerdictMark from "../../../components/VerdictMark";
import { runs } from "../../../lib/runs";

/* The receipt: the manifest as a document, the bench playing that run's
   tape. Static export generates one page per run at build time. */
export function generateStaticParams() {
  return runs.map((r) => ({ serial: r.serial }));
}

export function generateMetadata({ params }) {
  return { title: `${params.serial} · Rushes` };
}

export default function Receipt({ params }) {
  const run = runs.find((r) => r.serial === params.serial);
  if (!run) notFound();

  const fieldRows = [
    ["Surface", run.surface],
    ["Duration", `${run.durationSec}s`],
    ["Tape", `${(run.tapeBytes / 1024).toFixed(0)} KB`],
    ["Frames", `${run.pages.length} pages`],
    ["Date", run.date],
    ["Session", run.sessionId],
  ];

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
          / {run.serial}
        </p>
        <h1 className="beats-h2">{run.label}</h1>

        <section aria-label="The cutting bench for this run">
          <Bench run={run} />
        </section>

        <section className="card receipt" aria-label="Run manifest">
          <h2 className="micro receipt-key">Manifest · {run.serial}</h2>
          <dl className="receipt-grid">
            {fieldRows.map(([k, v]) => (
              <div key={k}>
                <dt className="micro">{k}</dt>
                <dd className="mono-num receipt-val">{v}</dd>
              </div>
            ))}
          </dl>
          <hr className="divider" />
          <p className="receipt-verdict">
            <VerdictMark verdict={run.verdict} tone="amber" />
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
          The tape is rendered from the bytes downloaded at run time; the replay
          original is notarized on Solari&apos;s servers. Presigned replay links
          expire in 15 minutes and are re-fetched live via the Solari API.
        </p>
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
