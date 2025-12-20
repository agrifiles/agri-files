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
      const fRes = await fetch(`${API}/api/files?owner_id=${ownerId}`);
      const fText = await fRes.text();
      let fJson = null;
      try { fJson = JSON.parse(fText); } catch (_) {}
      let filesList = fJson?.files || [];

      // Sort files by file_date (oldest first, new files at bottom)
      // OLD LOGIC: Sort by created_at (commented below)
      // filesList.sort((a, b) => {
      //   const dateA = new Date(a.created_at || 0);
      //   const dateB = new Date(b.created_at || 0);
      //   return dateA.getTime() - dateB.getTime(); // Oldest first (new at bottom)
      // });

      // NEW LOGIC: Sort by file_date (oldest at top)
      filesList.sort((a, b) => {
        const dateA = new Date(a.file_date || a.fileDate || 0);
        const dateB = new Date(b.file_date || b.fileDate || 0);
        return dateA.getTime() - dateB.getTime(); // Oldest first (top)
      });

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-3 mb-4">
        {/* Total Files Card */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 text-white rounded-xl p-4 md:p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-blue-300">
          <div className="flex items-center justify-between mb-1 md:mb-1">
            <div className="text-xs font-bold text-blue-100 uppercase tracking-widest">{t.totalFiles}</div>
            <div className="text-xl md:text-lg">📁</div>
          </div>
          <div className="text-2xl md:text-3xl font-black mt-0.5">{insights.totalFiles}</div>
          <div className="text-xs text-blue-100 mt-1 font-medium">{t.allTime}</div>
        </div>

        {/* Files This Month Card */}
        <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-400 text-white rounded-xl p-4 md:p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-green-300">
          <div className="flex items-center justify-between mb-1 md:mb-1">
            <div className="text-xs font-bold text-green-100 uppercase tracking-widest">{t.thisMonth}</div>
            <div className="text-xl md:text-lg">📅</div>
          </div>
          <div className="text-2xl md:text-3xl font-black mt-0.5">{insights.filesThisMonth}</div>
          <div className="text-xs text-green-100 mt-1 font-medium">
            {new Date().toLocaleDateString('en-IN', { month: 'short' })}
          </div>
        </div>

        {/* Latest File Date Card */}
        <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-400 text-white rounded-xl p-4 md:p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-orange-300">
          <div className="flex items-center justify-between mb-1 md:mb-1">
            <div className="text-xs font-bold text-orange-100 uppercase tracking-widest">{t.latestFile}</div>
            <div className="text-xl md:text-lg">⚡</div>
          </div>
          <div className="text-xl md:text-2xl font-black mt-0.5 break-words">
            {insights.latestDate ? insights.latestDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '-'}
          </div>
          <div className="text-xs text-orange-100 mt-1 font-medium">
            {insights.latestDate ? insights.latestDate.getFullYear() : t.noFiles}
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-gradient-to-br from-purple-600 via-violet-500 to-pink-400 text-white rounded-xl p-4 md:p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-purple-300">
          <div className="flex items-center justify-between mb-1 md:mb-1">
            <div className="text-xs font-bold text-purple-100 uppercase tracking-widest">{t.byMonth}</div>
            <div className="text-xl md:text-lg">📊</div>
          </div>
          <div className="mt-1 md:mt-1 space-y-1 text-xs">
            {Object.entries(insights.filesByMonth).map(([month, count]) => (
              <div key={month} className="flex justify-between items-center bg-opacity-20 rounded px-2 py-0.5">
                <span className="text-purple-100 font-medium text-xs">{month}</span>
                <span className="font-black text-xs bg-purple-600 bg-opacity-30 px-1.5 py-0.5 rounded">{count}</span>
              </div>
            ))}
          </div>
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
              const linkedBill = bills.find(b => {
                const bid = b.bill_id ?? b.id;
                const bFileId = b.file_id ?? b.fileId;
                return bFileId === id || bid === f.bill_id || (b.bill_no && f.bill_no && b.bill_no === f.bill_no);
              });
              const billNo = linkedBill?.bill_no ?? f.bill_no ?? "-";
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
