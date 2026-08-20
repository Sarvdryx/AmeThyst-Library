"use client";

import { useEffect, useRef } from "react";

interface Sparkle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  speed: number;
  phase: number;
}

export default function SparkleImageOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const MAX_OPACITY = 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let sparkles: Sparkle[] = [];
    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      width = rect.width;
      height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      initSparkles();
    };

    const initSparkles = () => {
      sparkles = [];
      const w = window.innerWidth;
      
      let count = 0;
      if (w < 768) {
        count = 0;
      } else if (w < 1024) {
        count = 20;
      } else {
        count = 45;
      }

      for (let i = 0; i < count; i++) {
        sparkles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 1 + Math.random() * 5,
          alpha: Math.random() * MAX_OPACITY,
          targetAlpha: Math.random() * MAX_OPACITY,
          speed: 0.01 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const drawSparkle = (s: Sparkle) => {
      ctx.save();
      ctx.beginPath();
      
      const glow = s.alpha * 0.4;
      const baseColor = "255, 245, 220";
      
      const gradient = ctx.createRadialGradient(
        s.x, s.y, 0,
        s.x, s.y, s.size * 3
      );
      gradient.addColorStop(0, `rgba(${baseColor}, ${s.alpha})`);
      gradient.addColorStop(0.3, `rgba(${baseColor}, ${glow})`);
      gradient.addColorStop(1, `rgba(${baseColor}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.arc(s.x, s.y, s.size * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const tick = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < sparkles.length; i++) {
        const s = sparkles[i];

        if (!prefersReducedMotion) {
          s.y -= 0.08;
          if (s.y < -10) {
            s.y = height + 10;
            s.x = Math.random() * width;
          }

          s.phase += s.speed;
          s.alpha = (Math.sin(s.phase) + 1) / 2 * s.targetAlpha;
        }

        drawSparkle(s);
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    resize();
    tick();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-6 bg-transparent"
    />
  );
}
