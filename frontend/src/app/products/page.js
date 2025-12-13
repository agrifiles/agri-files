'use client';
import { useState,  useContext, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LangContext } from '../layout';
import Loader from '@/components/Loader';
import { getCurrentUserId , API_BASE, getUserCompanyLinks} from '@/lib/utils';
import ProtectedRoute from '@/components/ProtectedRoute';

//import { API_BASE_URL } from '../../lib/config';

// 2) helper to get current user id from localStorage (robust)
// const getCurrentUserId = () => {
//   if (typeof window === 'undefined') return null;
//   try {
//     const raw = localStorage.getItem('user');
//     if (!raw) return null;
//     const u = JSON.parse(raw);
//     // try a few common keys
//     return u?.id ;
//   } catch (e) {
//     return null;
//   }
// };


function InventoryPageContent() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const { t } = useContext(LangContext);
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [linkedCompanies, setLinkedCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

const [form, setForm] = useState({
  product_id: null,                 // <-- added
    spare1: getCurrentUserId(),   
  description_of_good: '',
  hsn_code: '',
  batchNo: '',
  cmlNo: '',
  size: '',
  qty: '',
  govRate: '',
  companyRate: '',
  sellingRate: '',
  unit: '',
  sgst: '',
  cgst: '',
  bis: '',
  spare2: null, // company_id
});

// 2) reset clears product_id too
const resetForm = () => {
  setForm({
    product_id: null,
    description_of_good: '',
    hsn_code: '',
    batchNo: '',
    cmlNo: '',
    size: '',
    qty: '',
    govRate: '',
    companyRate: '',
    sellingRate: '',
    unit: '',
    sgst: '',
    cgst: '',
    bis: '',
    spare2: selectedCompanyId, // keep selected company
  });
  setEditingIndex(null);
};

// 3) handleEdit must set product_id (so backend will update)
const handleEdit = (index) => {
  setEditingIndex(index);
  const p = products[index] || {};

  setForm({
    product_id: p.product_id ?? null,    // <-- important!
    description_of_good: p.description_of_good ?? p.description ?? '',
    hsn_code: p.hsn_code ?? p.hsn ?? '',
    batchNo: p.batch_no ?? p.batchNo ?? '',
    cmlNo: p.cml_no ?? p.cmlNo ?? '',
    size: p.size ?? '',
    qty: p.qty ?? '',
    govRate: p.gov_rate ?? p.govRate ?? '',
    companyRate: p.company_rate ?? p.companyRate ?? '',
    sellingRate: p.selling_rate ?? p.sellingRate ?? '',
    unit: p.unit_of_measure ?? p.unit ?? '',
    sgst: p.sgst ?? '',
    cgst: p.cgst ?? '',
    bis: p.bis ?? '',
    spare2: p.spare2 || selectedCompanyId, // company_id
  });
};

const handleChange = (e) => {
  const { name, value } = e.target;
  setForm(prev => ({ ...prev, [name]: value }));
};

// Load linked companies on mount
useEffect(() => {
  const loadCompanies = async () => {
    try {
      const links = await getUserCompanyLinks();
      setLinkedCompanies(links);
      
      // Get company_id from URL params or use first company
      const urlCompanyId = searchParams.get('company_id');
      if (urlCompanyId) {
        setSelectedCompanyId(urlCompanyId);
        setForm(prev => ({ ...prev, spare2: urlCompanyId }));
      } else if (links.length > 0) {
        setSelectedCompanyId(links[0].company_id);
        setForm(prev => ({ ...prev, spare2: links[0].company_id }));
      }
    } catch (err) {
      console.error('Error loading companies:', err);
    }
  };
  loadCompanies();
}, [searchParams]);

const handleCompanyChange = (companyId) => {
  setSelectedCompanyId(companyId);
  setForm(prev => ({ ...prev, spare2: companyId }));
  resetForm();
};

const fetchProducts = async () => {
  try {
    setLoading(true);

    const uid = getCurrentUserId();
    console.log("UID", uid);

    const base = `${API_BASE}/products/list`;
    const url = uid ? `${base}?user_id=${encodeURIComponent(uid)}` : base;

    console.log("Final URL:", url);

    const res = await fetch(url);
    const data = await res.json();

    console.log("fetchProducts", data);

    if (data.success) setProducts(data.products);
  } catch (err) {
    console.error("Failed to fetch products", err);
  } finally {
    setLoading(false);
  }
};


  // Fetch on component mount
  useEffect(() => {
    fetchProducts();
  }, []);



const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    setLoading(true);
    const res = await fetch(`${API_BASE}/products/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    console.log("res", JSON.stringify(form))
    const data = await res.json();
    if (data.success) {
      resetForm();
      await fetchProducts(); // refresh table
    } else {
      alert("Error saving product");
    }
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};



  // Delete product
const handleDelete = async (index) => {
  const p = products[index];
  if (!p || !p.product_id) {
    setProducts(prev => prev.filter((_, i) => i !== index));
    return;
  }

  if (!confirm(`Delete product "${p.description_of_good || p.description}"?`)) return;

  // optimistic remove
  const before = products;
  setProducts(prev => prev.filter((_, i) => i !== index));

  try {
    const url = `${API_BASE}/products/${encodeURIComponent(p.product_id)}`;
    const res = await fetch(url, { method: 'DELETE' });
    const data = await res.json();

    if (!(res.ok && data.success)) {
      // rollback
      setProducts(before);
      alert(data?.error || data?.message || 'Failed to delete product');
    }
    // success -> you can optionally call fetchProducts() to refresh
  } catch (err) {
    console.error('Delete error', err);
    setProducts(before); // rollback
    alert('Server/network error while deleting');
  }
};


  const handleBack = (index) => {
   router.push('/settings'); 
  };

  // Filter products by selected company
  const filteredProducts = selectedCompanyId 
    ? products.filter(p => p.spare2 === selectedCompanyId)
    : products;

  const selectedCompanyName = linkedCompanies.find(c => c.company_id === selectedCompanyId)?.company_name || 'Unknown';

  return (
  
    <div className="p-6 max-w-7xl mx-auto">
      {loading && <Loader message="Loading products..." size="lg" fullScreen={true} />}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold leading-normal text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-blue-600">
          🛍️ {t.productList}
        </h1>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 hover:cursor-pointer transition font-semibold"
        >
          ← {t.back || 'Back'}
        </button>
      </div>

      {/* Company Selection Section */}
      {linkedCompanies.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6">
          <h3 className="text-lg font-bold text-blue-700 mb-4">📊 Select Company for Products</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {linkedCompanies.map((company) => (
              <button
                key={company.company_id}
                onClick={() => handleCompanyChange(company.company_id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedCompanyId === company.company_id
                    ? 'border-blue-600 bg-blue-50 shadow-lg'
                    : 'border-gray-300 bg-white hover:border-blue-400'
                }`}
              >
                <p className="font-bold text-gray-800">{company.company_name}</p>
                <p className="text-sm text-gray-600">Engineer: {company.engineer_name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side – Product Table */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl shadow-lg border-2 border-green-200">
            <table className="min-w-full bg-white">
              {/* Table Head */}
              <thead className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{t.description}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{t.qty}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{t.unit}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{t.sellingRate}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{t.actions}</th>
                </tr>
              </thead>
              
              {/* Table Body */}
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500 font-medium">
                      {t.noProducts}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p, i) => (
                    <tr
                      key={i}
                      className={`hover:bg-green-50 transition ${
                        i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700">{i + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.description_of_good}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700">{p.qty}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700">{p.unit_of_measure}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">₹{p.selling_rate}</td>
                      
                      <td className="px-4 py-3 flex gap-2">
                        {p.spare1 === "master_User" ? (
                          <>
                            <button
                              disabled
                              className="text-gray-400 cursor-not-allowed text-sm font-medium"
                              title="Master User product cannot be edited"
                            >
                              {t.edit}
                            </button>
                            <button
                              disabled
                              className="text-gray-400 cursor-not-allowed text-sm font-medium"
                              title="Master User product cannot be deleted"
                            >
                              {t.delete}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(i)}
                              className="text-blue-600 rounded-full border px-3 py-0 hover:cursor-pointer hover:text-blue-800 text-sm font-medium"
                            >
                              {t.edit}
                            </button>
                            <button
                              onClick={() => handleDelete(i)}
                              className="text-red-600 rounded-full border px-3 py-0 hover:text-red-900 hover:cursor-pointer text-sm font-medium"
                            >
                              {t.delete}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side – Product Form */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-lg rounded-xl border-2 border-green-200 p-5">
            <h2 className="text-xl font-bold text-green-700 mb-2">
              {editingIndex !== null ? t.editProduct : t.addProduct}
            </h2>
            {selectedCompanyId && (
              <p className="text-sm text-gray-600 mb-4">📍 Company: <span className="font-semibold text-blue-700">{selectedCompanyName}</span></p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Section 1: Basic Details */}
              <div className="border-b-2 border-green-100 pb-4">
                <h3 className="font-bold text-green-600 mb-3 text-sm">📋 Basic Details</h3>
                <div className="space-y-2.5">
                  <div className="flex flex-col">
                    <label className="font-semibold text-sm text-gray-700 mb-1">{t.description}</label>
                    <input 
                      name="description_of_good" 
                      value={form.description_of_good} 
                      onChange={handleChange} 
                      className="border-2 border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="flex flex-col">
                      <label className="font-semibold text-xs text-gray-700 mb-1">{t.hsn}</label>
                      <input 
                        name="hsn_code" 
                        value={form.hsn_code} 
                        onChange={handleChange} 
                        className="border-2 border-green-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="font-semibold text-xs text-gray-700 mb-1">{t.batchNo}</label>
                      <input 
                        name="batchNo" 
                        value={form.batchNo} 
                        onChange={handleChange} 
                        className="border-2 border-green-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="font-semibold text-xs text-gray-700 mb-1">{t.cmlNo}</label>
                      <input 
                        name="cmlNo" 
                        value={form.cmlNo} 
                        onChange={handleChange} 
                        className="border-2 border-green-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="font-semibold text-xs text-gray-700 mb-1">{t.size}</label>
                      <input 
                        name="size" 
                        value={form.size} 
                        onChange={handleChange} 
                        className="border-2 border-green-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing & Taxes */}
              <div className="border-b-2 border-green-100 pb-4">
                <h3 className="font-bold text-green-600 mb-3 text-sm">💰 Pricing & Taxes</h3>
                <div className="space-y-3">
                  {/* Row 1: Qty, GovRate, CompanyRate */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col">
                      <label className="font-semibold text-xs text-gray-700 mb-1">{t.qty}</label>
                      <input 
                        name="qty" 
                        type="number"
                        step="0.01"
                        value={form.qty} 
                        onChange={handleChange} 
                        className="border-2 border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="font-semibold text-xs text-gray-700 mb-1">{t.govRate}</label>
                      <input 
                        name="govRate" 
                        type="number"
                        step="0.01"
                        value={form.govRate} 
                        onChange={handleChange} 
                        className="border-2 border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="font-semibold text-xs text-gray-700 mb-1">{t.companyRate}</label>
                      <input 
                        name="companyRate" 
                        type="number"
                        step="0.01"
                        value={form.companyRate} 
                        onChange={handleChange} 
                        className="border-2 border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Row 2: SellingRate, Unit, BIS */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col">
                      <label className="font-semibold text-xs text-gray-700 mb-1">{t.sellingRate}</label>
                      <input 
                        name="sellingRate" 
                        type="number"
                        step="0.01"
                        value={form.sellingRate} 
                        onChange={handleChange} 
                        className="border-2 border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="font-semibold text-xs text-gray-700 mb-1">{t.unit}</label>
                      <input 
                        name="unit" 
                        value={form.unit} 
                        onChange={handleChange} 
                        className="border-2 border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="font-semibold text-xs text-gray-700 mb-1">{t.bis}</label>
                      <input 
                        name="bis" 
                        value={form.bis} 
                        onChange={handleChange} 
                        className="border-2 border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                      />
                    </div>
                  </div>

                  {/* Row 3: SGST %, CGST % */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col">
                      <label className="font-semibold text-xs text-gray-700 mb-1">{t.sgst} %</label>
                      <input 
                        name="sgst" 
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={form.sgst} 
                        onChange={handleChange} 
                        className="border-2 border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="font-semibold text-xs text-gray-700 mb-1">{t.cgst} %</label>
                      <input 
                        name="cgst" 
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={form.cgst} 
                        onChange={handleChange} 
                        className="border-2 border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                        placeholder="0.00"
                      />
                    </div>

                    <div></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transition shadow-md text-sm"
                >
                  {editingIndex !== null ? t.update : t.add}
                </button>

                {editingIndex !== null && (
                  <button 
                    type="button" 
                    onClick={resetForm} 
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 font-bold rounded-lg hover:bg-gray-400 transition text-sm"
                  >
                    {t.cancel}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <ProtectedRoute>
      <InventoryPageContent />
    </ProtectedRoute>
  );
}
