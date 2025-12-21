// // frontend/pages/register.js

// import Layout from '../components/Layout';
// import { useState } from 'react';
// import Router from 'next/router';

// export default function Register() {
//   const [form, setForm] = useState({
//     name:'', business_name:'', email:'', mobile:'', short_address:'',
//     district:'', taluka:'', bank_name:'', account_name:'', account_number:'',
//     ifsc:'', gst_no:'', gst_state:'', password:''
//   });
//   const [loading, setLoading] = useState(false);
//   const [msg, setMsg] = useState('');

//   const handle = (e) => setForm({...form, [e.target.name]: e.target.value});

//   const submit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMsg('');
//     try {
//       const res = await fetch('http://localhost:5006/auth/register', {
//         method: 'POST',
//         headers: { 'Content-Type':'application/json' },
//         body: JSON.stringify(form)
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || 'Failed');
//       setMsg(data.message);
//       // redirect to OTP verify page with email/mob
//       Router.push('/verify-otp?target=' + encodeURIComponent(form.email));
//     } catch (err) {
//       setMsg(err.message);
//     } finally { setLoading(false); }
//   };

//   return (
//             <Layout>
//     <div className="min-h-screen flex items-center justify-center bg-gray-50">
//       <form onSubmit={submit} className="bg-white p-8 rounded shadow w-full max-w-xl">
//         <h2 className="text-2xl font-semibold mb-4">Register</h2>
//         {/* inputs (required ones shown) */}
//         <div className="grid grid-cols-2 gap-3">
//           <input name="name" onChange={handle} value={form.name} placeholder="Full name" className="input" required />
//           <input name="business_name" onChange={handle} value={form.business_name} placeholder="Business name" className="input" required />
//           <input name="email" onChange={handle} value={form.email} placeholder="Email" className="input" required />
//           <input name="mobile" onChange={handle} value={form.mobile} placeholder="Mobile (10-digit)" className="input" required />
//           <input name="district" onChange={handle} value={form.district} placeholder="District" className="input" required />
//           <input name="taluka" onChange={handle} value={form.taluka} placeholder="Taluka / Jurisdiction" className="input" required />
//           <input name="gst_no" onChange={handle} value={form.gst_no} placeholder="GST No" className="input" required />
//           <input name="gst_state" onChange={handle} value={form.gst_state} placeholder="GST State" className="input" required />
//           <input name="password" type="password" onChange={handle} value={form.password} placeholder="Password" className="input col-span-2" required />
//           <input name="short_address" onChange={handle} value={form.short_address} placeholder="Short address" className="input col-span-2" />
//           <input name="bank_name" onChange={handle} value={form.bank_name} placeholder="Bank name" className="input" />
//           <input name="account_name" onChange={handle} value={form.account_name} placeholder="A/c name" className="input" />
//           <input name="account_number" onChange={handle} value={form.account_number} placeholder="A/c no" className="input" />
//           <input name="ifsc" onChange={handle} value={form.ifsc} placeholder="IFSC" className="input" />
//         </div>

//         <div className="mt-4 flex flex-col space-y-2">
//   <button className="text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">
//     Register & Send OTP
//   </button>
//   <button
//     type="button"
//     className="text-white bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-teal-300 dark:focus:ring-teal-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
//      onClick={() => Router.push('/login')}
//   >
//     Already have an account? Login
//   </button>
// </div>

//         {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
//         <style jsx>{`
//           .input { border:1px solid #e5e7eb; padding:10px; border-radius:6px; }
//         `}</style>
//       </form>
//     </div>


//     </Layout>
//   );

// }


'use client';

import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LangContext } from '../layout';
import { API_BASE } from '@/lib/utils';
import { districtsEn, districtsMr } from '@/lib/districts';
import { states } from '@/lib/states';


export default function RegisterPage() {
  const { t, lang, toggleLang } = useContext(LangContext);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Force Marathi language for registration on mount
  useEffect(() => {
    setMounted(true);
    if (lang !== 'mr') {
      toggleLang();
    }
  }, []); // Run only on mount

  // Ensure Marathi is set when language changes
  useEffect(() => {
    if (mounted && lang !== 'mr') {
      toggleLang();
    }
  }, [lang, mounted, toggleLang]);

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
    bank_branch: '',
    gst_no: '',
    gst_state: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  // const [showOtpModal, setShowOtpModal] = useState(false);
  // const [otp, setOtp] = useState('');
  // const [otpLoading, setOtpLoading] = useState(false);
  // const [otpMsg, setOtpMsg] = useState('');
  // const [registeredEmail, setRegisteredEmail] = useState('');

  // Load districts based on language
  useEffect(() => {
    if (lang === 'mr') {
      setDistricts(districtsMr);
    } else {
      setDistricts(districtsEn);
    }
  }, [lang]);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // ✅ If district changes, populate talukas
    if (name === 'district') {
      const selectedDistrict = districts.find(d => d.name === value);
      if (selectedDistrict) {
        setTalukas(selectedDistrict.tahasil);
        setForm(prev => ({ ...prev, taluka: '' })); // reset taluka
      }
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || 'Failed to register';
        // Show error in alert
        alert(`${lang === 'mr' ? '⚠️ त्रुटी' : '⚠️ Error'}\n${errorMsg}`);
        throw new Error(errorMsg);
      }
      // Show success alert and redirect to login
      const successMsg = lang === 'mr' ? '✅ नोंदणी यशस्वी!\n\nलॉगिन पृष्ठावर पुनः दिशित केले जात आहे...' : '✅ Registration Successful!\n\nRedirecting to login...';
      alert(successMsg);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // const verifyOtp = async (e) => {
  //   e.preventDefault();
  //   setOtpLoading(true);
  //   setOtpMsg('');
  //   try {
  //     const res = await fetch(`${API_BASE}/auth/verify-otp`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ target: registeredEmail, otp }),
  //     });
  //     const data = await res.json();
  //     if (!res.ok) throw new Error(data.error || 'Invalid OTP');
  //     setOtpMsg('✅ ' + (t.verifiedOtp || 'OTP verified successfully!'));
  //     setTimeout(() => {
  //       setShowOtpModal(false);
  //       router.push('/dashboard');
  //     }, 1500);
  //   } catch (err) {
  //     setOtpMsg('⚠️ ' + err.message);
  //   } finally {
  //     setOtpLoading(false);
  //   }
  // };

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
        onSubmit={submit}
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
                {t.register}
              </h2>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-grow h-1 bg-gradient-to-r from-green-400 to-transparent rounded-full"></div>
              </div>
              <p className="text-green-800 font-medium text-sm">Create your account to get started</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input name="name" onChange={handle} value={form.name} placeholder={t.fullName} className="input-enhanced-green" required />
              <input name="business_name" onChange={handle} value={form.business_name} placeholder={t.businessName} className="input-enhanced-green" required />
              <input name="email" onChange={handle} value={form.email} placeholder={t.email} className="input-enhanced-green" required />
              <input name="mobile" onChange={handle} value={form.mobile} placeholder={t.mobile + ' (10-digit)'} className="input-enhanced-green" required />
              
              <select name="district" onChange={handle} value={form.district} className="input-enhanced-green" required>
                <option value="">{t.district}</option>
                {districts.map(d => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>

              <select name="taluka" onChange={handle} value={form.taluka} className="input-enhanced-green" required>
                <option value="">Select Taluka</option>
                {talukas.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <input name="gst_no" onChange={handle} value={form.gst_no} placeholder={t.gstNo} className="input-enhanced-green" required />
              <select name="gst_state" onChange={handle} value={form.gst_state} className="input-enhanced-green" required>
                <option value="">{t.gstState || 'Select GST State'}</option>
                {states.map(state => (
                  <option key={state.key} value={`${state.key} - ${state.name}`}>{state.key} - {state.name}</option>
                ))}
              </select>
              <input name="password" type="password" onChange={handle} value={form.password} placeholder={t.password} className="input-enhanced-green col-span-2" required />
              <input name="short_address" onChange={handle} value={form.short_address} placeholder={t.shortAddress} className="input-enhanced-green col-span-2" />
              <input name="bank_name" onChange={handle} value={form.bank_name} placeholder={t.bankName} className="input-enhanced-green" />
              <input name="account_name" onChange={handle} value={form.account_name} placeholder={t.accountName} className="input-enhanced-green" />
              <input name="account_number" onChange={handle} value={form.account_number} placeholder={t.accountNumber} className="input-enhanced-green" />
              <input name="ifsc" onChange={handle} value={form.ifsc} placeholder={t.ifsc} className="input-enhanced-green" />
              <input name="bank_branch" onChange={handle} value={form.bank_branch} placeholder={t.branch || 'Bank Branch'} className="input-enhanced-green col-span-1 md:col-span-2" />
            </div>

            {/* Buttons */}
            <div className="mt-8 flex flex-col space-y-3">
              {/* Register Button */}
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
                  {loading ? '⏳ ' + t.waitRegister : '🚀 ' + (t.sendOtp || 'Register Now')}
                </span>
              </button>

              {/* Login Button */}
              <button
                type="button"
                onClick={() => router.push('/')}
                className="relative group overflow-hidden w-full text-white font-bold rounded-xl text-base px-6 py-4 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 group-hover:from-green-600 group-hover:to-emerald-600 transition duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition duration-300"></div>
                <span className="relative flex items-center justify-center gap-2">
                  ← {t.alreadyAccount}
                </span>
              </button>
            </div>

            {/* Terms */}
            <p className="text-center text-xs text-green-700 mt-6 font-medium">
              By registering, you agree to our <span className="text-green-600 font-bold cursor-pointer hover:underline">Terms of Service</span>
            </p>
          </div>
        </div>
      </form>


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
