'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { LangContext } from '../layout';

export default function DashboardPage() {
  const { t } = useContext(LangContext);
  const router = useRouter();
  const [user, setUser] = useState(null);

  // Example: load user from localStorage/session after login
  useEffect(() => {
    const dummyUser = {
      id: 1,
      name: "Prashant Sable",
      business_name: "Agri Solutions",
      email: "prashant@example.com",
      mobile: "9876543210",
      district: "Pune",
      taluka: "Haveli",
      status: "Active", // or "Inactive"
    };

   // localStorage.setItem('user', JSON.stringify(dummyUser));
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    else router.push('/'); // redirect if no user found
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/'); // redirect to login page
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-10 px-4">
      {/* Top user info */}
      {/* <div className="w-full max-w-4xl bg-white shadow rounded-lg p-6 mb-4 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-cyan-700 mb-3">{user.name}</h2>
          <div className="grid grid-cols-2 gap-4 text-gray-700">
            <p><strong>{t.businessName}:</strong> {user.business_name}</p>
            <p><strong>{t.district}:</strong> {user.district}</p>
            <p><strong>{t.taluka}:</strong> {user.taluka}</p>
            <p>
              <strong>{t.status}:</strong>{' '}
              <span className={`px-2 py-1 rounded text-white ${user.status?.toLowerCase() === 'active' ? 'bg-green-500' : 'bg-red-500'}`}>
                {user.status}
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600 hover:shadow-lg transition-all"
        >
          {t.logout || 'Logout'}
        </button>
      </div> */}

      {/* Main actions */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => router.push('/new')}
          className="p-10 text-xl font-semibold text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition-all duration-300"
        >
          {t.fillNewFile}
        </button>

        <button
          onClick={() => router.push('/files')}
          className="p-10 text-xl font-semibold text-white bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition-all duration-300"
        >
          {t.seeExistingFiles}
        </button>
      </div>
    </div>
  );
}
