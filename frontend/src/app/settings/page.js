'use client';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';
import { LangContext } from '../layout';
import ProtectedRoute from '@/components/ProtectedRoute';

function HomePageContent() {
      const { t } = useContext(LangContext);
      const router = useRouter();
  const handleNavigate = (path) => {
    router.push(path);
  };

const sections = [
  {
    title: t.products,
    description: t.descProducts,
    buttonText: t.btnProduct,
    route: '/products',
    emoji: '🛍️',
    color: 'from-blue-50 to-cyan-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    buttonColor: 'from-blue-600 to-cyan-600',
    buttonHover: 'hover:from-blue-700 hover:to-cyan-700',
  },
  {
    title: t.bills,
    description: t.descBills,
    buttonText: t.btnBills,
    route: '/bill',
    emoji: '📋',
    color: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    buttonColor: 'from-green-600 to-emerald-600',
    buttonHover: 'hover:from-green-700 hover:to-emerald-700',
  },
];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      {/* Background animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">


        {/* Settings Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sections.map((sec, idx) => (
            <div 
              key={idx} 
              className={`group relative bg-gradient-to-br ${sec.color} rounded-3xl shadow-2xl border-2 ${sec.borderColor} backdrop-blur-md overflow-hidden p-8 cursor-pointer hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2`}
            >
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10 pointer-events-none"></div>
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-40 h-2 bg-gradient-to-r from-transparent via-white to-transparent rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity"></div>

              <div className="relative z-10">
                {/* Emoji Icon */}
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">{sec.emoji}</div>

                {/* Title */}
                <h2 className={`text-3xl font-black ${sec.textColor} mb-2 leading-tight`}>
                  {sec.title}
                </h2>

                {/* Description */}
                <p className={`${sec.textColor} font-medium text-base mb-6 opacity-80`}>
                  {sec.description}
                </p>

                {/* Divider */}
                <div className={`h-1 bg-gradient-to-r ${sec.buttonColor} rounded-full mb-6 w-1/3`}></div>

                {/* Button */}
                <button
                  onClick={() => handleNavigate(sec.route)}
                  className={`relative group/btn w-full overflow-hidden text-white font-bold rounded-xl text-lg px-6 py-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${sec.buttonColor} ${sec.buttonHover} transition duration-300`}></div>
                  <span className="relative flex items-center justify-center gap-2">
                    → {sec.buttonText}
                  </span>
                </button>
              </div>
            </div>
          ))}
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

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomePageContent />
    </ProtectedRoute>
  );
}
