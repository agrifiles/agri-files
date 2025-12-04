'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {API_BASE} from '../../lib/utils';

export default function FilesPage() {
  const router = useRouter();

  const API = API_BASE 
  const [files, setFiles] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ownerId, setOwnerId] = useState(null);    // local user id

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

  // Link bill → file
  const linkBill = async (fileId, billId) => {
    if (!billId || !fileId) return;
    if (!confirm("Link this bill to the file and set status to FINAL?")) return;

    try {
      const res = await fetch(`${API}/api/files/${fileId}/link-bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill_id: billId })
      });

      const text = await res.text();
      let data = null;
      try { data = JSON.parse(text); } catch (_) {}

      if (!res.ok || !data?.success) {
        console.error("LINK ERROR", text);
        alert("Linking bill failed");
        return;
      }

      alert("Bill linked successfully!");
      loadData();
    } catch (err) {
      console.error("LINK EXCEPTION", err);
      alert("Network error");
    }
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

  // Row color by status
  const rowStyle = (file) => {
    const bill = bills.find(b => (b.bill_id ?? b.id) === file.bill_id);
    const status = bill?.status ?? file.status ?? "draft";

    if (status === "draft")
      return { background: "rgba(255, 120, 120, 0.08)" }; // faint red
    if (status === "final")
      return { background: "rgba(120, 255, 120, 0.08)" }; // faint green
    return {};
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Files</h1>

      {loading ? <p>Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="text-left bg-gray-100">
                <th className="p-2 border-b">ID</th>
                <th className="p-2 border-b">Farmer</th>
                <th className="p-2 border-b">Mobile</th>
                <th className="p-2 border-b">File Date</th>
                <th className="p-2 border-b">Bill No</th>
                <th className="p-2 border-b">Link Bill</th>
                <th className="p-2 border-b">Status</th>
                <th className="p-2 border-b">Actions</th>
              </tr>
            </thead>

            <tbody>
              {files.length === 0 ? (
                <tr>
                  <td className="p-3 text-center text-gray-500" colSpan={8}>No files found</td>
                </tr>
              ) : (
                files.map((f) => {
                  const id = f.id ?? f.file_id;
                  const farmerName = f.farmer_name ?? f.farmerName;
                  const mobile = f.mobile ?? f.farmer_mobile ?? "";
                  const fileDate = f.file_date ?? f.fileDate ?? "";
                  const linkedBill = bills.find(b => (b.bill_id ?? b.id) === f.bill_id);
                  const billNo = linkedBill?.bill_no ?? "";

                  return (
                    <tr key={id} style={rowStyle(f)}>
                      <td className="p-2 border-b">{id}</td>
                      <td className="p-2 border-b">{farmerName}</td>
                      <td className="p-2 border-b">{mobile}</td>
                      <td className="p-2 border-b">{fileDate}</td>
                      <td className="p-2 border-b">{billNo}</td>

                      <td className="p-2 border-b">
                        <select
                          className="border p-1 rounded"
                          value={f.bill_id ?? ""}
                          onChange={(e) => linkBill(id, e.target.value)}
                        >
                          <option value="">-- select bill --</option>
                          {bills.map(b => (
                            <option key={b.bill_id ?? b.id} value={b.bill_id ?? b.id}>
                              {b.bill_no}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-2 border-b">
                        {(linkedBill?.status ?? f.status ?? "draft")}
                      </td>

                      <td className="p-2 border-b">
                        <button
                          className="px-3 py-1 bg-green-200 text-black rounded mr-2"
                          onClick={() => editFile(id)}
                        >
                          Edit
                        </button>

                        <button
                          className="px-3 py-1 bg-red-300 text-black rounded"
                          onClick={() => deleteFile(id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
