"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getLoggedInUser, getDashboardPath } from '../utils/user';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const user = getLoggedInUser();
    router.replace(getDashboardPath(user));
  }, [router]);

  return null;
}
