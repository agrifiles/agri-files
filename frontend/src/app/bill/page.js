'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE, getCurrentUserId } from '@/lib/utils';
import Loader from '@/components/Loader';
import ProtectedRoute from '@/components/ProtectedRoute';

function BillsListPageContent() {
  const API = API_BASE;
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Helper to format date/timestamp to readable format
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr; // fallback if invalid
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Helper to format timestamp to readable format with time
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr; // fallback if invalid
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const ownerId = getCurrentUserId();
      const queryParams = ownerId ? `?owner_id=${ownerId}` : '';
      const res = await fetch(`${API}/api/bills${queryParams}`);
      const text = await res.text();
      const data = JSON.parse(text || '{}');
      setBills(data.bills || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this bill?')) return;
    try {
      await fetch(`${API}/api/bills/${id}`, { method: 'DELETE' });
      alert('Deleted');
      load();
    } catch (err) { console.error(err); alert('Delete failed'); }
  };

return (
  <div className="p-6 max-w-6xl mx-auto">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-800">Bills</h1>

      <button
        className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 hover:cursor-pointer transition"
        onClick={() => router.push('/bill/new')}
      >
        + New Bill
      </button>
    </div>

    <div className="overflow-hidden rounded-xl shadow-lg border border-gray-200">
      <table className="min-w-full bg-white">
        
        {/* Table Head — Always visible */}
        <thead className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Bill No</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Farmer</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Total</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-gray-200">
          
          {/* 🔵 SHOW LOADING INSIDE TABLE BODY */}
          {loading && (
            <tr>
              <td colSpan="7" className="py-12 text-center">
                <Loader message="Loading bills..." size="md" />
              </td>
            </tr>
          )}

          {/* 🟢 IF NOT LOADING & NO BILLS */}
          {!loading && bills.length === 0 && (
            <tr>
              <td colSpan="7" className="py-8 text-center text-gray-500">
                No bills found.
              </td>
            </tr>
          )}

          {/* 🟡 SHOW BILL ROWS WHEN LOADED */}
          {!loading &&
            bills.map((b, i) => (
              <tr
                key={b.bill_id}
                className={`hover:bg-gray-50 transition ${
                  i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="px-4 py-3 text-sm text-gray-700">{b.bill_id}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{b.bill_no || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{formatDate(b.bill_date || b.created_at)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{b.farmer_name || b.customer_name || '-'}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                  ₹{Number(b.total_amount || 0).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      b.status === 'final'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {b.status}
                  </span>
                </td>

                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => router.push(`/bill/${b.bill_id}`)}
                    className="text-blue-600 rounded-full border px-3 py-0 hover:cursor-pointer  hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => router.push(`/bill/print/${b.bill_id}`)}
                    className="text-purple-600 rounded-full border px-3 py-0 hover:cursor-pointer  hover:text-purple-800 text-sm font-medium"
                  >
                    Print
                  </button>

                  <button
                    onClick={() => handleDelete(b.bill_id)}
                    className="text-red-600 rounded-full border px-3 py-0 hover:text-red-900 hover:cursor-pointer text-sm font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

        </tbody>
      </table>
    </div>
  </div>
  );
}

export default function BillsListPage() {
  return (
    <ProtectedRoute>
      <BillsListPageContent />
    </ProtectedRoute>
  );
}
