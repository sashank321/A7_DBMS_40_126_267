"use client";

import React, { useEffect } from "react";

export function HeroComputerInteractive() {
  useEffect(() => {
    let animFrame: number;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentRotX = 5;
    let currentRotY = -15;
    let targetRotX = 5;
    let targetRotY = -15;

    const findElements = () => {
      const scene = document.querySelector(".scene") as HTMLElement | null;
      const productCol = document.querySelector(".product-col") as HTMLElement | null;
      const keys = document.querySelectorAll(".keyboard-assembly .key");
      const crtWindow = document.querySelector(".crt-window") as HTMLElement | null;
      const typingSpan = document.querySelector(".typing-container span:first-child") as HTMLElement | null;

      if (!scene || !productCol) {
        return false;
      }

      // 1. Enable 3D Parallax & Smooth Drag to Rotate
      const handleMouseMove = (e: MouseEvent) => {
        const rect = productCol.getBoundingClientRect();
        const normX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
        const normY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);

        if (isDragging) {
          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;
          targetRotY = currentRotY + deltaX * 0.25;
          targetRotX = Math.max(-30, Math.min(30, currentRotX - deltaY * 0.25));
        } else {
          // Dynamic tilt following the mouse
          targetRotY = normX * 22;
          targetRotX = -normY * 18;
        }
      };

      const handleMouseDown = (e: MouseEvent) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        currentRotX = targetRotX;
        currentRotY = targetRotY;
        scene.style.cursor = "grabbing";
      };

      const handleMouseUp = () => {
        if (isDragging) {
          isDragging = false;
          currentRotX = targetRotX;
          currentRotY = targetRotY;
          scene.style.cursor = "grab";
        }
      };

      const handleMouseLeave = () => {
        isDragging = false;
        targetRotX = 4;
        targetRotY = -10;
        scene.style.cursor = "grab";
      };

      // Animation loop for fluid inertia rotation
      const updatePhysics = () => {
        currentRotX += (targetRotX - currentRotX) * 0.12;
        currentRotY += (targetRotY - currentRotY) * 0.12;
        scene.style.transform = `scale(0.88) rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg)`;
        animFrame = requestAnimationFrame(updatePhysics);
      };

      productCol.addEventListener("mousemove", handleMouseMove);
      productCol.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mouseup", handleMouseUp);
      productCol.addEventListener("mouseleave", handleMouseLeave);
      animFrame = requestAnimationFrame(updatePhysics);

      // 2. Interactive Keyboard Key Press Sounds/Visual Feedback
      const sampleQueries = [
        "> SELECT * FROM v_document_overview LIMIT 5;",
        "> run-vector-search --dim 384 --top-k 4",
        "> audit-rbac --role Admin --verify-token",
        "> mongodb.telemetry.aggregate([ { $group: { _id: '$action' } } ])",
        "> explain-knowledge-graph --depth 2"
      ];
      let queryIdx = 0;

      keys.forEach((keyEl, idx) => {
        const key = keyEl as HTMLElement;
        key.addEventListener("click", (e) => {
          e.stopPropagation();
          key.classList.add("pressed");
          setTimeout(() => key.classList.remove("pressed"), 180);

          // Type custom command into screen on click
          if (typingSpan) {
            queryIdx = (queryIdx + 1) % sampleQueries.length;
            typingSpan.textContent = sampleQueries[queryIdx];
          }
        });
      });

      // 3. Click CRT Window to execute test query in terminal
      if (crtWindow) {
        crtWindow.addEventListener("click", () => {
          if (typingSpan) {
            queryIdx = (queryIdx + 1) % sampleQueries.length;
            typingSpan.textContent = sampleQueries[queryIdx];
          }
        });
      }

      return true;
    };

    // Retry finding elements until DOM is hydrated
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (findElements() || attempts > 20) {
        clearInterval(interval);
      }
    }, 150);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  return null;
}
