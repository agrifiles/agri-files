'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE, getCurrentUserId } from '../../lib/utils';
import { LangContext } from '../layout';
import Loader from '@/components/Loader';
import ProtectedRoute from '@/components/ProtectedRoute';

function QuotationsPageContent() {
  const router = useRouter();
  const { t } = useContext(LangContext);
  const API = API_BASE;
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ownerId, setOwnerId] = useState(null);

  // Status options for dropdown
  const statusOptions = [
    { value: 'draft', label: 'Draft', labelMr: 'मसुदा', color: 'bg-gray-100 text-gray-700' },
    { value: 'sent', label: 'Sent', labelMr: 'पाठवले', color: 'bg-blue-100 text-blue-700' },
    { value: 'accepted', label: 'Accepted', labelMr: 'स्वीकारले', color: 'bg-green-100 text-green-700' },
    { value: 'rejected', label: 'Rejected', labelMr: 'नाकारले', color: 'bg-red-100 text-red-700' },
    { value: 'expired', label: 'Expired', labelMr: 'कालबाह्य', color: 'bg-orange-100 text-orange-700' },
    { value: 'converted', label: 'Converted to Bill', labelMr: 'बिलमध्ये रूपांतरित', color: 'bg-purple-100 text-purple-700' }
  ];

  // Helper to format date
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

  // Get status badge
  const getStatusBadge = (status) => {
    const option = statusOptions.find(o => o.value === status) || statusOptions[0];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${option.color}`}>
        {option.label}
      </span>
    );
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

  // Load quotations
  const loadData = async () => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/quotations?owner_id=${ownerId}`);
      const data = await res.json();
      if (data.success) {
        setQuotations(data.quotations || []);
      }
    } catch (err) {
      console.error("Load quotations error:", err);
      alert("Error loading quotations");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (ownerId) loadData();
  }, [ownerId]);

  // Update status
  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${API}/api/quotations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        loadData(); // Refresh list
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
    const totalQuotations = quotations.length;
    
    // Quotations in current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const quotationsThisMonth = quotations.filter(q => {
      const qDate = q.quotation_date || q.quotationDate;
      if (!qDate) return false;
      const date = new Date(qDate);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    // Get latest quotation date
    let latestDate = null;
    if (quotations.length > 0) {
      const dates = quotations
        .map(q => q.quotation_date || q.quotationDate)
        .filter(d => d)
        .map(d => new Date(d))
        .filter(d => !isNaN(d.getTime()))
        .sort((a, b) => b.getTime() - a.getTime());
      if (dates.length > 0) latestDate = dates[0];
    }

    // Quotations by last 3 months
    const quotationsByMonth = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 3; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      quotationsByMonth[monthKey] = 0;
    }

    quotations.forEach(q => {
      const qDate = q.quotation_date || q.quotationDate;
      if (!qDate) return;
      const date = new Date(qDate);
      if (isNaN(date.getTime())) return;
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      if (quotationsByMonth[monthKey] !== undefined) {
        quotationsByMonth[monthKey]++;
      }
    });

    return { totalQuotations, quotationsThisMonth, latestDate, quotationsByMonth };
  };

  const insights = getInsights();

  // Delete quotation
  const deleteQuotation = async (id) => {
    if (!confirm("Delete this quotation? / हे कोटेशन हटवायचे?")) return;

    try {
      const res = await fetch(`${API}/api/quotations/${id}/delete`, { method: "POST" });
      if (!res.ok) {
        alert("Delete failed");
        return;
      }
      alert("Quotation deleted / कोटेशन हटवले");
      loadData();
    } catch (err) {
      console.error(err);
      alert("Delete error");
    }
  };

  // Convert to bill
  const convertToBill = async (id) => {
    if (!confirm("Convert this quotation to bill? / हे कोटेशन बिलमध्ये रूपांतरित करायचे?")) return;

    try {
      const res = await fetch(`${API}/api/quotations/${id}/convert-to-bill`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert("Quotation converted to bill successfully! / कोटेशन बिलमध्ये यशस्वीरित्या रूपांतरित!");
        loadData();
      } else {
        alert('Failed to convert: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert("Convert error");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-blue-800">
          📋 {t.quotations || 'Quotations'}
        </h1>
        <button
          className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 hover:cursor-pointer transition"
          onClick={() => router.push('/quotations/new')}
        >
          + {t.newQuotation || 'New Quotation'}
        </button>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-3 mb-4">
        {/* Total Quotations Card */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 text-white rounded-xl p-4 md:p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-blue-300">
          <div className="flex items-center justify-between mb-1 md:mb-1">
            <div className="text-xs font-bold text-blue-100 uppercase tracking-widest">{t.totalQuotations || 'Total'}</div>
            <div className="text-xl md:text-lg">📋</div>
          </div>
          <div className="text-2xl md:text-3xl font-black mt-0.5">{insights.totalQuotations}</div>
          <div className="text-xs text-blue-100 mt-1 font-medium">{t.allTime || 'All Time'}</div>
        </div>

        {/* Quotations This Month Card */}
        <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-400 text-white rounded-xl p-4 md:p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-green-300">
          <div className="flex items-center justify-between mb-1 md:mb-1">
            <div className="text-xs font-bold text-green-100 uppercase tracking-widest">{t.thisMonth || 'This Month'}</div>
            <div className="text-xl md:text-lg">📅</div>
          </div>
          <div className="text-2xl md:text-3xl font-black mt-0.5">{insights.quotationsThisMonth}</div>
          <div className="text-xs text-green-100 mt-1 font-medium">
            {new Date().toLocaleDateString('en-IN', { month: 'short' })}
          </div>
        </div>

        {/* Latest Quotation Date Card */}
        <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-400 text-white rounded-xl p-4 md:p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-orange-300">
          <div className="flex items-center justify-between mb-1 md:mb-1">
            <div className="text-xs font-bold text-orange-100 uppercase tracking-widest">{t.latestQuotation || 'Latest'}</div>
            <div className="text-xl md:text-lg">⚡</div>
          </div>
          <div className="text-xl md:text-2xl font-black mt-0.5 break-words">
            {insights.latestDate ? insights.latestDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '-'}
          </div>
          <div className="text-xs text-orange-100 mt-1 font-medium">
            {insights.latestDate ? insights.latestDate.getFullYear() : t.noQuotations || 'No quotations'}
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-gradient-to-br from-purple-600 via-violet-500 to-pink-400 text-white rounded-xl p-4 md:p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-purple-300">
          <div className="flex items-center justify-between mb-1 md:mb-1">
            <div className="text-xs font-bold text-purple-100 uppercase tracking-widest">{t.byMonth || 'Monthly'}</div>
            <div className="text-xl md:text-lg">📊</div>
          </div>
          <div className="mt-1 md:mt-1 space-y-1 text-xs">
            {Object.entries(insights.quotationsByMonth).map(([month, count]) => (
              <div key={month} className="flex justify-between items-center bg-opacity-20 rounded px-2 py-0.5">
                <span className="text-purple-100 font-medium text-xs">{month}</span>
                <span className="font-black text-xs bg-purple-600 bg-opacity-30 px-1.5 py-0.5 rounded">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
        <table className="w-full bg-white min-w-max md:min-w-full">
          
          {/* Table Head */}
          <thead className="bg-gradient-to-r from-blue-800 to-blue-600 text-white hidden md:table-header-group">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t.srNo || 'Sr No'}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t.quotationNo || 'Quotation No'}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t.customer || 'Customer'}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t.mobile || 'Mobile'}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t.date || 'Date'}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t.amount || 'Amount'}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t.status || 'Status'}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t.actions || 'Actions'}</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-200">
            
            {loading && (
              <tr>
                <td colSpan="8" className="py-12 text-center">
                  <Loader message="Loading quotations..." size="md" />
                </td>
              </tr>
            )}

            {!loading && quotations.length === 0 && (
              <tr>
                <td colSpan="8" className="py-8 text-center text-gray-500">
                  No quotations found. / कोणतेही कोटेशन सापडले नाही.
                </td>
              </tr>
            )}

            {!loading && quotations.map((q, i) => {
              const id = q.quotation_id;

              return (
                <tr
                  key={id}
                  className={`block md:table-row mb-4 md:mb-0 border md:border-none rounded-lg md:rounded-none overflow-hidden ${
                    i % 2 === 0 ? 'bg-blue-50' : 'bg-blue-100'
                  }`}
                >
                  <td className="block md:table-cell px-4 py-2 text-sm text-gray-700 before:content-['Sr_No:'] before:font-bold before:text-gray-600 before:mr-2 md:before:content-none">
                    {i + 1}
                  </td>
                  <td className="block md:table-cell px-4 py-2 text-sm font-semibold text-blue-800 before:content-['Quotation_No:'] before:font-bold before:text-gray-600 before:mr-2 md:before:content-none">
                    {q.quotation_no}
                  </td>
                  <td className="block md:table-cell px-4 py-2 text-sm text-gray-700 before:content-['Customer:'] before:font-bold before:text-gray-600 before:mr-2 md:before:content-none">
                    {q.farmer_name || '-'}
                  </td>
                  <td className="block md:table-cell px-4 py-2 text-sm text-gray-700 before:content-['Mobile:'] before:font-bold before:text-gray-600 before:mr-2 md:before:content-none">
                    {q.farmer_mobile || '-'}
                  </td>
                  <td className="block md:table-cell px-4 py-2 text-sm text-gray-700 before:content-['Date:'] before:font-bold before:text-gray-600 before:mr-2 md:before:content-none">
                    {formatDate(q.quotation_date)}
                  </td>
                  <td className="block md:table-cell px-4 py-2 text-sm font-semibold text-green-700 before:content-['Amount:'] before:font-bold before:text-gray-600 before:mr-2 md:before:content-none">
                    ₹{Number(q.grand_total || 0).toFixed(2)}
                  </td>
                  <td className="block md:table-cell px-4 py-2 text-sm before:content-['Status:'] before:font-bold before:text-gray-600 before:mr-2 md:before:content-none">
                    <select
                      value={q.status || 'draft'}
                      onChange={(e) => updateStatus(id, e.target.value)}
                      className={`px-2 py-1 rounded-lg border text-xs font-semibold cursor-pointer ${
                        statusOptions.find(o => o.value === q.status)?.color || 'bg-gray-100'
                      }`}
                      disabled={q.status === 'converted'}
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
                        onClick={() => router.push(`/quotations/new?id=${id}`)}
                        className="flex-1 md:flex-auto text-blue-600 rounded-full border px-2 md:px-3 py-1 md:py-0 hover:cursor-pointer hover:text-blue-800 text-xs md:text-sm font-medium"
                      >
                        {t.edit || 'Edit'}
                      </button>

                      <button
                        onClick={() => router.push(`/quotation/print/${id}`)}
                        className="flex-1 md:flex-auto text-green-600 rounded-full border px-2 md:px-3 py-1 md:py-0 hover:cursor-pointer hover:text-green-800 text-xs md:text-sm font-medium"
                      >
                        {t.quotationFeaturePrint || 'Print'}
                      </button>

                      {/* {q.status !== 'converted' && (
                        <button
                          onClick={() => convertToBill(id)}
                          className="flex-1 md:flex-auto text-purple-600 rounded-full border px-2 md:px-3 py-1 md:py-0 hover:cursor-pointer hover:text-purple-800 text-xs md:text-sm font-medium"
                        >
                          → Bill
                        </button>
                      )} */}

                      <button
                        onClick={() => deleteQuotation(id)}
                        className="flex-1 md:flex-auto text-red-600 rounded-full border px-2 md:px-3 py-1 md:py-0 hover:text-red-900 hover:cursor-pointer text-xs md:text-sm font-medium"
                      >
                        {t.delete || 'Delete'}
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

export default function QuotationsPage() {
  return (
    <ProtectedRoute>
      <QuotationsPageContent />
    </ProtectedRoute>
  );
}
