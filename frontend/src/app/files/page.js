'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {API_BASE} from '../../lib/utils';
import Loader from '@/components/Loader';

export default function FilesPage() {
  const router = useRouter();

  const API = API_BASE 
  const [files, setFiles] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ownerId, setOwnerId] = useState(null);    // local user id

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
      const filesList = fJson?.files || [];

      const bRes = await fetch(`${API}/api/bills`);
      const bText = await bRes.text();
      let bJson = null;
      try { bJson = JSON.parse(bText); } catch (_) {}
      const billsList = bJson?.bills || [];

      setFiles(filesList);
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
      const res = await fetch(`${API}/api/files/${fileId}`, { method: "DELETE" });
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Files</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 hover:cursor-pointer transition"
          onClick={() => router.push('/new')}
        >
          + New File
        </button>
      </div>

      <div className="overflow-hidden rounded-xl shadow-lg border border-gray-200">
        <table className="min-w-full bg-white">
          
          {/* Table Head */}
          <thead className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Farmer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Mobile</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">File Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Bill No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
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
                // Match either by bill's file_id pointing to this file, explicit file.bill_id, or by bill_no equality
                return bFileId === id || bid === f.bill_id || (b.bill_no && f.bill_no && b.bill_no === f.bill_no);
              });
              const billNo = linkedBill?.bill_no ?? f.bill_no ?? "-";
              const billStatus = linkedBill?.status ?? f.status ?? "draft";

              return (
                <tr
                  key={id}
                  className={`hover:bg-gray-50 transition ${
                    i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-gray-700">{id}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{farmerName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{mobile}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(fileDate)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">{billNo}</td>
                  
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        billStatus === 'final'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {billStatus}
                    </span>
                  </td>

                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => editFile(id)}
                      className="text-blue-600 rounded-full border px-3 py-0 hover:cursor-pointer hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => openBillModal(id, f.bill_id)}
                      className="text-purple-600 rounded-full border px-3 py-0 hover:cursor-pointer hover:text-purple-800 text-sm font-medium"
                    >
                      {linkedBill ? "Update Bill" : "Link Bill"}
                    </button>

                    <button
                      onClick={() => router.push(`/files/print/${id}`)}
                      className="text-green-600 rounded-full border px-3 py-0 hover:cursor-pointer hover:text-green-800 text-sm font-medium"
                    >
                      Print
                    </button>

                    <button
                      onClick={() => deleteFile(id)}
                      className="text-red-600 rounded-full border px-3 py-0 hover:text-red-900 hover:cursor-pointer text-sm font-medium"
                    >
                      Delete
                    </button>
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
              {(files.find(f => f.id === modalFileId)?.bill_no || bills.find(b => (b.file_id ?? b.fileId) === modalFileId)) ? "Update Bill" : "Link Bill"}
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Bill
              </label>
              <select
                value={selectedBillId}
                onChange={(e) => setSelectedBillId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Select a bill --</option>
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
                Cancel
              </button>
              <button
                onClick={linkBill}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                disabled={isLinking || !selectedBillId}
              >
                {isLinking ? "Linking..." : "Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
