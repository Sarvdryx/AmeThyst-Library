"use client";

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import InteractiveParticleField from './InteractiveParticleField';
import bookshelfBg from '../../assets/bookshelf_bg.jpg';

interface SpotlightRevealHeroProps {
  children: React.ReactNode;
}

export default function SpotlightRevealHero({ children }: SpotlightRevealHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Browser API lookups run strictly after hydration/mount
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouchDevice || prefersReducedMotion) {
      container.style.setProperty('--mx', '50%');
      container.style.setProperty('--my', '55%');
      return;
    }

    let animationFrameId: number;
    let rect = container.getBoundingClientRect();

    const updateRect = () => {
      rect = container.getBoundingClientRect();
    };

    // Default position at middle-horizontal and 55% vertical
    let currentX = rect.width / 2;
    let currentY = rect.height * 0.55;
    let targetX = currentX;
    let targetY = currentY;

    container.style.setProperty('--mx', `${currentX}px`);
    container.style.setProperty('--my', `${currentY}px`);

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      targetX = rect.width / 2;
      targetY = rect.height * 0.55;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', updateRect);

    const lerpSpeed = 0.09;

    const tick = () => {
      currentX += (targetX - currentX) * lerpSpeed;
      currentY += (targetY - currentY) * lerpSpeed;

      container.style.setProperty('--mx', `${currentX}px`);
      container.style.setProperty('--my', `${currentY}px`);

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', updateRect);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // CSS mask for the illuminated layer 3 copy using CSS responsive sizes
  const maskStyle: React.CSSProperties = {
    WebkitMaskImage: 'radial-gradient(circle var(--spotlight-size, 380px) at var(--mx, 50%) var(--my, 55%), black 0%, black 38%, rgba(0, 0, 0, 0.8) 55%, rgba(0, 0, 0, 0.35) 75%, transparent 100%)',
    maskImage: 'radial-gradient(circle var(--spotlight-size, 380px) at var(--mx, 50%) var(--my, 55%), black 0%, black 38%, rgba(0, 0, 0, 0.8) 55%, rgba(0, 0, 0, 0.35) 75%, transparent 100%)',
  };

  // Amber glow overlay moving alongside the spotlight
  const glowStyle: React.CSSProperties = {
    backgroundImage: 'radial-gradient(circle var(--glow-size, 420px) at var(--mx, 50%) var(--my, 55%), rgba(255, 185, 95, 0.16) 0%, rgba(255, 185, 95, 0.08) 38%, rgba(255, 185, 95, 0.025) 62%, transparent 78%)',
    mixBlendMode: 'screen',
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden flex flex-col bg-[#0a0704] px-6 md:px-16 select-none isolate flex-grow justify-center [--spotlight-size:270px] [--glow-size:310px] md:[--spotlight-size:310px] md:[--glow-size:350px] lg:[--spotlight-size:380px] lg:[--glow-size:420px]"
      style={{
        minHeight: 'calc(100vh - 4rem)',
      }}
    >
      {/* LAYER 1 (z-0): BOOKSHELF BACKGROUND (DIMMED/DARK VERSION) */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src={bookshelfBg}
          alt=""
          fill
          priority
          placeholder="blur"
          className="object-cover object-bottom select-none pointer-events-none brightness-[0.4] saturate-[0.7]"
          sizes="100vw"
        />
      </div>

      {/* LAYER 2 (z-10): PERMANENT DARK SHADING */}
      <div className="absolute inset-0 z-10 bg-[rgba(10,7,4,0.3)] select-none pointer-events-none" />

      {/* LAYER 3 (z-20): REVEALED/ILLUMINATED COPY OF BOOKSHELF IMAGE */}
      <div
        className="absolute inset-0 z-20 pointer-events-none select-none transition-all duration-300"
        style={maskStyle}
      >
        <Image
          src={bookshelfBg}
          alt=""
          fill
          priority
          placeholder="blur"
          className="object-cover object-bottom select-none pointer-events-none brightness-[1.08] saturate-[1.08]"
          sizes="100vw"
        />
      </div>

      {/* TRANSITIONAL TOP GRADIENT (z-[25]) */}
      <div
        className="absolute inset-0 z-[25] pointer-events-none select-none"
        style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(10, 7, 4, 0.85) 0%, rgba(10, 7, 4, 0.3) 20%, transparent 42%)'
        }}
      />

      {/* LAYER 4 (z-30): WARM AMBER GLOW */}
      <div
        className="absolute inset-0 z-30 select-none pointer-events-none transition-all duration-300"
        style={glowStyle}
      />

      {/* LAYER 5 (z-40): GOLDEN DUST PARTICLES */}
      <InteractiveParticleField
        containerRef={containerRef}
        className="pointer-events-none absolute inset-0 z-40 bg-transparent"
        particleCount={45}
        colors={["255, 185, 95", "245, 158, 11", "251, 191, 36"]}
        opacityRange={[0.08, 0.28]}
        lengthRange={[1.5, 4.5]}
        widthRange={[1, 1.5]}
        interactionRadius={120}
        maxPush={15}
      />

      {/* LAYER 6 (z-50): HERO CONTENT PORTAL */}
      <div className="relative z-50 w-full max-w-4xl mx-auto flex flex-col items-center justify-center pointer-events-auto">
        {children}
      </div>
    </div>
  );
}
