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

// Context
export const LangContext = createContext();

export default function RootLayout({ children }) {
  const [lang, setLang] = useState('en');
  const [user, setUser] = useState(null);
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
  }, [pathname]); // reload user if route changes

  // Also listen to other tabs/localStorage events
  useEffect(() => {
    const handleStorageChange = () => loadUserFromStorage();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/'); // redirect to login
  };
    // Logout handler
  const handleHome = () => {

    router.push('/dashboard'); // redirect to login
  };

      // Logout handler
  const handleSettings = () => {

    router.push('/settings'); // redirect to login
  };


  return (
    <html lang="en">
      <body>
        <LangContext.Provider value={{ lang, t, toggleLang }}>
          <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="bg-cyan-600 text-white p-4 flex justify-between items-center shadow-md">
              <h1 className="text-xl font-bold">Agri Files App</h1>
              <button
                className="bg-white text-cyan-600 px-3 py-1 rounded hover:bg-gray-100 transition"
                onClick={toggleLang}
              >
                {lang === 'en' ? 'मराठी' : 'EN'}
              </button>
            </header>

            {/* ✅ Sub-header (auto-updates after login/logout) */}
            {user && (
              <div className="bg-cyan-50 text-cyan-800 flex justify-between items-center px-6 py-2 border-b border-cyan-200 shadow-sm">
      {/* Left side: user info */}
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm font-medium">
      <span className="bg-emerald-600 font-extrabold text-xl text-white px-3 py-2 rounded-full shadow-sm">
        <strong>{user.business_name}</strong> 
      </span>
      <span className="bg-yellow-600  text-white px-3 py-2 rounded-full shadow-sm">
        <strong>{t.taluka}:</strong> {user.taluka}
      </span>
      <span className="bg-fuchsia-900  text-white px-3 py-2 rounded-full shadow-sm">
        <strong>{t.district}:</strong> {user.district}
      </span>
    </div>

    <div>
                   <button
                  onClick={handleSettings}
                  className="bg-cyan-600 text-white px-3 py-1 rounded-md hover:bg-cyan-600 transition text-sm m-2.5"
                >
                  {t.settings || 'Settings'}
                </button>
                          <button
                  onClick={handleHome}
                  className="bg-amber-600 text-white px-3 py-1 rounded-md hover:bg-amber-700 transition text-sm m-2.5"
                >
                  {t.home || 'Home'}
                </button>

                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition text-sm m-2.5"
                >
                  {t.logout || 'Logout'}
                </button> </div>


              </div>
            )}

            {/* Main content */}
            <main className="flex-grow">{children}</main>

            {/* Footer */}
            <footer className="bg-gray-200 text-gray-700 text-center p-4">
              © 2025 Agri Files. All rights reserved.
            </footer>
          </div>
        </LangContext.Provider>
      </body>
    </html>
  );
}
