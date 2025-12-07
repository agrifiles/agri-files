'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/utils';
import Loader from './Loader';

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      // User not logged in, redirect to login
      router.push('/');
    } else {
      // User is logged in
      setIsAuthorized(true);
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return <Loader fullScreen message="Loading..." />;
  }

  if (!isAuthorized) {
    return null; // will redirect shortly
  }

  return children;
}
