'use client';

import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { LangContext } from './layout';
import {API_BASE} from '../lib/utils'

export default function LoginPage() {
  const { t } = useContext(LangContext);
  const router = useRouter();

  const [form, setForm] = useState({ username: '', password: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={submit}
        className="bg-white p-8 rounded shadow w-full max-w-md"
      >
        <h2 className="text-2xl font-semibold mb-4">{t.login}</h2>

        <input
          name="username"
          placeholder={t.email + ' / ' + t.mobile}
          value={form.username}
          onChange={handle}
          className="input mb-3"
          required
        />

        <input
          type="password"
          name="password"
          placeholder={t.password}
          value={form.password}
          onChange={handle}
          className="input mb-3"
          required
        />

        <div className="mt-4 flex flex-col space-y-2">
          <button
            type="submit"
            disabled={loading}
            className="text-white bg-gradient-to-r from-cyan-400 to-cyan-600 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
          >
            {loading ? t.waitLogin : t.login}
          </button>

          <button
            type="button"
            onClick={() => router.push('/register')}
            className="text-white bg-gradient-to-r from-teal-400 to-teal-600 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
          >
            {t.noAccount}
          </button>
        </div>

        {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
      </form>

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          padding: 10px;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}
