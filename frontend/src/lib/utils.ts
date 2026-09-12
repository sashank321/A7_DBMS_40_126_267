import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMs(ms: number | undefined | null): string {
  if (ms === undefined || ms === null || isNaN(Number(ms))) return "0.000 ms";
  const num = Number(ms);
  if (num < 0.001) return "<0.001 ms";
  if (num < 1) return `${num.toFixed(3)} ms`;
  if (num < 10) return `${num.toFixed(2)} ms`;
  return `${num.toFixed(1)} ms`;
}

export function formatPct(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.0%";
  return `${Number(val).toFixed(1)}%`;
}
