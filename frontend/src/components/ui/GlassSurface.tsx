"use client";

import React, { useEffect, useState, useRef, useId } from "react";
import "./GlassSurface.css";

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: "R" | "G" | "B";
  yChannel?: "R" | "G" | "B";
  mixBlendMode?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function GlassSurface({
  children,
  width = "100%",
  height = "auto",
  borderRadius = 16,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0,
  backgroundOpacity = 0.4,
  saturation = 1.2,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = "R",
  yChannel = "G",
  mixBlendMode = "difference",
  className = "",
  style = {},
}: GlassSurfaceProps) {
  const reactId = useId();
  const [filterId, setFilterId] = useState<string>("glass-filter-default");
  const [redGradId, setRedGradId] = useState<string>("red-grad-default");
  const [blueGradId, setBlueGradId] = useState<string>("blue-grad-default");
  const [svgSupported, setSvgSupported] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const feImageRef = useRef<SVGElement | null>(null);
  const redChannelRef = useRef<SVGElement | null>(null);
  const greenChannelRef = useRef<SVGElement | null>(null);
  const blueChannelRef = useRef<SVGElement | null>(null);
  const gaussianBlurRef = useRef<SVGElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const cleanId = reactId.replace(/[^a-zA-Z0-9]/g, "-");
    setFilterId(`glass-filter-${cleanId}`);
    setRedGradId(`red-grad-${cleanId}`);
    setBlueGradId(`blue-grad-${cleanId}`);

    // Check SVG filter support safely
    try {
      const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      const isFirefox = /Firefox/.test(navigator.userAgent);
      if (!isWebkit && !isFirefox) {
        const div = document.createElement("div");
        div.style.backdropFilter = `url(#glass-filter-${cleanId})`;
        setSvgSupported(div.style.backdropFilter !== "");
      }
    } catch {
      setSvgSupported(false);
    }
  }, [reactId]);

  const generateDisplacementMap = () => {
    if (typeof window === "undefined") return "";
    const rect = containerRef.current?.getBoundingClientRect();
    const actualWidth = rect?.width || 400;
    const actualHeight = rect?.height || 200;
    const edgeSize = Math.min(actualWidth, actualHeight) * (borderWidth * 0.5);

    const svgContent = `
      <svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"></rect>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${Math.max(1, actualWidth - edgeSize * 2)}" height="${Math.max(1, actualHeight - edgeSize * 2)}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)" />
      </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  };

  const updateDisplacementMap = () => {
    if (!isMounted) return;
    try {
      feImageRef.current?.setAttribute("href", generateDisplacementMap());
    } catch {}
  };

  useEffect(() => {
    if (!isMounted) return;
    updateDisplacementMap();
    [
      { ref: redChannelRef, offset: redOffset },
      { ref: greenChannelRef, offset: greenOffset },
      { ref: blueChannelRef, offset: blueOffset },
    ].forEach(({ ref, offset }) => {
      if (ref.current) {
        ref.current.setAttribute("scale", (distortionScale + offset).toString());
        ref.current.setAttribute("xChannelSelector", xChannel);
        ref.current.setAttribute("yChannelSelector", yChannel);
      }
    });

    gaussianBlurRef.current?.setAttribute("stdDeviation", displace.toString());
  }, [
    isMounted,
    width,
    height,
    borderRadius,
    borderWidth,
    brightness,
    opacity,
    blur,
    displace,
    distortionScale,
    redOffset,
    greenOffset,
    blueOffset,
    xChannel,
    yChannel,
    mixBlendMode,
  ]);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") return;

    const resizeObserver = new ResizeObserver(() => {
      updateDisplacementMap();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isMounted]);

  const containerStyle: React.CSSProperties = {
    ...style,
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    // @ts-ignore
    "--glass-frost": backgroundOpacity,
    "--glass-saturation": saturation,
    "--filter-id": isMounted ? `url(#${filterId})` : "none",
  };

  return (
    <div
      ref={containerRef}
      className={`glass-surface ${
        svgSupported ? "glass-surface--svg" : "glass-surface--fallback"
      } ${className}`}
      style={containerStyle}
    >
      {isMounted && (
        <svg className="glass-surface__filter" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter
              id={filterId}
              colorInterpolationFilters="sRGB"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
            >
              <feImage
                // @ts-ignore
                ref={feImageRef}
                x="0"
                y="0"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                result="map"
              />

              <feDisplacementMap
                // @ts-ignore
                ref={redChannelRef}
                in="SourceGraphic"
                in2="map"
                id="redchannel"
                result="dispRed"
              />
              <feColorMatrix
                in="dispRed"
                type="matrix"
                values="1 0 0 0 0
                        0 0 0 0 0
                        0 0 0 0 0
                        0 0 0 1 0"
                result="red"
              />

              <feDisplacementMap
                // @ts-ignore
                ref={greenChannelRef}
                in="SourceGraphic"
                in2="map"
                id="greenchannel"
                result="dispGreen"
              />
              <feColorMatrix
                in="dispGreen"
                type="matrix"
                values="0 0 0 0 0
                        0 1 0 0 0
                        0 0 0 0 0
                        0 0 0 1 0"
                result="green"
              />

              <feDisplacementMap
                // @ts-ignore
                ref={blueChannelRef}
                in="SourceGraphic"
                in2="map"
                id="bluechannel"
                result="dispBlue"
              />
              <feColorMatrix
                in="dispBlue"
                type="matrix"
                values="0 0 0 0 0
                        0 0 0 0 0
                        0 0 1 0 0
                        0 0 0 1 0"
                result="blue"
              />

              <feBlend in="red" in2="green" mode="screen" result="rg" />
              <feBlend in="rg" in2="blue" mode="screen" result="output" />
              {/* @ts-ignore */}
              <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
            </filter>
          </defs>
        </svg>
      )}

      <div className="glass-surface__content">{children}</div>
    </div>
  );
}
