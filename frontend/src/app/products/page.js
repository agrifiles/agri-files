'use client';
import { useState,  useContext, useEffect } from 'react';
import { useRouter,  } from 'next/navigation';
import { LangContext } from '../layout';
import Loader from '../components/loader';


export default function InventoryPage() {
  const [loading, setLoading] = useState(false);

  const { t } = useContext(LangContext);
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const [form, setForm] = useState({
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

  // Reset form
  const resetForm = () => {
    setForm({
      description: '',
      hsn: '',
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

  // Handle input
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5006/products/list');
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
       setLoading(false);
    }
  };

  // Fetch on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Add / Update
// const handleSubmit = async (e) => {
//   e.preventDefault();
//     setLoading(true);
//     try {
//   const res = await fetch("http://localhost:5006/products/save", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(form),
//   })
//   const data = await res.json();
//   if (data.success) {
//     resetForm();
//     fetchProducts(); // refresh table
//   } else {
//     alert("Error saving product");
//   } } catch (err) {
//     console.error(err);
//   }
//   finally {
//       setLoading(false);
//   }
// };

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    setLoading(true);
    const res = await fetch("http://localhost:5006/products/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
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

  // Edit existing
  const handleEdit = (index) => {
    setEditingIndex(index);
    setForm(products[index]);
  };

  // Delete product
  const handleDelete = (index) => {
    const updated = products.filter((_, i) => i !== index);
    setProducts(updated);
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
                    <td className="px-3 py-2">{p.description}</td>
                    <td className="px-3 py-2 text-center">{p.qty}</td>
                    <td className="px-3 py-2 text-center">{p.unit}</td>
                    <td className="px-3 py-2 text-center">{p.sellingRate}</td>
                    <td className="px-3 py-2 text-center space-x-2">
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
