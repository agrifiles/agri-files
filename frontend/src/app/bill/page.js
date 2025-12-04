'use client';
import { useState,  useContext, useEffect } from 'react';
import { useRouter,  } from 'next/navigation';
import { LangContext } from '../layout';
import Loader from '../components/loader';
import { API_BASE } from '../../lib/utils';

//import { API_BASE_URL } from '../../lib/config';

// 2) helper to get current user id from localStorage (robust)
const getCurrentUserId = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    // try a few common keys
    return u?.user_id ?? u?.id ?? u?.userId ?? u?.uid ?? null;
  } catch (e) {
    return null;
  }
};


export default function InventoryPage() {
  const [loading, setLoading] = useState(false);

  const { t } = useContext(LangContext);
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

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
  });
};

const handleChange = (e) => {
  const { name, value } = e.target;
  setForm(prev => ({ ...prev, [name]: value }));
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


    // back to settings
  const handleBack = (index) => {
   router.push('/settings'); 
  };

  return (
  
    <div className="min-h-screen bg-gray-50 py-2  px-6 flex flex-col">
      {/* <h1 className="text-3xl font-bold text-cyan-700 mb-6">{t.products}</h1> */}
 {loading && <Loader />}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left side – Product Table */}
        <div className="w-full lg:w-2/3 bg-white shadow-lg rounded-lg p-6 overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4 text-cyan-700">{t.productList}</h2>

          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-cyan-600 text-white">
              <tr>
                <th className="px-3 py-2 border">#</th>
                <th className="px-3 py-2 border">{t.description}</th>
                <th className="px-3 py-2 border">{t.qty}</th>
                <th className="px-3 py-2 border">{t.unit}</th>
                <th className="px-3 py-2 border">{t.sellingRate}</th>
                <th className="px-3 py-2 border">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500">
                    {t.noProducts}
                  </td>
                </tr>
              ) : (
                products.map((p, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-100 transition border-b"
                  >
                    <td className="px-3 py-2 text-center">{i + 1}</td>
                    <td className="px-3 py-2">{p.description_of_good}</td>
                    <td className="px-3 py-2 text-center">{p.qty}</td>
                    <td className="px-3 py-2 text-center">{p.unit_of_measure}</td>
                    <td className="px-3 py-2 text-center">{p.selling_rate}</td>

                    {/* <td className="px-3 py-2 text-center space-x-2">
                      <button
                        onClick={() => handleEdit(i)}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        {t.edit}
                      </button>
                      <button
                        onClick={() => handleDelete(i)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        {t.delete}
                      </button>

                    </td> */}

                    <td className="px-3 py-2 text-center space-x-2">
  {p.spare1 === "master_User" ? (
    <>
      <button
        disabled
        className="text-gray-400 cursor-not-allowed font-semibold"
        title="Master User product cannot be edited"
      >
        {t.edit}
      </button>
      <button
        disabled
        className="text-gray-400 cursor-not-allowed font-semibold ml-2"
        title="Master User product cannot be deleted"
      >
        {t.delete}
      </button>
    </>
  ) : (
    <>
      <button
        onClick={() => handleEdit(i)}
        className="text-blue-600 hover:text-blue-800 font-semibold"
      >
        {t.edit}
      </button>
      <button
        onClick={() => handleDelete(i)}
        className="text-red-600 hover:text-red-800 font-semibold ml-2"
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

        {/* Right side – Product Form */}
        <div className="w-full lg:w-1/3 bg-white shadow-lg rounded-lg p-6">

<div className="flex items-center justify-between ">          <h2 className="text-xl font-semibold text-cyan-700">
            {editingIndex !== null ? t.editProduct : t.addProduct}
          </h2>
          

                          <button
                  onClick={handleBack}
                  className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition text-sm m-2.5"
                >
                  {t.back || 'Back to Settings'}
                </button>

        </div>

                

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="flex flex-col col-span-2">
              <label className="font-semibold mb-1">{t.description}</label>
              
              <input name="description_of_good" value={form.description_of_good} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.hsn}</label>
              <input name="hsn_code" value={form.hsn_code} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.batchNo}</label>
              <input name="batchNo" value={form.batchNo} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.cmlNo}</label>
              <input name="cmlNo" value={form.cmlNo} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.size}</label>
              <input name="size" value={form.size} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.qty}</label>
              <input name="qty" value={form.qty} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.govRate}</label>
              <input name="govRate" value={form.govRate} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.companyRate}</label>
              <input name="companyRate" value={form.companyRate} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.sellingRate}</label>
              <input name="sellingRate" value={form.sellingRate} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.unit}</label>
              <input name="unit" value={form.unit} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.sgst}</label>
              <input name="sgst" value={form.sgst} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.cgst}</label>
              <input name="cgst" value={form.cgst} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>

            <div className="flex flex-col col-span-2">
              <label className="font-semibold mb-1">{t.bis}</label>
              <input name="bis" value={form.bis} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>

            <div className="col-span-2 flex justify-between mt-4">

              <button type="submit" className="px-5 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-700">
                {editingIndex !== null ? t.update : t.add}
              </button>

              {editingIndex !== null && (
                <button type="button" onClick={resetForm} className="px-5 py-1 bg-gray-300 rounded hover:bg-gray-400">
                  {t.cancel}
                </button>
              )}


            </div>




          </form>
        </div>
      </div>
    </div>
  );
}
