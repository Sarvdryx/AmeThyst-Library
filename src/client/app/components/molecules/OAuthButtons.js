"use client";

import React from 'react';
import { Button } from '../atoms';

export const OAuthButtons = ({ label, disabled = false }) => {

  const handleGoogleSignIn = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <Button
        type="button"
        variant="outline"
        className="w-full h-[52px] gap-4"
        onClick={handleGoogleSignIn}
        disabled={disabled}
      >
        <div className="w-5 h-5 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.6 10.2273C19.6 9.50394 19.5352 8.81076 19.4148 8.14481H10V12.0835H15.3815C15.1491 13.3358 14.4426 14.3971 13.3769 15.1108V17.6653H16.6231C18.5213 15.9176 19.6 13.313 19.6 10.2273Z" fill="#4285F4"/>
            <path d="M10 20C12.7 20 14.9611 19.1045 16.6231 17.6659L13.3769 15.1114C12.4787 15.7136 11.3407 16.0727 10 16.0727C7.38981 16.0727 5.1787 14.3091 4.38981 11.9273H1.05648V14.5114C2.71019 17.7977 6.08889 20 10 20Z" fill="#34A853"/>
            <path d="M4.38981 11.9273C4.18704 11.3227 4.0713 10.675 4.0713 10C4.0713 9.325 4.18704 8.67727 4.38981 8.07273V5.48864H1.05648C0.381481 6.84318 0 8.37955 0 10C0 11.6205 0.381481 13.1568 1.05648 14.5114L4.38981 11.9273Z" fill="#FBBC05"/>
            <path d="M10 3.92727C11.4685 3.92727 12.787 4.43182 13.8241 5.41818L16.6963 2.54545C14.9574 0.968182 12.6954 0 10 0C6.08889 0 2.71019 2.20227 1.05648 5.48864L4.38981 8.07273C5.1787 5.69091 7.38981 3.92727 10 3.92727Z" fill="#EA4335"/>
          </svg>
        </div>
        {label}
      </Button>
    </div>
  );
};
