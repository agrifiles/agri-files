'use client';

import { useState, useRef, useEffect, useContext} from 'react';
import { LangContext } from '../layout';
import { Stage, Layer, Rect, Circle, Line, Image, Transformer, Arrow, Group } from 'react-konva';
import useImage from 'use-image';
import { useRouter, useSearchParams } from 'next/navigation'; // optional navigation
import { getCurrentUserId, getCurrentUser, API_BASE, getUserCompanyLinks, isUserVerified, formatBillNo } from '@/lib/utils';
import Loader from '@/components/Loader';
import { districtsEn, districtsMr } from '@/lib/districts';
import ProtectedRoute from '@/components/ProtectedRoute';
import { STANDARD_LAYOUTS } from '@/lib/standardLayouts';

function NewFilePageContent() {
  // ---------- Helper Functions ----------
  // Ensure date is in YYYY-MM-DD format for HTML date input
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    // If it's already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    // Otherwise parse it and format using LOCAL date (not UTC)
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      // Use local date components instead of toISOString (which converts to UTC)
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
      return {
        name: company.company_name,
        slot: company.company_slot || '?'
      };
    }
    return null;
  };

  // ---------- Localization ----------
  const { t, lang, toggleLang } = useContext(LangContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [savedFileId, setSavedFileId] = useState(null); // store returned id
  const [saving, setSaving] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false); // Loading state for file hydration
  const [mounted, setMounted] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const formRef = useRef(null);
  const billDateRef = useRef(null);

  // Auto-switch to Marathi when on file creation/update page
  useEffect(() => {
    setMounted(true);
    if (lang !== 'mr') {
      toggleLang();
    }
  }, []); // Run only on mount

  // Ensure Marathi is set when language changes
  useEffect(() => {
    if (mounted && lang !== 'mr') {
      toggleLang();
    }
  }, [lang, mounted, toggleLang]);

  // Handle scroll-to-top button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to bill section when section=bill parameter is present
  useEffect(() => {
    const section = searchParams?.get('section');
    if (section === 'bill') {
      // Set activeSection to 'bill' so the bill tab is visible
      setActiveSection('bill');
      setTimeout(() => {
        const billSection = document.getElementById('bill-section');
        if (billSection) {
          billSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }
  }, [searchParams]);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  
  const [form, setForm] = useState({
    fyYear: '', company: '', applicationId: '', farmerId: '', farmerName: '', fatherName: '',
    mobile: '', aadhaarNo: '', quotationNo: '', quotationDate: '', billDate: '', village: '',
    taluka: '', district: '', area8A: '', gutNo: '', cropName: '',
    irrigationArea: '', lateralSpacing: '', driplineProduct: '', dripperDischarge: '',
    dripperSpacing: '', planeLateralQty: '',
    // optional other fields referenced in UI
    salesEngg: '', pumpType: '', twoNozzelDistance: '', w1Name: '', w1Village: '',
    w2Name: '', w2Village: '', place: '', billAmount: '',
    // Bank details
    bankName: '', accountName: '', accountNumber: '', ifsc: '', bankBranch: '',
    // Common area and scheme details
    isCommonArea: false, schemeName: '', giverNames: '', customSchemeName: '',
    // engineer details (auto-populated from company selection)
    engineerDesignation: '', engineerMobile: '',
    // File type (POCRA or MAHADBT)
    fileType: ''
  });
  
  const [giverNamesList, setGiverNamesList] = useState(['']); // Track individual giver names
  
  const [originalCompany, setOriginalCompany] = useState(''); // Track original company for edit mode

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
            `⚠️ Bill items will be switched to products from the new company. Continue?`
          );
          if (!confirmed) {
            // Revert to previous company
            updatedForm.company = currentCompanyValue;
            return updatedForm;
          }
          // Company change confirmed - cache current items and switch
          console.log('🔄 Company changed from', currentCompanyValue, 'to', value);
          
          // Cache current bill items BEFORE switching (use previous company ID)
          if (previousCompany) {
            const prevCompanyId = String(previousCompany.company_id);
            console.log(`💾 Caching ${billItems.length} items for company ${prevCompanyId}`);
            setBillItemsCache(prevCache => ({
              ...prevCache,
              [prevCompanyId]: billItems
            }));
          }
          
          // Load new company (will check cache first)
          handleCompanyChangeInBill(selectedCompany.company_id);
        } else {
          // First company selection - just load products without confirmation
          console.log('🔄 First company selection:', value);
          loadProductsForCompany(selectedCompany.company_id);
        }
        
        // Update originalCompany to track for future changes
        setOriginalCompany(value);
      }
      
      if (selectedCompany && selectedCompany.engineer_name) {
        // Only populate if engineer_name exists
        updatedForm.salesEngg = selectedCompany.engineer_name;
        updatedForm.engineerDesignation = selectedCompany.designation || '';
        updatedForm.engineerMobile = selectedCompany.mobile || '';
      } else {
        // Clear fields if no engineer name exists
        console.log("No engineer found for selected company");
        updatedForm.salesEngg = '';
        updatedForm.engineerDesignation = '';
        updatedForm.engineerMobile = '';
      }
    }

    // ✅ If "district" changes, populate talukas, reset taluka, and sync witness districts
    if (name === "district") {
      const selectedDistrict = districts.find(d => d.name === value);
      if (selectedDistrict) {
        setTalukas(selectedDistrict.tahasil);
        updatedForm.taluka = ''; // reset taluka
        // Sync witness districts and talukas to match main district
        updatedForm.w1District = value;
        updatedForm.w2District = value;
        updatedForm.w1Taluka = '';
        updatedForm.w2Taluka = '';
        setW1Talukas(selectedDistrict.tahasil);
        setW2Talukas(selectedDistrict.tahasil);
      }
    }

    // ✅ If "taluka" changes, sync witness talukas
    if (name === "taluka") {
      updatedForm.w1Taluka = value;
      updatedForm.w2Taluka = value;
    }

    // ✅ If "fyYear" changes, refetch bill number for new FY
    if (name === "fyYear") {
      console.log(`📅 FY Year changed from ${prev.fyYear} to ${value}`);
      
      // Convert FY string (e.g., "2025-26") to format key (e.g., "2526")
      const fyParts = value.split('-');
      const fyKey = fyParts[0].slice(-2) + fyParts[1]; // "2025-26" → "2526"
      
      // Check if we have a cached bill number for this FY
      if (billNoCache[fyKey]) {
        console.log(`✅ Restoring cached bill number for FY ${value}: ${billNoCache[fyKey]}`);
        setBillNo(billNoCache[fyKey]);
      } else {
        // No cache - fetch new bill number for this FY
        console.log(`📦 No cache for FY ${value}, fetching new bill number`);
        if (billDate) {
          fetchNextBillNo(billDate);
        }
      }
    }

    {/* Removed w1District, w1Taluka, w2District, w2Taluka handlers since they auto-sync from main district/taluka */}

    // ✅ If "village" field changes, also update "place"
    if (name === "village") {
      updatedForm.place = value;
    }

    return updatedForm;
  });
};

  // Handle common area checkbox toggle
  const handleCommonAreaToggle = (e) => {
    const isChecked = e.target.checked;
    setForm(prev => ({
      ...prev,
      isCommonArea: isChecked,
      giverNames: isChecked ? prev.giverNames : '', // Clear giver names if unchecked
      schemeName: isChecked ? prev.schemeName : '' // Clear scheme name if unchecked
    }));
    if (isChecked) {
      setGiverNamesList(['']); // Start with one empty giver name
    } else {
      setGiverNamesList(['']);
    }
  };

  // Handle individual giver name change
  const handleGiverNameChange = (index, value) => {
    const updatedList = [...giverNamesList];
    updatedList[index] = value;
    setGiverNamesList(updatedList);
    // Update form giverNames with comma-separated values (filter out empty strings)
    const giverNamesStr = updatedList.filter(name => name.trim()).join(',');
    setForm(prev => ({
      ...prev,
      giverNames: giverNamesStr
    }));
  };

  // Add new giver name input field
  const addGiverNameField = () => {
    setGiverNamesList([...giverNamesList, '']);
  };

  // Remove giver name input field
  const removeGiverNameField = (index) => {
    const updatedList = giverNamesList.filter((_, i) => i !== index);
    setGiverNamesList(updatedList);
    // Update form giverNames
    const giverNamesStr = updatedList.filter(name => name.trim()).join(',');
    setForm(prev => ({
      ...prev,
      giverNames: giverNamesStr
    }));
  };

  const stageRef = useRef(null);
  const trRef = useRef(null);

  // Load images (place in /public)
  const [valveImg] = useImage('/valve.png');
  const [filterImg] = useImage('/screen_filter.png');
  const [flushImg] = useImage('/flush_valve.png');

  const [shapes, setShapes] = useState([]);
  const [standardGroup, setStandardGroup] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState(null);
  const [mode, setMode] = useState('draw'); // 'draw' or 'standard'
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  
  // Districts and Talukas state - will be set based on language
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [w1Talukas, setW1Talukas] = useState([]);
  const [w2Talukas, setW2Talukas] = useState([]);

  // Section selector (file vs bill)
  const [activeSection, setActiveSection] = useState('file');

  // Bill state management
  const [billNo, setBillNo] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [originalBillNo, setOriginalBillNo] = useState('');  // Track original bill number from DB
  const [originalBillDate, setOriginalBillDate] = useState('');  // Track original bill date from DB
  const [billCustomerName, setBillCustomerName] = useState('');
  const [billCustomerMobile, setBillCustomerMobile] = useState('');
  const [billStatus, setBillStatus] = useState('draft');
  const [billItems, setBillItems] = useState([]);
  const [lastFetchedMonthYear, setLastFetchedMonthYear] = useState('');
  const [products, setProducts] = useState([]);
  
  // Cache for bill items by company - allows switching back to previous company
  // Format: { companyId: billItems[] }
  const [billItemsCache, setBillItemsCache] = useState({});
  
  // Cache for bill numbers by FY - allows smooth switching between FYs
  // Format: { "2526": "01", "2627": "02" }
  const [billNoCache, setBillNoCache] = useState({});
  const [originalBillCompanyId, setOriginalBillCompanyId] = useState(null); // Track original bill's company

  // Fitting / Installation & Accessories charges
  const [enableFittingCharges, setEnableFittingCharges] = useState(false);
  const [fittingChargesPercent, setFittingChargesPercent] = useState(0);
  const [fittingChargesGst, setFittingChargesGst] = useState(0); // Default 0% GST (changed from 5)

  // Global GST % for all items - shortcut to apply same GST to all products
  const [enableGlobalGst, setEnableGlobalGst] = useState(false);
  const [globalGstPercent, setGlobalGstPercent] = useState(0);

  // Apply global GST to all items when enabled/changed
  const applyGlobalGst = (gstPercent) => {
    setBillItems(prev => prev.map(it => ({
      ...it,
      gst_percent: Number(gstPercent) || 0
    })));
    // Also update fitting charges GST if enabled
    if (enableFittingCharges) {
      setFittingChargesGst(Number(gstPercent) || 0);
    }
  };

  // Load districts based on selected language
  useEffect(() => {
    if (lang === 'mr') {
      setDistricts(districtsMr);
    } else {
      setDistricts(districtsEn);
    }
  }, [lang]);

  // Update talukas whenever district changes (handles language switching and file loading)
  useEffect(() => {
    if (form.district && districts.length > 0) {
      console.log('🔄 Updating talukas for district:', form.district);
      const selectedDistrict = districts.find(d => d.name === form.district);
      if (selectedDistrict && selectedDistrict.tahasil) {
        console.log('✅ Found matching district, talukas count:', selectedDistrict.tahasil.length);
        setTalukas(selectedDistrict.tahasil);
        setW1Talukas(selectedDistrict.tahasil);
        setW2Talukas(selectedDistrict.tahasil);
      } else {
        console.log('⚠️ District not found in current language:', form.district, 'Available districts:', districts.map(d => d.name));
        setTalukas([]);
      }
    }
  }, [form.district, districts]); // Re-run when district OR districts array changes

  // Fetch companies on mount using v2 API
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoadingCompanies(true);
        
        const uid = getCurrentUserId();
        if (!uid) {
          console.log('No user ID found');
          return;
        }
        
        // Use v2 API to fetch context (companies + engineer details)
        const res = await fetch(`${API_BASE}/api/v2/files/context/${uid}`);
        const data = await res.json();
        
        if (data.success && data.companyLinks) {
          console.log('✅ Fetched user company links:', data.companyLinks);
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

  // Clear products when company is cleared (loading is handled in handleChange)
  useEffect(() => {
    if (!form.company) {
      setBillItems([]);
      setProducts([]);
    }
    // NOTE: Product loading when company changes is handled in handleChange function
    // This ensures products are always reloaded and confirmation dialogs work correctly
  }, [form.company]);

  // Set default district and taluka from user data (for main, w1, and w2) - only if NOT editing
  useEffect(() => {
    const id = searchParams?.get?.('id');
    // Skip if we're in edit mode
    if (id) {
      console.log('Edit mode detected - skipping default district setup');
      return;
    }

    const user = getCurrentUser();
    if (user?.district) {
      console.log('New file mode - setting default district from user:', user.district);
      setForm((prev) => ({
        ...prev,
        district: user.district,
        taluka: user?.taluka || '',
        w1District: user.district,
        w1Taluka: user?.taluka || '',
        w2District: user.district,
        w2Taluka: user?.taluka || ''
      }));
      // Auto-populate talukas for the default district (for all three)
      const selectedDistrict = districts.find(d => d.name === user.district);
      if (selectedDistrict) {
        setTalukas(selectedDistrict.tahasil);
        setW1Talukas(selectedDistrict.tahasil);
        setW2Talukas(selectedDistrict.tahasil);
      }
    }
  }, [districts, searchParams]); // Re-run if districts change OR if we switch edit mode

  // If `?id=...` present, load file for editing and populate form
  useEffect(() => {
    const id = searchParams?.get?.('id');
    if (!id) return;

    const loadFileForEdit = async () => {
      setLoadingFile(true); // Start loading
      try {
        const res = await fetch(`${API_BASE}/api/v2/files/${id}`);
        const text = await res.text();
        let data = null;
        try { data = JSON.parse(text); } catch (_) { data = null; }
        if (!res.ok || !data?.success) {
          console.error('Failed to load file for edit', res.status, text);
          setLoadingFile(false);
          return;
        }

        const file = data.file;
        console.log('✅ File loaded for edit. District:', file.district, 'Taluka:', file.taluka);
        
        // set internal saved id so saves use PUT
        const returnedId = file.id ?? file.ID ?? file.file_id ?? null;
        if (returnedId) setSavedFileId(returnedId);
        
        // Track original company for edit mode
        if (file.company) {
          setOriginalCompany(file.company);
        }

        // map DB fields to form fields
        setForm((prev) => ({
          ...prev,
          fyYear: file.fy_year ?? prev.fyYear,
          company: file.company ?? prev.company,
          applicationId: file.application_id ?? prev.applicationId,
          farmerId: file.farmer_id ?? prev.farmerId,
          farmerName: file.farmer_name ?? prev.farmerName,
          fatherName: file.father_name ?? prev.fatherName,
          mobile: file.mobile ?? prev.mobile,
          quotationNo: file.quotation_no ?? prev.quotationNo,
          quotationDate: formatDateForInput(file.quotation_date ?? prev.quotationDate),
          aadhaarNo: file.aadhaar_no ?? prev.aadhaarNo,
          billDate: file.bill_date ? new Date(file.bill_date).toISOString().split('T')[0] : prev.billDate,
          village: file.village ?? prev.village,
          taluka: file.taluka ?? prev.taluka,
          district: file.district ?? prev.district,
          area8A: file.area8a ?? prev.area8A,
          gutNo: file.gut_no ?? prev.gutNo,
          cropName: file.crop_name ?? prev.cropName,
          irrigationArea: file.irrigation_area ?? prev.irrigationArea,
          lateralSpacing: file.lateral_spacing ?? prev.lateralSpacing,
          driplineProduct: file.dripline_product ?? prev.driplineProduct,
          dripperDischarge: file.dripper_discharge ?? prev.dripperDischarge,
          dripperSpacing: file.dripper_spacing ?? prev.dripperSpacing,
          planeLateralQty: file.plane_lateral_qty ?? prev.planeLateralQty,
          fileDate: formatDateForInput(file.file_date ?? prev.fileDate),
          salesEngg: file.sales_engg ?? prev.salesEngg,
          pumpType: file.pump_type ?? prev.pumpType,
          twoNozzelDistance: file.two_nozzel_distance ?? prev.twoNozzelDistance,
          w1Name: file.w1_name ?? prev.w1Name,
          w1Village: file.w1_village ?? prev.w1Village,
          w2Name: file.w2_name ?? prev.w2Name,
          w2Village: file.w2_village ?? prev.w2Village,
          w1District: file.district ?? prev.w1District,
          w1Taluka: file.taluka ?? prev.w1Taluka,
          w2District: file.district ?? prev.w2District,
          w2Taluka: file.taluka ?? prev.w2Taluka,
          place: file.place ?? prev.place,
          // Bank details
          bankName: file.bank_name ?? prev.bankName,
          accountName: file.account_name ?? prev.accountName,
          accountNumber: file.account_number ?? prev.accountNumber,
          ifsc: file.ifsc ?? prev.ifsc,
          bankBranch: file.bank_branch ?? prev.bankBranch,
          billAmount: file.bill_amount ?? prev.billAmount,
          // Common area and scheme details
          isCommonArea: file.is_common_area ?? prev.isCommonArea,
          schemeName: file.scheme_name || '',
          giverNames: file.giver_names || '',
          customSchemeName: '',
          fileType: file.file_type ?? prev.fileType
        }));

        // Update talukas dropdown for the loaded district
        const loadedDistrict = file.district;
        console.log('📁 File loaded. District from DB:', loadedDistrict);
        console.log('Available districts count:', districts.length);
        
        if (loadedDistrict && districts.length > 0) {
          const selectedDistrict = districts.find(d => d.name === loadedDistrict);
          if (selectedDistrict && selectedDistrict.tahasil) {
            console.log('✅ Talukas found for district:', loadedDistrict, 'Count:', selectedDistrict.tahasil.length);
            setTalukas(selectedDistrict.tahasil);
            setW1Talukas(selectedDistrict.tahasil);
            setW2Talukas(selectedDistrict.tahasil);
          } else {
            console.log('⚠️ District not found. Available:', districts.map(d => d.name));
          }
        } else {
          console.log('⚠️ Either no district or no districts array yet');
        }

        // shapes - be tolerant to several stored formats (stringified JSON, already-parsed array, double-encoded, etc.)
        try {
          const raw = file.shapes_json;
          let parsed = [];

          if (!raw) {
            parsed = [];
          } else if (Array.isArray(raw)) {
            parsed = raw;
          } else if (typeof raw === 'object') {
            // object but not array
            parsed = Array.isArray(raw) ? raw : [];
          } else if (typeof raw === 'string') {
            // try normal parse
            try {
              parsed = JSON.parse(raw);
            } catch (e1) {
              // try double-encoded JSON
              try {
                parsed = JSON.parse(JSON.parse(raw));
              } catch (e2) {
                // last-ditch: replace single quotes with double quotes and try
                try {
                  parsed = JSON.parse(raw.replace(/'/g, '"'));
                } catch (e3) {
                  console.warn('Invalid shapes_json for file (raw):', id, raw);
                  parsed = [];
                }
              }
            }
          } else {
            parsed = [];
          }

          // All shapes are now in standard format (no more separate standardGroup)
          console.log('=== LOAD FILE DEBUG INFO ===');
          console.log('Total parsed shapes:', parsed.length);
          console.log('Shapes loaded:');
          parsed.forEach((s, idx) => {
            console.log(`  ${idx}: type=${s.type}, id=${s.id}`,
              s.type === 'main_pipe' || s.type === 'sub_pipe' || s.type === 'lateral_pipe'
                ? `points=${JSON.stringify(s.points)}`
                : `x=${s.x}, y=${s.y}`);
          });
          console.log('=== END LOAD DEBUG INFO ===');
          
          setShapes(Array.isArray(parsed) ? parsed : []);
          // standardGroup no longer used - everything is flattened
          setStandardGroup(null);

          // Populate giver names list if common area is enabled
          if (file.is_common_area && file.giver_names) {
            const giverNamesArray = file.giver_names.split(',').map(name => name.trim());
            setGiverNamesList(giverNamesArray);
          } else {
            setGiverNamesList(['']);
          }
        } catch (e) {
          console.warn('Failed to parse shapes_json for file', id, e);
          setShapes([]);
        }

        // ===== LOAD ASSOCIATED BILL =====
        // If this file has a bill, load it
        try {
          const billRes = await fetch(`${API_BASE}/api/v2/bills?file_id=${returnedId}&limit=1`);
          const billText = await billRes.text();
          let billData = null;
          try { billData = JSON.parse(billText); } catch (e) { billData = null; }

          if (billRes.ok && billData?.success && billData?.bills && billData.bills.length > 0) {
            const billSummary = billData.bills[0];
            console.log('✅ Found associated bill_id:', billSummary.bill_id);

            // Now fetch full bill with items using bill_id
            const fullBillRes = await fetch(`${API_BASE}/api/v2/bills/${billSummary.bill_id}`);
            const fullBillText = await fullBillRes.text();
            let fullBillData = null;
            try { fullBillData = JSON.parse(fullBillText); } catch (e) { fullBillData = null; }

            if (fullBillRes.ok && fullBillData?.success && fullBillData?.bill) {
              const bill = fullBillData.bill;
              console.log('✅ Loaded full bill with items:', bill);

              // Set bill details
              setBillNo(bill.bill_no || '');
              setBillDate(formatDateForInput(bill.bill_date) || new Date().toISOString().split('T')[0]);
              
              // Track ORIGINAL bill details for FY switching
              setOriginalBillNo(bill.bill_no || '');
              setOriginalBillDate(formatDateForInput(bill.bill_date) || '');
              
              setLastFetchedMonthYear(bill.bill_date ? `${new Date(bill.bill_date).getFullYear()}-${new Date(bill.bill_date).getMonth() + 1}` : '');

              // Fetch products filtered by the bill's company
              if (bill.items && Array.isArray(bill.items)) {
                console.log('✅ Fetching products for bill company');
                console.log('Bill items count:', bill.items.length);
                
                // Get company_id from bill (NEW field we just added)
                let companyId = null;
                
                if (bill.company_id) {
                  companyId = bill.company_id;
                  console.log('📦 Using company_id from bill:', companyId);
                } else {
                  // Fallback: get company_id from form or bill items
                  const selectedCompany = companies.find(c => c.company_name === form.company);
                  
                  if (selectedCompany?.company_id) {
                    companyId = selectedCompany.company_id;
                    console.log('📦 Using company_id from dropdown:', companyId);
                  } else if (bill.items.length > 0 && bill.items[0].spare2) {
                    companyId = bill.items[0].spare2;
                    console.warn('⚠️ Company not in dropdown, using company_id from bill items:', companyId);
                  } else {
                    console.warn('⚠️ Could not find company_id - bill has no company context');
                  }
                }
                
                // Convert companyId to string since spare2 is TEXT field in database
                const companyIdText = companyId ? String(companyId) : '';
                console.log(`📦 Using company_id: ${companyIdText} (Type: ${typeof companyIdText})`);
                
                // Fetch products for user and company
                const owner_id = getCurrentUserId();
                console.log(`📦 Bill loading: owner_id=${owner_id}, companyId=${companyIdText}`);
                
                if (!owner_id) {
                  console.error('❌ Bill loading: No owner_id found');
                  return;
                }
                
                // IMPORTANT: Only fetch products if we have company context
                if (!companyIdText) {
                  console.warn('⚠️ No company_id for bill - showing bill items without product merge');
                  setBillItems(bill.items.filter(item => !item.is_fitting_charge).map(item => ({
                    product_id: item.product_id,
                    description: item.description || '',
                    hsn: item.hsn || '',
                    batch_no: item.batch_no || '',
                    cml_no: item.cml_no || '',
                    size: item.size || '',
                    gov_rate: item.gov_rate || 0,
                    sales_rate: item.sales_rate || 0,
                    uom: item.uom || '',
                    gst_percent: item.gst_percent || 0,
                    qty: item.qty || 0,
                    amount: item.amount || 0,
                    spare2: item.spare2
                  })));
                  return;
                }
                
                let productsUrl = `${API_BASE}/api/v2/files/products?userId=${owner_id}`;
                if (companyIdText) {
                  productsUrl += `&companyId=${companyIdText}`;
                }
                console.log('📡 Bill loading fetch URL:', productsUrl);
                const productsRes = await fetch(productsUrl);
                const productsText = await productsRes.text();
                const productsData = JSON.parse(productsText || '{}');
                const allProducts = productsData.products || [];

                console.log(`✅ Loaded ${allProducts.length} products for company ${companyIdText}`);
                
                // Store original bill's company ID for tracking
                setOriginalBillCompanyId(companyIdText);
                
                // Create a map of product_id -> bill item data from loaded bill
                const billItemMap = {};
                const billItemsWithoutFitting = bill.items.filter(item => 
                  !item.is_fitting_charge && 
                  item.product_id && 
                  !item.description?.includes('Fitting / Installation')
                );
                
                billItemsWithoutFitting.forEach(item => {
                  const key = String(item.product_id);
                  billItemMap[key] = {
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
                  console.log(`📋 Bill item: product_id=${key}, qty=${billItemMap[key].qty}`);
                });
                
                // Create set of product IDs from API for matching
                const productIdSet = new Set(allProducts.map(p => String(p.product_id ?? p.id)));
                
                // STEP 1: Map ALL products from API (with qty from bill if matched)
                const mergedItems = allProducts.map(prod => {
                  const productId = prod.product_id ?? prod.id;
                  const productIdKey = String(productId);
                  const billItem = billItemMap[productIdKey];
                  const salesRate = Number(prod.selling_rate || prod.sellingRate || prod.sales_rate || 0);
                  const qty = Number(billItem?.qty) || 0;
                  
                  // IMPORTANT: When editing, prioritize billItem's GST even if it's 0%
                  // Don't fall back to product's GST (which might be 5% by default)
                  const gstPercent = billItem !== undefined && billItem.gst_percent !== undefined 
                    ? Number(billItem.gst_percent) 
                    : Number(prod.sgst || prod.cgst || prod.gst_percent || 0);
                  
                  return {
                    product_id: productId,
                    description: prod.description_of_good || prod.name || prod.product_name || '',
                    hsn: prod.hsn_code || prod.hsn || '',
                    batch_no: billItem?.batch_no || prod.batch_no || prod.batchNo || '',  // Use saved billItem batch_no first
                    cml_no: billItem?.cml_no || prod.cml_no || prod.cmlNo || '',  // Use saved billItem cml_no first
                    size: prod.size || '',
                    gov_rate: Number(prod.gov_rate || prod.govRate || 0),
                    sales_rate: salesRate,
                    uom: prod.unit_of_measure || prod.unit || prod.uom || '',
                    gst_percent: gstPercent,
                    qty: qty,
                    amount: Number((qty * salesRate).toFixed(2)),
                    spare2: prod.spare2
                  };
                });
                
                // STEP 2: Add bill items that don't exist in current products (legacy/changed products)
                const unmatchedBillItems = billItemsWithoutFitting
                  .filter(item => !productIdSet.has(String(item.product_id)))
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
                
                if (unmatchedBillItems.length > 0) {
                  console.log(`📋 Adding ${unmatchedBillItems.length} legacy bill items (products no longer in catalog)`);
                }
                
                // Combine: all products + unmatched bill items
                const allFinalItems = [...mergedItems, ...unmatchedBillItems];
                
                // SORT by product_id ASC (consistent with new file order)
                const finalItems = allFinalItems.sort((a, b) => {
                  const aId = Number(a.product_id) || 0;
                  const bId = Number(b.product_id) || 0;
                  return aId - bId;
                });
                
                // Log summary
                const itemsWithQty = finalItems.filter(i => i.qty > 0);
                console.log('✅ Final bill items:', finalItems.length, '| Items with qty > 0:', itemsWithQty.length);
                
                setBillItems(finalItems);
                setProducts(allProducts);
                
                // Extract most common GST % from bill items with NON-ZERO QTY (for hydration in global GST field)
                // When editing: include items with 0% GST as valid values
                const billItemsWithQty = finalItems.filter(item => item.qty > 0);
                
                console.log('🔍 GST Hydration Debug:');
                console.log('  Total items:', finalItems.length);
                console.log('  Items with qty > 0:', billItemsWithQty.length);
                billItemsWithQty.forEach((item, idx) => {
                  console.log(`    Item ${idx+1}: qty=${item.qty}, gst_percent=${item.gst_percent}, description=${item.description?.substring(0, 30)}`);
                });
                
                if (billItemsWithQty.length > 0) {
                  // Create frequency map of ALL GST percentages (including 0%)
                  const gstFrequency = {};
                  billItemsWithQty.forEach(item => {
                    const gst = Number(item.gst_percent ?? 0); // Treat undefined/null as 0%
                    gstFrequency[gst] = (gstFrequency[gst] || 0) + 1;
                  });
                  
                  console.log('  GST Frequency map:', gstFrequency);
                  
                  // Find the most common GST %
                  const mostCommonGst = Object.entries(gstFrequency)
                    .sort((a, b) => b[1] - a[1])[0];
                  
                  if (mostCommonGst) {
                    const gstPercent = Number(mostCommonGst[0]);
                    const frequency = mostCommonGst[1];
                    console.log(`📊 Most common GST in bill (qty > 0): ${gstPercent}% (appears ${frequency} times)`);
                    setGlobalGstPercent(gstPercent);
                    // Auto-enable only if GST > 0
                    if (gstPercent > 0) {
                      setEnableGlobalGst(true);
                    } else {
                      setEnableGlobalGst(false); // Keep disabled for 0% GST
                    }
                  }
                } else {
                  console.log(`📊 No items with qty > 0 - keeping GST at 0%`);
                  setGlobalGstPercent(0);
                  setEnableGlobalGst(false);
                }
                
                // Cache this company's bill items for later switching
                setBillItemsCache(prev => ({
                  ...prev,
                  [companyIdText]: finalItems
                }));
                console.log('💾 Cached bill items for company:', companyIdText);

                // Check if bill has fitting charges
                const fittingChargeItem = bill.items.find(item => 
                  item.is_fitting_charge === true || item.description?.includes('Fitting / Installation & Accessories charges')
                );
                
                if (fittingChargeItem) {
                  console.log('✅ Found fitting charges:', fittingChargeItem);
                  const percentMatch = fittingChargeItem.description?.match(/@\s*([\d.]+)%/);
                  if (percentMatch) {
                    const extractedPercent = parseFloat(percentMatch[1]);
                    setEnableFittingCharges(true);
                    setFittingChargesPercent(extractedPercent);
                    console.log('✅ Set fitting charges percent to:', extractedPercent);
                  }
                  // Extract GST from fitting item - use original value even if 0%
                  if (fittingChargeItem.gst_percent !== undefined && fittingChargeItem.gst_percent !== null) {
                    setFittingChargesGst(Number(fittingChargeItem.gst_percent));
                    console.log('✅ Set fitting charges GST to:', fittingChargeItem.gst_percent);
                  }
                }
              }
            }
          } else {
            console.log('No associated bill found for this file');
          }
        } catch (billErr) {
          console.warn('Error loading bill for file:', billErr);
        }
      } catch (err) {
        console.error('loadFileForEdit err', err);
      } finally {
        setLoadingFile(false);
      }
    };

    loadFileForEdit();
  }, [searchParams]);


  const resetForm = () => {
  setForm({
    fyYear: '', company: '', applicationId: '', farmerId: '', farmerName: '', fatherName: '',
    mobile: '', aadhaarNo: '', quotationNo: '', quotationDate: '', billDate: '', village: '',
    taluka: '', district: '', area8A: '', gutNo: '', cropName: '',
    irrigationArea: '', lateralSpacing: '', driplineProduct: '', dripperDischarge: '',
    dripperSpacing: '', planeLateralQty: '',
    salesEngg: '', pumpType: '', twoNozzelDistance: '',
    w1Name: '', w1Village: '',
    w2Name: '', w2Village: '',
    place: '', billAmount: '',
    // Bank details
    bankName: '', accountName: '', accountNumber: '', ifsc: '', bankBranch: '',
    // Common area and scheme details
    isCommonArea: false, schemeName: '', giverNames: '', customSchemeName: '',
    engineerDesignation: '', engineerMobile: ''
  });

  setGiverNamesList(['']); // Reset giver names list
  setShapes([]);       // clear canvas
  setSavedFileId(null); // reset file id, so next SAVE is fresh POST
};

// ===== BILL-RELATED FUNCTIONS =====

// Fetch next bill number
const fetchNextBillNo = async (dateStr) => {
  const owner_id = getCurrentUserId();
  if (!owner_id) return;
  
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const monthYearKey = `${year}-${month}`;
  
  // Determine FY from the date
  const fyStartYear = month >= 4 ? year : year - 1;
  const fyEndYear = fyStartYear + 1;
  const fyKey = `${String(fyStartYear).slice(-2)}${String(fyEndYear).slice(-2)}`;
  
  if (monthYearKey === lastFetchedMonthYear) return;
  
  try {
    const res = await fetch(`${API_BASE}/api/v2/bills/next-bill-no?owner_id=${owner_id}&month=${month}&year=${year}`);
    const data = await res.json();
    if (data.success && data.bill_no) {
      console.log(`✅ Fetched bill number ${data.bill_no} for FY ${fyKey}`);
      setBillNo(data.bill_no);
      setLastFetchedMonthYear(monthYearKey);
      
      // For NEW files: set originalBillNo so same-FY date changes work correctly
      if (!savedFileId && !originalBillNo) {
        console.log(`📌 Setting originalBillNo to ${data.bill_no} for new file`);
        setOriginalBillNo(data.bill_no);
        setOriginalBillDate(dateStr);
      }
      
      // Cache the bill number for this FY for smooth FY switching
      setBillNoCache(prev => ({
        ...prev,
        [fyKey]: data.bill_no
      }));
    }
  } catch (err) {
    console.error('Failed to fetch next bill number:', err);
  }
};

// Helper function to get month abbreviation
const getMonthAbbr = (dateStr) => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const date = new Date(dateStr);
  return months[date.getMonth()];
};

// Helper function to extract sequence number from bill number (e.g., "2025DEC_03" → "03" OR "03" → "03")
const extractBillSequence = (billNo) => {
  if (!billNo) return null;
  const parts = billNo.split('_');
  // New format: bill number IS the sequence (e.g., "03")
  // Old format: sequence is after underscore (e.g., "2025DEC_03" → "03")
  return parts.length > 1 ? parts[1] : billNo;
};

// Helper function to determine FY year from a date
// FY starts in April, so March belongs to current FY year
const getFYYear = (dateStr) => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;  // 1-12
  const year = date.getFullYear();
  
  // If month is Jan-Mar, it belongs to FY of previous year
  // If month is Apr-Dec, it belongs to FY of current year
  if (month < 4) {
    return year - 1;  // Jan-Mar belongs to previous FY
  }
  return year;  // Apr-Dec belongs to current FY
};

// Handle bill date change - fetch new bill number if FY changes
const handleBillDateChange = (newDate) => {
  setBillDate(newDate);
  
  // Determine FY for new date and original date
  const newFY = getFYYear(newDate);
  const originalFY = originalBillDate ? getFYYear(originalBillDate) : null;
  
  // If FY changed, fetch new bill number for the new FY
  if (newFY !== originalFY) {
    console.log(`📅 FY Changed (${originalFY} → ${newFY}), fetching new bill number`);
    fetchNextBillNo(newDate);
  }
  // If FY is same, keep the existing bill number (no rearrangement)
};

// Load products and initialize bill items with all products (qty = 0 by default)
const loadProducts = async () => {
  const owner_id = getCurrentUserId();
  try {
    console.log('📦 loadProducts: owner_id =', owner_id, 'Type:', typeof owner_id);
    
    if (!owner_id) {
      console.error('❌ loadProducts: No owner_id found');
      return;
    }
    
    const url = `${API_BASE}/api/v2/files/products?userId=${owner_id}`;
    console.log('📡 Fetching from:', url);
    
    const res = await fetch(url);
    const text = await res.text();
    const data = JSON.parse(text || '{}');
    const allProducts = data.products || [];
    
    console.log('✅ Loaded products count:', allProducts.length);
    if (allProducts.length > 0) {
      console.log('Sample product spare1 values:', allProducts.slice(0, 3).map(p => ({ product_id: p.product_id, spare1: p.spare1 })));
    }
    
    setProducts(allProducts);

    // Initialize bill items with all products (qty = 0)
    const initialItems = allProducts.map(prod => ({
      product_id: prod.product_id ?? prod.id,
      description: prod.description_of_good || prod.name || prod.product_name || '',
      hsn: prod.hsn_code || prod.hsn || '',
      batch_no: prod.batch_no || prod.batchNo || '',
      size: prod.size || '',
      gov_rate: Number(prod.gov_rate || prod.govRate || 0),
      sales_rate: Number(prod.selling_rate || prod.sellingRate || prod.sales_rate || 0),
      uom: prod.unit_of_measure || prod.unit || prod.uom || '',
      gst_percent: 0, // Default GST is 0 for all items (user can enable global GST or set per item)
      qty: 0, // Default qty is 0
      amount: 0,
      spare2: prod.spare2 // Track company_id for filtering
    }));
    setBillItems(initialItems);
  } catch (err) {
    console.error(err);
  }
};

// Load products ONLY for selected company (filter by company_id)
const loadProductsForCompany = async (companyId) => {
  const owner_id = getCurrentUserId();
  try {
    if (!owner_id) {
      console.error('❌ loadProductsForCompany: No owner_id found');
      return;
    }
    
    console.log(`🔄 Loading products for company ${companyId}...`);
    const url = `${API_BASE}/api/v2/files/products?companyId=${companyId}&userId=${owner_id}`;
    
    const res = await fetch(url);
    const data = await res.json();
    const allProducts = data.products || [];
    
    console.log(`✅ API returned ${allProducts.length} products`);
    setProducts(allProducts);

    // Initialize bill items with loaded products (qty = 0)
    const initialItems = allProducts
      // Sort by product_id ASC for consistent order (oldest → newest)
      .sort((a, b) => {
        const aId = a.product_id ?? a.id;
        const bId = b.product_id ?? b.id;
        return Number(aId) - Number(bId);
      })
      .map(prod => ({
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
    
    console.log('📋 Setting billItems with:', initialItems.length, 'items');
    setBillItems(initialItems);
  } catch (err) {
    console.error('❌ Error loading products for company:', err);
  }
};

// Handle company change when bill exists - cache current items, then check cache or load fresh
// NOTE: Bill items are not deleted from DB here - they will be replaced when user saves the file
const handleCompanyChangeInBill = async (newCompanyId) => {
  const newCompanyIdStr = String(newCompanyId);
  console.log(`🔄 Handling company change in bill to company ${newCompanyIdStr}`);
  
  // Check if we have cached items for the NEW company
  const cachedItems = billItemsCache[newCompanyIdStr];
  const uid = getCurrentUserId();
  
  if (cachedItems && cachedItems.length > 0) {
    // Restore from cache
    console.log(`✅ Restoring ${cachedItems.length} cached items for company ${newCompanyIdStr}`);
    setBillItems(cachedItems);
    
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
    setBillItems([]);
    await loadProductsForCompany(newCompanyId);
  }
  
  console.log('✅ Company switch complete');
};

// Update bill item qty (automatically calculate amount)
const updateBillItemQty = (productId, newQty) => {
  setBillItems(prev => prev.map(it => 
    it.product_id === productId 
      ? {
          ...it, 
          qty: Number(newQty || 0),
          amount: Number(((Number(newQty || 0)) * it.sales_rate).toFixed(2))
        } 
      : it
  ));
};

// Update bill item GST percent
const updateBillItemGST = (productId, newGST) => {
  setBillItems(prev => prev.map(it => 
    it.product_id === productId 
      ? {
          ...it, 
          gst_percent: Number(newGST || 0)
        } 
      : it
  ));
};

// Update any bill item field (generic handler)
const updateBillItemField = (productId, field, value) => {
  setBillItems(prev => prev.map(it => 
    it.product_id === productId 
      ? { ...it, [field]: value } 
      : it
  ));
};

// Get only items with qty > 0 for saving
const getBillItemsForSave = () => {
  const items = billItems.filter(it => (it.qty || 0) > 0);
  
  // Add fitting charges as a separate item if enabled
  if (enableFittingCharges && fittingChargesPercent > 0) {
    const taxableAmount = computeBillTotals().taxable;
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

// Compute bill totals
const computeBillTotals = () => {
  let taxable = 0;
  let totalGst = 0;
  for (const it of billItems) {
    const amt = Number(it.amount || 0);
    taxable += amt;
    const gst = (Number(it.gst_percent||0)/100) * amt;
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

// Load products on mount
useEffect(() => {
  console.log('🔄 [FILTER] Page mounted - NOT loading all products');
  console.log('🔄 [FILTER] Products will be loaded ONLY when company is selected');
  
  const owner_id = getCurrentUserId();
  if (owner_id && billDate) {
    fetchNextBillNo(billDate);
  }
}, []);

// const DEFAULT_API_BASE = API_BASE// use your deployed backend
// const API_BASE = (typeof window !== 'undefined' && (process?.env?.NEXT_PUBLIC_API_BASE)) 
//   ? process.env.NEXT_PUBLIC_API_BASE 
//   : DEFAULT_API_BASE;

const submitForm = async (e) => {
  e.preventDefault();

  if (saving) return; // prevent double submit

  // Check if user is verified before allowing file creation/update
  if (!isUserVerified()) {
    alert(t.accountNotActive || 'आपले खाते सक्रिय नाही. कृपया प्रशासकांशी संपर्क करा - 📞 8055554030 किंवा 📧 connect.agrifiles@gmail.com');
    return;
  }

  // ===== VALIDATE BILL NUMBER =====
  if (!billNo || billNo.trim() === '') {
    alert('⚠️ Bill number is mandatory. Please enter a bill number (e.g., 01, 02, 03)');
    return;
  }
  
  const billNoStr = billNo.trim();
  if (!/^\d+$/.test(billNoStr)) {
    alert('⚠️ Bill number must contain only digits (e.g., 01, 02, 03). No special characters or letters allowed.');
    return;
  }

  // Validate required file fields
  if (!form.fyYear || !form.farmerName || !form.mobile) {
    alert('Please fill in all required file fields (FY Year, Farmer Name, Mobile)');
    return;
  }

  const owner_id = getCurrentUserId();
  if (!owner_id) {
    alert('User ID not found. Please log in again.');
    return;
  }

  // Function to flatten standardGroup by applying transformations to each shape
  const flattenStandardGroup = (group) => {
    if (!group || !group.shapes || !Array.isArray(group.shapes)) {
      return [];
    }
    
    console.log('=== SAVING STANDARD LAYOUT ===');
    console.log('Layout will be rendered with rotation:', group.rotation, 'degrees');
    console.log('Total shapes:', group.shapes.length);
    
    return group.shapes.map(s => ({
      ...s,
      rotation: (s.rotation || 0) + (group.rotation || 0)
    }));
  };

  // Flatten standardGroup if it exists, otherwise use regular shapes
  const shapesToSave = standardGroup ? flattenStandardGroup(standardGroup) : shapes;

  // Calculate bill totals to get the actual bill amount
  const billTotals = computeBillTotals();
  const actualBillAmount = billTotals.total;

  // Normalize bill number before saving
  const normalizedBillNo = billNo ? billNo.trim().padStart(2, '0') : null;

  // Add bill data to form before saving
  const formWithBillData = {
    ...form,
    billNo: normalizedBillNo,
    bill_no: normalizedBillNo,  // snake_case for backend
    billDate: billDate || new Date().toISOString().split('T')[0],
    bill_date: billDate || new Date().toISOString().split('T')[0],  // snake_case for backend
    billAmount: actualBillAmount  // Use calculated total, not form input
  };

  const filePayload = {
    owner_id,                         
    title: `${form.farmerName || 'File'} - ${billDate}`,
    form: { ...formWithBillData, fileDate: billDate },  // Use billDate as fileDate
    bill_no: normalizedBillNo,  // Explicitly include bill_no at file level
    bill_date: billDate || new Date().toISOString().split('T')[0],  // Explicitly include bill_date at file level
    shapes: shapesToSave
  };

  console.log('=== SUBMITTING FORM ===');
  console.log('File Payload:', filePayload);
  console.log('📊 Bill totals calculated:', billTotals);
  console.log('📊 actualBillAmount:', actualBillAmount);
  console.log('📊 formWithBillData.billAmount:', formWithBillData.billAmount);
  console.log('🔍 Common area fields:');
  console.log('   form.isCommonArea:', form.isCommonArea);
  console.log('   form.schemeName:', form.schemeName);
  console.log('   form.giverNames:', form.giverNames);

  try {
    setSaving(true);
    const isUpdate = !!savedFileId;

    // Validate file and bill data
    if (!form.farmerName || !form.mobile) {
      alert('Farmer name and mobile are required');
      setSaving(false);
      return;
    }

    // ===== STEP 1: SAVE FILE =====
    console.log(`Step 1: ${isUpdate ? 'Updating' : 'Creating'} file...`);
    const fileUrl = isUpdate ? `${API_BASE}/api/v2/files/${savedFileId}` : `${API_BASE}/api/v2/files`;
    const fileMethod = isUpdate ? 'PUT' : 'POST';

    const fileRes = await fetch(fileUrl, {
      method: fileMethod,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filePayload),
    });

    const fileText = await fileRes.text();
    let fileData = null;
    try { fileData = JSON.parse(fileText); } catch (err) { fileData = null; }

    if (!fileRes.ok) {
      console.error('❌ File save failed:', fileRes.status, fileText);
      // Check for account not verified error
      if (fileRes.status === 403 && fileData?.accountNotActive) {
        alert(t.accountNotActive || 'आपले खाते सक्रिय नाही. कृपया प्रशासकांशी संपर्क करा - 📞 8055554030 किंवा 📧 connect.agrifiles@gmail.com');
      } else {
        alert(`File save failed: ${fileRes.status}\nResponse: ${fileText}\nSee console for details.`);
      }
      setSaving(false);
      return;
    }

    if (!fileData || !fileData.success) {
      console.error('❌ Unexpected file response:', fileData ?? fileText);
      alert('File save failed: unexpected response from server.');
      setSaving(false);
      return;
    }

    const fileId = fileData.file?.id ?? fileData.file?.ID ?? fileData.file?.file_id ?? null;
    if (!fileId) {
      console.error('❌ No file ID returned from server');
      alert('File save failed: no ID returned from server.');
      setSaving(false);
      return;
    }

    if (!isUpdate) {
      setSavedFileId(fileId);
    }
    console.log('✅ File saved successfully. ID:', fileId);

    // ===== STEP 2: SAVE BILL =====
    console.log(`Step 2: ${isUpdate && billNo ? 'Updating' : 'Creating'} bill...`);

    // Prepare bill payload with items NOW that we have fileId
    // IMPORTANT: Use backend field names: farmer_name (not customer_name), farmer_mobile (not customer_mobile)
    // Only include items with qty > 0
    
    // Get company context
    const selectedCompany = companies.find(c => c.company_name === form.company);
    const company_id = selectedCompany?.company_id || null;
    const company_slot_no = selectedCompany?.company_slot || null;
    
    const billPayload = {
      bill_no: billNo ? billNo.trim().padStart(2, '0') : null,  // Normalize: pad with leading zeros (01, 02, etc.)
      bill_date: billDate || new Date().toISOString().split('T')[0],
      farmer_name: form.farmerName,
      farmer_mobile: form.mobile,
      status: 'draft',
      owner_id: owner_id,  // REQUIRED: Owner ID for database constraint
      created_by: owner_id,
      file_id: fileId, // NOW we have fileId from file save
      company_id: company_id,  // NEW: Company reference
      company_slot_no: company_slot_no,  // NEW: Slot number
      total_amount: actualBillAmount,  // Calculated bill total
      taxable_amount: billTotals.taxable,  // Taxable amount
      billItems: getBillItemsForSave() // Only items with qty > 0
    };
    
    console.log('📦 Bill payload:', { bill_no: billPayload.bill_no, owner_id, company_id, company_slot_no, total_amount: billPayload.total_amount, items_count: billPayload.billItems.length });
    
    let billUrl = null;
    let billMethod = null;
    let billIdForUpdate = null;

    if (isUpdate && billNo) {
      // Update existing bill - need to find bill_id first
      // Query to get bill_id from file_id or bill_no
      console.log(`Fetching existing bill for file_id: ${fileId} or bill_no: ${billNo}...`);
      const getBillRes = await fetch(`${API_BASE}/api/v2/bills?file_id=${fileId}&owner_id=${owner_id}&limit=1`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const getBillText = await getBillRes.text();
      let getBillData = null;
      try { getBillData = JSON.parse(getBillText); } catch (err) { getBillData = null; }
      
      if (getBillRes.ok && getBillData && getBillData.bills && getBillData.bills.length > 0) {
        // Bill exists - update it using bill_id
        billIdForUpdate = getBillData.bills[0].bill_id;
        billUrl = `${API_BASE}/api/v2/bills/${billIdForUpdate}`;
        billMethod = 'PUT';
        console.log(`Found existing bill_id: ${billIdForUpdate}`);
      } else {
        // Bill doesn't exist yet - create new one
        billUrl = `${API_BASE}/api/v2/bills`;
        billMethod = 'POST';
        console.log('No existing bill found - will create new one');
      }
    } else {
      // Create new bill for this file
      billUrl = `${API_BASE}/api/v2/bills`;
      billMethod = 'POST';
    }

    console.log(`Bill request: ${billMethod} ${billUrl}`);
    console.log('Bill Payload:', billPayload);

    const billRes = await fetch(billUrl, {
      method: billMethod,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billPayload),
    });

    const billText = await billRes.text();
    let billData = null;
    try { billData = JSON.parse(billText); } catch (err) { billData = null; }

    if (!billRes.ok) {
      console.error('❌ Bill save failed:', billRes.status);
      console.error('Response:', billText);
      console.error('Parsed Data:', billData);
      if (billRes.status === 403 && billData?.accountNotActive) {
        alert(t.accountNotActive || 'आपले खाते सक्रिय नाही. कृपया प्रशासकांशी संपर्क करा - 📞 8055554030 किंवा 📧 connect.agrifiles@gmail.com');
      } else {
        alert(`⚠️ File saved, but Bill save failed: ${billRes.status}\nError: ${billData?.error || billText}`);
      }
      setSaving(false);
      return;
    }

    if (!billData || !billData.success) {
      console.error('❌ Unexpected bill response:', billData ?? billText);
      alert('⚠️ File saved, but unexpected bill response.');
      setSaving(false);
      return;
    }

    const returnedBillNo = billData.bill?.bill_no ?? billData.bill?.billNo ?? billData.bill?.id ?? null;
    const returnedBillId = billData.bill?.bill_id ?? billIdForUpdate ?? null;
    
    if (!isUpdate && returnedBillNo && !billNo) {
      setBillNo(returnedBillNo);
      console.log('✅ Bill created successfully. Bill No:', returnedBillNo);
    } else if (isUpdate) {
      console.log('✅ Bill updated successfully. Bill No:', billNo);
      
      // If FY changed, trigger resequencing of bills in original FY to fill gaps
      const originalFY = originalBillDate ? getFYYear(originalBillDate) : null;
      const newFY = getFYYear(billDate);
      
      if (originalFY !== null && originalFY !== newFY) {
        console.log(`📅 FY changed (${originalFY} → ${newFY}), triggering resequence for original FY ${originalFY}...`);
        
        try {
          const reseqRes = await fetch(`${API_BASE}/api/v2/bills/resequence-fy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ owner_id, fy_year: originalFY })
          });
          
          const reseqData = await reseqRes.json();
          if (reseqData.success) {
            console.log(`✅ Resequenced ${reseqData.billsUpdated} bills in FY ${originalFY}`);
          } else {
            console.error('❌ Resequence failed:', reseqData.error);
          }
        } catch (err) {
          console.error('❌ Error triggering resequence:', err);
        }
      }
    }

    // ===== VERIFY BILL ITEMS WERE SAVED =====
    const expectedItemsCount = billPayload.billItems.length;
    if (expectedItemsCount > 0 && returnedBillId) {
      console.log(`🔍 Verifying bill items... Expected: ${expectedItemsCount} items`);
      
      const verifyRes = await fetch(`${API_BASE}/api/v2/bills/${returnedBillId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        const savedItemsCount = verifyData.bill?.items?.length || 0;
        
        console.log(`🔍 Verification: Saved ${savedItemsCount} items, Expected ${expectedItemsCount} items`);
        
        if (savedItemsCount === 0 && expectedItemsCount > 0) {
          console.error('❌ Bill items verification FAILED! No items saved.');
          alert(`⚠️ Warning: Bill was saved but ${expectedItemsCount} items were NOT saved!\nPlease try saving again or contact support.`);
          setSaving(false);
          return;
        } else if (savedItemsCount < expectedItemsCount) {
          console.warn(`⚠️ Bill items partial save: ${savedItemsCount}/${expectedItemsCount} items saved`);
          alert(`⚠️ Warning: Only ${savedItemsCount} of ${expectedItemsCount} bill items were saved.\nPlease verify and try again.`);
          setSaving(false);
          return;
        } else {
          console.log(`✅ Bill items verified: ${savedItemsCount} items saved successfully`);
        }
      } else {
        console.warn('⚠️ Could not verify bill items (verification request failed)');
      }
    }

    alert(`✅ File and Bill saved successfully!\nFile ID: ${fileId}\nBill No: ${returnedBillNo}${expectedItemsCount > 0 ? `\nBill Items: ${expectedItemsCount}` : ''}`);

    // Update talukas dropdown based on the saved district
    const savedDistrict = form.district;
    if (savedDistrict) {
      const selectedDistrict = districts.find(d => d.name === savedDistrict);
      if (selectedDistrict) {
        setTalukas(selectedDistrict.tahasil);
      }
    }

    // ===== STEP 3: SUCCESS - REDIRECT =====
    console.log('✅ All data saved successfully. Redirecting to files page...');
    setTimeout(() => {
      router.push('/files');
    }, 1500);

  } catch (err) {
    console.error('❌ Network/save error:', err);
    alert(`Network error: ${err.message || err}\nSee console for details.`);
    setSaving(false);
  } finally {
    if (saving) {
      setSaving(false);
    }
  }
};

// Save form and redirect to print page
const submitFormAndPrint = async (e) => {
  e.preventDefault();

  if (saving) return; // prevent double submit

  // Check if user is verified before allowing file creation/update/print
  if (!isUserVerified()) {
    alert(t.accountNotActive || 'आपले खाते सक्रिय नाही. कृपया प्रशासकांशी संपर्क करा - 📞 8055554030 किंवा 📧 connect.agrifiles@gmail.com');
    return;
  }

  // ===== VALIDATE BILL NUMBER =====
  if (!billNo || billNo.trim() === '') {
    alert('⚠️ Bill number is mandatory. Please enter a bill number (e.g., 01, 02, 03)');
    return;
  }
  
  const billNoStr = billNo.trim();
  if (!/^\d+$/.test(billNoStr)) {
    alert('⚠️ Bill number must contain only digits (e.g., 01, 02, 03). No special characters or letters allowed.');
    return;
  }

  // Validate required file fields
  if (!form.fyYear || !form.farmerName || !form.mobile) {
    alert('Please fill in all required file fields (FY Year, Farmer Name, Mobile)');
    return;
  }

  const owner_id = getCurrentUserId();
  if (!owner_id) {
    alert('User ID not found. Please log in again.');
    return;
  }

  // Function to flatten standardGroup by applying transformations to each shape
  const flattenStandardGroup = (group) => {
    if (!group || !group.shapes || !Array.isArray(group.shapes)) {
      return [];
    }
    
    console.log('=== SAVING STANDARD LAYOUT ===');
    console.log('Layout will be rendered with rotation:', group.rotation, 'degrees');
    console.log('Total shapes:', group.shapes.length);
    
    return group.shapes.map(s => ({
      ...s,
      rotation: (s.rotation || 0) + (group.rotation || 0)
    }));
  };

  // Flatten standardGroup if it exists, otherwise use regular shapes
  const shapesToSave = standardGroup ? flattenStandardGroup(standardGroup) : shapes;

  // Normalize bill number before saving
  const normalizedBillNo = billNo ? billNo.trim().padStart(2, '0') : null;

  const filePayload = {
    owner_id,                         
    title: `${form.farmerName || 'File'} - ${billDate}`,
    form: { ...form, fileDate: billDate, bill_no: normalizedBillNo, bill_date: billDate || new Date().toISOString().split('T')[0] },  // Include normalized bill_no and bill_date
    bill_no: normalizedBillNo,  // Explicitly include bill_no at file level
    bill_date: billDate || new Date().toISOString().split('T')[0],  // Explicitly include bill_date at file level
    shapes: shapesToSave
  };

  console.log('=== SUBMITTING FORM AND PRINT ===');
  console.log('File Payload:', filePayload);

  try {
    setSaving(true);
    const isUpdate = !!savedFileId;

    // Validate file and bill data
    if (!form.farmerName || !form.mobile) {
      alert('Farmer name and mobile are required');
      setSaving(false);
      return;
    }

    // ===== STEP 1: SAVE FILE =====
    console.log(`Step 1: ${isUpdate ? 'Updating' : 'Creating'} file...`);
    const fileUrl = isUpdate ? `${API_BASE}/api/v2/files/${savedFileId}` : `${API_BASE}/api/v2/files`;
    const fileMethod = isUpdate ? 'PUT' : 'POST';

    const fileRes = await fetch(fileUrl, {
      method: fileMethod,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filePayload),
    });

    const fileText = await fileRes.text();
    let fileData = null;
    try { fileData = JSON.parse(fileText); } catch (e) { fileData = null; }

    if (!fileRes.ok) {
      console.error('❌ File save failed:', fileRes.status);
      console.error('Response:', fileText);
      console.error('Parsed Data:', fileData);
      alert(`File save failed: ${fileRes.status}\nError: ${fileData?.error || fileText}`);
      setSaving(false);
      return;
    }

    if (!fileData || !fileData.success) {
      console.error('❌ Unexpected file response:', fileData ?? fileText);
      alert('Unexpected file response.');
      setSaving(false);
      return;
    }

    const fileId = fileData.file?.id ?? fileData.file?.file_id ?? savedFileId;
    console.log('✅ File saved successfully. File ID:', fileId);
    setSavedFileId(fileId);

    // ===== STEP 2: SAVE BILL =====
    if (!fileId) {
      alert('File ID not available for bill save.');
      setSaving(false);
      return;
    }

    console.log('Step 2: Saving bill for file...');
    
    // Get company context
    const selectedCompany = companies.find(c => c.company_name === form.company);
    const company_id = selectedCompany?.company_id || null;
    const company_slot_no = selectedCompany?.company_slot || null;
    
    const billPayload = {
      file_id: fileId,
      bill_no: billNo.trim().padStart(2, '0'),  // Normalize: pad with leading zeros (01, 02, etc.)
      bill_date: billDate,
      farmer_name: form.farmerName || '',
      farmer_mobile: form.mobile || '',
      owner_id: owner_id,  // REQUIRED: Owner ID for database constraint
      created_by: owner_id,
      company_id: company_id,
      company_slot_no: company_slot_no,
      billItems: getBillItemsForSave() // Changed from 'items' to 'billItems' for backend compatibility
    };

    console.log('Bill Payload:', billPayload);

    // Determine if bill is new or update
    let billUrl = `${API_BASE}/api/v2/bills`;
    let billMethod = 'POST';

    if (isUpdate && savedFileId) {
      // Query for existing bill
      const billQuery = await fetch(`${API_BASE}/api/v2/bills?file_id=${fileId}&limit=1`);
      const billQueryText = await billQuery.text();
      let billQueryData = null;
      try { billQueryData = JSON.parse(billQueryText); } catch (e) { billQueryData = null; }

      if (billQuery.ok && billQueryData?.success && billQueryData?.bills && billQueryData.bills.length > 0) {
        const existingBill = billQueryData.bills[0];
        billUrl = `${API_BASE}/api/v2/bills/${existingBill.bill_id}`;
        billMethod = 'PUT';
        console.log('Bill exists, will update bill_id:', existingBill.bill_id);
      }
    }

    const billRes = await fetch(billUrl, {
      method: billMethod,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billPayload),
    });

    const billText = await billRes.text();
    let billData = null;
    try { billData = JSON.parse(billText); } catch (e) { billData = null; }

    if (!billRes.ok) {
      console.error('❌ Bill save failed:', billRes.status);
      console.error('Response:', billText);
      console.error('Parsed Data:', billData);
      alert(`⚠️ File saved, but Bill save failed: ${billRes.status}\nError: ${billData?.error || billText}`);
      setSaving(false);
      return;
    }

    if (!billData || !billData.success) {
      console.error('❌ Unexpected bill response:', billData ?? billText);
      alert('⚠️ File saved, but unexpected bill response.');
      setSaving(false);
      return;
    }

    // Get bill_id for verification
    const returnedBillId = billData.bill?.bill_id ?? null;
    
    // ===== VERIFY BILL ITEMS WERE SAVED =====
    const expectedItemsCount = billPayload.billItems.length;
    if (expectedItemsCount > 0 && returnedBillId) {
      console.log(`🔍 Verifying bill items... Expected: ${expectedItemsCount} items`);
      
      const verifyRes = await fetch(`${API_BASE}/api/v2/bills/${returnedBillId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        const savedItemsCount = verifyData.bill?.items?.length || 0;
        
        console.log(`🔍 Verification: Saved ${savedItemsCount} items, Expected ${expectedItemsCount} items`);
        
        if (savedItemsCount === 0 && expectedItemsCount > 0) {
          console.error('❌ Bill items verification FAILED! No items saved.');
          alert(`⚠️ Warning: Bill was saved but ${expectedItemsCount} items were NOT saved!\nPlease try saving again or contact support.`);
          setSaving(false);
          return;
        } else if (savedItemsCount < expectedItemsCount) {
          console.warn(`⚠️ Bill items partial save: ${savedItemsCount}/${expectedItemsCount} items saved`);
          alert(`⚠️ Warning: Only ${savedItemsCount} of ${expectedItemsCount} bill items were saved.\nPlease verify and try again.`);
          setSaving(false);
          return;
        } else {
          console.log(`✅ Bill items verified: ${savedItemsCount} items saved successfully`);
        }
      } else {
        console.warn('⚠️ Could not verify bill items (verification request failed)');
      }
    }

    console.log('✅ Bill saved successfully.');

    // ===== STEP 3: SUCCESS - REDIRECT TO PRINT =====
    console.log('✅ All data saved successfully. Redirecting to print page...');
    setSaving(false);
    setTimeout(() => {
      router.push(`/files/print/${fileId}`);
    }, 500);

  } catch (err) {
    console.error('❌ Network/save error:', err);
    alert(`Network error: ${err.message || err}\nSee console for details.`);
    setSaving(false);
  }
};
  const addShape = (type) => {
    // If standard layout is present, clear it before drawing any new shape
    setStandardGroup(null);
    if (type === 'main_pipe' || type === 'lateral_pipe' || type === 'sub_pipe') {
      setTool(type);
      return;
    }
    const id = `shape_${Date.now()}`;
    const newShape = {
      id,
      type,
      x: 120,
      y: 100,
      width: type === 'valve_image' || type === 'filter_image' || type === 'flush_image' ? 60 : 100,
      height: type === 'valve_image' || type === 'filter_image' || type === 'flush_image' ? 60 : 80,
      radius: 40,
      rotation: 0,
    };
    setShapes((prev) => [...prev, newShape]);
    setSelectedId(id);
  };

  // ---------- Drawing ----------
  const handleMouseDown = (e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    if (tool === 'main_pipe' || tool === 'lateral_pipe' || tool === 'sub_pipe') {
      const id = `shape_${Date.now()}`;
      let stroke = 'orange', strokeWidth = 3, dash = [];
      if (tool === 'main_pipe') {
        stroke = 'orange';
        strokeWidth = 3;
        dash = [];
      } else if (tool === 'lateral_pipe') {
        stroke = 'blue';
        strokeWidth = 2;
        dash = [10, 5];
      } else if (tool === 'sub_pipe') {
        stroke = '#166534'; // Tailwind green-800
        strokeWidth = 3;
        dash = [];
      }
      const newLine = {
        id,
        type: tool,
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke,
        strokeWidth,
        dash,
      };
      setShapes((prev) => [...prev, newLine]);
      setCurrentLine(id);
      setIsDrawing(true);
      return;
    }

    if (e.target === stage) setSelectedId(null);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentLine) return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    setShapes((prev) =>
      prev.map((s) =>
        s.id === currentLine
          ? { ...s, points: [s.points[0], s.points[1], pos.x, pos.y] }
          : s
      )
    );
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setCurrentLine(null);
      setTool(null);
    }
  };

  // ---------- Transform / Drag ----------
  const handleDragEnd = (id, e) => {
    const { x, y } = e.target.position();
    setShapes((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (
          s.type === 'main_pipe' ||
          s.type === 'lateral_pipe' ||
          s.type === 'sub_pipe'
        ) {
          // Move both points by the group delta
          const [x0, y0, x1, y1] = s.points;
          const dx = x - x0;
          const dy = y - y0;
          return { ...s, points: [x0 + dx, y0 + dy, x1 + dx, y1 + dy] };
        }
        // For other shapes, just update x/y
        return { ...s, x, y };
      })
    );
  };

  const handleTransformEnd = (id, node) => {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    setShapes((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          if (s.type === 'border' || s.type.includes('image')) {
            return {
              ...s,
              x: node.x(),
              y: node.y(),
              width: node.width() * scaleX,
              height: node.height() * scaleY,
              rotation: node.rotation(),
            };
          }
          if (s.type === 'well') {
            return {
              ...s,
              x: node.x(),
              y: node.y(),
              radius: Math.max(5, s.radius * scaleX),
              rotation: node.rotation(),
            };
          }
        }
        return s;
      })
    );
  };

  const handleDelete = () => {
    if (selectedId) {
      setShapes((prev) => prev.filter((s) => s.id !== selectedId));
      setSelectedId(null);
    }
  };

  // ---------- Transformer ----------
  useEffect(() => {
    const transformer = trRef.current;
    if (!transformer) return;
    const stage = stageRef.current;
    // Try to find a Group first (for pipes), else fallback to any node with the id
    let selectedNode = stage.findOne(`Group#${selectedId}`);
    if (!selectedNode) {
      selectedNode = stage.findOne(`#${selectedId}`);
    }
    transformer.nodes(selectedNode ? [selectedNode] : []);
    transformer.getLayer().batchDraw();
  }, [selectedId, shapes]);

  const isEditing = Boolean(savedFileId || searchParams?.get?.('id'));

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-3 md:py-5 px-2 md:px-4 relative">
      {saving && <Loader fullScreen message={savedFileId ? (t.updating || 'Updating...') : (t.savingFile || 'Saving file...')} />}
      {loadingFile && <Loader fullScreen message="Loading file details..." />}

      <form
        ref={formRef}
        onSubmit={submitForm}
        className="w-full max-w-6xl bg-white shadow-lg rounded-lg p-4 md:p-8 space-y-6 pb-32 md:pb-40"
      >

<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-3 md:gap-4">
  {/* Title on the left */}
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
  <h2 className="text-xl md:text-2xl font-bold text-cyan-700">{activeSection === 'file' ? (isEditing ? (t.update || 'Update File') : t.newFile) : 'Create / Update Bill'}</h2>
  </div>
</div>

{/* Section Tabs */}
<div className="flex gap-2 md:gap-4 mb-8 border-b-2 border-gray-200">
  <button
    type="button"
    onClick={() => setActiveSection('file')}
    className={`px-4 md:px-6 py-3 font-semibold text-base md:text-lg transition-colors duration-200 ${
      activeSection === 'file'
        ? 'border-b-4 border-cyan-600 text-cyan-700 bg-cyan-50'
        : 'text-gray-600 hover:text-cyan-600 border-b-4 border-transparent'
    }`}
  >
    📋 File Details
  </button>
  <button
    type="button"
    // onClick={() => {
    //   if (!form.company) {
    //     alert('⚠️ Please select a company first');
    //     return;
    //   }
    //   setActiveSection('bill');
    // }}
    onClick={() => {
  if (!form.company) {
    alert('⚠️ Please select a company first');
    return;
  }
  setActiveSection('bill');
  setTimeout(() => {
    billDateRef.current?.focus();
  }, 300); // Delay to ensure section is rendered
}}
    disabled={!form.company}
    className={`px-4 md:px-6 py-3 font-semibold text-base md:text-lg transition-colors duration-200 ${
      !form.company
        ? 'cursor-not-allowed opacity-50 text-gray-400 border-b-4 border-transparent'
        : activeSection === 'bill'
        ? 'border-b-4 border-green-600 text-green-700 bg-green-50'
        : 'text-gray-600 hover:text-green-600 border-b-4 border-transparent'
    }`}
  >
    💰 Bill Details
  </button>
</div>

{/* FILE SECTION */}
{activeSection === 'file' && !loadingFile && (
  <div>



        {/* Step 1: Farmer & Farm Details */}
        <div>
          <h3 className="text-lg md:text-xl font-bold text-cyan-700 mb-4 md:mb-6 pb-3 md:pb-4 border-b-4 border-cyan-400">{t.stepOne || 'Farmer & Farm Details'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.fyYear}</label>
              <select name="fyYear" value={form.fyYear} onChange={handleChange} className="input" required>
                <option value="">{t.fyYear}</option>
                <option value="2025-26">2025-26</option>
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.farmerName}</label>
              <input name="farmerName" value={form.farmerName} onChange={handleChange} className="input" required />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1 text-sm md:text-base">{t.applicationId}</label>
              <input name="applicationId" value={form.applicationId} onChange={handleChange} className="input" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1 text-sm md:text-base">{t.farmerId}</label>
              <input name="farmerId" value={form.farmerId} onChange={handleChange} className="input" />
            </div>


            <div className="flex flex-col">
              <label className="font-semibold mb-1 text-sm md:text-base">{t.fatherName}</label>
              <input name="fatherName" value={form.fatherName} onChange={handleChange} className="input" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1 text-sm md:text-base">{t.mobile}</label>
              <input name="mobile" value={form.mobile} onChange={handleChange} className="input" />
            </div>

                        <div className="flex flex-col">
              <label className="font-semibold mb-1 text-sm md:text-base">{t.aadhaarNo}</label>
              <input name="aadhaarNo" value={form.aadhaarNo} onChange={handleChange} className="input" />
            </div>



 

            <div className="flex flex-col">
              <label className="font-semibold mb-1 text-sm md:text-base">{t.area8a}</label>
              <input name="area8A" value={form.area8A} onChange={handleChange} className="input" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1 text-sm md:text-base">{t.gutNo}</label>
              <input name="gutNo" value={form.gutNo} onChange={handleChange} className="input" />
            </div>
           <div className="flex flex-col">
              <label className="font-semibold mb-1 text-sm md:text-base">{t.village}</label>
              <input name="village" value={form.village} onChange={handleChange} className="input" />
            </div>

            {/* File Type Radio Buttons */}
            <div className="col-span-1 md:col-span-2 flex flex-col gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="font-semibold text-sm md:text-base text-gray-700">{lang === 'en' ? 'File Type' : 'फाइल प्रकार'}</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="fileType" 
                    value="POCRA" 
                    checked={form.fileType === 'POCRA'}
                    onChange={(e) => setForm({...form, fileType: e.target.value})}
                    className="w-4 h-4"
                  />
                  <span className="text-sm md:text-base font-semibold text-gray-700">POCRA</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="fileType" 
                    value="MAHADBT" 
                    checked={form.fileType === 'MAHADBT'}
                    onChange={(e) => setForm({...form, fileType: e.target.value})}
                    className="w-4 h-4"
                  />
                  <span className="text-sm md:text-base font-semibold text-gray-700">MAHADBT</span>
                </label>
              </div>
            </div>

            



            
                        <div className="flex flex-col">
              <label className="font-semibold mb-1 text-sm md:text-base">{t.district}</label>
              <select name="district" value={form.district} onChange={handleChange} className="input" required>
                <option value="">{t.district}</option>
                {districts.map(d => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

                        <div className="flex flex-col">
              <label className="font-semibold mb-1 text-sm md:text-base">{t.taluka}</label>
              <select name="taluka" value={form.taluka} onChange={handleChange} className="input" required>
                <option value="">Select Taluka</option>
                {talukas.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Common Area Checkbox */}
            <div className="col-span-1 md:col-span-2 flex items-center gap-2 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
              <input 
                type="checkbox" 
                id="isCommonArea" 
                checked={form.isCommonArea} 
                onChange={handleCommonAreaToggle}
                className="w-5 h-5 accent-yellow-600 cursor-pointer"
              />
              <label htmlFor="isCommonArea" className="text-sm md:text-base font-semibold cursor-pointer text-gray-700">
                {lang === 'en' ? 'Common Area - Multiple Farmers in Same Gut No.' : t.commonArea}
              </label>
            </div>

            {/* Conditional Fields for Common Area */}
            {form.isCommonArea && (
              <>
                {/* Scheme Name Dropdown - Static Options Only */}
                <div className="col-span-1 md:col-span-2">
                  <label className="font-semibold mb-1 text-sm md:text-base">{lang === 'en' ? 'Scheme Name' : t.schemeName}</label>
                  <select 
                    value={form.schemeName || (lang === 'en' ? 'प्रधानमंत्री कृषी सिंचाई योजने अंतर्गत केंद्र पुरस्कृत सिंचन योजना' : t.schemeDefault)} 
                    onChange={(e) => setForm({...form, schemeName: e.target.value})}
                    className="input"
                  >
                    {/* <option value="">{lang === 'en' ? 'Select Scheme' : 'योजना निवडा'}</option> */}
                    <option value={lang === 'en' ? 'प्रधानमंत्री कृषी सिंचाई योजने अंतर्गत केंद्र पुरस्कृत सिंचन योजना' : t.schemeDefault}>
                      {lang === 'en' ? 'प्रधानमंत्री कृषी सिंचाई योजने अंतर्गत केंद्र पुरस्कृत सिंचन योजना' : t.schemeDefault}
                    </option>
                    <option value={lang === 'en' ? 'नानाजी देशमुख कृषी संजवणी प्रकल्प' : t.scheme2}>
                      {lang === 'en' ? 'नानाजी देशमुख कृषी संजवणी प्रकल्प' : t.scheme2}
                    </option>
                  </select>
                </div>

                {/* Giver Names */}
                <div className="col-span-1 md:col-span-2">
                  <label className="font-semibold mb-2 text-sm md:text-base">{lang === 'en' ? 'Giver Names (Co-Farmers)' : t.giverNames + ' (सह-शेतकरी)'}</label>
                  <div className="space-y-2">
                    {giverNamesList.map((name, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => handleGiverNameChange(index, e.target.value)}
                            className="input" 
                            placeholder={lang === 'en' ? `Farmer ${index + 1} Name` : `शेतकरी ${index + 1} नाव`}
                          />
                        </div>
                        {giverNamesList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeGiverNameField(index)}
                            className="px-2 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addGiverNameField}
                    className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-700 text-sm font-semibold"
                  >
                    {lang === 'en' ? '+ Add Farmer' : t.addFarmer}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
        

        {/* Step 2: Company & Equipment Details */}
        <div className="mt-8 md:mt-12">
          <h3 className="text-lg md:text-xl font-bold text-cyan-700 mb-4 md:mb-6 pb-3 md:pb-4 border-b-4 border-cyan-400">{t.stepTwo || 'Company & Equipment Details'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">

            <div className="flex flex-col">
              <label className="font-semibold mb-1 text-sm md:text-base">{t.selectCompany}</label>
              <select name="company" value={form.company} onChange={handleChange} className="input" required disabled={loadingCompanies}>
                <option value="">{loadingCompanies ? 'Loading...' : t.selectCompany}</option>
                {companies.filter(c => c.engineer_name).map((comp) => (
                  <option key={comp.company_id} value={comp.company_name}>
                    {comp.company_name} - {comp.engineer_name} ({comp.designation})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="font-semibold mb-1 text-sm md:text-base">{t.salesEngg}</label>
              <input name="salesEngg" value={form.salesEngg} onChange={handleChange} className="input bg-gray-100 text-gray-600 cursor-not-allowed" disabled />
            </div>


            <div className="flex flex-col">
              <label className="font-semibold mb-1 text-sm md:text-base">{t.selectCrop}</label>
              <select name="cropName" value={form.cropName} onChange={handleChange} className="input">
                <option value="">{t.selectCrop}</option>
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
              <label className="font-semibold mb-1 text-sm md:text-base">{t.irrigationType}</label>
              <select name="driplineProduct" value={form.driplineProduct} onChange={handleChange} className="input">
                <option value="">{t.irrigationType}</option>
                <option value={t.drip}>{t.drip}</option>
                <option value={t.sprinkler}>{t.sprinkler}</option>
                <option value={t.microSprinkler}>{t.microSprinkler}</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1 text-sm md:text-base">{t.irrigationArea}</label>
              <input name="irrigationArea" value={form.irrigationArea} onChange={handleChange} className="input" required />
            </div>

              <div className="flex flex-col">
              <label className="font-semibold mb-1 text-sm md:text-base">{t.pumpType}</label>
              <select name="pumpType" value={form.pumpType} onChange={handleChange} className="input" required>
                <option value="">{t.pumpType}</option>
                <option value="electric">{t.electric}</option>
                <option value="solar">{t.solar}</option>
                <option value="diesel">{t.diesel}</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1 text-sm md:text-base">{t.lateralSpacing}</label>
              <input name="lateralSpacing" value={form.lateralSpacing} onChange={handleChange} className="input" required />
            </div>

                                   {/* <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.twoNozzelDistance}</label>
              <input name="twoNozzelDistance" value={form.twoNozzelDistance} onChange={handleChange} className="input" />
            </div>
 */}

            
            {/* <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.twoNozzelDistance}</label>
              <input name="twoNozzelDistance" value={form.twoNozzelDistance} onChange={handleChange} className="input" />
            </div> */}

                        <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.dripperDischarge}</label>
              <input name="dripperDischarge" value={form.dripperDischarge} onChange={handleChange} className="input" required />
            </div>

            {/* <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.driplineProduct}</label>
              <input name="driplineProduct" value={form.driplineProduct} onChange={handleChange} className="input" required />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.dripperSpacing}</label>
              <select name="dripperSpacing" value={form.dripperSpacing} onChange={handleChange} className="input">
                <option value="">{t.selectDripperSpacing}</option>
                <option value="10cm">10 cm</option>
                <option value="20cm">20 cm</option>
                <option value="30cm">30 cm</option>
                <option value="40cm">40 cm</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.planeLateralQty}</label>
              <input name="planeLateralQty" value={form.planeLateralQty} onChange={handleChange} className="input" required />
            </div> */}




                        <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.quotationNo}</label>
              <input 
                name="quotationNo" 
                value={form.quotationNo} 
                onChange={handleChange}
                className="input" 
                placeholder="Enter Quotation No"
              />
              {/* Auto-generation commented out:
              value={billNo ? billNo.replace(/_(\d+)$/, '_QT$1') : ''} 
              disabled 
              */}
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.quotationDate}</label>
              <input 
                type="date" 
                name="quotationDate" 
                value={form.quotationDate} 
                onChange={handleChange}
                className="input" 
              />
              {/* Auto-sync with billDate commented out:
              value={billDate} 
              disabled 
              */}
            </div> 

            {/* <div className="flex flex-col">
              <label className="font-semibold mb-1"sddsds>{t.billNo}</label>
              <input name="billNo" value={form.billNo} onChange={handleChange} className="input" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.billDate}</label>
              <input type="date" name="billDate" value={form.billDate} onChange={handleChange} className="input" />
            </div> */}
          </div>
        </div>

         {/* Step 3: Farm Layout Designer */}
         <div className="mt-8 md:mt-12">
           <h3 className="text-lg md:text-xl font-bold text-cyan-700 mb-4 md:mb-6 pb-3 md:pb-4 border-b-4 border-cyan-400">{t.graphTitle}</h3>

      {/* Mode Selection Radio Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mb-4 md:mb-6 p-3 md:p-4 bg-gray-100 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="mode"
            value="draw"
            checked={mode === 'draw'}
            onChange={(e) => {
              // If switching from standard to draw and standard layout exists, ask for confirmation
              if (mode === 'standard' && standardGroup) {
                const confirmed = window.confirm(t.confirmStandardToDraw);
                if (!confirmed) return;
              }
              setMode('draw');
              setStandardGroup(null);
              setSelectedId(null);
            }}
            className="w-4 h-4"
          />
          <span className="font-semibold">{t.drawMode || 'Draw Mode'}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="mode"
            value="standard"
            checked={mode === 'standard'}
            onChange={(e) => {
              // If switching from draw to standard and shapes exist, ask for confirmation
              if (mode === 'draw' && shapes.length > 0) {
                const confirmed = window.confirm(t.confirmDrawToStandard);
                if (!confirmed) return;
              }
              setMode('standard');
              setShapes([]);
              setSelectedId(null);
              setTool(null);
            }}
            className="w-4 h-4"
          />
          <span className="font-semibold">{t.standardLayout || 'Standard Layout'}</span>
        </label>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap justify-center gap-1 md:gap-2 mb-3 md:mb-4">
        {/* Equipment Buttons - Only show in Draw Mode */}
        {mode === 'draw' && (
        <div className="flex gap-1 md:gap-2 flex-wrap justify-center">
          <button type="button" onClick={() => addShape('well')} className="px-2 md:px-3 py-1 text-xs md:text-sm border-2 border-blue-500 text-blue-500 bg-transparent rounded transition-colors duration-150 hover:bg-blue-500 hover:text-white">{t.well}</button>
          <button type="button" onClick={() => addShape('main_pipe')} className="px-2 md:px-3 py-1 text-xs md:text-sm border-2 border-orange-500 text-orange-500 bg-transparent rounded transition-colors duration-150 hover:bg-orange-500 hover:text-white">{t.mainPipe}</button>
          <button type="button" onClick={() => addShape('sub_pipe')} className="px-2 md:px-3 py-1 text-xs md:text-sm border-2 border-green-800 text-white bg-green-800 rounded transition-colors duration-150 hover:bg-green-900">Sub Pipe</button>
          <button type="button" onClick={() => addShape('lateral_pipe')} className="px-2 md:px-3 py-1 text-xs md:text-sm border-2 border-sky-500 text-sky-500 bg-transparent rounded transition-colors duration-150 hover:bg-sky-500 hover:text-white">{t.lateralPipe}</button>
          <button type="button" onClick={() => addShape('border')} className="px-2 md:px-3 py-1 text-xs md:text-sm border-2 border-green-600 text-green-600 bg-transparent rounded transition-colors duration-150 hover:bg-green-600 hover:text-white">{t.border}</button>
          <button type="button" onClick={() => addShape('valve_image')} className="px-2 md:px-3 py-1 text-xs md:text-sm border-2 border-purple-500 text-purple-500 bg-transparent rounded transition-colors duration-150 hover:bg-purple-500 hover:text-white">{t.valve}</button>
          <button type="button" onClick={() => addShape('filter_image')} className="px-2 md:px-3 py-1 text-xs md:text-sm border-2 border-teal-600 text-teal-600 bg-transparent rounded transition-colors duration-150 hover:bg-teal-600 hover:text-white">{t.filter}</button>
          <button type="button" onClick={() => addShape('flush_image')} className="px-2 md:px-3 py-1 text-xs md:text-sm border-2 border-sky-600 text-sky-600 bg-transparent rounded transition-colors duration-150 hover:bg-sky-600 hover:text-white">{t.flush}</button>

          <button type="button" onClick={handleDelete} className="px-2 md:px-3 py-1 text-xs md:text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-150">{t.delete}</button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t.confirmClearAll)) {
                setShapes([]);
                setSelectedId(null);
              }
            }}
            className="px-2 md:px-3 py-1 text-xs md:text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors duration-150"
          >
            {t.clearAll}
          </button>
        </div>
        )}

        {/* Action Buttons - Only show in Standard Layout Mode */}
        {mode === 'standard' && (
        <div className="flex gap-1 md:gap-2 border-l-3 pl-2 flex-wrap justify-center">
          {/* 4 Standard Layout Buttons */}
          <button
            type="button"
            onClick={() => {
              const layout = STANDARD_LAYOUTS['layout_1_vertical_left'];
              setStandardGroup({
                id: 'standard-layout-group',
                rotation: 0,
                x: 60,
                y: 35,
                shapes: layout.shapes
              });
              setSelectedId('standard-layout-group');
            }}
            className="px-2 md:px-3 py-1 text-xs md:text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            title={STANDARD_LAYOUTS['layout_1_vertical_left'].description}
          >
            {t.layout1}
          </button>
          
          <button
            type="button"
            onClick={() => {
              const layout = STANDARD_LAYOUTS['layout_2_horizontal_bottom'];
              setStandardGroup({
                id: 'standard-layout-group',
                rotation: 0,
            x: 60,
                y: 35,
                shapes: layout.shapes
              });
              setSelectedId('standard-layout-group');
            }}
            className="px-2 md:px-3 py-1 text-xs md:text-sm bg-green-600 text-white rounded hover:bg-green-700"
            title={STANDARD_LAYOUTS['layout_2_horizontal_bottom'].description}
          >
            {t.layout2}
          </button>
          
          <button
            type="button"
            onClick={() => {
              const layout = STANDARD_LAYOUTS['layout_3_u_shaped'];
              setStandardGroup({
                id: 'standard-layout-group',
                rotation: 0,
                 x: 70,
                y: 5,
                shapes: layout.shapes
              });
              setSelectedId('standard-layout-group');
            }}
            className="px-2 md:px-3 py-1 text-xs md:text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            title={STANDARD_LAYOUTS['layout_3_u_shaped'].description}
          >
            {t.layout3}
          </button>
          
          <button
            type="button"
            onClick={() => {
              const layout = STANDARD_LAYOUTS['layout_4_grid_pattern'];
              setStandardGroup({
                id: 'standard-layout-group',
                rotation: 0,
                  x: 55,
                y: 5,
                shapes: layout.shapes
              });
              setSelectedId('standard-layout-group');
            }}
            className="px-2 md:px-3 py-1 text-xs md:text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
            title={STANDARD_LAYOUTS['layout_4_grid_pattern'].description}
          >
            {t.layout4}
          </button>

          <button
            type="button"
            onClick={() => {
              const layout = STANDARD_LAYOUTS['layout_5_both_sides'];
              setStandardGroup({
                id: 'standard-layout-group',
                rotation: 0,
                x: 0,
                y: 0,
                shapes: layout.shapes
              });
              setSelectedId('standard-layout-group');
            }}
            className="px-2 md:px-3 py-1 text-xs md:text-sm bg-red-600 text-white rounded hover:bg-red-700"
            title={STANDARD_LAYOUTS['layout_5_both_sides'].description}
          >
            {t.layout5}
          </button>
        </div>
        )}
      </div>

      {/* Canvas */}
      <div className="w-full md:w-auto flex justify-center mb-4 md:mb-6 p-2 md:p-4" style={{ position: 'relative', display: 'inline-block' }}>
        <Stage
          width={900}
          height={416}
          ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          border: '2px solid #ccc',
          backgroundColor: '#ffffff',
          backgroundImage: `
            linear-gradient(to right, rgba(144, 238, 144, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(144, 238, 144, 0.3) 1px, transparent 1px),
            linear-gradient(to right, rgba(34, 139, 34, 0.35) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(34, 139, 34, 0.35) 1px, transparent 1px)
          `,
          backgroundSize: '5px 5px, 5px 5px, 50px 50px, 50px 50px',
          cursor: tool?.includes('pipe') ? 'crosshair' : 'default',
        }}
      >
        <Layer>
          {/* Render standardd layout group if present */}
          {standardGroup && (
            <Group
              id={standardGroup.id}
              x={standardGroup.x}
              y={standardGroup.y}
              rotation={standardGroup.rotation}
              scale={standardGroup.scale || { x: 1, y: 1 }}
              offset={standardGroup.offset || { x: 0, y: 0 }}
              draggable
              onClick={() => setSelectedId(standardGroup.id)}
              onDragEnd={(e) => {
                const newX = e.target.x();
                const newY = e.target.y();
                console.log('Standard layout group dragged:');
                console.log('  New position: x=' + newX + ', y=' + newY);
                console.log('  Scale:', standardGroup.scale);
                console.log('  Rotation:', e.target.rotation());
                setStandardGroup(prev => ({
                  ...prev,
                  x: newX,
                  y: newY,
                }));
              }}
              onTransformEnd={(e) => {
                const node = e.target;
                const newX = node.x();
                const newY = node.y();
                const newRotation = node.rotation();
                const newScaleX = node.scaleX();
                const newScaleY = node.scaleY();
                
                console.log('Standard layout group transformed (resize/rotate):');
                console.log('  New position: x=' + newX + ', y=' + newY);
                console.log('  New rotation:', newRotation);
                console.log('  New scale: x=' + newScaleX + ', y=' + newScaleY);
                console.log('  Previous scale:', standardGroup.scale);
                
                setStandardGroup(prev => ({
                  ...prev,
                  x: newX,
                  y: newY,
                  rotation: newRotation,
                  scale: {
                    x: newScaleX,
                    y: newScaleY,
                  },
                }));
                
                // Reset scale to 1 to avoid compounding
                node.scaleX(1);
                node.scaleY(1);
              }}
              ref={node => {
                if (node && selectedId === standardGroup.id && trRef.current) {
                  trRef.current.nodes([node]);
                }
              }}
            >
              {/* Render all shapes */}
              {standardGroup.shapes.map((s) => {
                if (s.type === 'main_pipe' || s.type === 'sub_pipe') {
                  const [x1, y1, x2, y2] = s.points;
                  const relPoints = [x1, y1, x2, y2];
                  return (
                    <Line
                      key={s.id}
                      points={relPoints}
                      stroke={s.stroke}
                      strokeWidth={s.strokeWidth}
                      dash={s.dash}
                      hitStrokeWidth={20}
                    />
                  );
                }
                if (s.type === 'lateral_pipe') {
                  // Render with arrows, matching normal shapes
                  const [x1, y1, x2, y2] = s.points;
                  const dash = [10, 5];
                  const arrowLength = 14;
                  const arrowWidth = 10;
                  const dx = x2 - x1;
                  const dy = y2 - y1;
                  const len = Math.sqrt(dx * dx + dy * dy);
                  const offset = arrowLength * (len > 0 ? 1 : 0) / len;
                  const relPoints = [0, 0, dx, dy];
                  const sx1 = dx * offset;
                  const sy1 = dy * offset;
                  const ex2 = dx - dx * offset;
                  const ey2 = dy - dy * offset;
                  return (
                    <Group key={s.id + '-group'} id={s.id} x={x1} y={y1}>
                      <Line
                        key={s.id + '-line'}
                        points={relPoints}
                        stroke={s.stroke}
                        strokeWidth={s.strokeWidth}
                        dash={dash}
                        hitStrokeWidth={20}
                      />
                      <Arrow
                        key={s.id + '-arrow-start'}
                        points={[sx1, sy1, 0, 0]}
                        pointerLength={arrowLength}
                        pointerWidth={arrowWidth}
                        fill={s.stroke}
                        stroke={s.stroke}
                        strokeWidth={s.strokeWidth}
                      />
                      <Arrow
                        key={s.id + '-arrow-end'}
                        points={[ex2, ey2, dx, dy]}
                        pointerLength={arrowLength}
                        pointerWidth={arrowWidth}
                        fill={s.stroke}
                        stroke={s.stroke}
                        strokeWidth={s.strokeWidth}
                      />
                    </Group>
                  );
                }
                if (s.type === 'well') {
                  return (
                    <Circle
                      key={s.id}
                      x={s.x}
                      y={s.y}
                      radius={s.radius}
                      stroke="blue"
                      strokeWidth={2}
                      fillEnabled={false}
                    />
                  );
                }
                if (s.type === 'border') {
                  return (
                    <Rect
                      key={s.id}
                      x={s.x}
                      y={s.y}
                      width={s.width}
                      height={s.height}
                      stroke="green"
                      strokeWidth={2}
                      fillEnabled={false}
                    />
                  );
                }
                if (s.type === 'valve_image') {
                  return (
                    <Image
                      key={s.id}
                      x={s.x}
                      y={s.y}
                      width={s.width}
                      height={s.height}
                      image={valveImg}
                      rotation={s.rotation || 0}
                    />
                  );
                }
                if (s.type === 'filter_image') {
                  return (
                    <Image
                      key={s.id}
                      x={s.x}
                      y={s.y}
                      width={s.width}
                      height={s.height}
                      image={filterImg}
                      rotation={s.rotation || 0}
                    />
                  );
                }
                if (s.type === 'flush_image') {
                  return (
                    <Image
                      key={s.id}
                      x={s.x}
                      y={s.y}
                      width={s.width}
                      height={s.height}
                      image={flushImg}
                      rotation={s.rotation || 0}
                    />
                  );
                }
                return null;
              })}

              {/* Calculate bounding box for selection area */}
              {(() => {
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                for (const s of standardGroup.shapes) {
                  if (s.type === 'main_pipe' || s.type === 'sub_pipe' || s.type === 'lateral_pipe') {
                    const [x1, y1, x2, y2] = s.points;
                    minX = Math.min(minX, x1, x2);
                    minY = Math.min(minY, y1, y2);
                    maxX = Math.max(maxX, x1, x2);
                    maxY = Math.max(maxY, y1, y2);
                  } else if (s.type === 'well' || s.type === 'valve_image' || s.type === 'filter_image' || s.type === 'flush_image') {
                    minX = Math.min(minX, s.x - (s.radius || 0));
                    minY = Math.min(minY, s.y - (s.radius || 0));
                    maxX = Math.max(maxX, s.x + (s.radius || s.width || 0));
                    maxY = Math.max(maxY, s.y + (s.radius || s.height || 0));
                  } else if (s.type === 'border') {
                    minX = Math.min(minX, s.x);
                    minY = Math.min(minY, s.y);
                    maxX = Math.max(maxX, s.x + s.width);
                    maxY = Math.max(maxY, s.y + s.height);
                  }
                }
                if (minX === Infinity) return null;
                return (
                  <Rect
                    x={minX}
                    y={minY}
                    width={maxX - minX}
                    height={maxY - minY}
                    fill="rgba(0,0,0,0)"
                    listening={true}
                    onClick={() => setSelectedId(standardGroup.id)}
                    onTap={() => setSelectedId(standardGroup.id)}
                  />
                );
              })()}
            </Group>
          )}
          {/* Render normal shapes if not in standard layout mode */}
          {!standardGroup && shapes.map((s) => {
            const common = {
              id: s.id,
              draggable: (
                s.type === 'main_pipe' ||
                s.type === 'sub_pipe' ||
                s.type === 'lateral_pipe' ||
                s.type === 'well' ||
                s.type === 'border' ||
                s.type === 'valve_image' ||
                s.type === 'filter_image' ||
                s.type === 'flush_image'
              ),
              onClick: () => setSelectedId(s.id),
              onDragEnd: (e) => handleDragEnd(s.id, e),
              onTransformEnd: (e) => handleTransformEnd(s.id, e.target),
              hitStrokeWidth: 20,
            };

            if (s.type === 'well')
              return (
                <Circle
                  key={s.id}
                  {...common}
                  x={s.x}
                  y={s.y}
                  radius={s.radius}
                  stroke="blue"
                  strokeWidth={2}
                  fillEnabled={false}
                />
              );

            if (s.type === 'border')
              return (
                <Rect
                  key={s.id}
                  {...common}
                  x={s.x}
                  y={s.y}
                  width={s.width}
                  height={s.height}
                  stroke="green"
                  strokeWidth={2}
                  fillEnabled={false}
                />
              );

            if (s.type === 'main_pipe' || s.type === 'sub_pipe') {
              // Wrap in Group for proper dragging
              // Calculate group x/y as the first point, and points relative to that
              const [x1, y1, x2, y2] = s.points;
              const relPoints = [0, 0, x2 - x1, y2 - y1];
              return (
                <Group
                  key={s.id + '-group'}
                  id={s.id}
                  x={x1}
                  y={y1}
                  draggable={true}
                  onClick={() => setSelectedId(s.id)}
                  onDragEnd={(e) => handleDragEnd(s.id, e)}
                  onTransformEnd={(e) => handleTransformEnd(s.id, e.target)}
                >
                  <Line
                    key={s.id + '-line'}
                    points={relPoints}
                    stroke={s.stroke}
                    strokeWidth={s.strokeWidth}
                    dash={s.dash}
                    hitStrokeWidth={20}
                  />
                </Group>
              );
            }
            if (s.type === 'lateral_pipe') {
              // Standardize dash size for all lateral pipes
              const dash = [16, 8];
              const arrowLength = 14;
              const arrowWidth = 10;
              const [x1, y1, x2, y2] = s.points;
              const dx = x2 - x1;
              const dy = y2 - y1;
              const len = Math.sqrt(dx * dx + dy * dy);
              const offset = arrowLength * (len > 0 ? 1 : 0) / len;
              // All points relative to (x1, y1)
              const relPoints = [0, 0, dx, dy];
              const sx1 = dx * offset;
              const sy1 = dy * offset;
              const ex2 = dx - dx * offset;
              const ey2 = dy - dy * offset;
              return (
                <Group
                  key={s.id + '-group'}
                  id={s.id}
                  x={x1}
                  y={y1}
                  draggable={true}
                  onClick={() => setSelectedId(s.id)}
                  onDragEnd={(e) => handleDragEnd(s.id, e)}
                  onTransformEnd={(e) => handleTransformEnd(s.id, e.target)}
                >
                  <Line
                    key={s.id + '-line'}
                    points={relPoints}
                    stroke={s.stroke}
                    strokeWidth={s.strokeWidth}
                    dash={dash}
                    hitStrokeWidth={20}
                  />
                  <Arrow
                    key={s.id + '-arrow-start'}
                    points={[sx1, sy1, 0, 0]}
                    pointerLength={arrowLength}
                    pointerWidth={arrowWidth}
                    fill={s.stroke}
                    stroke={s.stroke}
                    strokeWidth={s.strokeWidth}
                  />
                  <Arrow
                    key={s.id + '-arrow-end'}
                    points={[ex2, ey2, dx, dy]}
                    pointerLength={arrowLength}
                    pointerWidth={arrowWidth}
                    fill={s.stroke}
                    stroke={s.stroke}
                    strokeWidth={s.strokeWidth}
                  />
                </Group>
              );
            }

            if (s.type === 'valve_image')
              return (
                <Image
                  key={s.id}
                  {...common}
                  x={s.x}
                  y={s.y}
                  width={s.width}
                  height={s.height}
                  image={valveImg}
                  rotation={s.rotation || 0}
                />
              );

            if (s.type === 'filter_image')
              return (
                <Image
                  key={s.id}
                  {...common}
                  x={s.x}
                  y={s.y}
                  width={s.width}
                  height={s.height}
                  image={filterImg}
                  rotation={s.rotation || 0}
                />
              );

            if (s.type === 'flush_image')
              return (
                <Image
                  key={s.id}
                  {...common}
                  x={s.x}
                  y={s.y}
                  width={s.width}
                  height={s.height}
                  image={flushImg}
                  rotation={s.rotation || 0}
                />
              );

            return null;
          })}

          <Transformer
            ref={trRef}
            rotateEnabled={true}
            anchorSize={8}
            borderStroke="black"
            borderDash={[4, 4]}
            enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right", "top-center", "bottom-center", "middle-left", "middle-right"]}
            boundBoxFunc={(oldBox, newBox) => {
              // Get the selected shape
              const selectedShape = shapes.find(s => s.id === selectedId);
              // For images, allow very small sizes (min 1px); for other shapes, require minimum 50px
              const minSize = selectedShape && (selectedShape.type === 'valve_image' || selectedShape.type === 'filter_image' || selectedShape.type === 'flush_image') ? 1 : 50;
              if (newBox.width < minSize || newBox.height < minSize) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
      </div>

        </div>

        {/* Step 4: Witness & File Details */}
        <div className="mt-8 md:mt-12">
          <h3 className="text-lg md:text-xl font-bold text-cyan-700 mb-4 md:mb-6 pb-3 md:pb-4 border-b-4 border-cyan-400">{t.stepFour || 'Witness & File Details'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">


    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.w1Name}</label>
      <input
        name="w1Name"
        value={form.w1Name}
        onChange={handleChange}
        className="input"
        required
      />
    </div>

    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.w1Village}</label>
      <input
        name="w1Village"
        value={form.w1Village}
        onChange={handleChange}
        className="input"
      />
    </div>

    {/* <div className="col-span-2 border-t pt-4"></div> */}


    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.w2Name}</label>
      <input
        name="w2Name"
        value={form.w2Name}
        onChange={handleChange}
        className="input"
        required
      />
    </div>

    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.w2Village}</label>
      <input
        name="w2Village"
        value={form.w2Village}
        onChange={handleChange}
        className="input"
      />
    </div>

    {/* Date and Place */}
    {/* <div className="col-span-2 border-t pt-4"></div> */}
    {/* File Date field removed - uses Bill Date instead */}

<div className="flex flex-col">
  <label className="font-semibold mb-1">{t.place}</label>
  <input
    name="place"
    value={form.place}
    onChange={handleChange}
    className="input"
  />
</div>
{/* Bank details section - Part of Step 4 */}
<div className="col-span-2 border-t-2 border-gray-200 pt-6 mt-6">
  <h4 className="text-base md:text-lg font-semibold text-cyan-700 mb-4">{t.bankDetailsTitle || 'Bank Details'}</h4>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.bankName || 'Bank Name'}</label>
      <input name="bankName" value={form.bankName} onChange={handleChange} className="input" />
    </div>
    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.accountName || 'Account Name'}</label>
      <input name="accountName" value={form.accountName} onChange={handleChange} className="input" />
    </div>
    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.accountNumber || 'Account Number'}</label>
      <input name="accountNumber" value={form.accountNumber} onChange={handleChange} className="input" />
    </div>
    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.ifsc || 'IFSC'}</label>
      <input name="ifsc" value={form.ifsc} onChange={handleChange} className="input" />
    </div>
    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.branch || 'Bank Branch'}</label>
      <input name="bankBranch" value={form.bankBranch} onChange={handleChange} className="input" />
    </div>
  </div>
</div>
          </div>
        </div>

        {/* Go to Bill Button - Outside form grid */}
        <div className="flex justify-end mt-6">
          <button
            type="button"
    onClick={() => {
      if (!form.company) {
        alert('⚠️ Please select a company first');
        return;
      }
      setActiveSection('bill');
      
      setTimeout(() => {
        billDateRef.current?.focus();
      }, 100); // Delay to ensure section is rendered
    }}
            disabled={!form.company}
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            💰 Go to Bill 
          </button>
        </div>
  </div>
)}

{/* BILL SECTION */}
{activeSection === 'bill' && (
  <div>
    {/* Show message if no company selected */}
    {!form.company && (
      <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">
        <p className="font-semibold">⚠️ No company selected</p>
        <p className="text-sm">Please select a company from the File Details tab before creating a bill.</p>
      </div>
    )}
    
    {/* Bill Header */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Bill No <span className="text-red-500">*</span>
          <span className="text-xs text-gray-500 font-normal ml-2">(Sequential numbers: 01, 02, 03...)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            className="mt-1 block flex-1 rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={billNo}
            onChange={(e) => setBillNo(e.target.value.trim())}
            placeholder="Enter bill number (e.g., 01, 02, 03)"
          />
          {/* <button
            type="button"
            onClick={() => {
              // Auto-suggest next bill number
              if (billDate) {
                fetchNextBillNo(billDate);
              }
            }}
            className="mt-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition whitespace-nowrap"
            title="Click to auto-suggest next sequential number"
          >
            Auto-Suggest
          </button> */}
        </div>
        {billNo && !/^\d+$/.test(billNo.trim()) && (
          <p className="text-xs text-red-500 mt-1">⚠️ Bill number must contain only digits (e.g., 01, 02, 03)</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Bill Date</label>
        <input
          type="date"
          className="mt-1 block w-full rounded-md border border-gray-200 shadow-sm px-3 py-2 bg-white"
          value={billDate}
           ref={billDateRef}
          onChange={(e) => handleBillDateChange(e.target.value)}
        />
      </div>

      {/* <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Customer/Farmer Name</label>
        <input
          className="mt-1 block w-full rounded-md border border-gray-200 shadow-sm px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
          value={form.farmerName}
          disabled
          placeholder="Auto-populated from File Details"
        />
        <p className="text-xs text-gray-400 mt-1">Auto-synced from File Details - Edit in File Details tab</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile</label>
        <input
          className="mt-1 block w-full rounded-md border border-gray-200 shadow-sm px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
          value={form.mobile}
          disabled
          placeholder="Auto-populated from File Details"
        />
        <p className="text-xs text-gray-400 mt-1">Auto-synced from File Details - Edit in File Details tab</p>
      </div> */}
    </div>

    {/* Bill Items Section - All Products with Qty Inputs */}
    <div id="bill-section" className="mb-6">
      {console.log('🔍 [RENDER] Bill section rendered with', billItems.length, billItems, 'billItems:', billItems.slice(0, 3).map(b => ({ product_id: b.product_id, description: b.description, spare2: b.spare2 })))}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Products (Enter Qty to include in bill)</h2>
      <p className="text-sm text-gray-500 mb-4">All available products are shown below. Enter quantity to include them in the bill. Items with qty=0 will not be saved.</p>



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

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-100 shadow-sm">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 sticky top-0">
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
            {billItems.length === 0 && (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  {form.company ? 'Loading products for company...' : '⚠️ Please select a company first'}
                </td>
              </tr>
            )}

            {billItems.length > 0 && console.log(`📊 [RENDER] Rendering ${billItems.length} bill items in table`)}
            {billItems.map((it) => {
             // console.log(`   [Row] product_id=${it.product_id}, spare2=${it.spare2}, description=${it.description}`);
              return (
              <tr key={it.product_id} className={`transition hover:bg-green-100 ${(it.qty || 0) > 0 ? 'bg-green-100' : 'bg-white'}`}>
                <td className="px-4 py-3 text-sm text-gray-800">
                  <div className="font-medium">{it.description || 'N/A'}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {it.size && <div className="text-xs text-gray-400">Size: {it.size}</div>}
                    {it.spare2 && getCompanyInfo(it.spare2) && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full border border-gray-300">
                        <span className="text-xs font-semibold text-gray-600">No-{getCompanyInfo(it.spare2).slot}</span>
                        <span className="text-xs text-gray-500 italic">{getCompanyInfo(it.spare2).name}</span>
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3 text-sm text-center">
                  <input
                    type="text"
                    className="w-24 rounded-md border border-gray-200 px-2 py-1 text-center focus:ring-1 focus:ring-green-300 focus:border-green-300"
                    value={it.batch_no || ''}
                    onChange={(e) => updateBillItemField(it.product_id, 'batch_no', e.target.value)}
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
                    className="w-20 rounded-md border border-gray-200 px-2 py-1 text-right focus:ring-1 focus:ring-green-300 focus:border-green-300"
                    value={it.gst_percent ?? 0}
                    onChange={(e) => updateBillItemGST(it.product_id, e.target.value)}
                    placeholder="0"
                  />
                </td>

                <td className="px-4 py-3 text-sm text-right">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    disabled={it.is_fitting_charge === true}
                    className="w-24 rounded-md border border-gray-200 px-2 py-1 text-right focus:ring-1 focus:ring-green-300 focus:border-green-300 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    value={it.qty ?? 0}
                    onChange={(e) => updateBillItemQty(it.product_id, e.target.value)}
                    placeholder="0"
                  />
                </td>

                <td className="px-4 py-3 text-sm font-medium text-right">
                  ₹{Number(it.amount || 0).toFixed(2)}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {billItems.length === 0 && (
          <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg">
            Loading products...
          </div>
        )}

        {billItems.map((it) => (
          <div 
            key={it.product_id} 
            className={`p-4 rounded-lg border transition ${(it.qty || 0) > 0 ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}
          >
            <div className="mb-3">
              <div className="font-semibold text-gray-800">{it.description || 'N/A'}</div>
              <div className="flex items-center gap-2 mt-1">
                {it.size && <div className="text-xs text-gray-500">Size: {it.size}</div>}
                {it.spare2 && getCompanyInfo(it.spare2) && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full border border-gray-300">
                    <span className="text-xs font-semibold text-gray-600">No-{getCompanyInfo(it.spare2).slot}</span>
                    <span className="text-xs text-gray-500 italic">{getCompanyInfo(it.spare2).name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Batch No:</span>
                <input
                  type="text"
                  className="w-24 rounded-md border border-gray-300 px-2 py-1 text-center text-sm focus:ring-1 focus:ring-green-300 focus:border-green-300"
                  value={it.batch_no || ''}
                  onChange={(e) => updateBillItemField(it.product_id, 'batch_no', e.target.value)}
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
                  className="w-20 rounded-md border border-gray-300 px-2 py-1 text-right text-sm focus:ring-1 focus:ring-green-300 focus:border-green-300"
                  value={it.gst_percent ?? 0}
                  onChange={(e) => updateBillItemGST(it.product_id, e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Qty:</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  disabled={it.is_fitting_charge === true}
                  className="w-20 rounded-md border border-gray-300 px-2 py-1 text-right text-sm focus:ring-1 focus:ring-green-300 focus:border-green-300 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  value={it.qty ?? 0}
                  onChange={(e) => updateBillItemQty(it.product_id, e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                <span className="font-semibold text-gray-700">Amount:</span>
                <span className="font-bold text-lg text-green-600">₹{Number(it.amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Fitting / Installation & Accessories Charges Section Add Fitting / Installation & Accessories Charges */}
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
                ≈ ₹{enableFittingCharges && fittingChargesPercent > 0 ? ((fittingChargesPercent / 100) * computeBillTotals().taxable).toFixed(2) : '0.00'}
                {fittingChargesGst > 0 && ` + GST ₹${(((fittingChargesGst / 100) * (fittingChargesPercent / 100) * computeBillTotals().taxable) || 0).toFixed(2)}`}
              </span>
            </div>
          )}
        </div>
      </div>
      {/* Bill Totals - Mobile & Desktop */}
      <div className="mt-4 bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-2 md:flex md:justify-end gap-4 md:gap-8">
          <div>
            <p className="text-xs md:text-sm text-gray-600">Taxable Amount:</p>
            <p className="text-base md:text-lg font-semibold">₹{computeBillTotals().taxable.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-600">Total GST:</p>
            <p className="text-base md:text-lg font-semibold">₹{computeBillTotals().totalGst.toFixed(2)}</p>
          </div>
          {computeBillTotals().fittingChargesAmount > 0 && (
            <div>
              <p className="text-xs md:text-sm text-gray-600">Fitting Charges:</p>
              <p className="text-base md:text-lg font-semibold">₹{computeBillTotals().fittingChargesAmount.toFixed(2)}</p>
            </div>
          )}
          <div className="col-span-2 md:col-span-1">
            <p className="text-xs md:text-sm text-gray-600">Total Amount:</p>
            <p className="text-lg md:text-xl font-bold text-green-600">₹{computeBillTotals().total.toFixed(2)}</p>
          </div>
        </div>
      </div>
        <button
    type="button"
onClick={() => {
  setActiveSection('file');
}}
       className="mt-4 w-50 px-4 py-2 bg-orange-600 text-white font-semibold rounded hover:bg-orange-700"
  >
    💰 Go to Files 
  </button>
    </div>

  </div>
)}


        <style jsx>{`
          .input {
            border: 1px solid #e5e7eb;
            padding: 10px;
            border-radius: 6px;
            width: 100%;
          }
        `}</style>
      </form>

      {/* Sticky Submit Button at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center gap-3 md:gap-4 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-6 px-4 shadow-lg border-t border-gray-200 z-50">
        {/* Cancel Button */}
        <button 
          type="button"
          onClick={() => router.push('/files')}
          className="px-6 md:px-8 py-3 md:py-4 bg-red-500 hover:bg-red-600 text-white rounded-lg text-base md:text-lg font-semibold shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95"
        >
          {t.cancel || 'Cancel'}
        </button>

        {/* Save & Print Button */}
        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            submitFormAndPrint({ preventDefault: () => {} });
          }}
          className="px-6 md:px-8 py-3 md:py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-base md:text-lg font-semibold shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95"
          disabled={saving}
        >
          {saving ? (t.saving || 'Saving...') : (savedFileId ? (t.updateAndPrint || 'Update & Print') : (t.saveAndPrint || 'Save & Print'))}
        </button>

        {/* Submit Button */}
        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            submitForm({ preventDefault: () => {} });
          }}
          className="px-8 md:px-12 py-3 md:py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 text-base md:text-lg font-semibold shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95 w-full md:w-auto max-w-md"
          disabled={saving}
        >
          {saving ? (t.saving || 'Saving...') : (savedFileId ? (t.update || 'Update') : (t.submit || 'Submit'))}
        </button>
      </div>

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 md:bottom-28 md:right-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 md:p-4 shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95 z-50"
          aria-label="Scroll to top"
        >
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs md:text-sm font-semibold">{lang === 'mr' ? t.goUp : t.goUp}</span>
            <svg className="w-5 h-5 md:w-6 md:h-6 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
        </button>
      )}
    </div>
  );
}



export default function NewFilePage() {
  return (
    <ProtectedRoute>
      <NewFilePageContent />
    </ProtectedRoute>
  );
}
