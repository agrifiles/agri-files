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

import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { LangContext } from '../layout';
import {API_BASE} from '../lib/utils'


export default function RegisterPage() {
  const { t } = useContext(LangContext);
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
    gst_state: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handle = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

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
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMsg(t.registrationSuccess);
      router.push('/verify-otp?target=' + encodeURIComponent(form.email));
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={submit}
        className="bg-white p-8 rounded shadow w-full max-w-xl"
      >
        <h2 className="text-2xl font-semibold mb-4">{t.register}</h2>

        <div className="grid grid-cols-2 gap-3">
          <input name="name" onChange={handle} value={form.name} placeholder={t.fullName} className="input" required />
          <input name="business_name" onChange={handle} value={form.business_name} placeholder={t.businessName} className="input" required />
          <input name="email" onChange={handle} value={form.email} placeholder={t.email} className="input" required />
          <input name="mobile" onChange={handle} value={form.mobile} placeholder={t.mobile + ' (10-digit)'} className="input" required />
          <input name="district" onChange={handle} value={form.district} placeholder={t.district} className="input" required />
          <input name="taluka" onChange={handle} value={form.taluka} placeholder={t.taluka} className="input" required />
          <input name="gst_no" onChange={handle} value={form.gst_no} placeholder={t.gstNo} className="input" required />
          <input name="gst_state" onChange={handle} value={form.gst_state} placeholder={t.gstState} className="input" required />
          <input name="password" type="password" onChange={handle} value={form.password} placeholder={t.password} className="input col-span-2" required />
          <input name="short_address" onChange={handle} value={form.short_address} placeholder={t.shortAddress} className="input col-span-2" />
          <input name="bank_name" onChange={handle} value={form.bank_name} placeholder={t.bankName} className="input" />
          <input name="account_name" onChange={handle} value={form.account_name} placeholder={t.accountName} className="input" />
          <input name="account_number" onChange={handle} value={form.account_number} placeholder={t.accountNumber} className="input" />
          <input name="ifsc" onChange={handle} value={form.ifsc} placeholder={t.ifsc} className="input" />
        </div>

        <div className="mt-4 flex flex-col space-y-2">
          <button
            type="submit"
            className="text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            disabled={loading}
          >
            {loading ? t.waitRegister : t.sendOtp}
          </button>

          <button
            type="button"
            className="text-white bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-teal-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            onClick={() => router.push('/')}
          >
            {t.alreadyAccount}
          </button>
        </div>

        {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}

        <style jsx>{`
          .input {
            border: 1px solid #e5e7eb;
            padding: 10px;
            border-radius: 6px;
            width: 100%;
          }
        `}</style>
      </form>
    </div>
  );
}
