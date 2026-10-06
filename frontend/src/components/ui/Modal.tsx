"use client";
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function Modal({ children, label, onClose, busy = false }: { children: React.ReactNode; label: string; onClose: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const latest = useRef({ onClose, busy });
  latest.current = { onClose, busy };
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') || []);
    (focusable()[0] || dialog)?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !latest.current.busy) { event.preventDefault(); latest.current.onClose(); }
      if (event.key === "Tab") {
        const items = focusable(); const first = items[0]; const last = items[items.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, []);
  return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 font-space">
    <div ref={ref} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className="w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-white shadow-2xl outline-none">{children}</div>
  </div>, document.body);
}
