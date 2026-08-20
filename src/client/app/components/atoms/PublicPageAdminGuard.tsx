"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getLoggedInUser, isLoggedIn } from '../../utils/user';

const ADMIN_RESTRICTED_PATHS = ['/library', '/study-together', '/map'];

export default function PublicPageAdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) return;
    const user = getLoggedInUser();
    if (user?.role !== 'admin') return;
    const restricted =
      pathname === '/' ||
      ADMIN_RESTRICTED_PATHS.some((path) => pathname.startsWith(path));
    if (restricted) {
      router.replace('/dashboard/admin');
    }
  }, [pathname, router]);

  return <>{children}</>;
}
