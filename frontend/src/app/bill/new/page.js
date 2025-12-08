'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/utils';
import Loader from '@/components/Loader';
import ProtectedRoute from '@/components/ProtectedRoute';

function NewBillPageContent() {
  const API = API_BASE;
  const router = useRouter();

  // Extract user ID from localStorage
  const getUserId = () => {
    if (typeof window === 'undefined') return null;
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      return user?.id ?? null;
    } catch (e) {
      return null;
    }
  };

  const userId = getUserId();

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // bill header
  const [billNo, setBillNo] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [lastFetchedMonthYear, setLastFetchedMonthYear] = useState(''); // track to avoid duplicate calls
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [status, setStatus] = useState('draft');

  // items
  const [items, setItems] = useState([]);

  // modal
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
const [searchTerm, setSearchTerm] = useState('');
const [filteredProducts, setFilteredProducts] = useState([]);

  // Fetch next bill number from backend
  const fetchNextBillNo = async (dateStr) => {
    if (!userId) return;
    
    const date = new Date(dateStr);
    const month = date.getMonth() + 1; // 1-12
    const year = date.getFullYear();
    const monthYearKey = `${year}-${month}`;
    
    // Skip if already fetched for this month/year
    if (monthYearKey === lastFetchedMonthYear) return;
    
    try {
      const res = await fetch(`${API}/api/bills/next-bill-no?owner_id=${userId}&month=${month}&year=${year}`);
      const data = await res.json();
      if (data.success && data.bill_no) {
        setBillNo(data.bill_no);
        setLastFetchedMonthYear(monthYearKey);
      }
    } catch (err) {
      console.error('Failed to fetch next bill number:', err);
    }
  };

  // Handle bill date change - only fetch if month/year changed
  const handleBillDateChange = (newDate) => {
    const oldDate = new Date(billDate);
    const newDateObj = new Date(newDate);
    
    setBillDate(newDate);
    
    // Check if month or year changed
    if (oldDate.getMonth() !== newDateObj.getMonth() || oldDate.getFullYear() !== newDateObj.getFullYear()) {
      fetchNextBillNo(newDate);
    }
  };

  // Fetch next bill number on mount
  useEffect(() => {
    if (userId && billDate) {
      fetchNextBillNo(billDate);
    }
  }, [userId]);
  // load products
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      const res = await fetch(`${API}/products/list?${params.toString()}`);
      const text = await res.text();
      const data = JSON.parse(text || '{}');
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

// fetch products on mount
useEffect(() => { loadProducts(); }, []);

useEffect(() => {
  // whenever products update or searchTerm changes, update filteredProducts
  const q = (searchTerm || '').trim().toLowerCase();
  if (!q) {
    setFilteredProducts(products || []);
  } else {
    setFilteredProducts(
      (products || []).filter((p) => {
        const name = (p.description_of_good || p.name || '').toString().toLowerCase();
        const hsn = (p.hsn_code || '').toString().toLowerCase();
        const sku = (p.sku || p.product_code || '').toString().toLowerCase();
        return name.includes(q) || hsn.includes(q) || sku.includes(q);
      })
    );
  }
}, [products, searchTerm]);
const openAddItemModal = () => {
  setSearchTerm('');
  setSelectedProduct(null);
  setShowModal(true);
};
  const addItemFromProduct = (prod) => {
    // prod can be existing product or newly created product object
    const item = {
      product_id: prod.product_id ?? prod.id,
      description: prod.description_of_good || prod.name || prod.product_name || '',
      hsn: prod.hsn_code || prod.hsn || '',
      batch_no: prod.batch_no || prod.batchNo || '',
      size: prod.size || '',
      gov_rate: Number(prod.gov_rate || prod.govRate || 0),
      sales_rate: Number(prod.selling_rate || prod.sellingRate || prod.sales_rate || 0),
      uom: prod.unit_of_measure || prod.unit || prod.uom || '',
      gst_percent: Number(prod.sgst || prod.cgst || prod.gst_percent || 0),
      qty: 1,
      amount: Number(prod.selling_rate || prod.sellingRate || prod.sales_rate || 0)
    };
    setItems(prev => [...prev, item]);
    setShowModal(false);
  };


  // Modal flow: user picks an existing product to add (no inline create)

  // update item (qty/rate/gst)
  const updateItem = (idx, patch) => {
    setItems(prev => prev.map((it, i) => i===idx ? {...it, ...patch, amount: Number(((patch.qty ?? it.qty) * (patch.sales_rate ?? it.sales_rate)).toFixed(2)) } : it));
  };

  const removeItem = (idx) => setItems(prev => prev.filter((_,i)=>i!==idx));

  const computeTotals = () => {
    let taxable = 0;
    let totalGst = 0;
    for (const it of items) {
      const amt = Number(it.amount || 0);
      taxable += amt;
      const gst = (Number(it.gst_percent||0)/100) * amt;
      totalGst += gst;
    }
    taxable = Number(taxable.toFixed(2));
    totalGst = Number(totalGst.toFixed(2));
    const total = Number((taxable + totalGst).toFixed(2));
    return { taxable, totalGst, total };
  };

  const saveBill = async () => {
    if (!customerName) { alert('customer name required'); return; }
    if (items.length === 0) { alert('Add at least one item'); return; }

    // build payload: include product object inline if product_id missing
    const payloadItems = items.map(it => {
      const copy = {...it};
      // send product object only if product_id missing
      if (!it.product_id && it.product) {
        copy.product = it.product;
      }
      return copy;
    });

    const payload = {
      bill_no: billNo,
      bill_date: billDate,
      farmer_name: customerName,
      farmer_mobile: customerMobile,
      status,
      created_by: userId,
      items: payloadItems
    };

    setIsSaving(true);
    try {
      const res = await fetch(`${API}/api/bills`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
      });
      const text = await res.text();
      const data = JSON.parse(text || '{}');
      if (!res.ok || !data.success) {
        console.error('create bill failed', text);
        setIsSaving(false);
        alert('Failed to create bill');
        return;
      }
      // Navigate without alert to keep loader visible
      router.push(`/bill/print/${data.bill.bill_id}`); // navigate to print
    } catch (err) {
      console.error(err);
      setIsSaving(false);
      alert('Network error creating bill');
    }
  };

  const totals = computeTotals();

/* Replace your current return(...) with this improved UI */
return (
  <div className="p-6 max-w-4xl mx-auto">
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Create Bill</h1>
          <p className="text-sm text-gray-500 mt-1">Create a new bill — add items from existing products.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
            onClick={() => router.push('/bill')}
            type="button"
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition"
            onClick={saveBill}
            type="button"
          >
            Save Bill
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Bill No</label>
          <input
            className="mt-1 block w-full rounded-md border-gray-200 shadow-sm px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
            value={billNo}
            disabled
            placeholder="Auto-generated"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Bill Date</label>
          <input
            type="date"
            className="mt-1 block w-full rounded-md border-gray-200 shadow-sm px-3 py-2 bg-white"
            value={billDate}
            onChange={(e) => handleBillDateChange(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Customer</label>
          <input
            className="mt-1 block w-full rounded-md border-gray-200 shadow-sm px-3 py-2 bg-white"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer / Farmer name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mobile</label>
          <input
            className="mt-1 block w-full rounded-md border-gray-200 shadow-sm px-3 py-2 bg-white"
            value={customerMobile}
            onChange={(e) => setCustomerMobile(e.target.value)}
            placeholder="Mobile number"
          />
        </div>
      </div>

      {/* Items section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Items</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={openAddItemModal}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-600 text-white rounded-md shadow hover:bg-cyan-700 transition"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              Add Item
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-100 shadow-sm">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">HSN</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Qty</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Rate</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">GST%</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {items.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500">
                    No items added. Click <strong className="text-cyan-600">Add Item</strong> to include products.
                  </td>
                </tr>
              )}

              {items.map((it, idx) => (
                <tr key={idx} className={`transition hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  {/* Description (read-only) */}
                  <td className="px-4 py-3 text-sm text-gray-800">
                    <input
                      className="w-full bg-transparent border-0 focus:ring-0 text-sm"
                      value={it.description || ''}
                      readOnly
                      disabled
                    />
                    <div className="text-xs text-gray-400 mt-1">{it.size ? `Size: ${it.size}` : ''}</div>
                  </td>

                  {/* HSN (read-only) */}
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <input className="w-full bg-transparent border-0 focus:ring-0 text-sm" value={it.hsn || ''} readOnly disabled />
                  </td>

                  {/* Qty (editable) */}
                  <td className="px-4 py-3 text-sm text-right">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-24 rounded-md border border-gray-200 px-2 py-1 text-right focus:ring-1 focus:ring-cyan-300"
                      value={it.qty ?? 0}
                      onChange={(e) => updateItem(idx, { qty: Number(e.target.value) })}
                    />
                  </td>

                  {/* Rate (read-only) */}
                  <td className="px-4 py-3 text-sm text-right">
                    <input className="w-28 bg-transparent border-0 text-sm text-right" value={Number(it.sales_rate || 0).toFixed(2)} readOnly disabled />
                  </td>

                  {/* GST% (editable) */}
                  <td className="px-4 py-3 text-sm text-right">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-20 rounded-md border border-gray-200 px-2 py-1 text-right focus:ring-1 focus:ring-cyan-300"
                      value={it.gst_percent ?? 0}
                      onChange={(e) => updateItem(idx, { gst_percent: Number(e.target.value) })}
                    />
                  </td>

                  {/* Amount (computed, read-only) */}
                  <td className="px-4 py-3 text-sm font-medium text-right">
                    {Number(it.amount || 0).toFixed(2)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-sm text-red-600 hover:text-red-800"
                      type="button"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end items-end gap-8">
        <div className="text-right">
          <div className="text-sm text-gray-500">Taxable</div>
          <div className="text-lg font-semibold text-gray-800">{totals.taxable.toFixed(2)}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Total GST</div>
          <div className="text-lg font-semibold text-gray-800">{totals.totalGst.toFixed(2)}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Grand Total</div>
          <div className="text-2xl font-bold text-gray-900">{totals.total.toFixed(2)}</div>
        </div>
      </div>
    </div>

    {/* PRODUCT SELECTOR / CREATE MODAL */}
    {showModal && (
      <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />

        <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Select Product</h3>
            <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowModal(false)} aria-label="Close">
              ✕
            </button>
          </div>

          <div className="p-4">
            <div className="mb-3">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, HSN or code..."
                className="w-full rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-300"
                autoFocus
              />
            </div>

            <div className="mb-2 text-sm text-gray-600">{loadingProducts ? '' : `${filteredProducts.length} product${filteredProducts.length!==1 ? 's' : ''}`}</div>
            <div className="max-h-72 overflow-auto border border-gray-100 rounded-md">
              {loadingProducts ? (
                <div className="p-6 text-center text-gray-500">Loading products...</div>
              ) : (filteredProducts.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No products found</div>
              ) : (
                filteredProducts.map((p) => {
                  const pid = p.product_id ?? p.id;
                  return (
                    <div
                      key={pid}
                      onClick={() => {
                        addItemFromProduct(p);
                        setShowModal(false);
                      }}
                      className="p-3 cursor-pointer border-b last:border-b-0 hover:bg-cyan-50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800">{p.description_of_good || p.name || 'Unnamed'}</div>
                          <div className="text-xs text-gray-500 mt-1">HSN: {p.hsn_code ?? '-'} · Rate: {Number(p.selling_rate || p.sales_rate || 0).toFixed(2)}</div>
                        </div>
                        <div className="text-sm text-gray-600">{p.uom ?? ''}</div>
                      </div>
                    </div>
                  );
                })
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {isSaving && <Loader message="Saving bill..." size="lg" fullScreen={true} />}
  </div>
);
}

export default function NewBillPage() {
  return (
    <ProtectedRoute>
      <NewBillPageContent />
    </ProtectedRoute>
  );
}