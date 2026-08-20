"use client";

import { useState } from 'react';

interface UserAvatarProps {
  avatar?: string | null;
  initials: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export default function UserAvatar({ avatar, initials, alt, className = 'h-8 w-8', fallbackClassName = '' }: UserAvatarProps) {
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);

  if (avatar && failedAvatar !== avatar) {
    return <img src={avatar} alt={alt} className={`${className} rounded-full object-cover`} onError={() => setFailedAvatar(avatar)} />;
  }

  return (
    <span aria-label={alt} className={`${className} ${fallbackClassName} inline-flex shrink-0 items-center justify-center rounded-full font-bold`}>
      {initials}
    </span>
  );
}
