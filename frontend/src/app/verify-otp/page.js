'use client';

import { useState, useContext } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LangContext } from '../layout';

export default function VerifyOtpPage() {
  const { t } = useContext(LangContext);
  const searchParams = useSearchParams();
  const router = useRouter();

  const target = searchParams.get('target');
  const [otp, setOtp] = useState('');
  const [msg, setMsg] = useState('');

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('http://localhost:5006/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, otp }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Invalid OTP');
      setMsg(t.verifiedOtp);
      setTimeout(() => router.push('/'), 1200);
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white rounded shadow w-full max-w-md">
        <h2 className="text-xl font-semibold mb-2">{t.verifyOtp}</h2>
        <p className="text-sm mb-4">
          {t.otpSentTo} <strong>{target}</strong>
        </p>
        <form onSubmit={submit}>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder={t.enterOtp}
            className="w-full p-3 border rounded mb-3"
          />
          <div className="mt-4 flex flex-col space-y-2">          <button
            type="submit"
            className="text-white bg-gradient-to-r from-cyan-400 to-cyan-600 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
          >
            {t.verify}
          </button></div>

        </form>
        {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
      </div>
    </div>
  );
}
