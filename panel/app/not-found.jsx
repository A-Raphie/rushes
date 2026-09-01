import Link from "next/link";
import Nav from "../components/Nav";
import ThemeToggle from "../components/ThemeToggle";

/* No dead ends: even a bad URL gets the nav, an explanation, and two ways out. */
export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="runs-main">
        <h1 className="beats-h2">This page does not exist.</h1>
        <p className="runs-intro">
          No run, page, or tape lives at this address. The record is elsewhere:
        </p>
        <div className="notfound-actions">
          <Link className="btn btn-primary btn-lg" href="/">
            Back to the light table
          </Link>
          <Link className="btn btn-ghost btn-lg" href="/runs">
            See all runs
          </Link>
        </div>
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
