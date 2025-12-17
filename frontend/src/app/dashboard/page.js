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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 py-6 px-4">
      {/* Background animation container */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          {/* <h1 className="text-2xl font-bold text-gray-800">🌾 {t.dashboard || 'डॅशबोर्ड'}</h1> */}
        </div>

        {/* Two Section Layout - Files & Quotations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">  

          {/* Files Section */}
          <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-200 shadow-lg">
            {/* Section Header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📂</span>
              <h3 className="text-lg font-bold text-green-800">{t.filesSection || 'फाईल्स (MAHADBT)'}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Card 1: New File */}
              <div
                onClick={() => router.push('/new')}
                className="group relative bg-white rounded-xl shadow-md border border-green-200 overflow-hidden p-4 cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🌱</div>
                <h2 className="text-base font-bold text-green-700 mb-1">{t.fillNewFile}</h2>
                <p className="text-xs text-gray-500 mb-3">नवीन फाईल तयार करा</p>
                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all">
                  ➕ नवीन फाईल
                </button>
              </div>

              {/* Card 2: Existing Files */}
              <div
                onClick={handleNavigateToFiles}
                className="group relative bg-white rounded-xl shadow-md border border-teal-200 overflow-hidden p-4 cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500"></div>
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📁</div>
                <h2 className="text-base font-bold text-teal-700 mb-1">{t.seeExistingFiles}</h2>
                <p className="text-xs text-gray-500 mb-3">सर्व फाईल्स पहा</p>
                <button className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-semibold py-2 rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all">
                  📋 फाईल्स पहा
                </button>
              </div>
            </div>
          </div>

          {/* Quotations Section */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200 shadow-lg">
            {/* Section Header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📋</span>
              <h3 className="text-lg font-bold text-blue-800">{t.quotationsSection || 'कोटेशन'}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Card 3: New Quotation */}
              <div
                onClick={() => router.push('/quotations/new')}
                className="group relative bg-white rounded-xl shadow-md border border-blue-200 overflow-hidden p-4 cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📝</div>
                <h2 className="text-base font-bold text-blue-700 mb-1">{t.newQuotation || 'नवीन कोटेशन'}</h2>
                <p className="text-xs text-gray-500 mb-3">अंदाजपत्रक तयार करा</p>
                <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all">
                  📝 नवीन कोटेशन
                </button>
              </div>

              {/* Card 4: Existing Quotations */}
              <div
                onClick={() => router.push('/quotations')}
                className="group relative bg-white rounded-xl shadow-md border border-purple-200 overflow-hidden p-4 cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📑</div>
                <h2 className="text-base font-bold text-purple-700 mb-1">{t.seeExistingQuotations || 'कोटेशन पहा'}</h2>
                <p className="text-xs text-gray-500 mb-3">सर्व कोटेशन यादी</p>
                <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all">
                  📑 कोटेशन पहा
                </button>
              </div>
            </div>
          </div>

        </div>
        {/* User Info Section - Stylish */}
        <div className="relative overflow-hidden rounded-2xl mt-8 shadow-xl">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600"></div>
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full"></div>
          
          <div className="relative p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="text-xl">👤</span>
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium">आपले खाते</p>
                <p className="text-white font-bold text-lg">{user.name || user.business_name}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <p className="text-white/60 text-xs font-medium mb-1">🏢 व्यवसाय</p>
                <p className="text-white font-bold text-sm truncate">{user.business_name}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <p className="text-white/60 text-xs font-medium mb-1">📍 जिल्हा</p>
                <p className="text-white font-bold text-sm">{user.district}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <p className="text-white/60 text-xs font-medium mb-1">🗺️ तालुका</p>
                <p className="text-white font-bold text-sm">{user.taluka}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <p className="text-white/60 text-xs font-medium mb-1">⚡ स्थिती</p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-400/30 text-green-100 rounded-full text-xs font-bold border border-green-400/50">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 7s infinite; }
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
