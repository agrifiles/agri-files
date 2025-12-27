    // frontend/src/lib/utils.js
// utility helpers used across components (client-side safe)

// Dynamic API_BASE - uses localhost for local development, onrender for production
export const API_BASE = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5006'
  : 'https://agri-files.onrender.com'

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
    // Also clear user company links cache on logout
    localStorage.removeItem('userCompanyLinks');
  } catch (e) {
    console.warn('clearCurrentUser failed', e);
  }
}

/**
 * Format bill number for display: converts stored number (e.g., "01") to formatted string (e.g., "2526MAR_01")
 * @param {string} billNo - The stored bill number (e.g., "01", "02", "15")
 * @param {string|Date} billDate - The bill date (ISO string or Date object)
 * @returns {string} Formatted bill number (e.g., "2526MAR_01") or original billNo if invalid
 * 
 * Format: FYMONTH_NN where:
 * - FY: Financial year (last 2 digits of start year + last 2 digits of end year)
 *   e.g., 2025-2026 → "2526"
 * - MONTH: Month from bill_date (JAN, FEB, ..., DEC)
 * - NN: Bill sequence number (e.g., "01", "02")
 */
export function formatBillNo(billNo, billDate) {
  // Handle invalid inputs
  if (!billNo || billNo === "-" || billNo === "null") {
    return billNo || "-";
  }

  if (!billDate) {
    console.warn('formatBillNo: No billDate provided for billNo:', billNo);
    return billNo; // Return unformatted if no date
  }

  try {
    console.log('\n🔵 formatBillNo: billNo=' + billNo + ', billDate=' + billDate);
    
    let year, month, day;
    
    // IMPORTANT: Handle ISO format with time (e.g., "2026-06-13T18:30:00.000Z")
    // Extract YYYY-MM-DD to avoid timezone conversion issues
    if (typeof billDate === 'string' && billDate.includes('T')) {
      console.log('   📌 ISO format detected, extracting date part only...');
      const dateMatch = billDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        year = parseInt(dateMatch[1], 10);
        month = parseInt(dateMatch[2], 10);
        day = parseInt(dateMatch[3], 10);
        console.log('   ✅ Extracted: ' + year + '-' + month + '-' + day);
      } else {
        console.warn('   ❌ Could not parse ISO date:', billDate);
        return billNo;
      }
    } else {
      // Parse as regular date
      const date = new Date(billDate);
      if (isNaN(date.getTime())) {
        console.warn('formatBillNo: Invalid date format:', billDate, 'for billNo:', billNo);
        return billNo; // Return unformatted if date is invalid
      }
      month = date.getMonth() + 1; // 1-12
      year = date.getFullYear();
      day = date.getDate();
    }

    // Calculate FY: Apr onwards = same year, Jan-Mar = previous year
    // Financial Year: April 1 to March 31
    const fyStartYear = month >= 4 ? year : year - 1;
    const fyEndYear = fyStartYear + 1;

    // Format FY as 2-digit year + 2-digit year (e.g., "2627" for 2026-2027)
    const fyFormatted = `${String(fyStartYear).slice(-2)}${String(fyEndYear).slice(-2)}`;

    // Month abbreviations
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthStr = monthNames[month - 1];

    // Ensure billNo is padded with leading zeros
    const billNoFormatted = String(billNo).padStart(2, '0');

    // Return formatted: FYMONTH_NN
    const formatted = `${fyFormatted}${monthStr}_${billNoFormatted}`;
    console.log('   ✅ Formatted: ' + formatted + ' (FY' + fyStartYear + '-' + fyEndYear + ', month=' + month + ')');
    return formatted;
  } catch (e) {
    console.warn('formatBillNo error:', e, 'billNo:', billNo, 'billDate:', billDate);
    return billNo; // Return unformatted if any error
  }
}

/**
 * Format quotation number for display
 * If quotationNo AND quotationDate both exist, keep original quotationNo
 * If only quotationNo exists (no date), format as FYMONTH_QT{sequence}
 * @param {string} quotationNo - The quotation number (e.g., "04")
 * @param {string|Date} quotationDate - The quotation date (optional)
 * @param {string|Date} billDate - Fallback date if quotationDate not provided (optional)
 * @returns {string} Formatted quotation number (e.g., "2526MAR_QT04") or original if already formatted
 */
export function formatQuotationNo(quotationNo, quotationDate, billDate) {
  // Handle invalid inputs
  if (!quotationNo || quotationNo === "-" || quotationNo === "null") {
    return quotationNo || "-";
  }

  // If quotationNo and quotationDate both exist, keep original (already formatted)
  if (quotationNo && quotationDate) {
    console.log('✅ Quotation already has date, keeping original format: ' + quotationNo);
    return quotationNo;
  }

  // Otherwise, format using bill date or fallback
  const dateToUse = quotationDate || billDate;
  if (!dateToUse) {
    console.warn('formatQuotationNo: No date available for quotationNo:', quotationNo);
    return quotationNo;
  }

  try {
    console.log('\n🔵 formatQuotationNo: quotationNo=' + quotationNo + ', date=' + dateToUse);
    
    let year, month, day;
    
    // IMPORTANT: Handle ISO format with time (e.g., "2026-06-13T18:30:00.000Z")
    // Extract YYYY-MM-DD to avoid timezone conversion issues
    if (typeof dateToUse === 'string' && dateToUse.includes('T')) {
      console.log('   📌 ISO format detected, extracting date part only...');
      const dateMatch = dateToUse.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        year = parseInt(dateMatch[1], 10);
        month = parseInt(dateMatch[2], 10);
        day = parseInt(dateMatch[3], 10);
        console.log('   ✅ Extracted: ' + year + '-' + month + '-' + day);
      } else {
        console.warn('   ❌ Could not parse ISO date:', dateToUse);
        return quotationNo;
      }
    } else {
      // Parse as regular date
      const date = new Date(dateToUse);
      if (isNaN(date.getTime())) {
        console.warn('formatQuotationNo: Invalid date format:', dateToUse, 'for quotationNo:', quotationNo);
        return quotationNo;
      }
      month = date.getMonth() + 1;
      year = date.getFullYear();
      day = date.getDate();
    }

    // Calculate FY: Apr onwards = same year, Jan-Mar = previous year
    const fyStartYear = month >= 4 ? year : year - 1;
    const fyEndYear = fyStartYear + 1;
    const fyFormatted = `${String(fyStartYear).slice(-2)}${String(fyEndYear).slice(-2)}`;

    // Month abbreviations
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthStr = monthNames[month - 1];

    // Ensure quotationNo is padded with leading zeros
    const quotationNoFormatted = String(quotationNo).padStart(2, '0');

    // Return formatted: FYMONTH_QT{NN}
    const formatted = `${fyFormatted}${monthStr}_QT${quotationNoFormatted}`;
    console.log('   ✅ Formatted: ' + formatted + ' (FY' + fyStartYear + '-' + fyEndYear + ', month=' + month + ')');
    return formatted;
  } catch (e) {
    console.warn('formatQuotationNo error:', e, 'quotationNo:', quotationNo, 'date:', dateToUse);
    return quotationNo;
  }
}

/**
 * Check if current user is verified (is_verified = true)
 */
export function isUserVerified() {
  const user = getCurrentUser();
  if (!user) return false;
  return user?.is_verified === true || user?.isVerified === true;
}

/**
 * Get cached company links for current user from localStorage
 */
export function getCachedCompanyLinks() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('userCompanyLinks');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('getCachedCompanyLinks parse error', e);
    return null;
  }
}

/**
 * Store company links in localStorage with user_id and timestamp
 */
export function setCachedCompanyLinks(links) {
  if (typeof window === 'undefined') return;
  try {
    const user = getCurrentUser();
    if (!user?.id) return;
    
    const cacheData = {
      user_id: user.id,
      links: links,
      timestamp: Date.now()
    };
    localStorage.setItem('userCompanyLinks', JSON.stringify(cacheData));
  } catch (e) {
    console.warn('setCachedCompanyLinks failed', e);
  }
}

/**
 * Fetch user's company links with local cache
 * Returns from cache if available, otherwise fetches from API
 */
export async function getUserCompanyLinks() {
  if (typeof window === 'undefined') return [];
  
  try {
    const user = getCurrentUser();
    if (!user?.id) return [];

    // Check cache first
    const cached = getCachedCompanyLinks();
    if (cached && cached.user_id === user.id) {
      console.log('✅ Using cached company links');
      return cached.links || [];
    }

    // If not in cache, fetch from API
    console.log('📡 Fetching company links from API');
    const res = await fetch(`${API_BASE}/api/company-settings/user/${user.id}`);
    const data = await res.json();

    if (data.success && data.companyLinks) {
      // Cache the result
      setCachedCompanyLinks(data.companyLinks);
      return data.companyLinks;
    }

    return [];
  } catch (err) {
    console.error('Error fetching company links:', err);
    // Try to return cached data as fallback
    const cached = getCachedCompanyLinks();
    return cached?.links || [];
  }
}

/**
 * Clear cached company links
 */
export function clearCachedCompanyLinks() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('userCompanyLinks');
  } catch (e) {
    console.warn('clearCachedCompanyLinks failed', e);
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
