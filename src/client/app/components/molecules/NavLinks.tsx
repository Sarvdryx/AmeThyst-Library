import React from 'react';
import { NavLink } from '../atoms/NavLink';
import { useI18n } from '../../providers/I18nProvider';

export const NavLinks = () => {
  const { t } = useI18n();
  return (
    <ul className="hidden md:flex items-center gap-8">
      <li><NavLink href="/">{t('navbar.home')}</NavLink></li>
      <li><NavLink href="/about">{t('navbar.about')}</NavLink></li>
      <li><NavLink href="/library">{t('navbar.library')}</NavLink></li>
    </ul>
  );
};
