"use client";

import { useEffect, useRef, useState } from "react";

interface ApiCallCounterProps {
  count: number;
  label?: string;
}

export default function ApiCallCounter({
  count,
  label = "Total tokens scanned",
}: ApiCallCounterProps) {
  const [displayCount, setDisplayCount] = useState(0);
  const frameRef = useRef<number | null>(null);
  const displayCountRef = useRef(0);

  useEffect(() => {
    const startValue = displayCountRef.current;
    const startTime = performance.now();
    const duration = 650;

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const nextValue = Math.round(startValue + (count - startValue) * progress);
      displayCountRef.current = nextValue;
      setDisplayCount(nextValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [count]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 font-mono text-2xl font-semibold text-slate-50">
        {new Intl.NumberFormat("en-US").format(displayCount)}
      </div>
      <div className="mt-1 text-xs text-slate-400">
        Aim for 50+ Birdeye calls for the sprint submission.
      </div>
    </div>
  );
}
