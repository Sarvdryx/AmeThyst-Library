"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../utils/apiClient';
import { useI18n } from '../../providers/I18nProvider';
import ConfigurationField from '../molecules/ConfigurationField';

interface SystemConfiguration {
  MAX_BORROW_LIMIT: number;
  FEE_ADMIN: number;
  FEE_ADDON: number;
  DAMAGE_COEFFICIENTS: Record<DamageKey, number>;
}

interface SystemConfigurationState {
  configuration: SystemConfiguration;
  version: string;
}

type DamageKey =
  | 'perfect_condition' | 'slight_cover_scratches' | 'folded_pages' | 'pencil_marks'
  | 'ink_marks' | 'torn_pages' | 'water_damage' | 'damaged_binding'
  | 'missing_mats' | 'missing_pages' | 'lost';

type FieldPath = 'MAX_BORROW_LIMIT' | 'FEE_ADMIN' | 'FEE_ADDON' | `DAMAGE_COEFFICIENTS.${DamageKey}`;
type Draft = Record<FieldPath, string>;
type FormStatus = 'loading' | 'ready' | 'saving' | 'saved' | 'failed' | 'conflict';

const damageKeys: DamageKey[] = [
  'perfect_condition', 'slight_cover_scratches', 'folded_pages', 'pencil_marks',
  'ink_marks', 'torn_pages', 'water_damage', 'damaged_binding', 'missing_mats',
  'missing_pages', 'lost',
];

const toDraft = (configuration: SystemConfiguration): Draft => ({
  MAX_BORROW_LIMIT: String(configuration.MAX_BORROW_LIMIT),
  FEE_ADMIN: String(configuration.FEE_ADMIN),
  FEE_ADDON: String(configuration.FEE_ADDON),
  ...Object.fromEntries(damageKeys.map((key) => [`DAMAGE_COEFFICIENTS.${key}`, String(configuration.DAMAGE_COEFFICIENTS[key])])),
}) as Draft;

const toConfiguration = (draft: Draft): SystemConfiguration => ({
  MAX_BORROW_LIMIT: Number(draft.MAX_BORROW_LIMIT),
  FEE_ADMIN: Number(draft.FEE_ADMIN),
  FEE_ADDON: Number(draft.FEE_ADDON),
  DAMAGE_COEFFICIENTS: Object.fromEntries(
    damageKeys.map((key) => [key, Number(draft[`DAMAGE_COEFFICIENTS.${key}`])]),
  ) as Record<DamageKey, number>,
});

const sections: Array<{ key: 'borrowing' | 'fees' | 'damage'; fields: FieldPath[] }> = [
  { key: 'borrowing', fields: ['MAX_BORROW_LIMIT'] },
  { key: 'fees', fields: ['FEE_ADMIN', 'FEE_ADDON'] },
  { key: 'damage', fields: damageKeys.map((key) => `DAMAGE_COEFFICIENTS.${key}` as FieldPath) },
];

const translationSlug = (path: FieldPath) => {
  const key = path.split('.').at(-1) || path;
  return key.toLowerCase().replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase());
};

export default function SystemConfigurationForm() {
  const { t } = useI18n();
  const [savedState, setSavedState] = useState<SystemConfigurationState | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [touched, setTouched] = useState<Partial<Record<FieldPath, boolean>>>({});
  const [status, setStatus] = useState<FormStatus>('loading');
  const [feedback, setFeedback] = useState<string>('');

  const loadConfiguration = useCallback(async () => {
    setStatus('loading');
    setFeedback('');
    const result = await apiFetch<SystemConfigurationState>('/api/dashboard/admin/system-configuration');
    if (!result.success || !result.data) {
      setStatus('failed');
      setFeedback(t('admin.system_configuration.errors.load'));
      return;
    }
    setSavedState(result.data);
    setDraft(toDraft(result.data.configuration));
    setTouched({});
    setStatus('ready');
  }, [t]);

  useEffect(() => {
    // Loading is the external synchronization performed by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadConfiguration();
  }, [loadConfiguration]);

  const errors = useMemo(() => {
    const next: Partial<Record<FieldPath, string>> = {};
    if (!draft) return next;
    for (const [path, rawValue] of Object.entries(draft) as Array<[FieldPath, string]>) {
      if (path === 'DAMAGE_COEFFICIENTS.perfect_condition') continue;
      if (rawValue.trim() === '') {
        next[path] = t('admin.system_configuration.errors.required');
        continue;
      }
      const numberValue = Number(rawValue);
      if (!Number.isFinite(numberValue) || numberValue < 0) {
        next[path] = t('admin.system_configuration.errors.non_negative');
      } else if (path === 'MAX_BORROW_LIMIT' && (!Number.isInteger(numberValue) || numberValue < 1)) {
        next[path] = t('admin.system_configuration.errors.positive_integer');
      }
    }
    return next;
  }, [draft, t]);

  const dirty = Boolean(draft && savedState && JSON.stringify(draft) !== JSON.stringify(toDraft(savedState.configuration)));
  const invalid = Object.keys(errors).length > 0;
  const saveDisabled = !dirty || invalid || status === 'saving';

  const updateField = (path: FieldPath, value: string) => {
    setDraft((current) => current ? { ...current, [path]: value } : current);
    setTouched((current) => ({ ...current, [path]: true }));
    if (status === 'saved' || status === 'failed' || status === 'conflict') {
      setStatus('ready');
      setFeedback('');
    }
  };

  const discard = () => {
    if (!savedState) return;
    setDraft(toDraft(savedState.configuration));
    setTouched({});
    setFeedback(t('admin.system_configuration.feedback.discarded'));
    setStatus('ready');
  };

  const save = async () => {
    if (!draft || !savedState || saveDisabled) return;
    setTouched(Object.fromEntries(Object.keys(draft).map((key) => [key, true])) as Record<FieldPath, boolean>);
    setStatus('saving');
    setFeedback(t('admin.system_configuration.feedback.saving'));
    const result = await apiFetch<SystemConfigurationState>('/api/dashboard/admin/system-configuration', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expectedVersion: savedState.version, configuration: toConfiguration(draft) }),
    });
    if (result.success && result.data) {
      setSavedState(result.data);
      setDraft(toDraft(result.data.configuration));
      setTouched({});
      setStatus('saved');
      setFeedback(t('admin.system_configuration.feedback.saved'));
      return;
    }
    if (result.error?.code === 'CONFIG_VERSION_CONFLICT') {
      setStatus('conflict');
      setFeedback(t('admin.system_configuration.errors.conflict'));
      return;
    }
    setStatus('failed');
    setFeedback(t('admin.system_configuration.errors.save'));
  };

  if (status === 'loading' && !draft) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm dark:border-neutral-700 dark:bg-neutral-900" role="status">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-neutral-700 dark:border-t-white" />
        <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-neutral-300">{t('admin.system_configuration.loading')}</p>
      </div>
    );
  }

  if (!draft || !savedState) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900 dark:bg-neutral-900" role="alert">
        <p className="font-semibold text-red-800 dark:text-red-200">{feedback || t('admin.system_configuration.errors.load')}</p>
        <button type="button" className="mt-4 rounded-full border border-stone-300 px-6 py-2 font-hankenGrotesk text-xs font-bold tracking-[0.05em] hover:bg-stone-50 dark:border-neutral-600 dark:hover:bg-neutral-800" onClick={() => void loadConfiguration()}>
          {t('admin.system_configuration.actions.retry')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); void save(); }} aria-label={t('admin.system_configuration.form_label')} className="space-y-6">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-3 px-1">
        <p aria-live="polite" className={`font-manrope text-sm ${status === 'failed' || status === 'conflict' || invalid ? 'text-red-700 dark:text-red-300' : 'text-slate-600 dark:text-neutral-300'}`}>
          {feedback || (invalid ? t('admin.system_configuration.feedback.fix_errors') : dirty ? t('admin.system_configuration.feedback.unsaved') : t('admin.system_configuration.feedback.up_to_date'))}
        </p>
        <div className="flex items-center gap-3">
          {status === 'conflict' && (
            <button type="button" className="font-hankenGrotesk text-xs font-bold tracking-[0.05em] text-slate-700 underline underline-offset-4 transition-colors hover:text-slate-900 dark:text-neutral-200 dark:hover:text-white" onClick={() => void loadConfiguration()}>
              {t('admin.system_configuration.actions.reload')}
            </button>
          )}
          <button type="button" className="font-hankenGrotesk text-xs font-bold tracking-[0.05em] text-slate-700 underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-40 transition-colors hover:text-slate-900 dark:text-neutral-200 dark:hover:text-white" disabled={!dirty || status === 'saving'} onClick={discard}>
            {t('admin.system_configuration.actions.discard')}
          </button>
        </div>
      </div>

      {sections.map((section) => (
        <section key={section.key} aria-labelledby={`configuration-${section.key}`} className="rounded-xl border border-stone-200 bg-white p-5 shadow-[0_4px_20px_-2px_rgba(26,46,68,0.06)] dark:border-neutral-700 dark:bg-neutral-900 sm:p-8">
          <header className="flex flex-col items-start justify-between gap-5 sm:flex-row">
            <div>
              <h2 id={`configuration-${section.key}`} className="font-manrope text-xl font-bold leading-7 text-black dark:text-white">
                {t(`admin.system_configuration.sections.${section.key}.title`)}
              </h2>
              <p className="mt-1 font-manrope text-base leading-6 text-slate-600 dark:text-neutral-400">
                {t(`admin.system_configuration.sections.${section.key}.description`)}
              </p>
            </div>
            <button type="submit" disabled={saveDisabled} className="shrink-0 rounded-full border border-stone-300 px-6 py-2 font-hankenGrotesk text-xs font-bold tracking-[0.05em] text-slate-900 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-800">
              {status === 'saving' ? t('admin.system_configuration.feedback.saving') : t('admin.system_configuration.actions.save')}
            </button>
          </header>
          <div className={`mt-8 grid gap-x-12 gap-y-6 ${section.key === 'borrowing' ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
            {section.fields.map((path) => {
              const slug = translationSlug(path);
              const fieldError = touched[path] || errors[path] === t('admin.system_configuration.errors.required') ? errors[path] : undefined;
              return (
                <ConfigurationField
                  key={path}
                  id={`configuration-${path.replaceAll('.', '-').toLowerCase()}`}
                  configurationKey={path}
                  label={t(`admin.system_configuration.fields.${slug}.label`)}
                  description={t(`admin.system_configuration.fields.${slug}.description`)}
                  value={draft[path]}
                  onChange={(value) => updateField(path, value)}
                  error={fieldError}
                  readOnly={path === 'DAMAGE_COEFFICIENTS.perfect_condition'}
                  integer={path === 'MAX_BORROW_LIMIT'}
                  prefix={path === 'FEE_ADMIN' || path === 'FEE_ADDON' ? '$' : path.startsWith('DAMAGE_COEFFICIENTS.') ? '×' : undefined}
                />
              );
            })}
          </div>
        </section>
      ))}
    </form>
  );
}
