    // frontend/src/lib/utils.js
// utility helpers used across components (client-side safe)

// export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 
// 'https://agri-files.onrender.com';

export const API_BASE =  'https://agri-files.onrender.com'
/**
 * Safely read the current user object from localStorage (client-only).
 * Returns null on server or if parsing fails.
 */
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('getCurrentUser parse error', e);
    return null;
  }
}

/**
 * Return the current user id or null.
 */
export function getCurrentUserId() {
  const u = getCurrentUser();
  // adapt if your user object uses a different key (userId, _id, ID)
  return u?.id ?? u?.userId ?? u?._id ?? null;
}

/**
 * Store user object in localStorage (stringify safe).
 */
export function setCurrentUser(userObj) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('user', JSON.stringify(userObj));
  } catch (e) {
    console.warn('setCurrentUser failed', e);
  }
}

/**
 * Remove user from localStorage
 */
export function clearCurrentUser() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('user');
  } catch (e) {
    console.warn('clearCurrentUser failed', e);
  }
}

/**
 * Small fetch wrapper:
 * - uses API_BASE
 * - auto-adds JSON headers
 * - parses response as JSON when possible and throws on non-OK
 *
 * usage: await apiFetch('/api/files', { method:'POST', body: { ... } })
 */
export async function apiFetch(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const init = {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    credentials: opts.credentials ?? undefined, // use 'include' if you need cookies
    method: opts.method || 'GET',
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    ...opts,
  };

  const res = await fetch(url, init);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = null; }

  if (!res.ok) {
    const err = new Error(data?.error || res.statusText || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = data ?? text;
    throw err;
  }
  return data;
}

/**
 * Factory to return a resetForm function with default values.
 * Call: const resetForm = resetFormFactory(setForm, setShapes, setStep);
 */
export function resetFormFactory(setForm, setShapes, setStep) {
  return () => {
    setForm({
      fyYear: '', company: '', applicationId: '', farmerId: '', farmerName: '', fatherName: '',
      mobile: '', quotationNo: '', quotationDate: '', billNo: '', billDate: '', village: '',
      taluka: '', district: '', area8A: '', gutNo: '', cropName: '',
      irrigationArea: '', lateralSpacing: '', driplineProduct: '', dripperDischarge: '',
      dripperSpacing: '', planeLateralQty: '', fileDate: new Date().toISOString().split('T')[0],
      salesEngg: '', pumpType: '', twoNozzelDistance: '', w1Name: '', w1Village: '', w1Taluka: '', w1District: '',
      w2Name: '', w2Village: '', w2Taluka: '', w2District: '', place: '', billAmount: ''
    });
    setShapes?.([]);
    setStep?.(1);
  };
}
