"use client";

import React from 'react';
import { NavBar, Footer } from '../organisms';
import loginPanelImg from '../../assets/login_panel.png';
import { SparkleImageOverlay } from '../effects';

interface RegisterTemplateProps {
    children: React.ReactNode;
}

export default function RegisterTemplate({ children }: RegisterTemplateProps) {
  return (
    <main 
      className="min-h-screen flex flex-col font-inter text-[#091426] dark:text-neutral-200 overflow-x-hidden relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('${loginPanelImg.src}')` }}
    >
      <NavBar />
      <div className="absolute inset-0 bg-black/10 dark:bg-black/40 pointer-events-none z-0" />
      <SparkleImageOverlay />

      <section className="flex-grow w-full flex justify-center items-center relative z-10 p-4 lg:p-8">
        <div className="bg-[#FFF8EB] dark:bg-neutral-800 p-8 lg:p-12 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15),-9px_4px_76px_0_rgba(0,0,0,0.2)] w-full max-w-[480px] flex justify-center items-center">
          {children}
        </div>
      </section>
      <Footer />
    </main>
  );
}