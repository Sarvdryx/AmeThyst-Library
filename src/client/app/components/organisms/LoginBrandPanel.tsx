"use client";

import React from 'react';
import loginPanelImg from '../../assets/login_panel.png';
import { useI18n } from '../../providers/I18nProvider';
import { SparkleImageOverlay } from '../effects';

export default function LoginBrandPanel() {
  const { t } = useI18n();

  return (
    <div className="hidden lg:flex lg:w-3/5 xl:w-2/3 min-h-screen bg-black overflow-hidden relative">
      <div className="absolute inset-0 w-full h-full">
        <img
          src={loginPanelImg.src}
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          alt={t('auth.library_branding')}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D9D9D900] to-[rgba(0,0,0,0.8)] z-5"></div>
        <SparkleImageOverlay />
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
        <h1 className="text-[#FFF] font-inder text-9xl tracking-[0.5156em] text-center ml-[0.5156em] select-none">
          LIMA
        </h1>
      </div>

      <div className="absolute bottom-10 left-10 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2.16225C15.204 2.16225 15.5835 2.17462 16.8491 2.23238C18.2149 2.29463 19.482 2.568 20.457 3.54338C21.432 4.51837 21.7054 5.7855 21.768 7.15125C21.8258 8.4165 21.8381 8.796 21.8381 12.0004C21.8381 15.2048 21.8258 15.5839 21.768 16.8495C21.7057 18.2153 21.4324 19.4824 20.457 20.4574C19.482 21.4324 18.2145 21.7057 16.8491 21.7684C15.5839 21.8261 15.2044 21.8385 12 21.8385C8.79562 21.8385 8.41613 21.8261 7.15088 21.7684C5.78513 21.7061 4.518 21.4328 3.543 20.4574C2.568 19.4824 2.29463 18.2153 2.232 16.8495C2.17425 15.5835 2.16225 15.204 2.16225 12C2.16225 8.796 2.17462 8.4165 2.23238 7.15088C2.29463 5.78513 2.568 4.518 3.54338 3.543C4.51837 2.568 5.7855 2.29463 7.15125 2.232C8.4165 2.17425 8.796 2.16225 12 2.16225ZM12 0C8.74088 0 8.3325 0.013875 7.05225 0.072375C5.10225 0.16125 3.38925 0.639 2.01375 2.01412C0.639375 3.38888 0.16125 5.1015 0.072375 7.05225C0.013875 8.3325 0 8.74088 0 12C0 15.2591 0.013875 15.6675 0.072375 16.9478C0.16125 18.8978 0.639 20.6108 2.01412 21.9862C3.38925 23.361 5.10187 23.8391 7.05262 23.928C8.3325 23.9861 8.74088 24 12 24C15.2591 24 15.6675 23.9861 16.9478 23.9276C18.8974 23.8387 20.6108 23.361 21.9862 21.9859C23.361 20.6111 23.8391 18.8981 23.928 16.9474C23.9861 15.6675 24 15.2591 24 12C24 8.74088 23.9861 8.3325 23.9276 7.05225C23.8387 5.10225 23.361 3.38925 21.9859 2.01375C20.6111 0.639 18.8981 0.160875 16.9474 0.072C15.6675 0.013875 15.2591 0 12 0Z" fill="white" />
          </svg>
          <span className="text-white text-xs font-semibold tracking-[-0.01em]">Bakti Milineal</span>
        </div>
        <div className="flex items-center gap-2 ml-10">
          <span className="text-white text-xs font-medium tracking-[-0.01em]">{t('auth.our_activities')}</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}