"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  length: number;
  width: number;
  angle: number;
  baseAngle: number;
  speed: number;
  opacity: number;
  color: string;
}

interface InteractiveParticleFieldProps {
  containerRef: React.RefObject<HTMLElement | null>;
  className?: string;
  particleCount: number;
  interactionRadius?: number;
  maxPush?: number;
  opacityRange?: [number, number];
  lengthRange?: [number, number];
  widthRange?: [number, number];
  colors?: string[];
}

const DEFAULT_OPACITY_RANGE: [number, number] = [0.35, 0.75];
const DEFAULT_LENGTH_RANGE: [number, number] = [10, 22];
const DEFAULT_WIDTH_RANGE: [number, number] = [1, 1.5];

const DEFAULT_COLORS = [
  "255, 99, 132",  // Pink
  "255, 159, 64",  // Orange
  "255, 205, 86",  // Yellow
  "75, 192, 192",  // Turquoise
  "54, 162, 235",  // Blue
  "153, 102, 255", // Purple
  "255, 105, 180", // Hot pink
  "110, 231, 183", // Mint
  "244, 114, 182", // Rose
  "129, 140, 248", // Indigo
];

export default function InteractiveParticleField({
  containerRef,
  className = "",
  particleCount,
  interactionRadius = 150,
  maxPush = 40,
  opacityRange = DEFAULT_OPACITY_RANGE,
  lengthRange = DEFAULT_LENGTH_RANGE,
  widthRange = DEFAULT_WIDTH_RANGE,
  colors = DEFAULT_COLORS,
}: InteractiveParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const mouseRef = useRef<{
    x: number | null;
    y: number | null;
  }>({
    x: null,
    y: null,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const container = containerRef.current;
    if (!container) return;

    let particles: Particle[] = [];
    let animationFrameId = 0;
    let width = 0;
    let height = 0;

    const randomInRange = ([min, max]: [number, number]) =>
      min + Math.random() * (max - min);

    const getRandomColor = () => {
      if (colors.length === 0) {
        return "54, 162, 235";
      }
      return colors[Math.floor(Math.random() * colors.length)];
    };

    const initParticles = () => {
      particles = [];

      const isMobile = window.innerWidth < 768;
      const count = isMobile
        ? Math.max(5, Math.floor(particleCount / 3))
        : particleCount;

      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const baseAngle = Math.random() * Math.PI * 2;

        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          length: randomInRange(lengthRange),
          width: randomInRange(widthRange),
          angle: baseAngle,
          baseAngle,
          speed: 0.03 + Math.random() * 0.03,
          opacity: randomInRange(opacityRange),
          color: getRandomColor(),
        });
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      initParticles();
    };

    const drawParticle = (particle: Particle) => {
      ctx.save();
      ctx.beginPath();

      ctx.strokeStyle = `rgba(${particle.color}, ${particle.opacity})`;
      ctx.lineWidth = particle.width;
      ctx.lineCap = "round";

      ctx.shadowColor = `rgba(${particle.color}, 0.75)`;
      ctx.shadowBlur = particle.width * 3;

      const halfLength = particle.length / 2;
      const dx = Math.cos(particle.angle) * halfLength;
      const dy = Math.sin(particle.angle) * halfLength;

      ctx.moveTo(particle.x - dx, particle.y - dy);
      ctx.lineTo(particle.x + dx, particle.y + dy);
      ctx.stroke();

      ctx.restore();
    };

    const tick = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(tick);

      if (document.hidden) return;

      ctx.clearRect(0, 0, width, height);

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      const isMobile = window.innerWidth < 768;
      const driftTime = timestamp * 0.0001;

      for (const particle of particles) {
        particle.baseX +=
          Math.cos(particle.baseAngle + driftTime) * 0.05;

        particle.baseY +=
          Math.sin(particle.baseAngle + driftTime) * 0.05;

        if (particle.baseX < -20) {
          particle.baseX = width + 20;
          particle.x = particle.baseX;
        } else if (particle.baseX > width + 20) {
          particle.baseX = -20;
          particle.x = particle.baseX;
        }

        if (particle.baseY < -20) {
          particle.baseY = height + 20;
          particle.y = particle.baseY;
        } else if (particle.baseY > height + 20) {
          particle.baseY = -20;
          particle.y = particle.baseY;
        }

        let targetX = particle.baseX;
        let targetY = particle.baseY;
        let targetAngle = particle.baseAngle;

        if (!isMobile && mouseX !== null && mouseY !== null) {
          const dx = particle.x - mouseX;
          const dy = particle.y - mouseY;
          const distance = Math.hypot(dx, dy);

          if (distance < interactionRadius) {
            const force =
              (interactionRadius - distance) / interactionRadius;

            const pushDirectionX =
              distance > 0 ? dx / distance : Math.cos(particle.angle);

            const pushDirectionY =
              distance > 0 ? dy / distance : Math.sin(particle.angle);

            targetX =
              particle.baseX + pushDirectionX * force * maxPush;

            targetY =
              particle.baseY + pushDirectionY * force * maxPush;

            targetAngle = Math.atan2(dy, dx);
          }
        }

        particle.x += (targetX - particle.x) * particle.speed;
        particle.y += (targetY - particle.y) * particle.speed;

        let angleDifference = targetAngle - particle.angle;

        angleDifference = Math.atan2(
          Math.sin(angleDifference),
          Math.cos(angleDifference),
        );

        particle.angle += angleDifference * 0.05;

        drawParticle(particle);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = event.clientX - rect.left;
      mouseRef.current.y = event.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    resize();
    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      resizeObserver.disconnect();
    };
  }, [
    containerRef,
    particleCount,
    interactionRadius,
    maxPush,
    opacityRange,
    lengthRange,
    widthRange,
    colors,
  ]);

  const defaultClasses = "pointer-events-none absolute inset-0 z-0 bg-transparent";

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className || defaultClasses}
    />
  );
}