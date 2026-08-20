"use client";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuthActions } from '../molecules';
import { ThemeToggle } from '../atoms/ThemeToggle';
import { LanguageToggle } from '../atoms/LanguageToggle';
import { useI18n } from '../../providers/I18nProvider';
import { getDashboardPath, getLoggedInUserInitials, useStoredUser } from '../../utils/user';
import NotificationBell from '../molecules/NotificationBell';
import UserAvatar from '../atoms/UserAvatar';

interface NavBarProps {
  variant?: 'default' | 'admin';
}

export default function NavBar({ variant = 'default' }: NavBarProps) {
  const pathname = usePathname();
  const { locale, t } = useI18n();
  const user = useStoredUser();
  const isAdminVariant = variant === 'admin' || user?.role === 'admin';

  const navItems = [
    { label: t('navbar.library'), href: '/library' },
    { label: t('navbar.dashboard'), href: getDashboardPath(user) || '/login?returnTo=/dashboard/user' },
    { label: t('navbar.study_together'), href: '/study-together' },
    { label: t('navbar.library_map'), href: '/map' }
  ];

  const dashboardHref = getDashboardPath(user) || '/';
  const isDashboardPage = pathname.startsWith('/dashboard');
  const currentPageLabel =
    pathname === '/profile' ? t('profile.profile_link')
    : pathname === '/profile/security' ? t('profile.security_link')
    : null;

  return (
    <nav className="w-full h-[84px] bg-[#000] dark:bg-neutral-950 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">

        {/* Logo & Brand */}
        <Link href={isAdminVariant ? getDashboardPath(user) || '/' : '/'} className="flex items-center gap-2">
          <div className="flex items-center gap-2 w-[132px]">
            <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex flex-col items-start w-fit">
              <path d="M4 21.3333V12H6.66667V21.3333H4ZM12 21.3333V12H14.6667V21.3333H12ZM0 26.6667V24H26.6667V26.6667H0ZM20 21.3333V12H22.6667V21.3333H20ZM0 9.33333V6.66667L13.3333 0L26.6667 6.66667V9.33333H0Z" fill="white" />
            </svg>
            <div className="flex flex-col items-start w-fit">
              <span className="text-[#FFF] font-inter text-2xl font-bold leading-8 w-fit tracking-[-0.025em]">LIMA</span>
            </div>
          </div>
        </Link>

        {isAdminVariant ? (
          <>
            {/* Admin: breadcrumb showing current location with a Dashboard return link */}
            {!isDashboardPage && (
              <div className="hidden md:flex items-center gap-2 min-w-0">
                <Link
                  href={dashboardHref}
                  className="text-white/70 hover:text-white font-inter text-sm font-semibold leading-5 transition-colors"
                >
                  {t('navbar.dashboard')}
                </Link>
                {currentPageLabel && (
                  <>
                    <span className="text-white/40 font-inter text-sm leading-5" aria-hidden="true">›</span>
                    <span className="text-white font-inter text-sm font-semibold leading-5">{currentPageLabel}</span>
                  </>
                )}
              </div>
            )}

            {/* Admin: Toggles + Notification + Settings + Avatar */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              <div className="border-l border-neutral-800 pl-3 flex items-center gap-3">
                <NotificationBell enabled={!!user} t={t} userId={user?.userId} />
                <Link
                  href="/profile/security"
                  aria-label={t('profile.settings_aria')}
                  className="flex items-center justify-center text-white transition-colors hover:text-[#8FB2C1]"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor" />
                  </svg>
                </Link>
                <Link href="/profile" aria-label={user?.username || t('profile.settings_aria')}>
                  <UserAvatar
                    avatar={user?.avatar}
                    initials={user ? getLoggedInUserInitials() : '?'}
                    alt={user?.username || 'User'}
                    className="h-10 w-10 border border-neutral-700 transition-transform hover:scale-105"
                    fallbackClassName="bg-[#486C7E] font-bold text-white"
                  />
                </Link>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`font-inter text-sm font-semibold transition-colors ${isActive
                        ? 'text-[#486C7E]'
                        : 'text-[#FFF] hover:text-[#486C7E]'
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Toggles + Auth Actions */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              <div className="border-l border-neutral-800 pl-4">
                <AuthActions />
              </div>
            </div>
          </>
        )}

      </div>
    </nav>
  );
}
