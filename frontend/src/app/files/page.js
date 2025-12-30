'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE, getCurrentUserId } from '../../lib/utils';
import Loader from '@/components/Loader';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LangContext } from '../layout';

function FilesPageContent() {
  const router = useRouter();
  const langContext = useContext(LangContext);
  const { lang, t } = langContext || { lang: 'en', t: {} };

  const API = API_BASE 
  const [allFiles, setAllFiles] = useState([]);  // Store all files from API
  const [files, setFiles] = useState([]);        // Filtered files for display
  const [loading, setLoading] = useState(false);
  const [ownerId, setOwnerId] = useState(null);    // local user id
  const [selectedFY, setSelectedFY] = useState('all'); // Financial year filter
  const [fyOptions, setFyOptions] = useState([]);      // Available financial years

  // Bill number edit state
  const [editingBillFileId, setEditingBillFileId] = useState(null);
  const [editingBillNo, setEditingBillNo] = useState("");
  const [isUpdatingBill, setIsUpdatingBill] = useState(false);

  // Bill date edit state
  const [editingDateFileId, setEditingDateFileId] = useState(null);
  const [editingDate, setEditingDate] = useState("");
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);

  // Status options for dropdown
  const statusOptions = [
    { value: 'Draft', label: 'Draft', color: 'bg-gray-100 text-gray-700' },
    { value: 'Farmer Login', label: 'Farmer Login', color: 'bg-blue-100 text-blue-700' },
    { value: 'Supervisor Desk', label: 'Supervisor Desk', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'A.O. Desk', label: 'A.O. Desk', color: 'bg-orange-100 text-orange-700' },
    { value: 'T.A.O. Desk', label: 'T.A.O. Desk', color: 'bg-red-100 text-red-700' },
    { value: 'S.D.O. Desk', label: 'S.D.O. Desk', color: 'bg-pink-100 text-pink-700' },
    { value: 'Payment Desk', label: 'Payment Desk', color: 'bg-purple-100 text-purple-700' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' }
  ];

  // Helper to get financial year from a date (April to March)
  const getFinancialYear = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-indexed (0=Jan, 3=April)
      // If month is April (3) or later, FY is current year - next year
      // If month is before April, FY is previous year - current year
      if (month >= 3) { // April onwards
        return `${year}-${(year + 1).toString().slice(-2)}`;
      } else {
        return `${year - 1}-${year.toString().slice(-2)}`;
      }
    } catch (e) {
      return null;
    }
  };

  // Helper to get FY year from bill_date (NEW FORMAT: bill_no is just sequence number like 01, 02, etc)
  const getFYFromDate = (billDate) => {
    if (!billDate) return 0;
    const date = new Date(billDate);
    const month = date.getMonth() + 1; // 1-12
    const year = date.getFullYear();
    // FY: Apr onwards = same year, Jan-Mar = previous year
    return month >= 4 ? year : year - 1;
  };

  // Helper to parse bill_no and extract sequence only
  // NEW FORMAT: bill_no is just a simple number like "01", "02", "03"
  const parseBillNo = (billNo, billDate) => {
    if (!billNo || billNo === "-") return { seq: 0, fy: 0 };
    
    // Extract sequence number directly (entire bill_no is the sequence)
    const seq = parseInt(billNo, 10) || 0;
    
    // Get FY from bill_date
    const fy = getFYFromDate(billDate);
    
    console.log(`🔍 Parse "${billNo}" (date: ${billDate}) → seq:${seq}, fy:${fy}`);
    return { seq, fy };
  };

  // Sort files by bill_no: FY (from bill_date) → sequence
  // NEW FORMAT: bill_no is just sequence number (01, 02, etc). FY comes from bill_date.
  const sortFilesByBillNo = (filesList) => {
    console.log('📋 sortFilesByBillNo called with', filesList.length, 'files');
    
    // Clean bill_no values (handle string "null")
    const cleanedFiles = filesList.map(f => ({
      ...f,
      bill_no: (f.bill_no && f.bill_no !== "null") ? f.bill_no : null
    }));
    
    // console.log('Before sort:', cleanedFiles.map(f => f.bill_no || '-').join(', '));
    // console.log('=== DETAILED PARSING ===');
    cleanedFiles.forEach(f => {
      const data = parseBillNo(f.bill_no, f.bill_date);
      // console.log(`${f.bill_no} (date: ${f.bill_date}): fy=${data.fy}, seq=${data.seq}`);
    });
    
    const sorted = [...cleanedFiles].sort((a, b) => {
      const aBillNo = a.bill_no || "-";
      const bBillNo = b.bill_no || "-";
      
      // If no bill number, sort to bottom
      if (aBillNo === "-" && bBillNo === "-") return 0;
      if (aBillNo === "-") return 1;
      if (bBillNo === "-") return -1;
      
      const aData = parseBillNo(aBillNo, a.bill_date);
      const bData = parseBillNo(bBillNo, b.bill_date);
      
      // console.log(`\n🔄 COMPARING: ${aBillNo} vs ${bBillNo}`);
      // console.log(`  A: fy=${aData.fy}, seq=${aData.seq}`);
      // console.log(`  B: fy=${bData.fy}, seq=${bData.seq}`);
      
      // First sort by FY
      if (aData.fy !== bData.fy) {
        const result = aData.fy - bData.fy;
        // console.log(`  → Different FY: ${aData.fy} vs ${bData.fy} = ${result}`);
        return result;
      }
      
      // Same FY: sort by sequence
      const result = aData.seq - bData.seq;
      console.log(`  → Same FY (${aData.fy}), sort by SEQUENCE: ${aData.seq} vs ${bData.seq} = ${result}`);
      return result;
    });
    
    console.log('\n✅ After sort:', sorted.map(f => f.bill_no || '-').join(', '));
    return sorted;
  };

  // Generate list of unique financial years from files
  const generateFYOptions = (filesList) => {
    const fySet = new Set();
    filesList.forEach(f => {
      const fileDate = f.file_date ?? f.fileDate;
      const fy = getFinancialYear(fileDate);
      if (fy) fySet.add(fy);
    });
    // Sort in descending order (latest FY first)
    const sorted = Array.from(fySet).sort((a, b) => {
      const yearA = parseInt(a.split('-')[0]);
      const yearB = parseInt(b.split('-')[0]);
      return yearB - yearA;
    });
    return sorted;
  };

  // Filter files based on selected financial year
  const filterFilesByFY = (filesList, fy) => {
    if (fy === 'all') return filesList;
    return filesList.filter(f => {
      const fileDate = f.file_date ?? f.fileDate;
      return getFinancialYear(fileDate) === fy;
    });
  };

  // Helper to format date to readable format
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Helper to get FY date range (min and max dates for a given date)
  const getFYDateRange = (dateStr) => {
    if (!dateStr) return { minDate: '', maxDate: '' };
    try {
      const date = new Date(dateStr);
      const month = date.getMonth(); // 0-indexed (0=Jan, 3=April)
      const year = date.getFullYear();
      
      let fyStartYear, fyEndYear;
      if (month >= 3) { // April onwards
        fyStartYear = year;
        fyEndYear = year + 1;
      } else { // Jan-Mar
        fyStartYear = year - 1;
        fyEndYear = year;
      }
      
      // April 1 to March 31
      const minDate = `${fyStartYear}-04-01`;
      const maxDate = `${fyEndYear}-03-31`;
      
      return { minDate, maxDate };
    } catch (e) {
      return { minDate: '', maxDate: '' };
    }
  };

  // Read user from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem("user");
        if (raw) {
          const u = JSON.parse(raw);
          setOwnerId(u?.id ?? null);
        }
      } catch (_) {}
    }
  }, []);

  // Load files
  const loadData = async () => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const fRes = await fetch(`${API}/api/v2/files?owner_id=${ownerId}`);
      const fText = await fRes.text();
      let fJson = null;
      try { fJson = JSON.parse(fText); } catch (_) {}
      let filesList = fJson?.files || [];
      console.log(filesList)

      // Sort files by bill_no (FY year first, then sequence)
      filesList = sortFilesByBillNo(filesList);

      setAllFiles(filesList);
      setFyOptions(generateFYOptions(filesList));
      
      // Apply current filter
      setFiles(filterFilesByFY(filesList, selectedFY));
    } catch (err) {
      console.error("LOAD ERROR", err);
      alert("Error loading files");
    }
    setLoading(false);
  };

  // Load when owner loaded
  useEffect(() => {
    if (ownerId) loadData();
  }, [ownerId]);

  // Apply filter when selectedFY changes (local filtering, no API call)
  useEffect(() => {
    if (allFiles.length > 0) {
      setFiles(filterFilesByFY(allFiles, selectedFY));
    }
  }, [selectedFY, allFiles]);

  // Edit file → go to /new?id=123
  const editFile = (fileId) => {
    router.push(`/new?id=${fileId}`);
  };

  // Delete
  const deleteFile = async (fileId) => {
    if (!confirm("Delete this file? This will also delete any associated bills.")) return;

    try {
      const res = await fetch(`${API}/api/v2/files/${fileId}/delete`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner_id: ownerId })
      });
      const text = await res.text();
      let data = null;
      try { data = JSON.parse(text); } catch (_) {}

      if (!res.ok) {
        alert("Delete failed: " + (data?.error || text));
        return;
      }
      alert(data?.message || "File and associated bills deleted successfully");
      loadData();
    } catch (err) {
      console.error(err);
      alert("Delete error: " + err.message);
    }
  };

  // Update bill number for a file
  const updateBillNumber = async (fileId, newBillNo) => {
    if (!newBillNo || newBillNo.trim() === "") {
      alert("Bill number cannot be empty");
      return;
    }

    // Validate: digits only
    if (!/^\d+$/.test(newBillNo.trim())) {
      alert("Bill number must contain only digits");
      return;
    }

    setIsUpdatingBill(true);
    try {
      const normalizedBillNo = newBillNo.trim().padStart(2, '0');
      
      const res = await fetch(`${API}/api/v2/files/${fileId}/bill-no`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill_no: normalizedBillNo })
      });

      const text = await res.text();
      let data = null;
      try { data = JSON.parse(text); } catch (_) {}

      if (!res.ok) {
        alert("Update failed: " + (data?.error || text));
        setIsUpdatingBill(false);
        return;
      }

      // Update local state instead of full refresh
      setAllFiles(prevFiles =>
        prevFiles.map(f =>
          (f.id ?? f.file_id) === fileId
            ? { ...f, bill_no: normalizedBillNo }
            : f
        )
      );

      setFiles(prevFiles =>
        prevFiles.map(f =>
          (f.id ?? f.file_id) === fileId
            ? { ...f, bill_no: normalizedBillNo }
            : f
        )
      );

      setEditingBillFileId(null);
      setEditingBillNo("");
      setIsUpdatingBill(false);
    } catch (err) {
      console.error("UPDATE ERROR", err);
      alert("Update failed: " + err.message);
      setIsUpdatingBill(false);
    }
  };

  // Update bill date for a file
  const updateBillDate = async (fileId, newDate) => {
    if (!newDate || newDate.trim() === "") {
      alert("Date cannot be empty");
      return;
    }

    // Validate: valid date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate.trim())) {
      alert("Please enter a valid date (YYYY-MM-DD)");
      return;
    }

    setIsUpdatingDate(true);
    try {
      const res = await fetch(`${API}/api/v2/files/${fileId}/bill-date`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill_date: newDate.trim() })
      });

      const text = await res.text();
      let data = null;
      try { data = JSON.parse(text); } catch (_) {}

      if (!res.ok) {
        alert("Update failed: " + (data?.error || text));
        setIsUpdatingDate(false);
        return;
      }

      // Update local state instead of full refresh
      setAllFiles(prevFiles =>
        prevFiles.map(f =>
          (f.id ?? f.file_id) === fileId
            ? { ...f, bill_date: newDate.trim(), file_date: newDate.trim() }
            : f
        )
      );

      setFiles(prevFiles =>
        prevFiles.map(f =>
          (f.id ?? f.file_id) === fileId
            ? { ...f, bill_date: newDate.trim(), file_date: newDate.trim() }
            : f
        )
      );

      setEditingDateFileId(null);
      setEditingDate("");
      setIsUpdatingDate(false);
    } catch (err) {
      console.error("UPDATE DATE ERROR", err);
      alert("Update failed: " + err.message);
      setIsUpdatingDate(false);
    }
  };

  // Update status for a file
  const updateStatus = async (fileId, newStatus) => {
    try {
      const res = await fetch(`${API}/api/v2/files/${fileId}/status?owner_id=${ownerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        // Update local state
        setAllFiles(prevFiles =>
          prevFiles.map(f =>
            (f.id ?? f.file_id) === fileId
              ? { ...f, status: newStatus }
              : f
          )
        );

        setFiles(prevFiles =>
          prevFiles.map(f =>
            (f.id ?? f.file_id) === fileId
              ? { ...f, status: newStatus }
              : f
          )
        );
      } else {
        alert('Failed to update status: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('Error updating status');
    }
  };

  // Calculate insights
  const getInsights = () => {
    const totalFiles = allFiles.length;
    
    // Files in current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const filesThisMonth = allFiles.filter(f => {
      const fileDate = f.file_date ?? f.fileDate;
      if (!fileDate) return false;
      const date = new Date(fileDate);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    // Files by status (count only non-zero)
    const statusCounts = {};
    statusOptions.forEach(opt => {
      const count = allFiles.filter(f => (f.status || 'Draft') === opt.value).length;
      if (count > 0) {
        statusCounts[opt.value] = { count, label: opt.label, color: opt.color };
      }
    });

    // Files by last 4 months (using bill_date)
    const filesByMonth = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    console.log('🗓️ === INITIALIZING MONTHS ===');
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setDate(1); // Set to 1st to avoid day overflow when changing month
      d.setMonth(d.getMonth() - i);
      const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      filesByMonth[monthKey] = 0;
      console.log(`  Month ${i}: ${monthKey}`);
    }
    console.log('📊 filesByMonth initialized:', filesByMonth);

    console.log('📁 === PROCESSING FILES ===');
    allFiles.forEach((f, idx) => {
      // Use SAME fallback chain as table display: bill_date → billDate → file_date → fileDate
      const billDate = f.bill_date ?? f.billDate ?? f.file_date ?? f.fileDate;
      if (!billDate) {
        console.log(`  [${idx}] NO DATE - skipped`);
        return;
      }
      const date = new Date(billDate);
      if (isNaN(date.getTime())) {
        console.log(`  [${idx}] INVALID DATE: ${billDate} - skipped`);
        return;
      }
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      console.log(`  [${idx}] ${monthKey} (${billDate})`);
      if (filesByMonth[monthKey] !== undefined) {
        filesByMonth[monthKey]++;
        console.log(`    ✅ Counted! Total for ${monthKey}: ${filesByMonth[monthKey]}`);
      } else {
        console.log(`    ⚠️ Month not in range: ${monthKey}`);
      }
    });
    console.log('📊 Final filesByMonth:', filesByMonth);

    return { totalFiles, filesThisMonth, statusCounts, filesByMonth };
  };

  const insights = getInsights();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">{t.files}</h1>
        <button
          className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 hover:cursor-pointer transition"
          onClick={() => router.push('/new')}
        >
          + {t.newFile}
        </button>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-4 mb-6">
        {/* Total Files Card */}
        <div className="bg-white rounded-lg p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t.totalFiles}</div>
              <div className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">{insights.totalFiles}</div>
              <div className="text-xs text-gray-500 font-medium">{t.allTime}</div>
            </div>
            <div className="text-4xl md:text-5xl">📁</div>
          </div>
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full mb-3"></div>
          {/* <div className="text-xs text-gray-600">
            <div className="flex justify-between mb-1">
              <span>{t.thisMonth || 'This Month'}:</span>
              <span className="font-semibold text-blue-600">{insights.filesThisMonth}</span>
            </div>
          </div> */}
        </div>

        {/* Status Summary Card - 2x Width */}
        <div className="col-span-2 bg-white rounded-lg p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 border-l-4 border-l-amber-500">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t.status || 'Status'}</div>
            </div>
            <div className="text-3xl md:text-4xl">📊</div>
          </div>
          <div className="flex justify-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(insights.statusCounts).map(([statusVal, statusInfo], idx) => (
                <div key={statusVal} style={{animationDelay: `${idx * 100}ms`}} className={`p-2 rounded text-center text-xs ${statusInfo.color} border border-current border-opacity-20 animate-fadeInUp opacity-0 animation-fill-forwards`}>
                  <div className="font-medium text-gray-700 mb-0.5 text-xl md:text-2xl font-bold">{statusInfo.count}</div>
                  <div className="text-xs font-semibold">{statusInfo.label}</div>
                </div>
              ))}
              {Object.keys(insights.statusCounts).length === 0 && (
                <div className="col-span-2 md:col-span-4 text-gray-500 text-center py-2 text-xs">No status data</div>
              )}
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-300 rounded-full mt-2"></div>
        </div>

        {/* Quick Stats Card - Files by Month */}
        {/* <div className="bg-white rounded-lg p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 border-l-4 border-l-violet-500">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t.byMonth}</div>
            </div>
            <div className="text-4xl md:text-5xl">📊</div>
          </div>
          <div className="space-y-2">
            {Object.entries(insights.filesByMonth).map(([month, count]) => (
              <div key={month} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">{month}</span>
                <div className="flex items-center gap-2 flex-1 ml-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 to-violet-300 rounded-full transition-all duration-300"
                      style={{width: insights.totalFiles > 0 ? `${(count / Math.max(...Object.values(insights.filesByMonth), 1)) * 100}%` : '0%'}}
                    ></div>
                  </div>
                  <span className="font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded text-sm min-w-10 text-center">{count}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="h-1 bg-gradient-to-r from-violet-500 to-violet-300 rounded-full mt-4"></div>
        </div> */}
      </div>

      {/* Financial Year Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <label className="text-sm font-medium text-gray-700">{t.financialYear}:</label>
        <select
          value={selectedFY}
          onChange={(e) => setSelectedFY(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <option value="all">{t.all || 'All'}</option>
          {fyOptions.map(fy => (
            <option key={fy} value={fy}>FY {fy}</option>
          ))}
        </select>
        <span className="text-xs text-gray-500">
          {t.showing} {files.length} {t.of} {allFiles.length} {t.files}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
        <table className="w-full bg-white min-w-max md:min-w-full">
          
          {/* Table Head */}
          <thead className="bg-gradient-to-r from-green-800 to-green-600 text-white hidden md:table-header-group">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t.srNo}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t.farmer}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t.mobile}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t.fileDate}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t.billNo}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t.status || 'Status'}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t.actions}</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-200">
            
            {/* Show loading inside table body */}
            {loading && (
              <tr>
                <td colSpan="8" className="py-12 text-center">
                  <Loader message="Loading files..." size="md" />
                </td>
              </tr>
            )}

            {/* No files found */}
            {!loading && files.length === 0 && (
              <tr>
                <td colSpan="8" className="py-8 text-center text-gray-500">
                  No files found.
                </td>
              </tr>
            )}

            {/* File rows */}
            {!loading && files.map((f, i) => {
              const id = f.id ?? f.file_id;
              const farmerName = f.farmer_name ?? f.farmerName;
              const mobile = f.mobile ?? f.farmer_mobile ?? "-";
              const fileDate = f.file_date ?? f.fileDate ?? "";
              
              // Helper to get clean bill_no (handle string "null")
              const getCleanBillNo = (billNoValue) => {
                if (!billNoValue || billNoValue === "null" || billNoValue === null) return null;
                return billNoValue;
              };

              const fBillNo = getCleanBillNo(f.bill_no ?? f.billNo);
              const billNo = fBillNo ?? "-";

              // Use the file's own bill_date and status directly
              const billDate = f.bill_date ?? f.billDate ?? fileDate;
              const billStatus = f.status ?? "draft";

              // // Debug logging for this specific row
              // console.log('\n📍 FILES TABLE ROW ' + (i + 1) + ':');
              // console.log('   fBillNo:', fBillNo);
              // console.log('   billNo:', billNo);
              // console.log('   f.bill_date:', f.bill_date ?? f.billDate);
              // console.log('   fileDate:', fileDate);
              // console.log('   billDate (final):', billDate);

              return (
                <tr
                  key={id}
                  className={`block md:table-row mb-4 md:mb-0 border md:border-none rounded-lg md:rounded-none overflow-hidden ${
                    i % 2 === 0 ? 'bg-green-50' : 'bg-green-100'
                  }`}
                >
                  <td className="block md:table-cell px-4 py-2 text-sm text-gray-700 before:content-['Sr_No:'] before:font-bold before:text-gray-600 before:mr-2 md:before:content-none">{i + 1}</td>
                  <td className="block md:table-cell px-4 py-2 text-sm text-gray-700 before:content-['Farmer:'] before:font-bold before:text-gray-600 before:mr-2 md:before:content-none">{farmerName}</td>
                  <td className="block md:table-cell px-4 py-2 text-sm text-gray-700 before:content-['Mobile:'] before:font-bold before:text-gray-600 before:mr-2 md:before:content-none">{mobile}</td>
                  
                  {/* File Date - Editable Cell */}
                  <td className="block md:table-cell px-4 py-2 text-sm text-gray-700 before:content-['Date:'] before:font-bold before:text-gray-600 before:mr-2 md:before:content-none min-w-40 bg-blue-50/50 md:hover:bg-blue-100/70 transition-colors">
                    {editingDateFileId === id ? (() => {
                      const { minDate, maxDate } = getFYDateRange(fileDate);
                      return (
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1 items-center">
                            <input
                              type="date"
                              value={editingDate}
                              onChange={(e) => setEditingDate(e.target.value)}
                              min={minDate}
                              max={maxDate}
                              className="px-2 py-1 border-2 border-blue-400 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              disabled={isUpdatingDate}
                              autoFocus
                            />
                            <button
                              onClick={() => updateBillDate(id, editingDate)}
                              disabled={isUpdatingDate}
                              className="w-7 h-7 flex items-center justify-center bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 flex-shrink-0 transition-colors"
                              title="Save"
                            >
                              {isUpdatingDate ? "..." : "✓"}
                            </button>
                            <button
                              onClick={() => setEditingDateFileId(null)}
                              disabled={isUpdatingDate}
                              className="w-7 h-7 flex items-center justify-center bg-gray-400 text-white text-xs rounded hover:bg-gray-500 disabled:opacity-50 flex-shrink-0 transition-colors"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })() : (
                      <span
                        onClick={() => {
                          setEditingDateFileId(id);
                          // Convert fileDate to YYYY-MM-DD format for input
                          const dateObj = new Date(fileDate);
                          const formattedDate = dateObj.toISOString().split('T')[0];
                          setEditingDate(formattedDate);
                        }}
                        className="cursor-pointer hover:text-blue-700 px-2 py-1 rounded inline-flex items-center gap-1 font-medium text-blue-600 transition-colors"
                        title="Click to edit date"
                      >
                        ✏️ {formatDate(fileDate)}
                      </span>
                    )}
                  </td>
                  
                  {/* Bill No - Editable Cell */}
                  <td className="block md:table-cell px-4 py-2 text-sm font-semibold text-gray-800 before:content-['Bill_No:'] before:font-bold before:text-gray-600 before:mr-2 md:before:content-none min-w-32 bg-amber-50/50 md:hover:bg-amber-100/70 transition-colors">
                    {editingBillFileId === id ? (
                      <div className="flex gap-1 items-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editingBillNo}
                          onChange={(e) => setEditingBillNo(e.target.value.replace(/\D/g, ''))}
                          placeholder={billNo}
                          className="w-12 px-2 py-1 border-2 border-amber-400 rounded text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-semibold"
                          disabled={isUpdatingBill}
                          autoFocus
                        />
                        <button
                          onClick={() => updateBillNumber(id, editingBillNo)}
                          disabled={isUpdatingBill}
                          className="w-7 h-7 flex items-center justify-center bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 flex-shrink-0 transition-colors"
                          title="Save"
                        >
                          {isUpdatingBill ? "..." : "✓"}
                        </button>
                        <button
                          onClick={() => setEditingBillFileId(null)}
                          disabled={isUpdatingBill}
                          className="w-7 h-7 flex items-center justify-center bg-gray-400 text-white text-xs rounded hover:bg-gray-500 disabled:opacity-50 flex-shrink-0 transition-colors"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={() => {
                          setEditingBillFileId(id);
                          setEditingBillNo(billNo === "-" ? "" : billNo);
                        }}
                        className="cursor-pointer hover:text-amber-700 px-2 py-1 rounded inline-flex items-center gap-1 font-semibold text-amber-600 transition-colors"
                        title="Click to edit bill number"
                      >
                        ✏️ {billNo}
                      </span>
                    )}
                  </td>

                  {/* Status Dropdown Cell */}
                  <td className="block md:table-cell px-4 py-2 text-sm before:content-['Status:'] before:font-bold before:text-gray-600 before:mr-2 md:before:content-none">
                    <select
                      value={f.status || 'Draft'}
                      onChange={(e) => updateStatus(id, e.target.value)}
                      className={`px-2 py-1 rounded-lg border text-xs font-semibold cursor-pointer ${
                        statusOptions.find(o => o.value === f.status)?.color || 'bg-gray-100'
                      }`}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="block md:table-cell px-4 py-3">
                    <div className="flex flex-wrap gap-2 md:gap-2">
                      <button
                        onClick={() => editFile(id)}
                        className="flex-1 md:flex-auto text-blue-600 rounded-full border px-2 md:px-3 py-1 md:py-0 hover:cursor-pointer hover:text-blue-800 text-xs md:text-sm font-medium"
                      >
                        {t.edit}
                      </button>

                      <button
                        onClick={() => router.push(`/new?id=${id}&section=bill`)}
                        className="flex-1 md:flex-auto text-purple-600 rounded-full border px-2 md:px-3 py-1 md:py-0 hover:cursor-pointer hover:text-purple-800 text-xs md:text-sm font-medium"
                      >
                        {t.editBill || 'Edit Bill'}
                      </button>

                      <button
                        onClick={() => router.push(`/files/print/${id}`)}
                        className="flex-1 md:flex-auto text-green-600 rounded-full border px-2 md:px-3 py-1 md:py-0 hover:cursor-pointer hover:text-green-800 text-xs md:text-sm font-medium"
                      >
                        {t.quotationFeaturePrint}
                      </button>

                      <button
                        onClick={() => deleteFile(id)}
                        className="flex-1 md:flex-auto text-red-600 rounded-full border px-2 md:px-3 py-1 md:py-0 hover:text-red-900 hover:cursor-pointer text-xs md:text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function FilesPage() {
  return (
    <ProtectedRoute>
      <FilesPageContent />
    </ProtectedRoute>
  );
}
