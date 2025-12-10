// 'use client';

// import './globals.css';
// import { createContext, useState } from 'react';
// import translations from './components/translations';

// // Context
// export const LangContext = createContext();

// export default function RootLayout({ children }) {
//   const [lang, setLang] = useState('en');
//   const toggleLang = () => setLang(prev => (prev === 'en' ? 'mr' : 'en'));
//   const t = translations[lang];

//   return (
//     <html lang="en">
//       <body>
//         <LangContext.Provider value={{ lang, t, toggleLang }}>
//           <div className="flex flex-col min-h-screen">
//             {/* Header */}
//             <header className="bg-cyan-600 text-white p-4 flex justify-between items-center">
//               <h1 className="text-xl font-bold">Agri Files App</h1>
//               <button
//                 className="bg-white text-cyan-600 px-3 py-1 rounded hover:bg-gray-100"
//                 onClick={toggleLang}
//               >
//                 {lang === 'en' ? 'मराठी' : 'EN'}
//               </button>
//             </header>

//             {/* Main content */}
//             <main className="flex-grow">{children}</main>

//             {/* Footer */}
//             <footer className="bg-gray-200 text-gray-700 text-center p-4">
//               © 2025 Agri Files. All rights reserved.
//             </footer>
//           </div>
//         </LangContext.Provider>
//       </body>
//     </html>
//   );
// }



'use client';

import './globals.css';
import { createContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import translations from './components/translations';
import Loader from '@/components/Loader';

// Context
export const LangContext = createContext();

export default function RootLayout({ children }) {
  const [lang, setLang] = useState('en');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const router = useRouter();
  const pathname = usePathname(); // detect navigation changes
  const toggleLang = () => setLang(prev => (prev === 'en' ? 'mr' : 'en'));
  const t = translations[lang];

  // ✅ Function to read user from localStorage safely
  const loadUserFromStorage = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      setUser(storedUser ? JSON.parse(storedUser) : null);
    }
  };

  // Run when page loads or route changes
  useEffect(() => {
    loadUserFromStorage();
    setIsLoading(false); // Reset loader when route changes
  }, [pathname]); // reload user if route changes

  // Also listen to other tabs/localStorage events
  useEffect(() => {
    const handleStorageChange = () => loadUserFromStorage();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Logout handler - Show confirmation first
  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  // Confirm logout
  const confirmLogout = () => {
    setIsLoading(true);
    localStorage.removeItem('user');
    setUser(null);
    setShowLogoutConfirm(false);
    setTimeout(() => {
      router.push('/'); // redirect to login
    }, 500);
  };

  // Cancel logout
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };
  // Home handler
  const handleHome = () => {
    if (pathname !== '/dashboard') {
      setIsLoading(true);
      setTimeout(() => {
        router.push('/dashboard'); // redirect to dashboard
      }, 500);
    }
  };

  // Settings handler with loader
  const handleSettings = () => {
    if (pathname !== '/settings') {
      setIsLoading(true);
      setTimeout(() => {
        router.push('/settings'); // redirect to settings
      }, 500);
    }
  };

  // Profile handler
  const handleProfile = () => {
    if (pathname !== '/profile') {
      setIsLoading(true);
      setTimeout(() => {
        router.push('/profile'); // redirect to profile
      }, 500);
    }
  };


  return (
    <html lang="en">
      <body>
        {isLoading && <Loader message="Loading..." fullScreen={true} />}
        
        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform transition-all">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl">🚪</span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-black text-center text-gray-800 mb-2">
                Confirm Logout
              </h2>

              {/* Description */}
              <p className="text-center text-gray-600 mb-8 font-medium">
                Are you sure you want to logout? You'll need to login again to access your account.
              </p>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={cancelLogout}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition-all"
                >
                  ✗ Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg"
                >
                  ✓ Logout
                </button>
              </div>
            </div>
          </div>
        )}

        <LangContext.Provider value={{ lang, t, toggleLang }}>
          <div className="flex flex-col h-screen overflow-hidden min-w-0">
            {/* Header - Fixed at top */}
            <header className="bg-gradient-to-r from-green-100 to-gray-100 text-green-900 p-2 sm:p-4 flex flex-col sm:flex-row justify-between items-center shadow-lg flex-shrink-0 sticky top-0 z-40 w-full">
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-start">
                <img src="/logo-icon.png" alt="Agri Files Icon" className="h-10 sm:h-12 object-contain" />
                <img src="/logo-text-shadow.png" alt="Agri Files" className="h-8 sm:h-10 object-contain" />
              </div>
              <button
                className="bg-green-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-green-700 transition font-bold shadow-md hover:shadow-lg mt-2 sm:mt-0"
                onClick={toggleLang}
              >
                {lang === 'en' ? 'मराठी' : 'EN'}
              </button>
            </header>

            {/* ✅ Sub-header (auto-updates after login/logout) - Fixed */}
            {user && (
              <div className="bg-gradient-to-r from-green-700 to-emerald-700 text-white flex flex-col sm:flex-row justify-between items-center px-2 sm:px-6 py-2 sm:py-3 border-b-2 border-green-900 shadow-md flex-shrink-0 sticky top-[72px] z-40 w-full">
      {/* Left side: user info */}
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs sm:text-sm font-semibold w-full sm:w-auto justify-center sm:justify-start">
      <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full shadow-md">
         {user.business_name}
      </span>
      <span className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-md">
       {user.taluka}
      </span>
      <span className="bg-purple-600 text-white px-4 py-2 rounded-full shadow-md">
       {user.district}
      </span>
    </div>

    {/* Right side: Navigation buttons - flex-end to push to right */}
    <div className="flex flex-wrap items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center sm:justify-end mt-2 sm:mt-0">
      {/* Home Button */}
      <button
        onClick={handleHome}
        className="bg-amber-600 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-md hover:bg-amber-700 transition text-xs sm:text-sm font-semibold cursor-pointer shadow-md hover:shadow-lg"
      >
        🏠 {t.home || 'Home'}
      </button>

      {/* Settings Button */}
      <button
        onClick={handleSettings}
        className="bg-cyan-600 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-md hover:bg-cyan-700 transition text-xs sm:text-sm font-semibold cursor-pointer shadow-md hover:shadow-lg"
      >
        ⚙️ {t.settings || 'Settings'}
      </button>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-md hover:bg-red-700 transition text-xs sm:text-sm font-semibold cursor-pointer shadow-md hover:shadow-lg"
      >
        🚪 {t.logout || 'Logout'}
      </button>

      {/* Profile Button - Extreme Right */}
      <button
        onClick={handleProfile}
        className="bg-yellow-500 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-md hover:bg-yellow-600 transition text-xs sm:text-sm font-semibold cursor-pointer shadow-md hover:shadow-lg ml-auto"
      >
        👤 {t.profile || 'Profile'}
      </button>
    </div>
              </div>
            )}

            {/* Main content - Scrollable area */}
            <main className="flex-grow overflow-y-auto min-w-0 px-1 sm:px-0">{children}</main>

            {/* Footer - Fixed at bottom of scrollable area */}
            <footer className="bg-gray-200 text-gray-700 text-center p-2 sm:p-4 flex-shrink-0 text-xs sm:text-sm">
              © 2025 Agri Files. All rights reserved.
            </footer>
          </div>
        </LangContext.Provider>
      </body>
    </html>
  );
}
