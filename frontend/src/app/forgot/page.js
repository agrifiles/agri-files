// frontend/pages/forgot.js
import { useState } from 'react';
export default function Forgot(){
  const [target,setTarget] = useState('');
  const [msg,setMsg] = useState('');
  async function requestOtp(e){
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5006/auth/forgot', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ target })
      });
      const d = await res.json();
      if(!res.ok) throw new Error(d.error || 'Failed');
      setMsg(d.message || 'OTP sent.');
      // redirect to verify-otp page for reset scenario
    } catch(err){ setMsg(err.message); }
  }
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={requestOtp} className="bg-white p-6 rounded shadow w-full max-w-md">
        <h3 className="text-lg mb-3">Forgot password</h3>
        <input className="w-full p-3 border rounded mb-3" placeholder="Email or mobile" value={target} onChange={e=>setTarget(e.target.value)} />
        <button className="w-full p-3 bg-indigo-600 text-white rounded">Send OTP</button>
        {msg && <p className="mt-3 text-sm">{msg}</p>}
      </form>
    </div>
  );
}
