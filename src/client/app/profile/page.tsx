"use client";

import React, { useState, useEffect } from 'react';
import ProfileTemplate from '../components/templates/ProfileTemplate';
import { useRequireAuth, updateStoredUser } from '../utils/user';
import { apiFetch } from '../utils/apiClient';
import { useI18n } from '../providers/I18nProvider';
import { FormField, ProfileSectionCard } from '../components/molecules';
import { CustomSelect, Label } from '../components/atoms';

import { validateFullName, validatePhone } from '../utils/validation';

interface ProfileState {
  fullName: string;
  email: string;
  phoneNumber: string;
  occupation: string;
  birthDate: string;
  gender: string;
  hometown: string;
  description: string;
  avatarUrl: string;
  role: string;
  borrowNum: number;
  maxBorrowLimit: number;
}

export default function ProfilePage() {
  const { t } = useI18n();
  useRequireAuth();

  const [profile, setProfile] = useState<ProfileState>({
    fullName: "",
    email: "",
    phoneNumber: "",
    occupation: "",
    birthDate: "",
    gender: "",
    hometown: "",
    description: "",
    avatarUrl: "",
    role: "user",
    borrowNum: 0,
    maxBorrowLimit: 5,
  });

  const [savedProfile, setSavedProfile] = useState<ProfileState>({
    fullName: "",
    email: "",
    phoneNumber: "",
    occupation: "",
    birthDate: "",
    gender: "",
    hometown: "",
    description: "",
    avatarUrl: "",
    role: "user",
    borrowNum: 0,
    maxBorrowLimit: 5,
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      const result = await apiFetch<Record<string, any>>('/user/profile');
      if (cancelled) return;
      if (!result.success || !result.data) {
        setError(result.message || t('profile.load_profile_failed'));
        return;
      }
      const data = result.data;

        // Map database response fields (camelCase from SQL aliases)
        const formatBirthDate = data.birthDate
        ? new Date(data.birthDate).toLocaleDateString('sv-SE')
        : "";

        const loaded: ProfileState = {
          fullName: data.username || "",
          email: data.email || "",
          phoneNumber: data.phoneNumber || "",
          occupation: data.occupation || "",
          birthDate: formatBirthDate,
          gender: data.gender || "",
          hometown: data.hometown || "",
          description: data.description || "",
          avatarUrl: data.avatar || "",
          role: data.role || "user",
          borrowNum: data.borrowNum || 0,
          maxBorrowLimit: data.maxBorrowLimit || 5,
        };

        setProfile(loaded);
        setSavedProfile(loaded);
        updateStoredUser({
          username: data.username,
          email: data.email,
          avatar: data.avatar,
        });
    };
    void loadProfile()
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : t('profile.load_profile_failed')); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [t]);

  const handleLocalUpdate = (field: keyof ProfileState, value: any) => {
    if (field === 'phoneNumber') {
      setPhoneError('');
    }
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setProfile(savedProfile);
    setPhoneError('');
    setError('');
    setMessage('');
  };

  const handleSaveChanges = async () => {
    const body: Record<string, any> = {};

    // Validate Full Name
    const nameValidationError = validateFullName(profile.fullName);
    if (nameValidationError) {
      setError(t(nameValidationError));
      return;
    }

    if (profile.fullName !== savedProfile.fullName) {
      body.username = profile.fullName;
    }

    if (profile.phoneNumber !== savedProfile.phoneNumber) {
      const phoneValidationError = validatePhone(profile.phoneNumber);
      if (phoneValidationError) {
        setPhoneError(t(phoneValidationError));
        return;
      }
      body.phoneNumber = profile.phoneNumber || null;
    }

    if (profile.occupation !== savedProfile.occupation) {
      body.occupation = profile.occupation || null;
    }

    if (profile.birthDate !== savedProfile.birthDate) {
      body.birthDate = profile.birthDate || null;
    }

    if (profile.gender !== savedProfile.gender) {
      body.gender = profile.gender || null;
    }

    if (profile.hometown !== savedProfile.hometown) {
      body.hometown = profile.hometown || null;
    }

    if (profile.description !== savedProfile.description) {
      body.description = profile.description || null;
    }

    if (Object.keys(body).length === 0) return;

    try {
      setError('');
      setMessage('');
      const result = await apiFetch<Record<string, any>>('/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!result.success || !result.data) throw new Error(result.message || t('profile.update_failed'));
      const updated = result.data;

      const formatBirthDate = updated.birthDate
        ? new Date(updated.birthDate).toISOString().split('T')[0]
        : "";

      const newProfile: ProfileState = {
        ...profile,
        fullName: updated.username || profile.fullName,
        phoneNumber: updated.phoneNumber || profile.phoneNumber,
        occupation: updated.occupation || profile.occupation,
        birthDate: formatBirthDate,
        gender: updated.gender || profile.gender,
        hometown: updated.hometown || profile.hometown,
        description: updated.description || profile.description,
      };

      setProfile(newProfile);
      setSavedProfile(newProfile);
      updateStoredUser({
        username: updated.username,
        email: updated.email,
        avatar: profile.avatarUrl,
      });
      setMessage(t('profile.updated_success'));
      setError('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('profile.update_failed'));
    }
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setProfile((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
    setSavedProfile((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
    updateStoredUser({ avatar: newAvatarUrl });
  };

  const isChanged =
    profile.fullName !== savedProfile.fullName ||
    profile.phoneNumber !== savedProfile.phoneNumber ||
    profile.occupation !== savedProfile.occupation ||
    profile.birthDate !== savedProfile.birthDate ||
    profile.gender !== savedProfile.gender ||
    profile.hometown !== savedProfile.hometown ||
    profile.description !== savedProfile.description;

  return (
    <ProfileTemplate
      username={profile.fullName}
      avatarUrl={profile.avatarUrl}
      role={profile.role}
      borrowNum={profile.borrowNum}
      maxBorrowLimit={profile.maxBorrowLimit}
      onAvatarUpdate={handleAvatarUpdate}
    >
      <div className="flex flex-col items-start w-full gap-2 mb-8">
        <h1 className="text-[#1E293B] dark:text-neutral-200 font-inter text-4xl font-bold leading-10 text-left w-full">
          {t('profile.profile_details')}
        </h1>
        <p className="text-[#475569] dark:text-neutral-400 font-inter text-base font-medium leading-6 text-left w-full">
          {t('profile.personal_information')}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <span className="text-[#091426] dark:text-neutral-200 font-medium animate-pulse">{t('profile.security_loading')}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-6 w-full">
          {message && <p className="text-green-600 dark:text-green-400 font-semibold p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 w-full text-left">{message}</p>}
          {error && <p className="text-red-500 dark:text-red-400 font-semibold p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 w-full text-left">{error}</p>}

          {/* Card 1: General & Contact Info */}
          <ProfileSectionCard title={t('profile.general_contact_info')} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label={t('profile.full_name')}
              id="fullName"
              type="text"
              value={profile.fullName}
              onChange={(e) => handleLocalUpdate('fullName', e.target.value)}
              placeholder={t('auth.full_name_placeholder') || "Enter your full name"}
              required
            />
            <FormField
              label={t('profile.email_address')}
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
            />
            <div className="flex flex-col">
              <FormField
                label={t('profile.phone_number')}
                id="phoneNumber"
                type="text"
                value={profile.phoneNumber}
                onChange={(e) => handleLocalUpdate('phoneNumber', e.target.value)}
                placeholder={t('profile.phone_placeholder') || "Enter phone number"}
                error={phoneError}
              />
            </div>
            <FormField
              label={t('profile.occupation')}
              id="occupation"
              type="text"
              value={profile.occupation}
              onChange={(e) => handleLocalUpdate('occupation', e.target.value)}
              placeholder={t('profile.occupation_placeholder')}
            />
          </ProfileSectionCard>

          {/* Card 2: Personal Details */}
          <ProfileSectionCard title={t('profile.personal_details')} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label={t('profile.birth_date')}
              id="birthDate"
              type="date"
              value={profile.birthDate}
              onChange={(e) => handleLocalUpdate('birthDate', e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gender">{t('profile.gender')}</Label>
              <CustomSelect
                options={[
                  { value: "", label: t('profile.gender_select') },
                  { value: "male", label: t('profile.gender_male') },
                  { value: "female", label: t('profile.gender_female') },
                  { value: "other", label: t('profile.gender_other') },
                ]}
                value={profile.gender}
                onChange={(v) => handleLocalUpdate('gender', v)}
                className="w-full"
              />
            </div>
            <FormField
              label={t('profile.hometown')}
              id="hometown"
              type="text"
              value={profile.hometown}
              onChange={(e) => handleLocalUpdate('hometown', e.target.value)}
              placeholder={t('profile.hometown_placeholder')}
            />
          </ProfileSectionCard>

          {/* Card 3: Description (Biography) */}
          <ProfileSectionCard title={t('profile.description')} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5 w-full">
              <textarea
                id="description"
                value={profile.description}
                onChange={(e) => handleLocalUpdate('description', e.target.value)}
                placeholder={t('profile.description_placeholder')}
                rows={4}
                className="w-full min-h-[120px] p-4 rounded-lg border border-[#C5C6CD] dark:border-neutral-600 bg-white dark:bg-neutral-800 text-base text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#006A61] dark:focus:ring-[#FFB95F] transition-all resize-y shadow-sm"
              />
            </div>
          </ProfileSectionCard>

          {/* Actions Bar */}
          <div className="flex justify-end items-center gap-4 mt-4">
            <button
              onClick={handleCancel}
              disabled={!isChanged}
              className="cursor-pointer text-nowrap flex py-3 px-10 justify-center items-center rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-700/50 text-slate-700 dark:text-neutral-200 font-inter text-sm font-medium leading-5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              {t('profile.cancel')}
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={!isChanged}
              className="cursor-pointer text-nowrap flex py-3 px-10 justify-center items-center rounded-lg bg-[#0F172A] hover:bg-[#1E293B] active:bg-[#000] text-white dark:bg-neutral-200 dark:hover:bg-white dark:text-neutral-900 font-inter text-sm font-bold leading-5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F172A] dark:focus:ring-white"
            >
              {t('profile.save_changes')}
            </button>
          </div>
        </div>
      )}
    </ProfileTemplate>
  );
}
