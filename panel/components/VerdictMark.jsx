/* Verdict mark: the amber grease pencil, drawn ON the subject.
   Always paired with a text label; color alone is never the signal. */
const LABELS = {
  verified: "verified",
  "no-tape": "no tape",
  failed: "failed",
  pending: "pending",
};

export default function VerdictMark({ verdict, tapeBytes, tone = "amber" }) {
  // verdict taxonomy: a run whose checks passed but whose tape never
  // captured is a "no tape" stamp, not a blank FAILED (audit re-gate P0:
  // FAILED beside "all pages passed" read as a contradiction)
  const effective = verdict === "failed" && !(tapeBytes > 0) ? "no-tape" : verdict;
  const label = LABELS[effective] ?? effective;
  const cls =
    effective === "verified" ? "is-pass" : effective === "no-tape" ? "is-notape" : effective === "failed" ? "is-error" : "is-pending";
  return (
    <span className={`verdict-mark ${cls} tone-${tone}`}>
      <svg viewBox="0 0 100 44" aria-hidden="true" className="verdict-circle">
        <ellipse
          cx="50"
          cy="22"
          rx="46"
          ry="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="250 20"
          strokeDashoffset="-14"
          transform="rotate(-2 50 22)"
        />
      </svg>
      <span className="micro verdict-text">{label}</span>
    </span>
  );
}
