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
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ownerId, setOwnerId] = useState(null);    // local user id
  const [selectedFY, setSelectedFY] = useState('all'); // Financial year filter
  const [fyOptions, setFyOptions] = useState([]);      // Available financial years

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

  // Helper to parse bill_no and extract year and sequence
  // e.g., "2025DEC_04" → { year: 2025, seq: 4 }
  const parseBillNo = (billNo) => {
    if (!billNo || billNo === "-") return { year: 0, seq: 0 };
    
    // Extract year (e.g., "2025" from "2025DEC_04")
    const yearMatch = billNo.match(/^\d+/);
    const year = yearMatch ? parseInt(yearMatch[0], 10) : 0;
    
    // Extract sequence number (e.g., "04" from "2025DEC_04")
    const seqMatch = billNo.match(/_(\d+)$/);
    const seq = seqMatch ? parseInt(seqMatch[1], 10) : 0;
    
    console.log(`🔍 Parse "${billNo}" → year:${year}, seq:${seq}`);
    return { year, seq };
  };

  // Sort files by bill_no: year → sequence (ignore month)
  const sortFilesByBillNo = (filesList) => {
    console.log('📋 sortFilesByBillNo called with', filesList.length, 'files');
    
    // Clean bill_no values (handle string "null")
    const cleanedFiles = filesList.map(f => ({
      ...f,
      bill_no: (f.bill_no && f.bill_no !== "null") ? f.bill_no : null
    }));
    
    console.log('Before sort:', cleanedFiles.map(f => f.bill_no || '-').join(', '));
    
    const sorted = [...cleanedFiles].sort((a, b) => {
      const aBillNo = a.bill_no || "-";
      const bBillNo = b.bill_no || "-";
      
      // If no bill number, sort to bottom
      if (aBillNo === "-" && bBillNo === "-") return 0;
      if (aBillNo === "-") return 1;
      if (bBillNo === "-") return -1;
      
      const aData = parseBillNo(aBillNo);
      const bData = parseBillNo(bBillNo);
      
      console.log(`  Compare: ${aBillNo}(y:${aData.year},s:${aData.seq}) vs ${bBillNo}(y:${bData.year},s:${bData.seq})`);
      
      // First sort by year
      if (aData.year !== bData.year) {
        const result = aData.year - bData.year;
        console.log(`    → Year diff: ${result}`);
        return result;
      }
      
      // Then sort by sequence number
      const result = aData.seq - bData.seq;
      console.log(`    → Seq diff: ${result}`);
      return result;
    });
    
    console.log('✅ After sort:', sorted.map(f => f.bill_no || '-').join(', '));
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

  // Load files + bills
  const loadData = async () => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const fRes = await fetch(`${API}/api/v2/files?owner_id=${ownerId}`);
      const fText = await fRes.text();
      let fJson = null;
      try { fJson = JSON.parse(fText); } catch (_) {}
      let filesList = fJson?.files || [];

      console.log('📥 Files received from API:');
      filesList.forEach((f, i) => {
        console.log(`  ${i+1}. bill_no: "${f.bill_no}" | billNo: "${f.billNo}" | id: ${f.id}`);
      });

      // Sort files by bill_no (FY year first, then sequence)
      filesList = sortFilesByBillNo(filesList);

      const bRes = await fetch(`${API}/api/bills?owner_id=${ownerId}`);
      const bText = await bRes.text();
      let bJson = null;
      try { bJson = JSON.parse(bText); } catch (_) {}
      const billsList = bJson?.bills || [];

      // Store all files and generate FY options
      setAllFiles(filesList);
      setFyOptions(generateFYOptions(filesList));
      
      // Apply current filter
      setFiles(filterFilesByFY(filesList, selectedFY));
      setBills(billsList);
    } catch (err) {
      console.error("LOAD ERROR", err);
      alert("Error loading files/bills");
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

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalFileId, setModalFileId] = useState(null);
  const [selectedBillId, setSelectedBillId] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  // Open bill linking modal
  const openBillModal = (fileId, currentBillId) => {
    setModalFileId(fileId);
    setSelectedBillId(currentBillId || "");
    setShowModal(true);
  };

  // Link bill → file
  const linkBill = async () => {
    if (!selectedBillId || !modalFileId) {
      alert("Please select a bill");
      return;
    }

    setIsLinking(true);
    console.log('Attempting to link - fileId:', modalFileId, 'billId:', selectedBillId);

    try {
      const res = await fetch(`${API}/api/files/${modalFileId}/link-bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill_id: Number(selectedBillId) || selectedBillId })
      });

      const text = await res.text();
      let data = null;
      try { data = JSON.parse(text); } catch (_) {}

      console.log('Response status:', res.status, 'Response:', text);

      if (!res.ok || !data?.success) {
        console.error("LINK ERROR", text);
        alert("Linking bill failed: " + (data?.error || text));
        setIsLinking(false);
        return;
      }

      alert("Bill linked successfully!");
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error("LINK EXCEPTION", err);
      alert("Network error");
    }
    setIsLinking(false);
  };

  // Edit file → go to /new?id=123
  const editFile = (fileId) => {
    router.push(`/new?id=${fileId}`);
  };

  // Delete
  const deleteFile = async (fileId) => {
    if (!confirm("Delete this file?")) return;

    try {
      const res = await fetch(`${API}/api/files/${fileId}/delete`, { method: "POST" });
      if (!res.ok) {
        alert("Delete failed");
        return;
      }
      alert("Deleted");
      loadData();
    } catch (err) {
      console.error(err);
      alert("Delete error");
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

    // Get latest file date
    let latestDate = null;
    if (allFiles.length > 0) {
      const dates = allFiles
        .map(f => f.file_date ?? f.fileDate)
        .filter(d => d)
        .map(d => new Date(d))
        .filter(d => !isNaN(d.getTime()))
        .sort((a, b) => b.getTime() - a.getTime());
      if (dates.length > 0) latestDate = dates[0];
    }

    // Files by last 3 months
    const filesByMonth = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 3; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      filesByMonth[monthKey] = 0;
    }

    allFiles.forEach(f => {
      const fileDate = f.file_date ?? f.fileDate;
      if (!fileDate) return;
      const date = new Date(fileDate);
      if (isNaN(date.getTime())) return;
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      if (filesByMonth[monthKey] !== undefined) {
        filesByMonth[monthKey]++;
      }
    });

    return { totalFiles, filesThisMonth, latestDate, filesByMonth };
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
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t.totalFiles}</div>
              <div className="text-3xl md:text-4xl font-bold text-gray-800">{insights.totalFiles}</div>
            </div>
            <div className="text-3xl md:text-4xl">📁</div>
          </div>
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full"></div>
          <div className="text-xs text-gray-500 mt-2 font-medium">{t.allTime}</div>
        </div>

        {/* Files This Month Card */}
        <div className="bg-white rounded-lg p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 border-l-4 border-l-emerald-500">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t.thisMonth}</div>
              <div className="text-3xl md:text-4xl font-bold text-gray-800">{insights.filesThisMonth}</div>
            </div>
            <div className="text-3xl md:text-4xl">📅</div>
          </div>
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full"></div>
          <div className="text-xs text-gray-500 mt-2 font-medium">
            {new Date().toLocaleDateString('en-IN', { month: 'short' })}
          </div>
        </div>

        {/* Latest File Date Card */}
        <div className="bg-white rounded-lg p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 border-l-4 border-l-amber-500">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t.latestFile}</div>
              <div className="text-3xl md:text-4xl font-bold text-gray-800">
                {insights.latestDate ? insights.latestDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '-'}
              </div>
            </div>
            <div className="text-3xl md:text-4xl">⚡</div>
          </div>
          <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"></div>
          <div className="text-xs text-gray-500 mt-2 font-medium">
            {insights.latestDate ? insights.latestDate.getFullYear() : t.noFiles}
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-white rounded-lg p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 border-l-4 border-l-violet-500">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t.byMonth}</div>
            </div>
            <div className="text-3xl md:text-4xl">📊</div>
          </div>
          <div className="space-y-1.5 text-xs">
            {Object.entries(insights.filesByMonth).slice(0, 2).map(([month, count]) => (
              <div key={month} className="flex justify-between items-center text-gray-700">
                <span className="text-gray-600 font-medium">{month}</span>
                <span className="font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">{count}</span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-gradient-to-r from-violet-500 to-violet-300 rounded-full mt-2"></div>
        </div>
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
              <th className="px-4 py-3 text-left text-sm font-semibold">{t.actions}</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-200">
            
            {/* Show loading inside table body */}
            {loading && (
              <tr>
                <td colSpan="7" className="py-12 text-center">
                  <Loader message="Loading files..." size="md" />
                </td>
              </tr>
            )}

            {/* No files found */}
            {!loading && files.length === 0 && (
              <tr>
                <td colSpan="7" className="py-8 text-center text-gray-500">
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
              
              const linkedBill = bills.find(b => {
                const bid = b.bill_id ?? b.id;
                const bFileId = b.file_id ?? b.fileId;
                const fBillNo = getCleanBillNo(f.bill_no ?? f.billNo);
                const bBillNo = getCleanBillNo(b.bill_no);
                return bFileId === id || bid === f.bill_id || (bBillNo && fBillNo && bBillNo === fBillNo);
              });
              
              const fBillNo = getCleanBillNo(f.bill_no ?? f.billNo);
              const billNo = linkedBill?.bill_no ?? fBillNo ?? "-";
              const billStatus = linkedBill?.status ?? f.status ?? "draft";

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
                  <td className="block md:table-cell px-4 py-2 text-sm text-gray-700 before:content-['Date:'] before:font-bold before:text-gray-600 before:mr-2 md:before:content-none">{formatDate(fileDate)}</td>
                  <td className="block md:table-cell px-4 py-2 text-sm font-semibold text-gray-800 before:content-['Bill_No:'] before:font-bold before:text-gray-600 before:mr-2 md:before:content-none">{billNo}</td>

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
                        {t.linkBill}
                      </button>

                      <button
                        onClick={() => router.push(`/files/print/${id}`)}
                        className="flex-1 md:flex-auto text-green-600 rounded-full border px-2 md:px-3 py-1 md:py-0 hover:cursor-pointer hover:text-green-800 text-xs md:text-sm font-medium"
                      >
                        {t.quotationFeaturePrint}
                      </button>

                      {/* <button
                        onClick={() => deleteFile(id)}
                        className="flex-1 md:flex-auto text-red-600 rounded-full border px-2 md:px-3 py-1 md:py-0 hover:text-red-900 hover:cursor-pointer text-xs md:text-sm font-medium"
                      >
                        Delete
                      </button> */}
                    </div>
                  </td>
                </tr>
              );
            })}

          </tbody>
        </table>
      </div>

      {/* Link Bill Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {t.linkBill}
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.selectBill}
              </label>
              <select
                value={selectedBillId}
                onChange={(e) => setSelectedBillId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- {t.selectBill} --</option>
                {bills.map(b => (
                  <option key={b.bill_id ?? b.id} value={b.bill_id ?? b.id}>
                    {b.bill_no} - {b.farmer_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                disabled={isLinking}
              >
                {t.close}
              </button>
              {/* <button
                onClick={linkBill}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                disabled={isLinking || !selectedBillId}
              >
                {isLinking ? "Linking..." : "Link"}
              </button> */}
            </div>
          </div>
        </div>
      )}
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
