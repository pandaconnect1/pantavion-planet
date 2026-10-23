"use client";

import { useEffect, useRef } from "react";
import { drawWaterAnnotation, type DrawingShape } from "@/core/infrastructure/water/water-map-drawing";

type DrawingMap = {
  getSize: () => { x: number; y: number };
  latLngToContainerPoint: (point: [number, number]) => { x: number; y: number };
  on: (events: string, callback: () => void) => void;
  off: (events: string, callback: () => void) => void;
};

export default function WaterLeafletDrawingOverlay({ map, shapes }: { map: DrawingMap | null; shapes: DrawingShape[] }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!map || !canvas) return;
    let frame = 0;
    const draw = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const size = map.getSize();
        const ratio = Math.min(window.devicePixelRatio || 1, 3);
        canvas.width = Math.round(size.x * ratio); canvas.height = Math.round(size.y * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        for (const shape of shapes) drawWaterAnnotation(ctx, shape, ([x, y]) => { const p = map.latLngToContainerPoint([y, x]); return [p.x, p.y]; });
      });
    };
    draw(); map.on("move zoom resize", draw);
    return () => { cancelAnimationFrame(frame); map.off("move zoom resize", draw); };
  }, [map, shapes]);
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[450] h-full w-full" />;
}
