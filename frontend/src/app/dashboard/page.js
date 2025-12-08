'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { LangContext } from '../layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loader from '@/components/Loader';

function DashboardPageContent() {
  const { t } = useContext(LangContext);
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    else router.push('/');
  }, [router]);

  if (!user) return null;

  const handleNavigateToFiles = () => {
    setIsLoading(true);
    setTimeout(() => {
      router.push('/files');
    }, 500);
  };

  if (isLoading) {
    return <Loader message="Loading your files..." fullScreen={true} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      {/* Background animation container */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 -right-32 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Main Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

          {/* New File Card */}
<div
  onClick={() => router.push('/new')}
  className="group relative bg-gradient-to-br from-green-50 via-green-50 to-emerald-50 rounded-3xl shadow-2xl border-2 border-green-200 backdrop-blur-md overflow-hidden p-10 cursor-pointer hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2"
>
  <div className="absolute inset-0 bg-gradient-to-br from-green-100/30 via-transparent to-emerald-100/30 pointer-events-none"></div>
  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-opacity"></div>
  
  <div className="absolute top-6 right-6 w-20 h-20 bg-green-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 group-hover:opacity-50 transition-opacity animate-blob"></div>
  
  <div className="relative z-10">
    <div className="text-7xl mb-6 transform group-hover:scale-110 transition-transform">🌱</div>

    {/* Title */}
    <h2 className="leading-normal text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-emerald-600 mb-3">
      {t.fillNewFile} (MAHADBT)
    </h2>

    {/* Subtitle */}
    <p className="text-green-700 font-medium text-lg mb-6">
      {t.fillNewFileSubtitle}
    </p>
    
    <div className="flex items-center gap-2 mb-6">
      <div className="flex-grow h-1 bg-gradient-to-r from-green-400 to-transparent rounded-full"></div>
    </div>

    {/* Features list */}
    <ul className="space-y-2 mb-8">
      <li className="flex items-center gap-3 text-green-700">
        <span className="text-2xl">✓</span>
        <span className="font-semibold">{t.fillNewFileFeatureFarmer}</span>
      </li>
      <li className="flex items-center gap-3 text-green-700">
        <span className="text-2xl">✓</span>
        <span className="font-semibold">{t.fillNewFileFeatureIrrigation}</span>
      </li>
      <li className="flex items-center gap-3 text-green-700">
        <span className="text-2xl">✓</span>
        <span className="font-semibold">{t.fillNewFileFeatureDrip}</span>
      </li>
      <li className="flex items-center gap-3 text-green-700">
        <span className="text-2xl">✓</span>
        <span className="font-semibold">{t.fillNewFileFeatureQuotation}</span>
      </li>
      <li className="flex items-center gap-3 text-green-700">
        <span className="text-2xl">✓</span>
        <span className="font-semibold">{t.fillNewFileFeatureLayout}</span>
      </li>
    </ul>

    {/* Button */}
    <button className="relative group/btn w-full overflow-hidden text-white font-bold rounded-xl text-lg px-6 py-4 transition-all duration-300 shadow-lg hover:shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 group-hover/btn:from-green-700 group-hover/btn:via-emerald-700 group-hover/btn:to-teal-700 transition duration-300"></div>
      <span className="relative flex items-center justify-center gap-2">
        🚀 {t.fillNewFile}
      </span>
    </button>
  </div>
</div>
{/* Existing Files Card */}
<div 
  onClick={handleNavigateToFiles}
  className="group relative bg-gradient-to-br from-emerald-50 via-emerald-50 to-teal-50 rounded-3xl shadow-2xl border-2 border-emerald-200 backdrop-blur-md overflow-hidden p-10 cursor-pointer hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2"
>
  <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/30 via-transparent to-teal-100/30 pointer-events-none"></div>
  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-opacity"></div>

  <div className="absolute top-6 right-6 w-20 h-20 bg-emerald-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 group-hover:opacity-50 transition-opacity animate-blob" style={{ animationDelay: '2s' }}></div>

  <div className="relative z-10">
    <div className="text-7xl mb-6 transform group-hover:scale-110 transition-transform">📂</div>

    <h2 className="leading-normal text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-600 mb-3">
      {t.seeExistingFiles}
    </h2>

    <p className="text-emerald-700 font-medium text-lg mb-6">
      {t.existingSubtitle}
    </p>

    <div className="flex items-center gap-2 mb-6">
      <div className="flex-grow h-1 bg-gradient-to-r from-emerald-400 to-transparent rounded-full"></div>
    </div>

    <ul className="space-y-2 mb-8">
      <li className="flex items-center gap-3 text-emerald-700">
        <span className="text-2xl">✓</span>
        <span className="font-semibold">{t.existingFeatureViewFiles}</span>
      </li>
      <li className="flex items-center gap-3 text-emerald-700">
        <span className="text-2xl">✓</span>
        <span className="font-semibold">{t.existingFeatureBills}</span>
      </li>
      <li className="flex items-center gap-3 text-emerald-700">
        <span className="text-2xl">✓</span>
        <span className="font-semibold">{t.existingFeatureEdit}</span>
      </li>
      <li className="flex items-center gap-3 text-emerald-700">
        <span className="text-2xl">✓</span>
        <span className="font-semibold">{t.existingFeatureExport}</span>
      </li>
      <li className="flex items-center gap-3 text-emerald-700">
        <span className="text-2xl">✓</span>
        <span className="font-semibold">{t.existingFeatureMaps}</span>
      </li>
    </ul>

    <button className="relative group/btn w-full overflow-hidden text-white font-bold rounded-xl text-lg px-6 py-4 transition-all duration-300 shadow-lg hover:shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 group-hover/btn:from-emerald-700 group-hover/btn:via-teal-700 group-hover/btn:to-cyan-700 transition duration-300"></div>
      <span className="relative flex items-center justify-center gap-2">
        📋 {t.seeExistingFiles}
      </span>
    </button>
  </div>
</div>

        </div>

        {/* User Info Section */}
        <div className="relative bg-gradient-to-r from-green-100/50 to-emerald-100/50 rounded-3xl border-2 border-green-200 backdrop-blur-md p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-bold text-green-700 mb-2">BUSINESS NAME</p>
              <p className="text-2xl font-black text-green-700">{user.business_name}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-green-700 mb-2">DISTRICT</p>
              <p className="text-xl font-bold text-green-700">{user.district}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-green-700 mb-2">TALUKA</p>
              <p className="text-xl font-bold text-green-700">{user.taluka}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-green-700 mb-2">STATUS</p>
              <p className="text-xl font-bold">
                <span className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-bold">
                  ✓ Active
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardPageContent />
    </ProtectedRoute>
  );
}
