'use client';

import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LangContext } from '../layout';
import { API_BASE, getCurrentUser } from '@/lib/utils';
import { districtsEn, districtsMr } from '@/lib/districts';
import { states } from '@/lib/states';

function ProfileContent() {
  const { t, lang } = useContext(LangContext);
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    business_name: '',
    email: '',
    mobile: '',
    short_address: '',
    district: '',
    taluka: '',
    bank_name: '',
    account_name: '',
    account_number: '',
    ifsc: '',
    gst_no: '',
    gst_state: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [editMode, setEditMode] = useState(false);

  // Load districts based on language
  useEffect(() => {
    if (lang === 'mr') {
      setDistricts(districtsMr);
    } else {
      setDistricts(districtsEn);
    }
  }, [lang]);

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = getCurrentUser();
        if (user && user.id) {
          const res = await fetch(`${API_BASE}/auth/profile/${user.id}`, {
            headers: { 'Content-Type': 'application/json' },
          });
          const data = await res.json();
          if (res.ok) {
            setForm(data.user || {});
            // Load talukas for the district if available
            if (data.user?.district) {
              const selectedDistrict = districts.find(d => d.name === data.user.district);
              if (selectedDistrict) {
                setTalukas(selectedDistrict.tahasil);
              }
            }
          } else {
            setMsg('Error: ' + (data.error || 'Failed to load profile'));
          }
        }
      } catch (err) {
        console.error('Profile load error:', err);
        setMsg('Error loading profile: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (districts.length > 0) {
      loadProfile();
    }
  }, [districts]);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === 'district') {
      const selectedDistrict = districts.find(d => d.name === value);
      if (selectedDistrict) {
        setTalukas(selectedDistrict.tahasil);
        setForm(prev => ({ ...prev, taluka: '' }));
      }
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const user = getCurrentUser();
      const res = await fetch(`${API_BASE}/auth/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setMsg('✅ Profile updated successfully!');
      setEditMode(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('⚠️ ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-green-700 font-semibold">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      {/* Background animation container - Clipped to prevent overflow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/3 -right-32 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 mb-2">
            My Profile
          </h1>
          <p className="text-green-700 font-medium">Manage your account information</p>
        </div>

        {/* Main Card */}
        <div className="relative bg-gradient-to-br from-green-50 via-green-50 to-emerald-50 rounded-3xl shadow-2xl border-2 border-green-200 backdrop-blur-md overflow-hidden p-8">
          {/* Animated glow background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 via-transparent to-emerald-100/20 pointer-events-none"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-green-400/20 via-emerald-400/20 to-teal-400/20 rounded-3xl blur-lg opacity-0 animate-pulse" style={{ animationDuration: '3s' }}></div>

          {/* Animated top accent */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-full blur-xl opacity-60"></div>

          <div className="relative z-10">
            {/* Edit/Save Button */}
            <div className="flex justify-end mb-6">
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="relative group overflow-hidden px-6 py-2 text-white font-bold rounded-xl text-sm transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 group-hover:from-green-700 group-hover:via-emerald-700 group-hover:to-teal-700 transition duration-300"></div>
                  <span className="relative flex items-center justify-center gap-2">
                    ✏️ Edit Profile
                  </span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-6 py-2 text-green-700 font-bold rounded-xl text-sm border-2 border-green-400 hover:bg-green-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={saving}
                    className="relative group overflow-hidden px-6 py-2 text-white font-bold rounded-xl text-sm transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 group-hover:from-green-700 group-hover:via-emerald-700 group-hover:to-teal-700 transition duration-300"></div>
                    <span className="relative flex items-center justify-center gap-2">
                      {saving ? '💾 Saving...' : '💾 Save Changes'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Message */}
            {msg && (
              <div className={`mb-6 p-4 border-l-4 rounded-lg text-sm font-semibold ${
                msg.includes('✅') ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'
              }`}>
                {msg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={submit} className="space-y-6">
              {/* Section 1: Personal Info */}
              <div>
                <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                  👤 Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-green-700 mb-2 block">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handle}
                      disabled={!editMode}
                      className={`input-enhanced-green ${!editMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-green-700 mb-2 block">Mobile</label>
                    <input
                      type="text"
                      name="mobile"
                      value={form.mobile}
                      disabled={true}
                      className="input-enhanced-green opacity-60 cursor-not-allowed bg-gray-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-green-700 mb-2 block">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      disabled={true}
                      className="input-enhanced-green opacity-60 cursor-not-allowed bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Business Info */}
              <div>
                <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                  🏢 Business Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-green-700 mb-2 block">Business Name</label>
                    <input
                      type="text"
                      name="business_name"
                      value={form.business_name}
                      onChange={handle}
                      disabled={!editMode}
                      className={`input-enhanced-green ${!editMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-green-700 mb-2 block">Short Address</label>
                    <input
                      type="text"
                      name="short_address"
                      value={form.short_address}
                      onChange={handle}
                      disabled={!editMode}
                      className={`input-enhanced-green ${!editMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-green-700 mb-2 block">District</label>
                    {editMode ? (
                      <select
                        name="district"
                        value={form.district}
                        onChange={handle}
                        className="input-enhanced-green"
                      >
                        <option value="">Select District</option>
                        {districts.map(d => (
                          <option key={d.name} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="input-enhanced-green opacity-60 cursor-not-allowed flex items-center">
                        {form.district || 'Not set'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-green-700 mb-2 block">Taluka</label>
                    {editMode ? (
                      <select
                        name="taluka"
                        value={form.taluka}
                        onChange={handle}
                        className="input-enhanced-green"
                      >
                        <option value="">Select Taluka</option>
                        {talukas.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="input-enhanced-green opacity-60 cursor-not-allowed flex items-center">
                        {form.taluka || 'Not set'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: GST Info */}
              <div>
                <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                  🏛️ GST Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-green-700 mb-2 block">GST No</label>
                    <input
                      type="text"
                      name="gst_no"
                      value={form.gst_no}
                      onChange={handle}
                      disabled={!editMode}
                      className={`input-enhanced-green ${!editMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-green-700 mb-2 block">GST State</label>
                    <select
                      name="gst_state"
                      value={form.gst_state}
                      onChange={handle}
                      disabled={!editMode}
                      className={`input-enhanced-green ${!editMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <option value="">Select State</option>
                      {states.map(state => (
                        <option key={state.key} value={`${state.key} - ${state.name}`}>{state.key} - {state.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Bank Info */}
              <div>
                <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                  🏦 Bank Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-green-700 mb-2 block">Bank Name</label>
                    <input
                      type="text"
                      name="bank_name"
                      value={form.bank_name}
                      onChange={handle}
                      disabled={!editMode}
                      className={`input-enhanced-green ${!editMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-green-700 mb-2 block">Account Holder Name</label>
                    <input
                      type="text"
                      name="account_name"
                      value={form.account_name}
                      onChange={handle}
                      disabled={!editMode}
                      className={`input-enhanced-green ${!editMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-green-700 mb-2 block">Account Number</label>
                    <input
                      type="text"
                      name="account_number"
                      value={form.account_number}
                      onChange={handle}
                      disabled={!editMode}
                      className={`input-enhanced-green ${!editMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-green-700 mb-2 block">IFSC Code</label>
                    <input
                      type="text"
                      name="ifsc"
                      value={form.ifsc}
                      onChange={handle}
                      disabled={!editMode}
                      className={`input-enhanced-green ${!editMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              {editMode && (
                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="relative group overflow-hidden flex-1 text-white font-bold rounded-xl text-base px-6 py-4 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 group-hover:from-green-700 group-hover:via-emerald-700 group-hover:to-teal-700 transition duration-300"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300 animate-pulse-glow" style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    }}></div>
                    <span className="relative flex items-center justify-center gap-2">
                      {saving ? '⏳ Saving...' : '💾 Save All Changes'}
                    </span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .input-enhanced-green {
          width: 100%;
          border: 2px solid #86efac;
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 14px;
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

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.3;
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

export default function ProfilePage(props) {
  return (
    <ProtectedRoute>
      <ProfileContent {...props} />
    </ProtectedRoute>
  );
}
