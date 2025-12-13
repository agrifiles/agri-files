'use client';

import { useState, useRef, useEffect, useContext} from 'react';
import { LangContext } from '../layout';
import { Stage, Layer, Rect, Circle, Line, Image, Transformer, Arrow, Group } from 'react-konva';
import useImage from 'use-image';
import { useRouter, useSearchParams } from 'next/navigation'; // optional navigation
import { getCurrentUserId, getCurrentUser, API_BASE } from '@/lib/utils';
import Loader from '@/components/Loader';
import { districtsEn, districtsMr } from '@/lib/districts';
import ProtectedRoute from '@/components/ProtectedRoute';
import { STANDARD_LAYOUTS } from '@/lib/standardLayouts';

function NewFilePageContent() {
  // ---------- Localization ----------
  const { t, lang, toggleLang } = useContext(LangContext);
  const router = useRouter();
  const [savedFileId, setSavedFileId] = useState(null); // store returned id
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const formRef = useRef(null);

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

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  
  const [form, setForm] = useState({
    fyYear: '', company: '', applicationId: '', farmerId: '', farmerName: '', fatherName: '',
    mobile: '', aadhaarNo: '', quotationNo: '', quotationDate: '', billNo: '', billDate: '', village: '',
    taluka: '', district: '', area8A: '', gutNo: '', cropName: '',
    irrigationArea: '', lateralSpacing: '', driplineProduct: '', dripperDischarge: '',
    dripperSpacing: '', planeLateralQty: '', fileDate: new Date().toISOString().split('T')[0],
    // optional other fields referenced in UI
    salesEngg: '', pumpType: '', twoNozzelDistance: '', w1Name: '', w1Village: '',
    w2Name: '', w2Village: '', place: '', billAmount: '',
    // engineer details (auto-populated from company selection)
    engineerDesignation: '', engineerMobile: ''
  });
  // const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value

    
  //  });

  const handleChange = (e) => {
  const { name, value } = e.target;

  setForm((prev) => {
    const updatedForm = { ...prev, [name]: value };

    // ✅ If the "company" field changes, auto-populate engineer details only if they exist
    if (name === "company") {
      const selectedCompany = companies.find(c => c.company_name === value);
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

    {/* Removed w1District, w1Taluka, w2District, w2Taluka handlers since they auto-sync from main district/taluka */}

    // ✅ If "village" field changes, also update "place"
    if (name === "village") {
      updatedForm.place = value;
    }

    return updatedForm;
  });
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
  const [billCustomerName, setBillCustomerName] = useState('');
  const [billCustomerMobile, setBillCustomerMobile] = useState('');
  const [billStatus, setBillStatus] = useState('draft');
  const [billItems, setBillItems] = useState([]);
  const [lastFetchedMonthYear, setLastFetchedMonthYear] = useState('');
  const [products, setProducts] = useState([]);

  const searchParams = useSearchParams();

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

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoadingCompanies(true);
        const res = await fetch(`${API_BASE}/api/files/companies/list`);
        const data = await res.json();
        console.log('Fetched companies:', data);
        if (data.success && data.companies) {
          setCompanies(data.companies);
        }
      } catch (err) {
        console.error('Failed to fetch companies:', err);
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, []);

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
      try {
        const res = await fetch(`${API_BASE}/api/files/${id}`);
        const text = await res.text();
        let data = null;
        try { data = JSON.parse(text); } catch (_) { data = null; }
        if (!res.ok || !data?.success) {
          console.error('Failed to load file for edit', res.status, text);
          return;
        }

        const file = data.file;
        console.log('✅ File loaded for edit. District:', file.district, 'Taluka:', file.taluka);
        
        // set internal saved id so saves use PUT
        const returnedId = file.id ?? file.ID ?? file.file_id ?? null;
        if (returnedId) setSavedFileId(returnedId);

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
          quotationDate: file.quotation_date ?? prev.quotationDate,
          billNo: file.bill_no ?? prev.billNo,
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
          fileDate: file.file_date ? new Date(file.file_date).toISOString().split('T')[0] : prev.fileDate,
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
          billAmount: file.bill_amount ?? prev.billAmount
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
        } catch (e) {
          console.warn('Failed to parse shapes_json for file', id, e);
          setShapes([]);
        }

        // ===== LOAD ASSOCIATED BILL =====
        // If this file has a bill, load it
        try {
          const billRes = await fetch(`${API_BASE}/api/bills?file_id=${returnedId}&limit=1`);
          const billText = await billRes.text();
          let billData = null;
          try { billData = JSON.parse(billText); } catch (e) { billData = null; }

          if (billRes.ok && billData?.success && billData?.bills && billData.bills.length > 0) {
            const billSummary = billData.bills[0];
            console.log('✅ Found associated bill_id:', billSummary.bill_id);

            // Now fetch full bill with items using bill_id
            const fullBillRes = await fetch(`${API_BASE}/api/bills/${billSummary.bill_id}`);
            const fullBillText = await fullBillRes.text();
            let fullBillData = null;
            try { fullBillData = JSON.parse(fullBillText); } catch (e) { fullBillData = null; }

            if (fullBillRes.ok && fullBillData?.success && fullBillData?.bill) {
              const bill = fullBillData.bill;
              console.log('✅ Loaded full bill with items:', bill);

              // Set bill details
              setBillNo(bill.bill_no || '');
              setBillDate(bill.bill_date ? new Date(bill.bill_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

              // Fetch all products and merge with bill items
              if (bill.items && Array.isArray(bill.items)) {
                console.log('✅ Fetching all products to merge with bill items');
                
                // Fetch all products
                const owner_id = getCurrentUserId();
                const params = new URLSearchParams();
                if (owner_id) params.append('user_id', owner_id);
                const productsRes = await fetch(`${API_BASE}/products/list?${params.toString()}`);
                const productsText = await productsRes.text();
                const productsData = JSON.parse(productsText || '{}');
                const allProducts = productsData.products || [];

                // Create a map of product_id -> {qty, gst_percent} from loaded bill
                const billItemMap = {};
                bill.items.forEach(item => {
                  billItemMap[item.product_id] = {
                    qty: item.qty || 0,
                    gst_percent: item.gst_percent || item.gst || 0
                  };
                });

                // Create merged items: all products with bill quantities
                const mergedItems = allProducts.map(prod => {
                  const billItem = billItemMap[prod.product_id || prod.id];
                  const productId = prod.product_id ?? prod.id;
                  const salesRate = Number(prod.selling_rate || prod.sellingRate || prod.sales_rate || 0);
                  const qty = billItem?.qty ?? 0;
                  
                  return {
                    product_id: productId,
                    description: prod.description_of_good || prod.name || prod.product_name || '',
                    hsn: prod.hsn_code || prod.hsn || '',
                    batch_no: prod.batch_no || prod.batchNo || '',
                    size: prod.size || '',
                    gov_rate: Number(prod.gov_rate || prod.govRate || 0),
                    sales_rate: salesRate,
                    uom: prod.unit_of_measure || prod.unit || prod.uom || '',
                    gst_percent: billItem?.gst_percent ?? Number(prod.sgst || prod.cgst || prod.gst_percent || 0),
                    qty: qty,
                    amount: Number((qty * salesRate).toFixed(2))
                  };
                });

                console.log('✅ Merged bill items with products:', mergedItems);
                setBillItems(mergedItems);
              }
            }
          } else {
            console.log('No associated bill found for this file');
          }
        } catch (billErr) {
          console.warn('Error loading bill for file:', billErr);
          // Don't fail the whole form load if bill fetch fails
        }
      } catch (err) {
        console.error('loadFileForEdit err', err);
      }
    };

    loadFileForEdit();
  }, [searchParams]);

// const submitForm = async (e) => {
//     e.preventDefault();
//     // build payload exactly as backend expects
//     const payload = {
//       title: `${form.farmerName || 'File'} - ${form.fileDate}`,
//       form,
//       shapes
//     };

//     try {
//       setSaving(true);
//       let res, data;
//       if (savedFileId) {
//         // update existing
//         res = await fetch(`/api/files/${savedFileId}`, {
//           method: 'PUT',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(payload)
//         });
//         data = await res.json();
//         if (!res.ok || !data.success) throw new Error(data.error || 'Update failed');
//         alert(t.fileUpdated || 'File updated successfully');
//       } else {
//         // create new
//         res = await fetch('/api/files', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(payload)
//         });
//         data = await res.json();
//         if (!res.ok || !data.success) throw new Error(data.error || 'Save failed');
//         setSavedFileId(data.file.id || data.file.ID || data.file.id); // adapt to returned shape
//         alert(t.fileSaved || `Saved (id: ${data.file.id})`);
//       }
//       // optional: navigate to view page
//       // router.push(`/files/${data.file.id}`);
//     } catch (err) {
//       console.error('save file err', err);
//       alert((err && err.message) || t.saveFailed || 'Save failed');
//     } finally {
//       setSaving(false);
//     }
//   };
  // ---------- Add Shapes ----------
 
  const resetForm = () => {
  setForm({
    fyYear: '', company: '', applicationId: '', farmerId: '', farmerName: '', fatherName: '',
    mobile: '', aadhaarNo: '', quotationNo: '', quotationDate: '', billNo: '', billDate: '', village: '',
    taluka: '', district: '', area8A: '', gutNo: '', cropName: '',
    irrigationArea: '', lateralSpacing: '', driplineProduct: '', dripperDischarge: '',
    dripperSpacing: '', planeLateralQty: '',
    fileDate: new Date().toISOString().split('T')[0],
    salesEngg: '', pumpType: '', twoNozzelDistance: '',
    w1Name: '', w1Village: '',
    w2Name: '', w2Village: '',
    place: '', billAmount: '',
    engineerDesignation: '', engineerMobile: ''
  });

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
  
  if (monthYearKey === lastFetchedMonthYear) return;
  
  try {
    const res = await fetch(`${API_BASE}/api/bills/next-bill-no?owner_id=${owner_id}&month=${month}&year=${year}`);
    const data = await res.json();
    if (data.success && data.bill_no) {
      setBillNo(data.bill_no);
      setLastFetchedMonthYear(monthYearKey);
    }
  } catch (err) {
    console.error('Failed to fetch next bill number:', err);
  }
};

// Handle bill date change
const handleBillDateChange = (newDate) => {
  const oldDate = new Date(billDate);
  const newDateObj = new Date(newDate);
  
  setBillDate(newDate);
  
  if (oldDate.getMonth() !== newDateObj.getMonth() || oldDate.getFullYear() !== newDateObj.getFullYear()) {
    fetchNextBillNo(newDate);
  }
};

// Load products and initialize bill items with all products (qty = 0 by default)
const loadProducts = async () => {
  const owner_id = getCurrentUserId();
  try {
    const params = new URLSearchParams();
    if (owner_id) params.append('user_id', owner_id);
    const res = await fetch(`${API_BASE}/products/list?${params.toString()}`);
    const text = await res.text();
    const data = JSON.parse(text || '{}');
    const allProducts = data.products || [];
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
      gst_percent: Number(prod.sgst || prod.cgst || prod.gst_percent || 0),
      qty: 0, // Default qty is 0
      amount: 0
    }));
    setBillItems(initialItems);
  } catch (err) {
    console.error(err);
  }
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

// Get only items with qty > 0 for saving
const getBillItemsForSave = () => {
  return billItems.filter(it => (it.qty || 0) > 0);
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
  const total = Number((taxable + totalGst).toFixed(2));
  return { taxable, totalGst, total };
};

// Load products on mount
useEffect(() => {
  loadProducts();
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

  // Validate required file fields
  if (!form.fyYear || !form.farmerName || !form.mobile || !form.fileDate) {
    alert('Please fill in all required file fields (FY Year, Farmer Name, Mobile, File Date)');
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

  const filePayload = {
    owner_id,                         
    title: `${form.farmerName || 'File'} - ${form.fileDate}`,
    form,
    shapes: shapesToSave
  };

  console.log('=== SUBMITTING FORM ===');
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
    const fileUrl = isUpdate ? `${API_BASE}/api/files/${savedFileId}` : `${API_BASE}/api/files`;
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
      alert(`File save failed: ${fileRes.status}\nResponse: ${fileText}\nSee console for details.`);
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
    const billPayload = {
      bill_no: billNo || null, // Will be auto-generated if null
      bill_date: billDate || new Date().toISOString().split('T')[0],
      farmer_name: form.farmerName,
      farmer_mobile: form.mobile,
      status: 'draft',
      created_by: owner_id,
      file_id: fileId, // NOW we have fileId from file save
      items: getBillItemsForSave() // Only items with qty > 0
    };
    
    let billUrl = null;
    let billMethod = null;
    let billIdForUpdate = null;

    if (isUpdate && billNo) {
      // Update existing bill - need to find bill_id first
      // Query to get bill_id from file_id or bill_no
      console.log(`Fetching existing bill for file_id: ${fileId} or bill_no: ${billNo}...`);
      const getBillRes = await fetch(`${API_BASE}/api/bills?file_id=${fileId}&owner_id=${owner_id}&limit=1`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const getBillText = await getBillRes.text();
      let getBillData = null;
      try { getBillData = JSON.parse(getBillText); } catch (err) { getBillData = null; }
      
      if (getBillRes.ok && getBillData && getBillData.bills && getBillData.bills.length > 0) {
        // Bill exists - update it using bill_id
        billIdForUpdate = getBillData.bills[0].bill_id;
        billUrl = `${API_BASE}/api/bills/${billIdForUpdate}`;
        billMethod = 'PUT';
        console.log(`Found existing bill_id: ${billIdForUpdate}`);
      } else {
        // Bill doesn't exist yet - create new one
        billUrl = `${API_BASE}/api/bills`;
        billMethod = 'POST';
        console.log('No existing bill found - will create new one');
      }
    } else {
      // Create new bill for this file
      billUrl = `${API_BASE}/api/bills`;
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

    const returnedBillNo = billData.bill?.bill_no ?? billData.bill?.billNo ?? billData.bill?.id ?? null;
    if (!isUpdate && returnedBillNo && !billNo) {
      setBillNo(returnedBillNo);
      console.log('✅ Bill created successfully. Bill No:', returnedBillNo);
    } else if (isUpdate) {
      console.log('✅ Bill updated successfully. Bill No:', billNo);
    }

    alert(`✅ File and Bill saved successfully!\nFile ID: ${fileId}\nBill No: ${returnedBillNo}`);

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

  // Validate required file fields
  if (!form.fyYear || !form.farmerName || !form.mobile || !form.fileDate) {
    alert('Please fill in all required file fields (FY Year, Farmer Name, Mobile, File Date)');
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

  const filePayload = {
    owner_id,                         
    title: `${form.farmerName || 'File'} - ${form.fileDate}`,
    form,
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
    const fileUrl = isUpdate ? `${API_BASE}/api/files/${savedFileId}` : `${API_BASE}/api/files`;
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
    const billPayload = {
      file_id: fileId,
      bill_no: billNo,
      bill_date: billDate,
      farmer_name: form.farmerName || '',
      farmer_mobile: form.mobile || '',
      items: getBillItemsForSave()
    };

    console.log('Bill Payload:', billPayload);

    // Determine if bill is new or update
    let billUrl = `${API_BASE}/api/bills`;
    let billMethod = 'POST';

    if (isUpdate && savedFileId) {
      // Query for existing bill
      const billQuery = await fetch(`${API_BASE}/api/bills?file_id=${fileId}&limit=1`);
      const billQueryText = await billQuery.text();
      let billQueryData = null;
      try { billQueryData = JSON.parse(billQueryText); } catch (e) { billQueryData = null; }

      if (billQuery.ok && billQueryData?.success && billQueryData?.bills && billQueryData.bills.length > 0) {
        const existingBill = billQueryData.bills[0];
        billUrl = `${API_BASE}/api/bills/${existingBill.bill_id}`;
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
    onClick={() => setActiveSection('bill')}
    className={`px-4 md:px-6 py-3 font-semibold text-base md:text-lg transition-colors duration-200 ${
      activeSection === 'bill'
        ? 'border-b-4 border-green-600 text-green-700 bg-green-50'
        : 'text-gray-600 hover:text-green-600 border-b-4 border-transparent'
    }`}
  >
    💰 Bill Details
  </button>
</div>

{/* FILE SECTION */}
{activeSection === 'file' && (
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
                {companies.map((comp) => (
                  <option key={comp.company_id} value={comp.company_name}>
                    {comp.company_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="font-semibold mb-1 text-sm md:text-base">{t.salesEngg}</label>
              <input name="salesEngg" value={form.salesEngg} onChange={handleChange} className="input" required />
            </div>


            <div className="flex flex-col">
              <label className="font-semibold mb-1 text-sm md:text-base">{t.selectCrop}</label>
              <select name="cropName" value={form.cropName} onChange={handleChange} className="input">
                <option value="">{t.selectCrop}</option>
                <option value="Sugarcane">{t.sugarcane}</option>
                <option value="Cotton">{t.cotton}</option>
                <option value="Wheat">{t.wheat}</option>
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
              <input name="quotationNo" value={form.quotationNo} onChange={handleChange} className="input" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.quotationDate}</label>
              <input type="date" name="quotationDate" value={form.quotationDate} onChange={handleChange} className="input" />
            </div> 

            {/* <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.billNo}</label>
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

{/* 
      <button
        onClick={() => console.log('Exported Layout:', shapes)}
        className="mt-4 px-4 py-2 bg-cyan-700 text-white rounded"
      >
        {t.export}
      </button> */}
        </div>

        {/* Step 4: Witness & File Details */}
        <div className="mt-8 md:mt-12">
          <h3 className="text-lg md:text-xl font-bold text-cyan-700 mb-4 md:mb-6 pb-3 md:pb-4 border-b-4 border-cyan-400">{t.stepFour || 'Witness & File Details'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">

    {/* Bill Information */}
    {/* <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.billNo}</label>
      <input
        name="billNo"
        value={form.billNo}
        onChange={handleChange}
        className="input bg-gray-50 text-gray-500 opacity-70"
        disabled
      />
      <p className="text-xs text-gray-400 mt-1">Bill number is linked separately via Bills. Edit from Files &gt; Link Bill.</p>
    </div>

    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.billDate}</label>
      <input
        type="date"
        name="billDate"
        value={form.billDate}
        onChange={handleChange}
        className="input bg-gray-50 text-gray-500 opacity-70"
        disabled
      />
      <p className="text-xs text-gray-400 mt-1">Bill date is linked separately via Bills.</p>
    </div>

    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.billAmount}</label>
      <input
        type="number"
        name="billAmount"
        value={form.billAmount}
        onChange={handleChange}
        className="input bg-gray-50 text-gray-500 opacity-70"
        disabled
      />
      <p className="text-xs text-gray-400 mt-1">Bill amount is linked separately via Bills. Edit from Files &gt; Link Bill.</p>
    </div> */}

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

    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.fileDate}</label>
      <input
        type="date"
        name="fileDate"
        value={form.fileDate}
        onChange={handleChange}
        className="input"
        required
      />
    </div>

<div className="flex flex-col">
  <label className="font-semibold mb-1">{t.place}</label>
  <input
    name="place"
    value={form.place}
    onChange={handleChange}
    className="input"
  />
</div>
          </div>
        </div>
  </div>
)}

{/* BILL SECTION */}
{activeSection === 'bill' && (
  <div>
    {/* Bill Header */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Bill No</label>
        <input
          className="mt-1 block w-full rounded-md border border-gray-200 shadow-sm px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
          value={billNo}
          disabled
          placeholder="Auto-generated"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Bill Date</label>
        <input
          type="date"
          className="mt-1 block w-full rounded-md border border-gray-200 shadow-sm px-3 py-2 bg-white"
          value={billDate}
          onChange={(e) => handleBillDateChange(e.target.value)}
        />
      </div>

      <div>
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
      </div>
    </div>

    {/* Bill Items Section - All Products with Qty Inputs */}
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Products (Enter Qty to include in bill)</h2>
      <p className="text-sm text-gray-500 mb-4">All available products are shown below. Enter quantity to include them in the bill. Items with qty=0 will not be saved.</p>

      <div className="overflow-x-auto rounded-lg border border-gray-100 shadow-sm">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Description</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">HSN</th>
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
                  Loading products...
                </td>
              </tr>
            )}

            {billItems.map((it) => (
              <tr key={it.product_id} className={`transition hover:bg-green-100 ${(it.qty || 0) > 0 ? 'bg-green-100' : 'bg-white'}`}>
                <td className="px-4 py-3 text-sm text-gray-800">
                  <div className="font-medium">{it.description || 'N/A'}</div>
                  {it.size && <div className="text-xs text-gray-400">Size: {it.size}</div>}
                </td>

                <td className="px-4 py-3 text-sm text-gray-700">
                  {it.hsn || '-'}
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
                    className="w-24 rounded-md border border-gray-200 px-2 py-1 text-right focus:ring-1 focus:ring-green-300 focus:border-green-300"
                    value={it.qty ?? 0}
                    onChange={(e) => updateBillItemQty(it.product_id, e.target.value)}
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

      {/* Bill Totals - Only for items with qty > 0 */}
      <div className="mt-4 bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-end gap-8">
          <div>
            <p className="text-sm text-gray-600">Taxable Amount:</p>
            <p className="text-lg font-semibold">₹{computeBillTotals().taxable.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total GST:</p>
            <p className="text-lg font-semibold">₹{computeBillTotals().totalGst.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Amount:</p>
            <p className="text-xl font-bold text-green-600">₹{computeBillTotals().total.toFixed(2)}</p>
          </div>
        </div>
      </div>
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

// return (
//     <div className="min-h-screen flex flex-col items-center bg-gray-50 py-5 px-4">
//       <form
//         onSubmit={submitForm}
//         className="w-full max-w-6xl bg-white shadow-lg rounded-lg p-8 space-y-6"
//       >
//         {/* top header and steps */}
//         <div className="flex items-center justify-between mb-8">
//           <h2 className="text-2xl font-bold text-cyan-700">{t.newFile}</h2>
//           <div className="flex items-center space-x-6">
//             {steps.map((s) => (
//               <div
//                 key={s.id}
//                 className="flex flex-col items-center cursor-pointer"
//                 onClick={() => goToStep(s.id)}
//               >
//                 <div
//                   className={`w-12 h-12 flex items-center justify-center rounded-full text-white font-bold text-lg shadow-md transition-all ${
//                     step === s.id
//                       ? 'bg-cyan-600 scale-110'
//                       : 'bg-gray-300 hover:bg-cyan-400 hover:scale-105'
//                   }`}
//                 >
//                   {s.id}
//                 </div>
//                 <p className={`mt-2 text-sm font-medium ${step === s.id ? 'text-cyan-700' : 'text-gray-500'}`}>
//                   {/* optional title */}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Step 1 */}
//         {step === 1 && (
//           <div className="grid grid-cols-2 gap-4">
//             {/* ... all your input fields unchanged ... */}
//             <div className="flex flex-col">
//               <label className="font-semibold mb-1">{t.fyYear}</label>
//               <select name="fyYear" value={form.fyYear} onChange={handleChange} className="input" required>
//                 <option value="">{t.fyYear}</option>
//                 <option value="2025-26">2025-26</option>
//                 <option value="2024-25">2024-25</option>
//                 <option value="2023-24">2023-24</option>
//               </select>
//             </div>
//             {/* farmerName etc... (copy remaining fields exactly from your component) */}
//             <div className="flex flex-col">
//               <label className="font-semibold mb-1">{t.farmerName}</label>
//               <input name="farmerName" value={form.farmerName} onChange={handleChange} className="input" required />
//             </div>
//             {/* rest of fields... */}
//           </div>
//         )}

//         {/* Step 2 */}
//         {step === 2 && (
//           <div className="grid grid-cols-2 gap-4">
//             {/* ... */}
//             <div className="flex flex-col">
//               <label className="font-semibold mb-1">{t.selectCompany}</label>
//               <select name="company" value={form.company} onChange={handleChange} className="input" required>
//                 <option value="">{t.selectCompany}</option>
//                 <option value="Agri Solutions">Agri Solutions</option>
//                 <option value="Green Fields">Green Fields</option>
//                 <option value="FarmTech">FarmTech</option>
//               </select>
//             </div>
//             {/* other inputs... */}
//           </div>
//         )}

//         {/* Step 3: Canvas */}
//         {step === 3 && (
//           <div className="flex flex-col items-center p-1">
//             <h2 className="text-2xl font-bold text-cyan-700 mb-4">{t.graphTitle}</h2>

//             <div className="flex flex-wrap justify-center gap-2 mb-4">
//               <button type="button" onClick={() => addShape('well')} className="px-3 py-1 bg-blue-500 text-white rounded">{t.well}</button>
//               <button type="button" onClick={() => addShape('main_pipe')} className="px-3 py-1 bg-orange-500 text-white rounded">{t.mainPipe}</button>
//               <button type="button" onClick={() => addShape('lateral_pipe')} className="px-3 py-1 bg-sky-500 text-white rounded">{t.lateralPipe}</button>
//               <button type="button" onClick={() => addShape('border')} className="px-3 py-1 bg-green-600 text-white rounded">{t.border}</button>
//               <button type="button" onClick={() => addShape('valve_image')} className="px-3 py-1 bg-purple-500 text-white rounded">{t.valve}</button>
//               <button type="button" onClick={() => addShape('filter_image')} className="px-3 py-1 bg-teal-600 text-white rounded">{t.filter}</button>
//               <button type="button" onClick={() => addShape('flush_image')} className="px-3 py-1  bg-sky-600 text-white rounded">{t.flush}</button>
//               <button type="button" onClick={handleDelete} className="px-3 py-1 bg-red-600 text-white rounded">{t.delete}</button>
//             </div>

//             <Stage
//               width={900}
//               height={416}
//               ref={stageRef}
//               onMouseDown={handleMouseDown}
//               onMouseMove={handleMouseMove}
//               onMouseUp={handleMouseUp}
//               style={{
//                 border: '2px solid #ccc',
//                 backgroundSize: '20px 20px',
//                 backgroundImage:
//                   'linear-gradient(to right, #eee 1px, transparent 1px), linear-gradient(to bottom, #eee 1px, transparent 1px)',
//                 cursor: tool?.includes('pipe') ? 'crosshair' : 'default',
//               }}
//             >
//               <Layer>
//                 {shapes.map((s) => {
//                   const common = {
//                     id: s.id,
//                     draggable: !s.type.includes('pipe'),
//                     onClick: () => setSelectedId(s.id),
//                     onDragEnd: (e) => handleDragEnd(s.id, e),
//                     onTransformEnd: (e) => handleTransformEnd(s.id, e.target),
//                     hitStrokeWidth: 20,
//                   };

//                   if (s.type === 'well')
//                     return (
//                       <Circle
//                         key={s.id}
//                         {...common}
//                         x={s.x}
//                         y={s.y}
//                         radius={s.radius}
//                         stroke="blue"
//                         strokeWidth={2}
//                         fillEnabled={false}
//                       />
//                     );

//                   if (s.type === 'border')
//                     return (
//                       <Rect
//                         key={s.id}
//                         {...common}
//                         x={s.x}
//                         y={s.y}
//                         width={s.width}
//                         height={s.height}
//                         stroke="green"
//                         strokeWidth={2}
//                         fillEnabled={false}
//                       />
//                     );

//                   if (s.type === 'main_pipe' || s.type === 'lateral_pipe')
//                     return (
//                       <Line
//                         key={s.id}
//                         {...common}
//                         points={s.points}
//                         stroke={s.stroke}
//                         strokeWidth={s.strokeWidth}
//                         dash={s.dash}
//                       />
//                     );

//                   if (s.type === 'valve_image')
//                     return (
//                       <Image
//                         key={s.id}
//                         {...common}
//                         x={s.x}
//                         y={s.y}
//                         width={s.width}
//                         height={s.height}
//                         image={valveImg}
//                       />
//                     );

//                   if (s.type === 'filter_image')
//                     return (
//                       <Image
//                         key={s.id}
//                         {...common}
//                         x={s.x}
//                         y={s.y}
//                         width={s.width}
//                         height={s.height}
//                         image={filterImg}
//                       />
//                     );

//                   if (s.type === 'flush_image')
//                     return (
//                       <Image
//                         key={s.id}
//                         {...common}
//                         x={s.x}
//                         y={s.y}
//                         width={s.width}
//                         height={s.height}
//                         image={flushImg}
//                       />
//                     );

//                   return null;
//                 })}

//                 <Transformer ref={trRef} rotateEnabled={true} anchorSize={8} borderStroke="black" borderDash={[4, 4]} />
//               </Layer>
//             </Stage>
//           </div>
//         )}

//         {/* Step 4 */}
//         {step === 4 && (
//           <div className="grid grid-cols-2 gap-4">
//             {/* Bill info fields (unchanged) */}
//             <div className="flex flex-col">
//               <label className="font-semibold mb-1">{t.billNo}</label>
//               <input name="billNo" value={form.billNo} onChange={handleChange} className="input" required />
//             </div>
//             <div className="flex flex-col">
//               <label className="font-semibold mb-1">{t.billAmount}</label>
//               <input type="number" name="billAmount" value={form.billAmount} onChange={handleChange} className="input" required />
//             </div>
//             {/* rest of W1/W2 and date/place */}
//             <div className="flex flex-col">
//               <label className="font-semibold mb-1">{t.fileDate}</label>
//               <input type="date" name="fileDate" value={form.fileDate} onChange={handleChange} className="input" required />
//             </div>
//             <div className="flex flex-col">
//               <label className="font-semibold mb-1">{t.place}</label>
//               <input name="place" value={form.place} onChange={handleChange} className="input" />
//             </div>
//           </div>
//         )}

//         {/* Navigation Buttons */}
//         <div className="flex justify-between mt-6">
//           {step > 1 && (
//             <button type="button" onClick={prevStep} className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400">
//               {t.previous}
//             </button>
//           )}
//           {step < 4 && (
//             <button type="button" onClick={nextStep} className="px-6 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600">
//               {t.next}
//             </button>
//           )}
//           {step === 4 && (
//             <button type="submit" className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600">
//               {saving ? (t.saving || 'Saving...') : (t.submit || 'Submit')}
//             </button>
//           )}
//         </div>

//         <style jsx>{`
//           .input {
//             border: 1px solid #e5e7eb;
//             padding: 10px;
//             border-radius: 6px;
//             width: 100%;
//           }
//         `}</style>
//       </form>
//     </div>
//   )

export default function NewFilePage() {
  return (
    <ProtectedRoute>
      <NewFilePageContent />
    </ProtectedRoute>
  );
}
