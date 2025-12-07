'use client';
import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { LangContext } from '../layout';
import { API_BASE } from '@/lib/utils';

export default function Forgot() {
  const { t } = useContext(LangContext);
  const router = useRouter();
  const [target, setTarget] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestOtp(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`${API_BASE}/auth/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed');
      setMsg(d.message || 'OTP sent');
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      {/* Background animation container - Clipped to prevent overflow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Background animated elements - Inside clipped container */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/3 -right-32 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: '4s' }}></div>
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '3s' }}></div>
      </div>

      <form
        onSubmit={requestOtp}
        className="relative w-full max-w-2xl z-10"
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

          <div className="relative z-10">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 mb-2 leading-tight">
                {t.forgotPassword || 'Forgot Password'}
              </h2>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-grow h-1 bg-gradient-to-r from-green-400 to-transparent rounded-full"></div>
              </div>
              <p className="text-green-800 font-medium text-sm">Enter your email or mobile to receive an OTP</p>
            </div>

            {/* Email/Mobile Input */}
            <div className="relative group mb-6">
              <label className="text-xs font-bold text-green-700 mb-2 block">Email / Mobile</label>
              <div className="relative">
                <input
                  placeholder="Email or mobile"
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  className="input-enhanced-green"
                  required
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-400 group-focus-within:text-green-600 transition">
                  📧
                </div>
              </div>
            </div>

            {/* Send OTP Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative group overflow-hidden w-full text-white font-bold rounded-xl text-base px-6 py-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mb-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 group-hover:from-green-700 group-hover:via-emerald-700 group-hover:to-teal-700 transition duration-300"></div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300 animate-pulse-glow" style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              }}></div>
              <span className="relative flex items-center justify-center gap-2">
                {loading ? '⏳ Sending...' : '🚀 Send OTP'}
              </span>
            </button>

            {/* Back to Login Button */}
            <button
              type="button"
              onClick={() => router.push('/')}
              className="relative group overflow-hidden w-full text-white font-bold rounded-xl text-base px-6 py-4 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 group-hover:from-green-600 group-hover:to-emerald-600 transition duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition duration-300"></div>
              <span className="relative flex items-center justify-center gap-2">
                ← Back to Login
              </span>
            </button>

            {/* Error/Success Message */}
            {msg && (
              <div className={`mt-6 p-4 border-l-4 rounded-lg animate-pulse-error ${msg.includes('OTP') || msg.includes('sent') ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                <p className={`${msg.includes('OTP') || msg.includes('sent') ? 'text-green-700' : 'text-red-700'} font-semibold text-sm`}>
                  {msg.includes('OTP') || msg.includes('sent') ? '✅' : '⚠️'} {msg}
                </p>
              </div>
            )}

            {/* Terms */}
            <p className="text-center text-xs text-green-700 mt-6 font-medium">
              By requesting an OTP, you agree to our <span className="text-green-600 font-bold cursor-pointer hover:underline">Terms of Service</span>
            </p>
          </div>
        </div>
      </form>

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
