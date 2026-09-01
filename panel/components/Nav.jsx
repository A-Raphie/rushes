import Link from "next/link";

/* Kit nav: plain top nav is the familiarity anchor (DESIGN.md);
   the divergence budget stays on the bench. */
export default function Nav() {
  return (
    <header className="nav">
      <Link href="/" className="nav-brand micro">
        Rushes
      </Link>
      <nav className="nav-links micro" aria-label="Main">
        <Link href="/runs">Runs</Link>
        <a href="https://github.com/A-Raphie/rushes" target="_blank" rel="noreferrer">
          Repo
        </a>
      </nav>
    </header>
  );
}
