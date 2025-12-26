'use client';

import { useState, useRef, useEffect, useContext } from 'react';
import { LangContext } from '../../layout';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUserId, getCurrentUser, API_BASE, isUserVerified } from '@/lib/utils';
import Loader from '@/components/Loader';
import { districtsEn, districtsMr } from '@/lib/districts';
import ProtectedRoute from '@/components/ProtectedRoute';

function NewQuotationPageContent() {
  // ---------- Helper Functions ----------
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (_) {
      return '';
    }
  };

  // Get company name and slot from spare2 (company_id)
  const getCompanyInfo = (spare2) => {
    if (!spare2 || !companies || companies.length === 0) return null;
    const companyId = Number(spare2);
    const company = companies.find(c => c.company_id === companyId);
    if (company) {
      return { name: company.company_name, slot: company.company_slot || '?' };
    }
    return null;
  };

  // ---------- Localization ----------
  const { t, lang, toggleLang } = useContext(LangContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [savedQuotationId, setSavedQuotationId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingQuotation, setLoadingQuotation] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const formRef = useRef(null);

  // Auto-switch to Marathi
  useEffect(() => {
    setMounted(true);
    if (lang !== 'mr') toggleLang();
  }, []);

  useEffect(() => {
    if (mounted && lang !== 'mr') toggleLang();
  }, [lang, mounted, toggleLang]);

  // Handle scroll-to-top visibility
  useEffect(() => {
    const handleScroll = () => setShowScrollToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Form state for customer details
  const [form, setForm] = useState({
    farmerName: '',
    fatherName: '',
    mobile: '',
    aadhaarNo: '',
    farmerId: '',
    village: '',
    taluka: '',
    district: '',
    area8A: '',
    gutNo: '',
    cropName: '',
    driplineProduct: '',
    irrigationArea: '',
    lateralSpacing: '',
    dripperDischarge: '',
    company: '',
    salesEngg: '',
    validityDays: 15,
    notes: '',
    applicationId: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updatedForm = { ...prev, [name]: value };

      // ✅ If the "company" field changes, auto-populate engineer details and reload products
      if (name === "company") {
        const selectedCompany = companies.find(c => c.company_name === value);
        const previousCompany = companies.find(c => c.company_name === prev.company);
        const currentCompanyValue = prev.company; // Get the PREVIOUS form company value from prev state
        
        // 🔄 If company is actually changing (not same as current value)
        if (selectedCompany && currentCompanyValue !== value && value !== '') {
          // Only show confirmation if there was a previous company selected (not first selection)
          if (currentCompanyValue && currentCompanyValue !== '') {
            const confirmed = window.confirm(
              `You are changing the company from "${currentCompanyValue}" to "${value}". ` +
              `⚠️ Quotation items will be switched to products from the new company. Continue?`
            );
            if (!confirmed) {
              // Revert to previous company
              updatedForm.company = currentCompanyValue;
              return updatedForm;
            }
            // Company change confirmed - cache current items and switch
            console.log('🔄 Company changed from', currentCompanyValue, 'to', value);
            
            // Cache current quotation items BEFORE switching (use previous company ID)
            if (previousCompany) {
              const prevCompanyId = String(previousCompany.company_id);
              console.log(`💾 Caching ${quotationItems.length} items for company ${prevCompanyId}`);
              setQuotationItemsCache(prevCache => ({
                ...prevCache,
                [prevCompanyId]: quotationItems
              }));
            }
            
            // Load new company (will check cache first)
            handleCompanyChangeInQuotation(selectedCompany.company_id);
          } else {
            // First company selection - just load products without confirmation
            console.log('🔄 First company selection:', value);
            loadProductsForCompany(selectedCompany.company_id);
          }
          
          // Update originalCompany to track for future changes
          setOriginalCompany(value);
        }
        
        if (selectedCompany && selectedCompany.engineer_name) {
          updatedForm.salesEngg = selectedCompany.engineer_name;
        } else {
          updatedForm.salesEngg = '';
        }
      }

      if (name === "district") {
        const selectedDistrict = districts.find(d => d.name === value);
        if (selectedDistrict) {
          setTalukas(selectedDistrict.tahasil);
          updatedForm.taluka = '';
        }
      }

      return updatedForm;
    });
  };

  // State
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [quotationNo, setQuotationNo] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [lastFetchedMonthYear, setLastFetchedMonthYear] = useState('');
  const [products, setProducts] = useState([]);
  const [quotationItems, setQuotationItems] = useState([]);

  // Cache for quotation items by company - allows switching back to previous company
  // Format: { companyId: quotationItems[] }
  const [quotationItemsCache, setQuotationItemsCache] = useState({});
  const [originalQuotationCompanyId, setOriginalQuotationCompanyId] = useState(null); // Track original quotation's company
  const [originalCompany, setOriginalCompany] = useState(''); // Track original company for edit mode

  // Fitting / Installation & Accessories charges
  const [enableFittingCharges, setEnableFittingCharges] = useState(false);
  const [fittingChargesPercent, setFittingChargesPercent] = useState(0);
  const [fittingChargesGst, setFittingChargesGst] = useState(0); // Default 0% GST

  // Global GST % for all items - shortcut to apply same GST to all products
  const [enableGlobalGst, setEnableGlobalGst] = useState(false);
  const [globalGstPercent, setGlobalGstPercent] = useState(0);

  // Apply global GST to all items when enabled/changed
  const applyGlobalGst = (gstPercent) => {
    setQuotationItems(prev => prev.map(it => ({
      ...it,
      gst_percent: Number(gstPercent) || 0
    })));
    // Also update fitting charges GST if enabled
    if (enableFittingCharges) {
      setFittingChargesGst(Number(gstPercent) || 0);
    }
  };

  // Load districts based on language
  useEffect(() => {
    setDistricts(lang === 'mr' ? districtsMr : districtsEn);
  }, [lang]);

  // Update talukas when district changes
  useEffect(() => {
    if (form.district && districts.length > 0) {
      const selectedDistrict = districts.find(d => d.name === form.district);
      if (selectedDistrict && selectedDistrict.tahasil) {
        setTalukas(selectedDistrict.tahasil);
      } else {
        setTalukas([]);
      }
    }
  }, [form.district, districts]);

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoadingCompanies(true);
        const uid = getCurrentUserId();
        if (!uid) return;

        const res = await fetch(`${API_BASE}/api/v2/files/context/${uid}`);
        const data = await res.json();
        if (data.success && data.companyLinks) {
          setCompanies(data.companyLinks);
        }
      } catch (err) {
        console.error('Failed to fetch companies:', err);
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, []);

  // Ref to store pending items for when companies load (avoids stale closure)
  const pendingQuotationItemsRef = useRef(null);

  // Effect to load products when in edit mode and companies are loaded but products aren't
  // This handles the case where quotation had company_name but no company_id stored
  useEffect(() => {
    const id = searchParams?.get?.('id');
    if (!id) return; // Not in edit mode
    if (!form.company) return; // No company in form
    if (companies.length === 0) return; // Companies not loaded yet
    if (products.length > 0) return; // Products already loaded
    if (!pendingQuotationItemsRef.current) return; // No pending items to merge
    
    const selectedCompany = companies.find(c => c.company_name === form.company);
    if (selectedCompany) {
      console.log('🔄 Loading products for company after companies loaded:', selectedCompany.company_id);
      // Use pending items from ref (preserves qty, batch_no, etc.)
      const pendingItems = pendingQuotationItemsRef.current;
      console.log(`📋 Using ${pendingItems.length} pending items for merge`);
      loadProductsForCompanyWithItems(selectedCompany.company_id, pendingItems);
      pendingQuotationItemsRef.current = null; // Clear after use
    }
  }, [companies, form.company, products.length, searchParams]);

  // Set default district from user
  useEffect(() => {
    const id = searchParams?.get?.('id');
    if (id) return; // Skip for edit mode

    const user = getCurrentUser();
    if (user?.district) {
      setForm((prev) => ({
        ...prev,
        district: user.district,
        taluka: user?.taluka || ''
      }));
      const selectedDistrict = districts.find(d => d.name === user.district);
      if (selectedDistrict) setTalukas(selectedDistrict.tahasil);
    }
  }, [districts, searchParams]);

  // Load quotation for editing
  useEffect(() => {
    const id = searchParams?.get?.('id');
    if (!id) return;

    const loadQuotationForEdit = async () => {
      setLoadingQuotation(true);
      try {
        const res = await fetch(`${API_BASE}/api/quotations/${id}`);
        const data = await res.json();
        if (!res.ok || !data?.success) {
          console.error('Failed to load quotation', res.status);
          setLoadingQuotation(false);
          return;
        }

        const quotation = data.quotation;
        setSavedQuotationId(quotation.quotation_id);
        setQuotationNo(quotation.quotation_no || '');
        setQuotationDate(formatDateForInput(quotation.quotation_date) || new Date().toISOString().split('T')[0]);

        // Map quotation data to form (including all additional fields)
        setForm({
          farmerName: quotation.farmer_name || '',
          fatherName: '',
          mobile: quotation.farmer_mobile || '',
          aadhaarNo: quotation.aadhaar_no || '',
          farmerId: quotation.farmer_id || '',
          village: quotation.village || '',
          taluka: quotation.taluka || '',
          district: quotation.district || '',
          area8A: quotation.area8a || '',
          gutNo: '',
          cropName: quotation.crop_name || '',
          driplineProduct: quotation.dripline_product || '',
          irrigationArea: quotation.irrigation_area || '',
          lateralSpacing: quotation.lateral_spacing || '',
          dripperDischarge: '',
          company: quotation.company_name || '',
          salesEngg: quotation.sales_engg || '',
          validityDays: quotation.validity_days || 15,
          notes: quotation.notes || '',
          applicationId: quotation.application_id || ''
        });

        // Set talukas if district is selected
        if (quotation.district) {
          const selectedDistrict = districts.find(d => d.name === quotation.district);
          if (selectedDistrict) {
            setTalukas(selectedDistrict.tahasil);
          }
        }

        // Check for fitting charges in existing items
        const allItems = quotation.items || [];
        const fittingItem = allItems.find(item => 
          item.is_fitting_charge === true || 
          item.description?.includes('Fitting / Installation & Accessories charges')
        );
        
        if (fittingItem) {
          setEnableFittingCharges(true);
          // Extract percentage from description
          const match = fittingItem.description?.match(/@\s*([\d.]+)%/);
          if (match) {
            setFittingChargesPercent(Number(match[1]) || 0);
          }
          // Extract GST from fitting item
          if (fittingItem.gst_percent !== undefined && fittingItem.gst_percent !== null) {
            setFittingChargesGst(Number(fittingItem.gst_percent) || 5);
          }
        }
        
        // Filter out fitting charge items for product list
        const productItems = allItems.filter(item => 
          item.is_fitting_charge !== true && 
          !item.description?.includes('Fitting / Installation & Accessories charges')
        );

        // Track original company for edit mode
        if (quotation.company_name) {
          setOriginalCompany(quotation.company_name);
        }

        // Load products for company
        if (quotation.company_id) {
          console.log('✅ Loading products for quotation company_id:', quotation.company_id);
          await loadProductsForCompanyWithItems(quotation.company_id, productItems);
        } else if (quotation.company_name) {
          // Fallback: Try to find company_id from company name in companies list
          // Note: companies might not be loaded yet, so we store items in ref for later merge
          console.log('⚠️ No company_id in quotation, storing items in ref for later merge');
          // Store in ref for the secondary effect to use when companies load
          pendingQuotationItemsRef.current = productItems;
          // Also set items immediately so user sees them (will be merged with products later)
          setQuotationItems(productItems.map(item => ({
            product_id: item.product_id,
            description: item.description || '',
            hsn: item.hsn || '',
            batch_no: item.batch_no || '',
            cml_no: item.cml_no || '',
            size: item.size || '',
            gov_rate: Number(item.gov_rate || 0),
            sales_rate: Number(item.sales_rate || 0),
            uom: item.uom || '',
            gst_percent: Number(item.gst_percent || 0),
            qty: Number(item.qty || 0),
            amount: Number(item.amount || 0)
          })));
        } else if (productItems.length > 0) {
          // Just set items directly if no company context
          console.log('⚠️ No company context, setting items directly');
          setQuotationItems(productItems.map(item => ({
            product_id: item.product_id,
            description: item.description || '',
            hsn: item.hsn || '',
            batch_no: item.batch_no || '',
            cml_no: item.cml_no || '',
            size: item.size || '',
            gov_rate: Number(item.gov_rate || 0),
            sales_rate: Number(item.sales_rate || 0),
            uom: item.uom || '',
            gst_percent: Number(item.gst_percent || 0),
            qty: Number(item.qty || 0),
            amount: Number(item.amount || 0)
          })));
        }
      } catch (err) {
        console.error('Load quotation error:', err);
      } finally {
        setLoadingQuotation(false);
      }
    };

    loadQuotationForEdit();
  }, [searchParams]);

  // Fetch next quotation number
  const fetchNextQuotationNo = async (dateStr) => {
    const owner_id = getCurrentUserId();
    if (!owner_id) return;

    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const monthYearKey = `${year}-${month}`;

    if (monthYearKey === lastFetchedMonthYear) return;

    try {
      const res = await fetch(`${API_BASE}/api/quotations/next-quotation-no?owner_id=${owner_id}&month=${month}&year=${year}`);
      const data = await res.json();
      if (data.success && data.quotation_no) {
        setQuotationNo(data.quotation_no);
        setLastFetchedMonthYear(monthYearKey);
      }
    } catch (err) {
      console.error('Failed to fetch next quotation number:', err);
    }
  };

  // Fetch quotation number on mount
  useEffect(() => {
    const id = searchParams?.get?.('id');
    if (!id) {
      fetchNextQuotationNo(quotationDate);
    }
  }, []);

  // Handle quotation date change
  const handleQuotationDateChange = (newDate) => {
    const oldDate = new Date(quotationDate);
    const newDateObj = new Date(newDate);

    setQuotationDate(newDate);

    if (oldDate.getMonth() !== newDateObj.getMonth() || oldDate.getFullYear() !== newDateObj.getFullYear()) {
      fetchNextQuotationNo(newDate);
    }
  };

  // Load products for company
  const loadProductsForCompany = async (companyId) => {
    const owner_id = getCurrentUserId();
    try {
      if (!owner_id) return;

      console.log(`🔄 Loading products for company ${companyId}...`);
      const url = `${API_BASE}/api/v2/files/products?companyId=${companyId}&userId=${owner_id}`;
      const res = await fetch(url);
      const data = await res.json();
      const allProducts = data.products || [];

      console.log(`✅ API returned ${allProducts.length} products`);
      console.log("📋 Products:", allProducts);
      setProducts(allProducts);

      // Initialize quotation items with loaded products (qty = 0)
      const initialItems = allProducts.map(prod => ({
        product_id: prod.product_id ?? prod.id,
        description: prod.description_of_good || prod.name || prod.product_name || '',
        hsn: prod.hsn_code || prod.hsn || '',
        batch_no: prod.batch_no || prod.batchNo || '',
        cml_no: prod.cml_no || prod.cmlNo || '',
        size: prod.size || '',
        gov_rate: Number(prod.gov_rate || prod.govRate || 0),
        sales_rate: Number(prod.selling_rate || prod.sellingRate || prod.sales_rate || 0),
        uom: prod.unit_of_measure || prod.unit || prod.uom || '',
        gst_percent: 0, // Default GST is 0 for all items (user can enable global GST or set per item)
        qty: 0,
        amount: 0,
        spare2: prod.spare2
      }));

      console.log('📋 Setting quotationItems with:', initialItems.length, 'items');
      setQuotationItems(initialItems);
    } catch (err) {
      console.error('❌ Error loading products for company:', err);
    }
  };

  // Handle company change when quotation exists - cache current items, then check cache or load fresh
  const handleCompanyChangeInQuotation = async (newCompanyId) => {
    const newCompanyIdStr = String(newCompanyId);
    console.log(`🔄 Handling company change in quotation to company ${newCompanyIdStr}`);
    
    // Check if we have cached items for the NEW company
    const cachedItems = quotationItemsCache[newCompanyIdStr];
    const uid = getCurrentUserId();
    
    if (cachedItems && cachedItems.length > 0) {
      // Restore from cache
      console.log(`✅ Restoring ${cachedItems.length} cached items for company ${newCompanyIdStr}`);
      setQuotationItems(cachedItems);
      
      // Also need to load products for the products list (for form display)
      try {
        const res = await fetch(`${API_BASE}/api/v2/files/products?companyId=${newCompanyId}&userId=${uid}`);
        const data = await res.json();
        if (data.products) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error('Error loading products list:', err);
      }
    } else {
      // No cache - load fresh products with qty=0
      console.log(`📦 No cache found, loading fresh products for company ${newCompanyIdStr}`);
      setQuotationItems([]);
      await loadProductsForCompany(newCompanyId);
    }
    
    console.log('✅ Company switch complete');
  };

  // Load products for company with existing items (for edit mode)
  const loadProductsForCompanyWithItems = async (companyId, existingItems) => {
    const owner_id = getCurrentUserId();
    const companyIdText = String(companyId);
    
    try {
      if (!owner_id) {
        console.error('❌ loadProductsForCompanyWithItems: No owner_id found');
        return;
      }

      console.log(`📦 Loading products for company ${companyIdText} with ${existingItems.length} existing items`);
      const url = `${API_BASE}/api/v2/files/products?companyId=${companyId}&userId=${owner_id}`;
      const res = await fetch(url);
      const data = await res.json();
      const allProducts = data.products || [];

      console.log(`✅ Loaded ${allProducts.length} products for company ${companyIdText}`);
      setProducts(allProducts);
      
      // Store original quotation's company ID for tracking
      setOriginalQuotationCompanyId(companyIdText);

      // Create a map of product_id -> quotation item data from loaded quotation
      const quotationItemMap = {};
      existingItems.forEach(item => {
        const key = String(item.product_id);
        quotationItemMap[key] = {
          qty: Number(item.qty) || 0,
          gst_percent: Number(item.gst_percent || item.gst) || 0,
          sales_rate: Number(item.sales_rate) || 0,
          description: item.description || '',
          hsn: item.hsn || '',
          size: item.size || '',
          uom: item.uom || '',
          batch_no: item.batch_no || '',
          cml_no: item.cml_no || '',
          gov_rate: Number(item.gov_rate) || 0,
          amount: Number(item.amount) || 0
        };
        console.log(`📋 Quotation item: product_id=${key}, qty=${quotationItemMap[key].qty}`);
      });
      
      // Create set of product IDs from API for matching
      const productIdSet = new Set(allProducts.map(p => String(p.product_id ?? p.id)));
      
      // STEP 1: Map ALL products from API (with qty from quotation if matched)
      const mergedItems = allProducts.map(prod => {
        const productId = prod.product_id ?? prod.id;
        const productIdKey = String(productId);
        const quotationItem = quotationItemMap[productIdKey];
        const salesRate = Number(prod.selling_rate || prod.sellingRate || prod.sales_rate || 0);
        const qty = Number(quotationItem?.qty) || 0;
        
        return {
          product_id: productId,
          description: prod.description_of_good || prod.name || prod.product_name || '',
          hsn: prod.hsn_code || prod.hsn || '',
          batch_no: quotationItem?.batch_no || prod.batch_no || prod.batchNo || '',  // Use saved quotationItem batch_no first
          cml_no: quotationItem?.cml_no || prod.cml_no || prod.cmlNo || '',  // Use saved quotationItem cml_no first
          size: prod.size || '',
          gov_rate: Number(prod.gov_rate || prod.govRate || 0),
          sales_rate: salesRate,
          uom: prod.unit_of_measure || prod.unit || prod.uom || '',
          gst_percent: Number(quotationItem?.gst_percent) || Number(prod.sgst || prod.cgst || prod.gst_percent || 0),
          qty: qty,
          amount: Number((qty * salesRate).toFixed(2)),
          spare2: prod.spare2
        };
      });
      
      // STEP 2: Add quotation items that don't exist in current products (legacy/changed products)
      const unmatchedQuotationItems = existingItems
        .filter(item => item.product_id && !productIdSet.has(String(item.product_id)))
        .map(item => ({
          product_id: item.product_id,
          description: item.description || '',
          hsn: item.hsn || '',
          batch_no: item.batch_no || '',
          cml_no: item.cml_no || '',
          size: item.size || '',
          gov_rate: Number(item.gov_rate) || 0,
          sales_rate: Number(item.sales_rate) || 0,
          uom: item.uom || '',
          gst_percent: Number(item.gst_percent) || 0,
          qty: Number(item.qty) || 0,
          amount: Number(item.amount) || 0,
          spare2: companyIdText,
          isLegacy: true // Mark as legacy item for UI indication
        }));
      
      if (unmatchedQuotationItems.length > 0) {
        console.log(`📋 Adding ${unmatchedQuotationItems.length} legacy quotation items (products no longer in catalog)`);
      }
      
      // Combine: all products + unmatched quotation items
      const finalItems = [...mergedItems, ...unmatchedQuotationItems];
      
      // Log summary
      const itemsWithQty = finalItems.filter(i => i.qty > 0);
      console.log('✅ Final quotation items:', finalItems.length, '| Items with qty > 0:', itemsWithQty.length);
      
      setQuotationItems(finalItems);
      
      // Cache this company's quotation items for later switching
      setQuotationItemsCache(prev => ({
        ...prev,
        [companyIdText]: finalItems
      }));
      console.log('💾 Cached quotation items for company:', companyIdText);
    } catch (err) {
      console.error('❌ Error loading products:', err);
    }
  };

  // Update quotation item qty
  const updateQuotationItemQty = (productId, newQty) => {
    setQuotationItems(prev => prev.map(it =>
      it.product_id === productId
        ? {
            ...it,
            qty: Number(newQty || 0),
            amount: Number(((Number(newQty || 0)) * it.sales_rate).toFixed(2))
          }
        : it
    ));
  };

  // Update quotation item GST
  const updateQuotationItemGST = (productId, newGST) => {
    setQuotationItems(prev => prev.map(it =>
      it.product_id === productId
        ? { ...it, gst_percent: Number(newGST || 0) }
        : it
    ));
  };

  // Update quotation item field
  const updateQuotationItemField = (productId, field, value) => {
    setQuotationItems(prev => prev.map(it =>
      it.product_id === productId
        ? { ...it, [field]: value }
        : it
    ));
  };

  // Get items for saving (qty > 0)
  const getQuotationItemsForSave = () => {
    const items = quotationItems.filter(it => (it.qty || 0) > 0);
    
    // Add fitting charges as a separate item if enabled
    if (enableFittingCharges && fittingChargesPercent > 0) {
      const taxableAmount = computeQuotationTotals().taxable;
      const fittingChargesAmount = (fittingChargesPercent / 100) * taxableAmount;
      
      items.push({
        product_id: null,
        description: `Fitting / Installation & Accessories charges @ ${fittingChargesPercent}%`,
        hsn: '',
        gst_percent: fittingChargesGst,
        sales_rate: fittingChargesAmount,
        qty: 1,
        amount: fittingChargesAmount,
        uom: 'FLAT',
        is_fitting_charge: true
      });
    }
    
    return items;
  };

  // Compute totals
  const computeQuotationTotals = () => {
    let taxable = 0;
    let totalGst = 0;
    for (const it of quotationItems) {
      const amt = Number(it.amount || 0);
      taxable += amt;
      const gst = (Number(it.gst_percent || 0) / 100) * amt;
      totalGst += gst;
    }
    taxable = Number(taxable.toFixed(2));
    totalGst = Number(totalGst.toFixed(2));
    
    // Calculate fitting charges if enabled
    let fittingChargesAmount = 0;
    let fittingChargesGstAmount = 0;
    if (enableFittingCharges && fittingChargesPercent > 0) {
      fittingChargesAmount = Number(((fittingChargesPercent / 100) * taxable).toFixed(2));
      fittingChargesGstAmount = Number(((fittingChargesGst / 100) * fittingChargesAmount).toFixed(2));
    }
    
    const total = Number((taxable + totalGst + fittingChargesAmount + fittingChargesGstAmount).toFixed(2));
    return { taxable, totalGst, fittingChargesAmount, fittingChargesGstAmount, total };
  };

  // Submit quotation
  const submitQuotation = async (e) => {
    e.preventDefault();
    if (saving) return;

    // Check if user is verified before allowing quotation creation/update
    if (!isUserVerified()) {
      alert(t.accountNotActive || 'आपले खाते सक्रिय नाही. कृपया प्रशासकांशी संपर्क करा - 📞 8055554030 किंवा 📧 connect.agrifiles@gmail.com');
      return;
    }

    const owner_id = getCurrentUserId();
    if (!owner_id) {
      alert('User not logged in');
      return;
    }

    if (!form.farmerName || !form.mobile) {
      alert('Please fill in customer name and mobile');
      return;
    }

    const itemsToSave = getQuotationItemsForSave();
    if (itemsToSave.length === 0) {
      alert('Please add at least one item with quantity > 0');
      return;
    }

    // Get company_id
    const selectedCompany = companies.find(c => c.company_name === form.company);
    const company_id = selectedCompany?.company_id || null;
    const company_slot_no = selectedCompany?.company_slot || null;

    const payload = {
      quotation_no: quotationNo,
      quotation_date: quotationDate,
      farmer_name: form.farmerName,
      farmer_mobile: form.mobile,
      owner_id,
      created_by: owner_id,
      status: 'draft',
      company_id,
      company_slot_no,
      validity_days: Number(form.validityDays) || 15,
      notes: form.notes,
      // Additional customer/farm fields
      aadhaar_no: form.aadhaarNo,
      farmer_id: form.farmerId || null,
      village: form.village,
      taluka: form.taluka,
      district: form.district,
      crop_name: form.cropName,
      dripline_product: form.driplineProduct,
      application_id: form.applicationId || null,
      area8a: form.area8A,
      irrigation_area: form.irrigationArea,
      lateral_spacing: form.lateralSpacing,
      sales_engg: form.salesEngg,
      company_name: form.company,
      items: itemsToSave
    };

    setSaving(true);
    try {
      const isUpdate = !!savedQuotationId;
      const url = isUpdate
        ? `${API_BASE}/api/quotations/${savedQuotationId}`
        : `${API_BASE}/api/quotations`;
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.status === 403 && data?.accountNotActive) {
        alert(t.accountNotActive || 'आपले खाते सक्रिय नाही. कृपया प्रशासकांशी संपर्क करा - 📞 8055554030 किंवा 📧 connect.agrifiles@gmail.com');
      } else if (data.success) {
        alert(isUpdate ? 'Quotation updated! / कोटेशन अपडेट झाले!' : 'Quotation created! / कोटेशन तयार झाले!');
        router.push('/quotations');
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Submit quotation error:', err);
      alert('Error saving quotation');
    } finally {
      setSaving(false);
    }
  };

  // Submit and print
  const submitQuotationAndPrint = async (e) => {
    e.preventDefault();
    if (saving) return;

    // Check if user is verified before allowing quotation creation/update/print
    if (!isUserVerified()) {
      alert(t.accountNotActive || 'आपले खाते सक्रिय नाही. कृपया प्रशासकांशी संपर्क करा - 📞 8055554030 किंवा 📧 connect.agrifiles@gmail.com');
      return;
    }

    const owner_id = getCurrentUserId();
    if (!owner_id) {
      alert('User not logged in');
      return;
    }

    if (!form.farmerName || !form.mobile) {
      alert('Please fill in customer name and mobile');
      return;
    }

    const itemsToSave = getQuotationItemsForSave();
    if (itemsToSave.length === 0) {
      alert('Please add at least one item with quantity > 0');
      return;
    }

    const selectedCompany = companies.find(c => c.company_name === form.company);
    const company_id = selectedCompany?.company_id || null;
    const company_slot_no = selectedCompany?.company_slot || null;

    const payload = {
      quotation_no: quotationNo,
      quotation_date: quotationDate,
      farmer_name: form.farmerName,
      farmer_mobile: form.mobile,
      owner_id,
      created_by: owner_id,
      status: 'draft',
      company_id,
      company_slot_no,
      validity_days: Number(form.validityDays) || 15,
      notes: form.notes,
      // Additional customer/farm fields
      aadhaar_no: form.aadhaarNo,
      farmer_id: form.farmerId || null,
      village: form.village,
      taluka: form.taluka,
      district: form.district,
      crop_name: form.cropName,
      dripline_product: form.driplineProduct,
      application_id: form.applicationId || null,
      area8a: form.area8A,
      irrigation_area: form.irrigationArea,
      lateral_spacing: form.lateralSpacing,
      sales_engg: form.salesEngg,
      company_name: form.company,
      items: itemsToSave
    };

    setSaving(true);
    try {
      const isUpdate = !!savedQuotationId;
      const url = isUpdate
        ? `${API_BASE}/api/quotations/${savedQuotationId}`
        : `${API_BASE}/api/quotations`;
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        const quotationId = data.quotation?.quotation_id || savedQuotationId;
        router.push(`/quotation/print/${quotationId}`);
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Submit quotation error:', err);
      alert('Error saving quotation');
    } finally {
      setSaving(false);
    }
  };

  const isEditing = Boolean(savedQuotationId || searchParams?.get?.('id'));

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-3 md:py-5 px-2 md:px-4 relative">
      {saving && <Loader fullScreen message={savedQuotationId ? 'Updating...' : 'Saving quotation...'} />}
      {loadingQuotation && <Loader fullScreen message="Loading quotation..." />}

      <form
        ref={formRef}
        onSubmit={submitQuotation}
        className="w-full max-w-6xl bg-white shadow-lg rounded-lg p-4 md:p-8 space-y-6 pb-32 md:pb-40"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-3 md:gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-blue-700">
            📋 {isEditing ? 'Update Quotation / कोटेशन अपडेट करा' : 'New Quotation / नवीन कोटेशन'}
          </h2>
        </div>

        {/* Quotation Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Quotation No / कोटेशन क्र.</label>
            <input
              className="mt-1 block w-full rounded-md border border-gray-200 shadow-sm px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
              value={quotationNo}
              disabled
              placeholder="Auto-generated"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Date / दिनांक</label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border border-gray-200 shadow-sm px-3 py-2 bg-white"
              value={quotationDate}
              onChange={(e) => handleQuotationDateChange(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Validity / वैधता (दिवस)</label>
            <select
              name="validityDays"
              value={form.validityDays}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-200 shadow-sm px-3 py-2 bg-white"
            >
              <option value={7}>7 Days</option>
              <option value={15}>15 Days</option>
              <option value={30}>30 Days</option>
              <option value={45}>45 Days</option>
              <option value={60}>60 Days</option>
            </select>
          </div>
        </div>

        {/* Customer Details */}
        <div>
          <h3 className="text-lg md:text-xl font-bold text-blue-700 mb-4 md:mb-6 pb-3 md:pb-4 border-b-4 border-blue-400">
            👤 Customer Details / ग्राहक माहिती
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Customer Name / ग्राहकाचे नाव *</label>
              <input name="farmerName" value={form.farmerName} onChange={handleChange} className="input" required />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Mobile / मोबाइल *</label>
              <input name="mobile" value={form.mobile} onChange={handleChange} className="input" required />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Aadhaar No / आधार क्र.</label>
              <input name="aadhaarNo" value={form.aadhaarNo} onChange={handleChange} className="input" />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Farmer ID / शेतकरी ओळख क्रमांक</label>
              <input name="farmerId" value={form.farmerId} onChange={handleChange} className="input" placeholder="शेतकरी ओळख क्रमांक" />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Village / गाव</label>
              <input name="village" value={form.village} onChange={handleChange} className="input" />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">District / जिल्हा</label>
              <select name="district" value={form.district} onChange={handleChange} className="input">
                <option value="">Select District</option>
                {districts.map(d => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Taluka / तालुका</label>
              <select name="taluka" value={form.taluka} onChange={handleChange} className="input">
                <option value="">Select Taluka</option>
                {talukas.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Farm Details */}
        <div className="mt-8">
          <h3 className="text-lg md:text-xl font-bold text-blue-700 mb-4 md:mb-6 pb-3 md:pb-4 border-b-4 border-blue-400">
            🌾 Farm Details / शेत माहिती
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Crop Name / पीक</label>
              <select name="cropName" value={form.cropName} onChange={handleChange} className="input">
                <option value="">{t.selectCrop || 'पीक निवडा'}</option>
                <option value={t.sugarcane}>{t.sugarcane}</option>
                <option value={t.cotton}>{t.cotton}</option>
                <option value={t.wheat}>{t.wheat}</option>
                <option value={t.banana}>{t.banana}</option>
                <option value={t.grapes}>{t.grapes}</option>
                <option value={t.pomegranate}>{t.pomegranate}</option>
                <option value={t.orange}>{t.orange}</option>
                <option value={t.mango}>{t.mango}</option>
                <option value={t.onion}>{t.onion}</option>
                <option value={t.tomato}>{t.tomato}</option>
                <option value={t.chilli}>{t.chilli}</option>
                <option value={t.turmeric}>{t.turmeric}</option>
                <option value={t.ginger}>{t.ginger}</option>
                <option value={t.groundnut}>{t.groundnut}</option>
                <option value={t.soybean}>{t.soybean}</option>
                <option value={t.maize}>{t.maize}</option>
                <option value={t.jowar}>{t.jowar}</option>
                <option value={t.bajra}>{t.bajra}</option>
                <option value={t.rice}>{t.rice}</option>
                <option value={t.vegetables}>{t.vegetables}</option>
                <option value={t.flowers}>{t.flowers}</option>
                <option value={t.papaya}>{t.papaya}</option>
                <option value={t.watermelon}>{t.watermelon}</option>
                <option value={t.cucumber}>{t.cucumber}</option>
                <option value={t.brinjal}>{t.brinjal}</option>
                <option value={t.ladyfinger}>{t.ladyfinger}</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.irrigationType || 'Irrigation Type / सिंचन प्रकार'}</label>
              <select name="driplineProduct" value={form.driplineProduct} onChange={handleChange} className="input">
                <option value="">{t.irrigationType || 'सिंचन प्रकार निवडा'}</option>
                <option value={t.drip}>{t.drip}</option>
                <option value={t.sprinkler}>{t.sprinkler}</option>
                <option value={t.microSprinkler}>{t.microSprinkler}</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Area (Hectare) / क्षेत्र</label>
              <input name="area8A" value={form.area8A} onChange={handleChange} className="input" placeholder="उदा. 0.50" />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Irrigation Area / ड्रिप क्षेत्र</label>
              <input name="irrigationArea" value={form.irrigationArea} onChange={handleChange} className="input" placeholder="उदा. 0.40" />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Lateral Spacing / लॅटरल अंतर</label>
              <input name="lateralSpacing" value={form.lateralSpacing} onChange={handleChange} className="input" placeholder="उदा. 1.5 मीटर" />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Application ID / अर्ज क्रमांक</label>
              <input name="applicationId" value={form.applicationId} onChange={handleChange} className="input" placeholder="MAHADBT अर्ज क्रमांक" />
            </div>
          </div>
        </div>

        {/* Company Selection */}
        <div className="mt-8">
          <h3 className="text-lg md:text-xl font-bold text-blue-700 mb-4 md:mb-6 pb-3 md:pb-4 border-b-4 border-blue-400">
            🏢 Company / कंपनी
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Select Company / कंपनी निवडा *</label>
              <select name="company" value={form.company} onChange={handleChange} className="input" required disabled={loadingCompanies}>
                <option value="">{loadingCompanies ? 'Loading...' : 'Select Company'}</option>
                {companies.filter(c => c.engineer_name).map((comp) => (
                  <option key={comp.company_id} value={comp.company_name}>
                    {comp.company_name} - {comp.engineer_name} ({comp.designation})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Sales Engineer</label>
              <input name="salesEngg" value={form.salesEngg} className="input bg-gray-100 text-gray-600 cursor-not-allowed" disabled />
            </div>
          </div>
        </div>

        {/* Quotation Items */}
        <div className="mt-8">
          <h3 className="text-lg md:text-xl font-bold text-blue-700 mb-4 md:mb-6 pb-3 md:pb-4 border-b-4 border-blue-400">
            📦 Items / साहित्य
          </h3>
          
          {!form.company && (
            <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded-lg text-yellow-700">
              <p className="font-semibold">⚠️ Please select a company first / कृपया प्रथम कंपनी निवडा</p>
            </div>
          )}

          {form.company && (
            <>
              {/* Global GST % Shortcut - Apply same GST to all items */}
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableGlobalGst}
                      onChange={(e) => {
                        setEnableGlobalGst(e.target.checked);
                        if (!e.target.checked) {
                          // When unchecked, reset all GST to 0
                          applyGlobalGst(0);
                          setGlobalGstPercent(0);
                        }
                      }}
                      className="w-4 h-4 accent-yellow-600"
                    />
                    <span className="font-semibold text-gray-700 text-sm md:text-base">सर्व वस्तूंसाठी GST % लागू करा (Apply GST % to all items)</span>
                  </label>

                  {enableGlobalGst && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">GST %:</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-20 rounded-md border border-yellow-400 px-2 py-1 text-right focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                        value={globalGstPercent}
                        onChange={(e) => {
                          const newGst = Number(e.target.value) || 0;
                          setGlobalGstPercent(newGst);
                          applyGlobalGst(newGst);
                        }}
                        placeholder="0"
                      />
                      <button
                        type="button"
                        onClick={() => applyGlobalGst(globalGstPercent)}
                        className="px-3 py-1 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600 transition"
                      >
                        Apply
                      </button>
                      <span className="text-xs text-gray-500 ml-2">(तुम्ही एकल आयटम GST स्वतंत्रपणे बदलू शकता)</span>
                    </div>
                  )}
                </div>
                {!enableGlobalGst && (
                  <p className="text-xs text-gray-500 mt-2">डिफॉल्ट: सर्व आयटमसाठी GST 0% आहे. टिक करा व % टाका सर्वांना लागू करण्यासाठी.</p>
                )}
              </div>

              {/* Fitting / Installation & Accessories Charges Section */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableFittingCharges}
                      onChange={(e) => setEnableFittingCharges(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="font-semibold text-gray-700 text-sm md:text-base">फिटिंग / इन्स्टॉलेशन आणि अक्सेसरीज शुल्क जोडा टक्केवारी (%)</span>
                  </label>

                  {enableFittingCharges && (
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Charges %:</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-right focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                          value={fittingChargesPercent}
                          onChange={(e) => setFittingChargesPercent(Number(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">GST %:</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-right focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                          value={fittingChargesGst}
                          onChange={(e) => setFittingChargesGst(Number(e.target.value) || 0)}
                          placeholder="5"
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        ≈ ₹{enableFittingCharges && fittingChargesPercent > 0 ? ((fittingChargesPercent / 100) * computeQuotationTotals().taxable).toFixed(2) : '0.00'}
                        {fittingChargesGst > 0 && ` + GST ₹${(((fittingChargesGst / 100) * (fittingChargesPercent / 100) * computeQuotationTotals().taxable) || 0).toFixed(2)}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-100 shadow-sm">
                <table className="min-w-full bg-white">
                  <thead className="bg-blue-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Description</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Batch No</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Rate</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">GST%</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Qty</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {quotationItems.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-gray-500">
                          Loading products for company...
                        </td>
                      </tr>
                    )}
                    {quotationItems.map((it) => (
                      <tr key={it.product_id} className={`transition hover:bg-blue-100 ${(it.qty || 0) > 0 ? 'bg-blue-100' : 'bg-white'}`}>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          <div className="font-medium">{it.description || 'N/A'}</div>
                          {it.size && <div className="text-xs text-gray-400">Size: {it.size}</div>}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <input
                            type="text"
                            className="w-24 rounded-md border border-gray-200 px-2 py-1 text-center focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                            value={it.batch_no || ''}
                            onChange={(e) => updateQuotationItemField(it.product_id, 'batch_no', e.target.value)}
                            placeholder="-"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          ₹{Number(it.sales_rate || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-20 rounded-md border border-gray-200 px-2 py-1 text-right focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                            value={it.gst_percent ?? 0}
                            onChange={(e) => updateQuotationItemGST(it.product_id, e.target.value)}
                            placeholder="0"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className="w-24 rounded-md border border-gray-200 px-2 py-1 text-right focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                            value={it.qty ?? 0}
                            onChange={(e) => updateQuotationItemQty(it.product_id, e.target.value)}
                            placeholder="0"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-right">
                          ₹{Number(it.amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {quotationItems.length === 0 && (
                  <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                    Loading products...
                  </div>
                )}
                {quotationItems.map((it) => (
                  <div
                    key={it.product_id}
                    className={`p-4 rounded-lg border transition ${(it.qty || 0) > 0 ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}`}
                  >
                    <div className="mb-3">
                      <div className="font-semibold text-gray-800">{it.description || 'N/A'}</div>
                      {it.size && <div className="text-xs text-gray-500">Size: {it.size}</div>}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Batch No:</span>
                        <input
                          type="text"
                          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-center text-sm"
                          value={it.batch_no || ''}
                          onChange={(e) => updateQuotationItemField(it.product_id, 'batch_no', e.target.value)}
                          placeholder="-"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Rate:</span>
                        <span className="font-medium">₹{Number(it.sales_rate || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">GST %:</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-right text-sm"
                          value={it.gst_percent ?? 0}
                          onChange={(e) => updateQuotationItemGST(it.product_id, e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Qty:</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-right text-sm"
                          value={it.qty ?? 0}
                          onChange={(e) => updateQuotationItemQty(it.product_id, e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                        <span className="font-semibold text-gray-700">Amount:</span>
                        <span className="font-bold text-lg text-blue-600">₹{Number(it.amount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:flex md:justify-end gap-4 md:gap-8">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Taxable Amount:</p>
                    <p className="text-base md:text-lg font-semibold">₹{computeQuotationTotals().taxable.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Total GST:</p>
                    <p className="text-base md:text-lg font-semibold">₹{computeQuotationTotals().totalGst.toFixed(2)}</p>
                  </div>
                  {enableFittingCharges && fittingChargesPercent > 0 && (
                    <>
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">Fitting Charges ({fittingChargesPercent}%):</p>
                        <p className="text-base md:text-lg font-semibold">₹{computeQuotationTotals().fittingChargesAmount.toFixed(2)}</p>
                      </div>
                      {fittingChargesGst > 0 && (
                        <div>
                          <p className="text-xs md:text-sm text-gray-600">Fitting GST ({fittingChargesGst}%):</p>
                          <p className="text-base md:text-lg font-semibold">₹{computeQuotationTotals().fittingChargesGstAmount.toFixed(2)}</p>
                        </div>
                      )}
                    </>
                  )}
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-xs md:text-sm text-gray-600">Grand Total:</p>
                    <p className="text-lg md:text-xl font-bold text-blue-600">₹{computeQuotationTotals().total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notes */}
        {/* <div className="mt-8">
          <h3 className="text-lg md:text-xl font-bold text-blue-700 mb-4 md:mb-6 pb-3 md:pb-4 border-b-4 border-blue-400">
            📝 Notes / टीप
          </h3>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="input w-full h-24"
            placeholder="Additional notes for the quotation..."
          />
        </div> */}

        <style jsx>{`
          .input {
            border: 1px solid #e5e7eb;
            padding: 10px;
            border-radius: 6px;
            width: 100%;
          }
        `}</style>
      </form>

      {/* Sticky Submit Buttons */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center gap-3 md:gap-4 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-6 px-4 shadow-lg border-t border-gray-200 z-50">
        <button
          type="button"
          onClick={() => router.push('/quotations')}
          className="px-6 md:px-8 py-3 md:py-4 bg-red-500 hover:bg-red-600 text-white rounded-lg text-base md:text-lg font-semibold shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95"
        >
          Cancel / रद्द करा
        </button>

        <button
          type="button"
          onClick={submitQuotationAndPrint}
          className="px-6 md:px-8 py-3 md:py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-base md:text-lg font-semibold shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95"
          disabled={saving}
        >
          {saving ? 'Saving...' : (savedQuotationId ? 'Update & Print' : 'Save & Print')}
        </button>

        <button
          type="button"
          onClick={submitQuotation}
          className="px-8 md:px-12 py-3 md:py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 text-base md:text-lg font-semibold shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95"
          disabled={saving}
        >
          {saving ? 'Saving...' : (savedQuotationId ? 'Update / अपडेट करा' : 'Save / सेव्ह करा')}
        </button>
      </div>

      {/* Scroll to Top */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 md:bottom-28 md:right-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 md:p-4 shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95 z-50"
          aria-label="Scroll to top"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function NewQuotationPage() {
  return (
    <ProtectedRoute>
      <NewQuotationPageContent />
    </ProtectedRoute>
  );
}
