import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function CurtainLoader() {
  const [stage, setStage] = useState<"initial" | "animate" | "done">("initial");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t1 = setTimeout(() => setStage("animate"), 100);
    const t2 = setTimeout(() => setStage("done"), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (stage === "done" || !mounted) return null;

  const content = (
    <div className="fixed inset-0 z-[999999] flex pointer-events-none overflow-hidden">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-full flex-1 bg-ink-black border-r border-white/5 transition-transform duration-1000 ease-[cubic-bezier(0.77,0,0.175,1)]"
          style={{
            transform: stage === "animate" ? "translateY(-100%)" : "translateY(0)",
            transitionDelay: `${i * 100}ms`
          }}
        />
      ))}
    </div>
  );

  return createPortal(content, document.body);
}
