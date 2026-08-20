"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '../atoms';
import { useI18n } from '../../providers/I18nProvider';

interface ProfileCardProps {
  label: string;
  value: string;
  onUpdate: (value: string) => void;
  editable?: boolean;
}

export default function ProfileCard({ label, value, onUpdate, editable = true }: ProfileCardProps) {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = () => {
    onUpdate(tempValue);
    setIsEditing(false);
  };

  return (
    <div
      className={`p-4 border ${editable ? 'border-transparent hover:border-slate-500 dark:hover:border-slate-400 cursor-pointer' : 'border-transparent opacity-60'} rounded-lg transition-all bg-white dark:bg-neutral-800 shadow-sm`}
      onClick={() => editable && !isEditing && setIsEditing(true)}
    >
      <h3 className="text-sm text-neutral-500 dark:text-neutral-400 font-semibold">{label}</h3>
      {isEditing ? (
        <Input
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
          className="h-8 border-0 border-b border-slate-500 dark:border-slate-400 rounded-none bg-transparent px-0 focus:ring-0 text-neutral-800 dark:text-neutral-200"
        />
      ) : (
        <p className={`text-base ${value ? 'text-neutral-800 dark:text-neutral-200' : 'text-neutral-400 dark:text-neutral-500'}`}>
          {value || t('profile.not_provided')}
        </p>
      )}
    </div>
  );
}