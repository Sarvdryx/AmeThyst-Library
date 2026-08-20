"use client";

import { SystemConfigurationForm } from '../../../components/organisms';
import { useI18n } from '../../../providers/I18nProvider';

export default function AdminSystemPage() {
  const { t } = useI18n();

  return (
    <div className="mx-auto w-full max-w-[1060px] pb-10">
      <header className="mb-8 px-1 py-4 sm:mb-10 sm:py-6">
        <h1 className="font-manrope text-3xl font-semibold tracking-[0.08em] text-black dark:text-white sm:text-[32px] sm:leading-10">
          {t('admin.system_configuration.title')}
        </h1>
      </header>
      <SystemConfigurationForm />
    </div>
  );
}
