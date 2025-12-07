'use client';

import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LangContext } from './layout';
import { API_BASE, getCurrentUser } from '../lib/utils'

export default function LoginPage() {
  const { t } = useContext(LangContext);
  const router = useRouter();

  const [form, setForm] = useState({ username: '', password: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      // User is already logged in, redirect to dashboard
      router.push('/dashboard');
    }
  }, [router]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to login');

      // save user info for dashboard
localStorage.setItem("user", JSON.stringify(data.user));

// redirect to dashboard
router.push("/dashboard");

    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="flex w-full max-w-5xl gap-8 lg:gap-12">
        
        {/* Left Side - Welcome Section */}
        <div className="hidden lg:flex flex-col justify-center w-1/2">
          <div className="space-y-6">
            <div className="relative">
              {/* Animated background blob */}
              <div className="absolute -inset-4 bg-gradient-to-r from-green-200 to-blue-200 rounded-3xl opacity-0 blur-2xl animate-pulse" style={{ animationDuration: '4s' }}></div>
              
              {/* Main heading with animated text */}
              <div className="relative">
                <div className="animated-title mb-4">
                  <h1 className="text-5xl font-bold py-3  text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600">
                    {t.welcomeTitle}
                  </h1>
                </div>
                <div className="animated-title" style={{ animationDelay: '0.2s' }}>
<h1
  className="text-6xl text-right py-3 my-6 font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500 animate-bounce"
  style={{ animationDuration: '2s' }}
>
  {t.welcomeBrand}
</h1>


                </div>
              </div>
              
              <div className="mt-6 pb-4">
                <p className="text-2xl text-gray-700 font-semibold leading-tight">
                  {t.welcomeSubtitle}
                </p>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute bottom-0 right-20 w-20 h-20 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" style={{ animationDelay: '2s' }}></div>
              <div className="absolute -left-8 bottom-20 w-20 h-20 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" style={{ animationDelay: '4s' }}></div>
            </div>

            {/* Feature cards with animation */}
            <div className="space-y-4 pt-6">
              <div className="feature-card">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="icon-box">
                      <span className="text-2xl">📋</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{t.farmManagement}</h3>
                    <p className="text-gray-600">{t.farmManagementDesc}</p>
                  </div>
                </div>
              </div>

              <div className="feature-card" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="icon-box">
                      <span className="text-2xl">📊</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{t.billTracking}</h3>
                    <p className="text-gray-600">{t.billTrackingDesc}</p>
                  </div>
                </div>
              </div>

              <div className="feature-card" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="icon-box">
                      <span className="text-2xl">📦</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{t.productInventory}</h3>
                    <p className="text-gray-600">{t.productInventoryDesc}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-300">
              <p className="text-gray-700">
                <span className="font-semibold">{t.getStarted}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 relative overflow-visible">
          {/* Background animated elements - Larger and more visible */}
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/3 -right-32 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: '4s' }}></div>
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '3s' }}></div>

          <form
            onSubmit={submit}
            className="relative w-full max-w-2xl"
          >
            {/* Form container with gradient - Enhanced with glow effect */}
            <div className="relative bg-gradient-to-br from-green-50 via-green-50 to-emerald-50 p-12 rounded-3xl shadow-2xl border-2 border-green-200 backdrop-blur-md overflow-hidden">
              {/* Animated glow background */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 via-transparent to-emerald-100/20 pointer-events-none"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400/20 via-emerald-400/20 to-teal-400/20 rounded-3xl blur-lg opacity-0 animate-pulse" style={{ animationDuration: '3s' }}></div>
              {/* Animated top accent - More prominent */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-full blur-xl opacity-60"></div>
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-green-300 via-emerald-300 to-cyan-300 rounded-full blur-lg opacity-40 animate-pulse" style={{ animationDuration: '2s' }}></div>

              {/* Decorative corner elements - Enhanced */}
              <div className="absolute top-6 right-6 w-4 h-4 bg-green-400 rounded-full opacity-80 animate-pulse" style={{ animationDuration: '1.5s' }}></div>
              <div className="absolute top-14 right-4 w-3 h-3 bg-emerald-300 rounded-full opacity-60 animate-pulse" style={{ animationDuration: '2s' }}></div>
              <div className="absolute bottom-6 left-6 w-4 h-4 bg-emerald-400 rounded-full opacity-80 animate-pulse" style={{ animationDuration: '1.8s' }}></div>
              <div className="absolute bottom-12 right-8 w-2 h-2 bg-teal-400 rounded-full opacity-70 animate-pulse" style={{ animationDuration: '2.5s' }}></div>
              <div className="absolute top-1/2 -right-2 w-2 h-2 bg-green-500 rounded-full opacity-60 animate-pulse" style={{ animationDuration: '1.2s' }}></div>

              <div className="relative z-10">
                {/* Header */}
                <div className="mb-8">
                  <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 mb-2 leading-tight">
                    {t.login}
                  </h2>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-grow h-1 bg-gradient-to-r from-green-400 to-transparent rounded-full"></div>
                  </div>
                  <p className="text-green-800 font-medium text-sm">Enter your credentials to access AgriFiles</p>
                </div>

                <div className="space-y-4">
                  {/* Email/Mobile Input */}
                  <div className="relative group">
                    <label className="text-xs font-bold text-green-700 mb-2 block">Email / Mobile</label>
                    <div className="relative">
                      <input
                        name="username"
                        placeholder={t.email + ' / ' + t.mobile}
                        value={form.username}
                        onChange={handle}
                        className="input-enhanced-green"
                        required
                      />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-400 group-focus-within:text-green-600 transition">
                        📧
                      </div>
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="relative group">
                    <label className="text-xs font-bold text-green-700 mb-2 block">Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        name="password"
                        placeholder={t.password}
                        value={form.password}
                        onChange={handle}
                        className="input-enhanced-green"
                        required
                      />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-400 group-focus-within:text-green-600 transition">
                        🔒
                      </div>
                    </div>
                  </div>

                  {/* Remember & Forgot */}
                  <div className="flex items-center justify-between text-sm pt-1 pb-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-2 border-green-300 text-green-600 cursor-pointer accent-green-600" />
                      <span className="text-green-800 font-medium group-hover:text-green-700 transition">Remember me</span>
                    </label>
                    <button type="button" onClick={() => router.push('/forgot')} className="text-green-600 hover:text-green-700 font-bold hover:underline transition text-xs">
                      Forgot password?
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="mt-8 flex flex-col space-y-3">
                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative group overflow-hidden w-full text-white font-bold rounded-xl text-base px-6 py-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 group-hover:from-green-700 group-hover:via-emerald-700 group-hover:to-teal-700 transition duration-300"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300 animate-pulse-glow" style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    }}></div>
                    <span className="relative flex items-center justify-center gap-2">
                      {loading ? '⏳ ' + t.waitLogin : '🚀 ' + t.login}
                    </span>
                  </button>

                  {/* Register Button */}
                  <button
                    type="button"
                    onClick={() => router.push('/register')}
                    className="relative group overflow-hidden w-full text-white font-bold rounded-xl text-base px-6 py-4 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 group-hover:from-green-600 group-hover:to-emerald-600 transition duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition duration-300"></div>
                    <span className="relative flex items-center justify-center gap-2">
                      ✨ {t.noAccount}
                    </span>
                  </button>
                </div>

                {/* Error Message */}
                {msg && (
                  <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-pulse-error">
                    <p className="text-red-700 font-semibold text-sm">⚠️ {msg}</p>
                  </div>
                )}

                {/* Terms */}
                <p className="text-center text-xs text-green-700 mt-6 font-medium">
                  By logging in, you agree to our <span className="text-green-600 font-bold cursor-pointer hover:underline">Terms of Service</span>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .input-enhanced-green {
          width: 100%;
          border: 2px solid #86efac;
          padding: 14px 44px 14px 16px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          color: #065f46;
        }

        .input-enhanced-green:focus {
          outline: none;
          border-color: #16a34a;
          box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.2), inset 0 2px 4px rgba(22, 163, 74, 0.1);
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
        }

        .input-enhanced-green::placeholder {
          color: #047857;
          font-weight: 600;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-pulse-error {
          animation: pulse-error 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.3;
          }
        }

        @keyframes pulse-error {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animated-title {
          animation: slideInDown 0.8s ease-out forwards;
        }

        .animated-title h1 {
          word-break: break-word;
        }

        /* Blob animation */
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

        /* Slide in up for feature cards */
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInScale {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes iconFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .feature-card {
          animation: slideInScale 0.6s ease-out forwards;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 100%);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s ease;
        }

        .feature-card:hover::before {
          left: 100%;
        }

        .feature-card:hover {
          transform: translateX(8px) translateY(-4px);
          border-color: #16a34a;
          box-shadow: 0 20px 40px rgba(22, 163, 74, 0.2);
          background: linear-gradient(135deg, #dcfce7 0%, #e0f2fe 100%);
        }

        .icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          border-radius: 10px;
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          color: white;
          flex-shrink: 0;
          animation: iconFloat 3s ease-in-out infinite;
          box-shadow: 0 8px 20px rgba(22, 163, 74, 0.3);
        }

        .feature-card:hover .icon-box {
          animation: iconFloat 2s ease-in-out infinite;
          box-shadow: 0 12px 30px rgba(22, 163, 74, 0.4);
        }

        /* Gradient text animation */
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        h1.animate-bounce {
          animation: bounce 2s infinite !important;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}
