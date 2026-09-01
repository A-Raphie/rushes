/* Verdict mark: the amber grease pencil, drawn ON the subject.
   Always paired with a text label; color alone is never the signal. */
const LABELS = {
  verified: "verified",
  failed: "failed",
  pending: "pending",
};

export default function VerdictMark({ verdict, tone = "amber" }) {
  const label = LABELS[verdict] ?? verdict;
  const cls =
    verdict === "verified" ? "is-pass" : verdict === "failed" ? "is-error" : "is-pending";
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
