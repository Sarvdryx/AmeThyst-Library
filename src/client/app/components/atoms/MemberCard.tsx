import React from 'react';
import IconButton from './IconButton';
import UserAvatar from './UserAvatar';
import UserProfileHoverCard from '../molecules/UserProfileHoverCard';

interface MemberCardProps {
  name: string;
  initials: string;
  avatar?: string | null;
  role?: string;
  email?: string | null;
  phoneNumber?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  occupation?: string | null;
  hometown?: string | null;
  description?: string | null;
  canKick?: boolean;
  onKick?: () => void;
}

export default function MemberCard({ name, initials, avatar, role, email, phoneNumber, birthDate, gender, occupation, hometown, description, canKick, onKick }: MemberCardProps) {
  return (
    <div className="flex p-3 items-center justify-between border border-[#C6C6CD] dark:border-neutral-800 bg-[#FFF] dark:bg-neutral-900 rounded-xl w-full">
      <UserProfileHoverCard user={{ name, initials, avatar, role, email, phoneNumber, birthDate, gender, occupation, hometown, description }}>
        <span className="flex items-center gap-3 overflow-hidden">
          <UserAvatar avatar={avatar} initials={initials} alt={name} className="h-10 w-10" fallbackClassName="bg-gray-100 text-sm text-gray-500 dark:bg-neutral-800 dark:text-gray-300" />
          <span className="flex flex-col items-start overflow-hidden">
            <span className="w-full truncate font-inter text-sm font-bold leading-5 text-[#000] dark:text-white">
              {name}
            </span>
            {role && (
              <span className="w-full truncate font-inter text-[10px] uppercase leading-[14px] tracking-wider text-[#45464D] dark:text-gray-400">
                {role}
              </span>
            )}
          </span>
        </span>
      </UserProfileHoverCard>
      {canKick && (
        <IconButton label="Kick Member" onClick={onKick} className="text-red-500 hover:text-red-700">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </IconButton>
      )}
    </div>
  );
}
