"use client";

import { useEffect } from "react";

export function HeroComputerInteractive() {
  useEffect(() => {
    const scene = document.querySelector<HTMLElement>(".hero-main-grid .scene");
    const hero = document.querySelector<HTMLElement>(".hero-main-grid");
    const column = document.querySelector<HTMLElement>(".hero-main-grid .product-col");
    if (!scene || !hero || !column) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const restingX = 5;
    const restingY = -12;
    let currentX = restingX, currentY = restingY;
    let targetX = restingX, targetY = restingY;
    let frame: number | null = null;
    let drag: { id: number; x: number; y: number; rotationX: number; rotationY: number } | null = null;
    const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));
    const paint = () => {
      scene.style.setProperty("--hero-rotate-x", `${currentX.toFixed(3)}deg`);
      scene.style.setProperty("--hero-rotate-y", `${currentY.toFixed(3)}deg`);
    };
    const animate = () => {
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;
      paint();
      if (Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > 0.01) {
        frame = requestAnimationFrame(animate);
      } else {
        currentX = targetX; currentY = targetY; paint(); frame = null;
      }
    };
    const moveTo = (x: number, y: number) => {
      if (reducedMotion.matches) return;
      targetX = x; targetY = y;
      if (frame === null) frame = requestAnimationFrame(animate);
    };
    const move = (event: PointerEvent) => {
      if (drag) {
        if (event.pointerId !== drag.id) return;
        moveTo(clamp(drag.rotationX - (event.clientY - drag.y) * 0.15, 24),
               clamp(drag.rotationY + (event.clientX - drag.x) * 0.15, 36));
        return;
      }
      if (event.pointerType !== "mouse") return;
      const rect = column.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left - rect.width / 2) / (rect.width / 2), 1);
      const y = clamp((event.clientY - rect.top - rect.height / 2) / (rect.height / 2), 1);
      moveTo(restingX - y * 10, restingY + x * 16);
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || reducedMotion.matches) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, rotationX: currentX, rotationY: currentY };
      scene.setPointerCapture(event.pointerId);
      scene.style.cursor = "grabbing";
    };
    const up = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      drag = null;
      if (scene.hasPointerCapture(event.pointerId)) scene.releasePointerCapture(event.pointerId);
      scene.style.cursor = "grab";
    };
    const reset = () => { if (!drag) moveTo(restingX, restingY); };
    paint();
    hero.addEventListener("pointermove", move);
    hero.addEventListener("pointerleave", reset);
    scene.addEventListener("pointerdown", down);
    scene.addEventListener("pointerup", up);
    scene.addEventListener("pointercancel", up);
    scene.addEventListener("lostpointercapture", up);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", reset);
      scene.removeEventListener("pointerdown", down);
      scene.removeEventListener("pointerup", up);
      scene.removeEventListener("pointercancel", up);
      scene.removeEventListener("lostpointercapture", up);
      scene.style.removeProperty("--hero-rotate-x");
      scene.style.removeProperty("--hero-rotate-y");
      scene.style.removeProperty("cursor");
    };
  }, []);
  return null;
}
