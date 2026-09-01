"use client";

/* Theme easter egg (DESIGN.md): light table flips to screening room.
   Deliberately off the main flow: it lives in the footer. */
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [projection, setProjection] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = projection ? "projection" : "";
  }, [projection]);

  return (
    <button
      type="button"
      className="btn btn-ghost theme-toggle micro"
      onClick={() => setProjection((v) => !v)}
      aria-pressed={projection}
    >
      {projection ? "Back to the light table" : "Screening room"}
    </button>
  );
}
