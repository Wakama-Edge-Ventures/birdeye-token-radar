import { getSafetyLabel, getSafetyLevel } from "@/lib/safety-score";
import type { SafetyLevel } from "@/lib/types";

interface SafetyBadgeProps {
  score?: number | null;
  level?: SafetyLevel | null;
  showScore?: boolean;
  className?: string;
}

export default function SafetyBadge({
  score,
  level,
  showScore = true,
  className,
}: SafetyBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span
        className={joinClasses(
          "inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 shadow-[0_0_18px_rgba(148,163,184,0.12)]",
          className,
        )}
      >
        <span className="h-2 w-2 rounded-full bg-slate-500" />
        Pending
      </span>
    );
  }

  const resolvedLevel = level ?? getSafetyLevel(score);
  const palette = getPalette(resolvedLevel);

  return (
    <span
      className={joinClasses(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] shadow-[0_0_24px_rgba(6,214,160,0.16)]",
        palette.className,
        className,
      )}
    >
      <span className={joinClasses("h-2 w-2 rounded-full", palette.dotClassName)} />
      {getSafetyLabel(resolvedLevel)}
      {showScore ? <span className="font-mono text-[11px]">{score}</span> : null}
    </span>
  );
}

function getPalette(level: SafetyLevel) {
  if (level === "safe") {
    return {
      className:
        "border-emerald-400/30 bg-emerald-500/10 text-emerald-200 shadow-[0_0_24px_rgba(6,214,160,0.18)]",
      dotClassName: "bg-emerald-400",
    };
  }

  if (level === "caution") {
    return {
      className:
        "border-amber-400/30 bg-amber-500/10 text-amber-200 shadow-[0_0_24px_rgba(245,158,11,0.18)]",
      dotClassName: "bg-amber-400",
    };
  }

  return {
    className:
      "border-rose-400/30 bg-rose-500/10 text-rose-200 shadow-[0_0_24px_rgba(239,68,68,0.18)]",
    dotClassName: "bg-rose-400",
  };
}

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}
