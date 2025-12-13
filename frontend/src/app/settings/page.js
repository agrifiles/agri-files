'use client';
import { useRouter } from 'next/navigation';
import { useContext, useState, useEffect } from 'react';
import { LangContext } from '../layout';
import { API_BASE, getCurrentUser, getUserCompanyLinks, getCurrentUserId } from '@/lib/utils';
import ProtectedRoute from '@/components/ProtectedRoute';
import CompanySettings from '../components/CompanySettings';
import Loader from '@/components/Loader';

function HomePageContent() {
      const { t } = useContext(LangContext);
      const router = useRouter();
      const [activeTab, setActiveTab] = useState('products');
      const [linkedCompanies, setLinkedCompanies] = useState([]);
      const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [copyToOtherCompanies, setCopyToOtherCompanies] = useState(false);
  
  // Products state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form, setForm] = useState({
    product_id: null,
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
    spare2: null,
    spare3: null,  // Add slot number to initial state
  });

  // Company-specific fields for copying
  const [companySpecificFields, setCompanySpecificFields] = useState({});

  // Fetch user's linked companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const links = await getUserCompanyLinks();
        setLinkedCompanies(links);
        // Set default to first company
        if (links.length > 0) {
          // Store as string to match API data
          const firstCompanyId = String(links[0].company_id);
          console.log('Setting initial selectedCompanyId:', firstCompanyId, 'Type:', typeof firstCompanyId);
          setSelectedCompanyId(firstCompanyId);
          setForm(prev => ({ ...prev, spare2: firstCompanyId }));
        }
      } catch (err) {
        console.error('Error fetching companies:', err);
      }
    };
    fetchCompanies();
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const uid = getCurrentUserId();
      const base = `${API_BASE}/products/list`;
      const url = uid ? `${base}?user_id=${encodeURIComponent(uid)}` : base;
      const res = await fetch(url);
      const data = await res.json();
      console.log('Fetched products:', data);
      if (data.success) {
        // Debug: Log sample product to check spare2 value
        if (data.products && data.products.length > 0) {
          console.log('Sample product spare2:', data.products[0].spare2, 'Type:', typeof data.products[0].spare2);
        }
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh companies AND fetch products ONLY when clicking on Products button
  useEffect(() => {
    if (activeTab === 'products') {
      const refetchCompanies = async () => {
        try {
          console.log('🔄 Fetching companies fresh from backend...');
          
          // Clear the cached company links in localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('userCompanyLinks');
          }
          
          const links = await getUserCompanyLinks();
          console.log('✅ Fresh companies from backend:', links);
          
          // CLEAR everything first
          setLinkedCompanies([]);
          setSelectedCompanyId('');
          setProducts([]);
          setIsNewUser(false);
          setForm(prev => ({ ...prev, spare2: null }));
          
          // If no companies, stop here
          if (!links || links.length === 0) {
            console.log('⚠️ No companies linked - all cleared');
            return;
          }
          
          console.log('Companies count:', links.length);
          
          // Now set the fresh data
          setLinkedCompanies(links);
          const firstCompanyId = String(links[0].company_id);
          setSelectedCompanyId(firstCompanyId);
          setForm(prev => ({ ...prev, spare2: firstCompanyId }));
          
          // Fetch products for first company
          await fetchProducts();
          
          // Check if user is new FOR THIS COMPANY
          const uid = getCurrentUserId();
          const uidStr = String(uid);
          
          const checkRes = await fetch(`${API_BASE}/products/check-new-user/${uidStr}/${firstCompanyId}`);
          const checkData = await checkRes.json();
          if (checkData.success) {
            setIsNewUser(checkData.isNewUser);
            console.log('New user for company check:', checkData.isNewUser);
            
            // If new user FOR THIS COMPANY, auto-copy standard products
            if (checkData.isNewUser) {
              const slotNo = links[0].company_slot;
              console.log('✅ Auto-copying for Company', firstCompanyId, 'Slot:', slotNo);
              await copyStandardProducts(uidStr, firstCompanyId, slotNo);
            }
          }
        } catch (err) {
          console.error('Error refetching companies:', err);
          // On error, clear everything to be safe
          setLinkedCompanies([]);
          setSelectedCompanyId('');
          setProducts([]);
          setIsNewUser(false);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('userCompanyLinks');
          }
        }
      };
      refetchCompanies();
    }
  }, [activeTab]);

  const [copyingCompanies, setCopyingCompanies] = useState(new Set()); // Track companies being copied

  // Copy standard products to user on first setup
  const copyStandardProducts = async (userId, companyId, slotNo) => {
    try {
      // Validate inputs
      if (!userId || !companyId || slotNo === undefined || slotNo === null) {
        console.error('Invalid inputs for copyStandardProducts:', { userId, companyId, slotNo });
        return;
      }

      // SAFEGUARD: Check if already copying this company
      if (copyingCompanies.has(companyId)) {
        console.log('⏭️ Copy already in progress for company:', companyId);
        return;
      }

      // Mark as copying
      setCopyingCompanies(prev => new Set(prev).add(companyId));

      console.log(`Copying standard products for user ${userId}, company ${companyId}, slot ${slotNo}`);
      setLoading(true);
      
      const res = await fetch(`${API_BASE}/products/copy-standard-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: String(userId),
          companyId: String(companyId),
          slotNo: Number(slotNo)
        })
      });
      
      const data = await res.json();
      console.log('Copy response:', data);
      
      if (data.success) {
        console.log(`✅ Copied ${data.copiedCount} standard products`);
        setIsNewUser(false);
        // Refresh products list
        await fetchProducts();
      } else {
        console.error('Error copying standard products:', data.error);
      }
    } catch (err) {
      console.error('Failed to copy standard products:', err);
    } finally {
      // Mark copy as complete
      setCopyingCompanies(prev => {
        const newSet = new Set(prev);
        newSet.delete(companyId);
        return newSet;
      });
      setLoading(false);
    }
  };

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
      spare2: selectedCompanyId,
      spare3: null,  // Reset slot number
    });
    setCopyToOtherCompanies(false);
    setCompanySpecificFields({});
    setEditingIndex(null);
  };

  const handleCompanyChange = async (companyId) => {
    // Ensure consistent string type for comparison
    const companyIdStr = String(companyId);
    console.log('Company changed to:', companyIdStr);
    
    setSelectedCompanyId(companyIdStr);
    setForm(prev => ({ ...prev, spare2: companyIdStr }));
    
    // Check if this company is new (no products for this company yet)
    const uid = getCurrentUserId();
    const uidStr = String(uid);
    
    try {
      const checkRes = await fetch(`${API_BASE}/products/check-new-user/${uidStr}/${companyIdStr}`);
      const checkData = await checkRes.json();
      
      if (checkData.success && checkData.isNewUser) {
        console.log('✅ Company', companyIdStr, 'is new - auto-copying products');
        
        // Find the company object to get slot number
        const company = linkedCompanies.find(c => String(c.company_id) === companyIdStr);
        if (company) {
          await copyStandardProducts(uidStr, companyIdStr, company.company_slot);
        }
      }
    } catch (err) {
      console.error('Error checking company products:', err);
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    const p = filteredProducts[index] || {};
    setForm({
      product_id: p.product_id ?? null,
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
      spare2: p.spare2 || selectedCompanyId,
      spare3: p.spare3,  // IMPORTANT: Preserve the slot number from product
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCompanySpecificChange = (companyId, field, value) => {
    setCompanySpecificFields(prev => ({
      ...prev,
      [String(companyId)]: {
        ...prev[String(companyId)],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Get current user ID
      const userId = getCurrentUserId();
      
      // Get the company_slot for the selected company
      const selectedCompany = linkedCompanies.find(c => String(c.company_id) === String(selectedCompanyId));
      const selectedSlotNo = selectedCompany?.company_slot;

      // If copying to other companies and not editing
      if (copyToOtherCompanies && editingIndex === null) {
        // Get other company IDs
        const otherCompanies = linkedCompanies.filter(c => String(c.company_id) !== String(selectedCompanyId));
        
        // Save for selected company first with correct spare1, spare2, spare3
        const productForSelectedCompany = {
          product_id: form.product_id,
          spare1: userId,
          description_of_good: form.description_of_good,
          
          // Basic details
          hsn_code: form.hsn_code,
          batchNo: form.batchNo,
          cmlNo: form.cmlNo,
          size: form.size,
          
          // Pricing & Taxes
          qty: form.qty,
          govRate: form.govRate,
          companyRate: form.companyRate,
          sellingRate: form.sellingRate,
          unit: form.unit,
          bis: form.bis,
          sgst: form.sgst,
          cgst: form.cgst,
          
          // Critical fields
          spare2: String(selectedCompanyId),
          spare3: selectedSlotNo,
        };

        console.log(`Saving product for selected company ${selectedCompanyId}:`, productForSelectedCompany);

        const res1 = await fetch(`${API_BASE}/products/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productForSelectedCompany),
        });
        const data1 = await res1.json();
        if (!data1.success) {
          alert("Error saving product for selected company");
          return;
        }

        // Save for other companies
        for (const company of otherCompanies) {
          const companyId = String(company.company_id);
          const companyFields = companySpecificFields[companyId] || {};
          
          // Build product with ALL company-specific fields (both basic details & pricing/taxes)
          const productForCompany = {
            product_id: form.product_id,
            spare1: userId,
            description_of_good: form.description_of_good,
            
            // Basic details - use company-specific or fallback to base
            hsn_code: companyFields.hsn_code || form.hsn_code,
            batchNo: companyFields.batchNo || form.batchNo,
            cmlNo: companyFields.cmlNo || form.cmlNo,
            size: companyFields.size || form.size,
            
            // Pricing & Taxes - use company-specific or fallback to base
            qty: companyFields.qty || form.qty,
            govRate: companyFields.govRate || form.govRate,
            companyRate: companyFields.companyRate || form.companyRate,
            sellingRate: companyFields.sellingRate || form.sellingRate,
            unit: companyFields.unit || form.unit,
            bis: companyFields.bis || form.bis,
            sgst: companyFields.sgst || form.sgst,
            cgst: companyFields.cgst || form.cgst,
            
            // Critical fields - MUST BE SET FOR EACH COMPANY
            spare1: userId,
            spare2: companyId,
            spare3: company.company_slot,
          };

          console.log(`Saving product for company ${companyId} (slot ${company.company_slot}):`, productForCompany);

          const res = await fetch(`${API_BASE}/products/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(productForCompany),
          });
          const data = await res.json();
          if (!data.success) {
            alert(`Error saving product for company ${company.company_name}`);
            return;
          }
        }

        resetForm();
        await fetchProducts();
        alert("Product created for all companies successfully!");
      } else {
        // Normal save (single company or editing) with correct spare1, spare2, spare3
        // When editing, use the product's original spare3; when creating, use current slot
        const slotForSave = editingIndex !== null ? form.spare3 : selectedSlotNo;
        
        const productToSave = {
          product_id: form.product_id,
          spare1: userId,
          description_of_good: form.description_of_good,
          
          // Basic details
          hsn_code: form.hsn_code,
          batchNo: form.batchNo,
          cmlNo: form.cmlNo,
          size: form.size,
          
          // Pricing & Taxes
          qty: form.qty,
          govRate: form.govRate,
          companyRate: form.companyRate,
          sellingRate: form.sellingRate,
          unit: form.unit,
          bis: form.bis,
          sgst: form.sgst,
          cgst: form.cgst,
          
          // Critical fields - MUST BE SET
          spare1: userId,
          spare2: String(selectedCompanyId),
          spare3: slotForSave,
        };

        console.log(`Saving product:`, productToSave);

        const res = await fetch(`${API_BASE}/products/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productToSave),
        });
        const data = await res.json();
        if (data.success) {
          resetForm();
          await fetchProducts();
        } else {
          alert("Error saving product");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error saving product");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index) => {
    const p = filteredProducts[index];
    if (!p || !p.product_id) {
      setProducts(prev => prev.filter((_, i) => i !== index));
      return;
    }

    if (!confirm(`Delete product "${p.description_of_good || p.description}"?`)) return;

    const before = products;
    setProducts(prev => prev.filter((_, i) => products.indexOf(p) !== i));

    try {
      const url = `${API_BASE}/products/${encodeURIComponent(p.product_id)}`;
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();

      if (!(res.ok && data.success)) {
        setProducts(before);
        alert(data?.error || data?.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Delete error', err);
      setProducts(before);
      alert('Server/network error while deleting');
    }
  };

  const filteredProducts = selectedCompanyId 
    ? products.filter(p => {
        // Handle type mismatch: convert both to string for comparison
        const pCompanyId = String(p.spare2);
        const selectedId = String(selectedCompanyId);
        const matches = pCompanyId === selectedId;
        return matches;
      })
    : products;

  // Debug logging
  if (selectedCompanyId) {
    console.log('Filter Debug:', {
      selectedCompanyId: selectedCompanyId,
      selectedCompanyIdType: typeof selectedCompanyId,
      totalProducts: products.length,
      filteredCount: filteredProducts.length,
      sampleSpare2Values: products.slice(0, 3).map(p => ({ spare2: p.spare2, type: typeof p.spare2, description: p.description_of_good }))
    });
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      {/* Background animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Tab Navigation - Section Style */}
        <div className="flex border-b-2 border-gray-300 mb-8 gap-0">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 sm:px-8 py-3 sm:py-4 font-bold text-sm sm:text-lg transition-all border-b-4 ${
              activeTab === 'products'
                ? 'border-b-blue-600 text-blue-700 bg-blue-50'
                : 'border-b-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            🛍️ Products
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`px-4 sm:px-8 py-3 sm:py-4 font-bold text-sm sm:text-lg transition-all border-b-4 ${
              activeTab === 'company'
                ? 'border-b-blue-600 text-blue-700 bg-blue-50'
                : 'border-b-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            🏢 Company Settings
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {loading && <Loader message="Loading products..." size="lg" fullScreen={true} />}

            {/* New User Welcome Message */}
            {isNewUser && linkedCompanies.length > 0 && (
              <div className="bg-gradient-to-r from-green-100 to-blue-100 border-2 border-green-500 rounded-lg p-4 sm:p-6 shadow-lg">
                <div className="flex gap-3">
                  <span className="text-3xl">🎉</span>
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-green-800 mb-1">Welcome to Your Product Library!</p>
                    <p className="text-sm sm:text-base text-green-700">Standard products have been automatically added to your account. You can customize them as needed.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Company Selection Section */}
            {linkedCompanies.length > 0 && (
              <div className="mb-4 sm:mb-6 bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-blue-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-blue-700 mb-3 sm:mb-4">📊 Select Company for Products</h3>
                <div className="flex flex-wrap gap-2">
                  {linkedCompanies.map((company) => (
                    <button
                      key={company.company_id}
                      onClick={() => handleCompanyChange(company.company_id)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border-2 text-left transition-all text-xs sm:text-sm ${
                        String(selectedCompanyId) === String(company.company_id)
                          ? 'border-blue-600 bg-blue-50 shadow-lg'
                          : 'border-gray-300 bg-white hover:border-blue-400'
                      }`}
                    >
                      <p className="font-semibold text-gray-800">{company.company_name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Left side – Product Table (Desktop) & Cards (Mobile) */}
              <div className="lg:col-span-2">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto rounded-lg sm:rounded-xl shadow-lg border-2 border-green-200">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                      <tr>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold">#</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold">{t.description}</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold">{t.qty}</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold">{t.unit}</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold">{t.sellingRate}</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold">{t.actions}</th>
                      </tr>
                    </thead>

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
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-700">{i + 1}</td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700">{p.description_of_good}</td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-center text-gray-700">{p.qty}</td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-center text-gray-700">{p.unit_of_measure}</td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-800">₹{p.selling_rate}</td>

                            <td className="px-2 sm:px-4 py-2 sm:py-3 flex gap-1 sm:gap-2">
                              {p.spare1 === "master_User" ? (
                                <>
                                  <button
                                    disabled
                                    className="text-gray-400 cursor-not-allowed text-xs sm:text-sm font-medium"
                                    title="Master User product cannot be edited"
                                  >
                                    {t.edit}
                                  </button>
                                  <button
                                    disabled
                                    className="text-gray-400 cursor-not-allowed text-xs sm:text-sm font-medium"
                                    title="Master User product cannot be deleted"
                                  >
                                    {t.delete}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEdit(i)}
                                    className="text-blue-600 rounded-full border px-2 sm:px-3 py-0 hover:cursor-pointer hover:text-blue-800 text-xs sm:text-sm font-medium"
                                  >
                                    {t.edit}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(i)}
                                    className="text-red-600 rounded-full border px-2 sm:px-3 py-0 hover:text-red-900 hover:cursor-pointer text-xs sm:text-sm font-medium"
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

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 font-medium bg-white rounded-lg border-2 border-green-200">
                      {t.noProducts}
                    </div>
                  ) : (
                    filteredProducts.map((p, i) => (
                      <div
                        key={i}
                        className="bg-white border-2 border-green-200 rounded-lg p-4 shadow-md hover:shadow-lg transition"
                      >
                        {/* Card Header with Number and Description */}
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1">#{i + 1}</p>
                          <p className="text-sm font-bold text-gray-800">{p.description_of_good}</p>
                        </div>

                        {/* Card Details Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-4 bg-gray-50 rounded-lg p-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-600 font-semibold mb-1">{t.qty}</p>
                            <p className="text-sm font-bold text-gray-800">{p.qty}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600 font-semibold mb-1">{t.unit}</p>
                            <p className="text-sm font-bold text-gray-800">{p.unit_of_measure}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600 font-semibold mb-1">{t.sellingRate}</p>
                            <p className="text-sm font-bold text-green-700">₹{p.selling_rate}</p>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex gap-2">
                          {p.spare1 === "master_User" ? (
                            <>
                              <button
                                disabled
                                className="flex-1 text-gray-400 cursor-not-allowed py-2 text-xs font-medium"
                                title="Master User product cannot be edited"
                              >
                                {t.edit}
                              </button>
                              <button
                                disabled
                                className="flex-1 text-gray-400 cursor-not-allowed py-2 text-xs font-medium"
                                title="Master User product cannot be deleted"
                              >
                                {t.delete}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(i)}
                                className="flex-1 text-blue-600 border-2 border-blue-600 rounded-lg py-2 text-xs font-bold hover:bg-blue-50 transition"
                              >
                                ✏️ {t.edit}
                              </button>
                              <button
                                onClick={() => handleDelete(i)}
                                className="flex-1 text-red-600 border-2 border-red-600 rounded-lg py-2 text-xs font-bold hover:bg-red-50 transition"
                              >
                                🗑️ {t.delete}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right side – Product Form */}
              <div className="lg:col-span-1">
                {linkedCompanies.length === 0 ? (
                  // Block: No companies linked
                  <div className="bg-white shadow-lg rounded-lg sm:rounded-xl border-2 border-red-300 p-4 sm:p-5">
                    <div className="text-center py-8">
                      <p className="text-5xl mb-3">🚫</p>
                      <h2 className="text-lg sm:text-xl font-bold text-red-700 mb-3">{t.addProduct}</h2>
                      <p className="text-sm text-gray-600 mb-6">
                        You need to add at least one company before creating products.
                      </p>
                      <button
                        onClick={() => setActiveTab('company')}
                        className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                      >
                        ➕ Add Company
                      </button>
                    </div>
                  </div>
                ) : (
                  // Form: Companies linked, allow product creation
                  <div className="bg-white shadow-lg rounded-lg sm:rounded-xl border-2 border-green-200 p-4 sm:p-5">
                    <h2 className="text-lg sm:text-xl font-bold text-green-700 mb-2">
                      {editingIndex !== null ? t.editProduct : t.addProduct}
                    </h2>
                    {selectedCompanyId && (
                      <p className="text-sm text-gray-600 mb-4">📍 Company: <span className="font-semibold text-blue-700">{linkedCompanies.find(c => String(c.company_id) === String(selectedCompanyId))?.company_name}</span></p>
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

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                    {/* Copy to Other Companies - Only when creating new product */}
                    {editingIndex === null && linkedCompanies.length > 1 && (
                      <div className="border-t-2 border-blue-100 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <input 
                            type="checkbox" 
                            id="copyToOthers"
                            checked={copyToOtherCompanies}
                            onChange={(e) => setCopyToOtherCompanies(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <label htmlFor="copyToOthers" className="font-semibold text-sm text-blue-700">
                            📋 इतर कंपन्यांमध्ये कॉपी करा
                          </label>
                        </div>

                        {copyToOtherCompanies && (
                          <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                            {linkedCompanies
                              .filter(c => String(c.company_id) !== String(selectedCompanyId))
                              .map((company) => (
                                <div key={company.company_id} className="border-l-4 border-blue-500 bg-white rounded-lg p-4">
                                  <p className="font-bold text-sm text-blue-700 mb-3">📍 {company.company_name}</p>
                                  
                                  {/* Company-specific fields */}
                                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Basic Details</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="flex flex-col">
                                        <label className="font-semibold text-xs text-gray-600 mb-1">{t.hsn}</label>
                                        <input 
                                          type="text"
                                          value={companySpecificFields[String(company.company_id)]?.hsn_code || ''}
                                          onChange={(e) => handleCompanySpecificChange(company.company_id, 'hsn_code', e.target.value)}
                                          placeholder="HSN Code"
                                          className="border border-blue-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" 
                                        />
                                      </div>
                                      <div className="flex flex-col">
                                        <label className="font-semibold text-xs text-gray-600 mb-1">{t.batchNo}</label>
                                        <input 
                                          type="text"
                                          value={companySpecificFields[String(company.company_id)]?.batchNo || ''}
                                          onChange={(e) => handleCompanySpecificChange(company.company_id, 'batchNo', e.target.value)}
                                          placeholder="Batch No"
                                          className="border border-blue-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" 
                                        />
                                      </div>
                                      <div className="flex flex-col">
                                        <label className="font-semibold text-xs text-gray-600 mb-1">{t.cmlNo}</label>
                                        <input 
                                          type="text"
                                          value={companySpecificFields[String(company.company_id)]?.cmlNo || ''}
                                          onChange={(e) => handleCompanySpecificChange(company.company_id, 'cmlNo', e.target.value)}
                                          placeholder="CML No"
                                          className="border border-blue-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" 
                                        />
                                      </div>
                                      <div className="flex flex-col">
                                        <label className="font-semibold text-xs text-gray-600 mb-1">{t.size}</label>
                                        <input 
                                          type="text"
                                          value={companySpecificFields[String(company.company_id)]?.size || ''}
                                          onChange={(e) => handleCompanySpecificChange(company.company_id, 'size', e.target.value)}
                                          placeholder="Size"
                                          className="border border-blue-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" 
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Company-specific pricing & taxes */}
                                  <div className="bg-green-50 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Pricing & Taxes</p>
                                    
                                    {/* Row 1: Qty, GovRate, CompanyRate */}
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                      <div className="flex flex-col">
                                        <label className="font-semibold text-xs text-gray-600 mb-1">{t.qty}</label>
                                        <input 
                                          type="number"
                                          step="0.01"
                                          value={companySpecificFields[String(company.company_id)]?.qty || form.qty}
                                          onChange={(e) => handleCompanySpecificChange(company.company_id, 'qty', e.target.value)}
                                          className="border border-green-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" 
                                          placeholder="0.00"
                                        />
                                      </div>
                                      <div className="flex flex-col">
                                        <label className="font-semibold text-xs text-gray-600 mb-1">{t.govRate}</label>
                                        <input 
                                          type="number"
                                          step="0.01"
                                          value={companySpecificFields[String(company.company_id)]?.govRate || form.govRate}
                                          onChange={(e) => handleCompanySpecificChange(company.company_id, 'govRate', e.target.value)}
                                          className="border border-green-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" 
                                          placeholder="0.00"
                                        />
                                      </div>
                                      <div className="flex flex-col">
                                        <label className="font-semibold text-xs text-gray-600 mb-1">{t.companyRate}</label>
                                        <input 
                                          type="number"
                                          step="0.01"
                                          value={companySpecificFields[String(company.company_id)]?.companyRate || form.companyRate}
                                          onChange={(e) => handleCompanySpecificChange(company.company_id, 'companyRate', e.target.value)}
                                          className="border border-green-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" 
                                          placeholder="0.00"
                                        />
                                      </div>
                                    </div>

                                    {/* Row 2: SellingRate, Unit, BIS */}
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                      <div className="flex flex-col">
                                        <label className="font-semibold text-xs text-gray-600 mb-1">{t.sellingRate}</label>
                                        <input 
                                          type="number"
                                          step="0.01"
                                          value={companySpecificFields[String(company.company_id)]?.sellingRate || form.sellingRate}
                                          onChange={(e) => handleCompanySpecificChange(company.company_id, 'sellingRate', e.target.value)}
                                          className="border border-green-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" 
                                          placeholder="0.00"
                                        />
                                      </div>
                                      <div className="flex flex-col">
                                        <label className="font-semibold text-xs text-gray-600 mb-1">{t.unit}</label>
                                        <input 
                                          type="text"
                                          value={companySpecificFields[String(company.company_id)]?.unit || form.unit}
                                          onChange={(e) => handleCompanySpecificChange(company.company_id, 'unit', e.target.value)}
                                          className="border border-green-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" 
                                          placeholder="Unit"
                                        />
                                      </div>
                                      <div className="flex flex-col">
                                        <label className="font-semibold text-xs text-gray-600 mb-1">{t.bis}</label>
                                        <input 
                                          type="text"
                                          value={companySpecificFields[String(company.company_id)]?.bis || form.bis}
                                          onChange={(e) => handleCompanySpecificChange(company.company_id, 'bis', e.target.value)}
                                          className="border border-green-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" 
                                          placeholder="BIS"
                                        />
                                      </div>
                                    </div>

                                    {/* Row 3: SGST %, CGST % */}
                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="flex flex-col">
                                        <label className="font-semibold text-xs text-gray-600 mb-1">{t.sgst} %</label>
                                        <input 
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          max="100"
                                          value={companySpecificFields[String(company.company_id)]?.sgst || form.sgst}
                                          onChange={(e) => handleCompanySpecificChange(company.company_id, 'sgst', e.target.value)}
                                          className="border border-green-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" 
                                          placeholder="0.00"
                                        />
                                      </div>
                                      <div className="flex flex-col">
                                        <label className="font-semibold text-xs text-gray-600 mb-1">{t.cgst} %</label>
                                        <input 
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          max="100"
                                          value={companySpecificFields[String(company.company_id)]?.cgst || form.cgst}
                                          onChange={(e) => handleCompanySpecificChange(company.company_id, 'cgst', e.target.value)}
                                          className="border border-green-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" 
                                          placeholder="0.00"
                                        />
                                      </div>
                                      <div></div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

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
                )}
              </div>
            </div>
          </div>
        )}

        {/* Company Settings Tab */}
        {activeTab === 'company' && (
          <CompanySettings />
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }
      `}</style>
    </div>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomePageContent />
    </ProtectedRoute>
  );
}
