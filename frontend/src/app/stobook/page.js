'use client';

import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { LangContext } from '../layout';
import ProtectedRoute from '@/components/ProtectedRoute';

function StobookPageContent() {
  const { t } = useContext(LangContext);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
      {/* Background animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Coming Soon Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          {/* Header with gradient */}
          <div className="h-32 bg-gradient-to-r from-rose-500 to-orange-500 flex items-center justify-center">
            <div className="text-6xl">📚</div>
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              {t.stobookManagement || 'Stock book Management'}
            </h1>

            <p className="text-xl font-semibold text-rose-600 mb-4">
              {t.comingSoon || 'Coming Soon'}
            </p>

            <p className="text-gray-600 mb-6 leading-relaxed">
              {t.stobookComingSoonDesc || 'We are working on something amazing! Stock and inventory management will be available very soon.'}
            </p>

            {/* Feature Preview */}
            <div className="space-y-3 mb-8 text-left">
              <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-lg">
                <span className="text-2xl">📦</span>
                <span className="text-gray-700">{t.stobookFeature1 || 'Manage Stock'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                <span className="text-2xl">📊</span>
                <span className="text-gray-700">{t.stobookFeature2 || 'Track Inventory'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <span className="text-2xl">📈</span>
                <span className="text-gray-700">{t.stobookFeature3 || 'Analytics & Reports'}</span>
              </div>
            </div>

            {/* Bottom line */}
            <p className="text-xs text-gray-500 mb-6">
              {t.stayTuned || 'Stay tuned for updates!'}
            </p>

            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="w-full px-4 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold rounded-lg hover:from-rose-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
            >
              {t.goBack || 'Go Back'}
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">
            {t.contactUs || 'Questions? Feel free to contact us'}
          </p>
          <div className="flex gap-3 justify-center">
            <a href="mailto:support@example.com" className="text-rose-600 hover:text-rose-700 font-medium">
              {t.email || 'Email'}
            </a>
            <span className="text-gray-400">•</span>
            <a href="tel:+919999999999" className="text-rose-600 hover:text-rose-700 font-medium">
              {t.support || 'Support'}
            </a>
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

export default function StobookPage() {
  return (
    <ProtectedRoute>
      <StobookPageContent />
    </ProtectedRoute>
  );
}
