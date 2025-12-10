'use client';

import { useState, useRef, useEffect, useContext} from 'react';
import { LangContext } from '../layout';
import { Stage, Layer, Rect, Circle, Line, Image, Transformer } from 'react-konva';
import useImage from 'use-image';
import { useRouter, useSearchParams } from 'next/navigation'; // optional navigation
import { getCurrentUserId, getCurrentUser, API_BASE } from '@/lib/utils';
import Loader from '@/components/Loader';
import { districtsEn, districtsMr } from '@/lib/districts';
import ProtectedRoute from '@/components/ProtectedRoute';

function NewFilePageContent() {
  // ---------- Localization ----------
  const { t, lang } = useContext(LangContext);
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [savedFileId, setSavedFileId] = useState(null); // store returned id
  const [saving, setSaving] = useState(false);

  
  const [form, setForm] = useState({
    fyYear: '', company: '', applicationId: '', farmerId: '', farmerName: '', fatherName: '',
    mobile: '', aadhaarNo: '', quotationNo: '', quotationDate: '', billNo: '', billDate: '', village: '',
    taluka: '', district: '', area8A: '', gutNo: '', cropName: '',
    irrigationArea: '', lateralSpacing: '', driplineProduct: '', dripperDischarge: '',
    dripperSpacing: '', planeLateralQty: '', fileDate: new Date().toISOString().split('T')[0],
    // optional other fields referenced in UI
    salesEngg: '', pumpType: '', twoNozzelDistance: '', w1Name: '', w1Village: '', w1Taluka: '', w1District: '',
    w2Name: '', w2Village: '', w2Taluka: '', w2District: '', place: '', billAmount: '',
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

    // ✅ If "district" changes, populate talukas and reset taluka
    if (name === "district") {
      const selectedDistrict = districts.find(d => d.name === value);
      if (selectedDistrict) {
        setTalukas(selectedDistrict.tahasil);
        updatedForm.taluka = ''; // reset taluka
      }
    }

    // ✅ If "w1District" changes, populate w1Talukas and reset w1Taluka
    if (name === "w1District") {
      const selectedDistrict = districts.find(d => d.name === value);
      if (selectedDistrict) {
        setW1Talukas(selectedDistrict.tahasil);
        updatedForm.w1Taluka = ''; // reset taluka
      }
    }

    // ✅ If "w2District" changes, populate w2Talukas and reset w2Taluka
    if (name === "w2District") {
      const selectedDistrict = districts.find(d => d.name === value);
      if (selectedDistrict) {
        setW2Talukas(selectedDistrict.tahasil);
        updatedForm.w2Taluka = ''; // reset taluka
      }
    }

    // ✅ If the "village" field changes, also update "place"
    if (name === "village") {
      updatedForm.place = value;
    }

    return updatedForm;
  });
};
// console.log(getCurrentUserId())
  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));
  const goToStep = (n) => setStep(n);

  // const submitForm = (e) => {
  //   e.preventDefault();
  //   console.log('Form submitted', form);
  //   alert(t.formSubmitted || 'Form submitted successfully!');
  // };

  const steps = [
    { id: 1, title: t.stepOne || 'Step 1' },
    { id: 2, title: t.stepTwo || 'Step 2' },
    { id: 3, title: t.stepThree || 'Step 3' },
    { id: 4, title: t.stepFour || 'Step 4' },
  ];

    const stageRef = useRef(null);
  const trRef = useRef(null);

  // Load images (place in /public)
  const [valveImg] = useImage('/valve.png');
  const [filterImg] = useImage('/screen_filter.png');
  const [flushImg] = useImage('/flush_valve.png');

  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  
  // Districts and Talukas state - will be set based on language
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [w1Talukas, setW1Talukas] = useState([]);
  const [w2Talukas, setW2Talukas] = useState([]);

  const searchParams = useSearchParams();

  // Load districts based on selected language
  useEffect(() => {
    if (lang === 'mr') {
      setDistricts(districtsMr);
    } else {
      setDistricts(districtsEn);
    }
  }, [lang]);

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

  // Set default district and taluka from user data (for main, w1, and w2)
  useEffect(() => {
    const user = getCurrentUser();
    if (user?.district) {
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
  }, [districts]); // Run when districts data is loaded

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
          w1Taluka: file.w1_taluka ?? prev.w1Taluka,
          w1District: file.w1_district ?? prev.w1District,
          w2Name: file.w2_name ?? prev.w2Name,
          w2Village: file.w2_village ?? prev.w2Village,
          w2Taluka: file.w2_taluka ?? prev.w2Taluka,
          w2District: file.w2_district ?? prev.w2District,
          place: file.place ?? prev.place,
          billAmount: file.bill_amount ?? prev.billAmount
        }));

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

          setShapes(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          console.warn('Failed to parse shapes_json for file', id, e);
          setShapes([]);
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
    w1Name: '', w1Village: '', w1Taluka: '', w1District: '',
    w2Name: '', w2Village: '', w2Taluka: '', w2District: '',
    place: '', billAmount: '',
    engineerDesignation: '', engineerMobile: ''
  });

  setShapes([]);       // clear canvas
  setStep(1);          // go back to step 1
  setSavedFileId(null); // reset file id, so next SAVE is fresh POST
};


 

// const DEFAULT_API_BASE = API_BASE// use your deployed backend
// const API_BASE = (typeof window !== 'undefined' && (process?.env?.NEXT_PUBLIC_API_BASE)) 
//   ? process.env.NEXT_PUBLIC_API_BASE 
//   : DEFAULT_API_BASE;

const submitForm = async (e) => {
  e.preventDefault();


  if (saving) return; // prevent double submit
    const owner_id = getCurrentUserId();

// console.log("owner", owner_id)

  const payload = {
    owner_id,                         
    title: `${form.farmerName || 'File'} - ${form.fileDate}`,
    form,
    shapes
  };

  // const payload = {
  //   title: `${form.farmerName || 'File'} - ${form.fileDate}`,
  //   form,
  //   shapes
  // };

  try {
    setSaving(true);
    // switch between create (POST) and update (PUT) depending on savedFileId
    const isUpdate = !!savedFileId;
    const url = isUpdate ? `${API_BASE}/api/files/${savedFileId}` : `${API_BASE}/api/files`;
    const method = isUpdate ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch (err) { data = null; }

    if (!res.ok) {
      console.error('Server returned non-OK status', res.status, res.statusText);
      console.error('Response body:', text);
      alert(`Save failed: ${res.status} ${res.statusText}\nSee console for details.`);
      return;
    }

    // server returned OK - expect JSON with { success: true, file: {...} }
    if (!data || !data.success) {
      console.error('Unexpected server response', data ?? text);
      alert('Save failed: server did not return the expected data. See console.');
      return;
    }

    // Optional: capture returned id for later linking/navigation
    const returnedId = data.file?.id ?? data.file?.ID ?? data.file?.file_id ?? null;
    if (returnedId) {
      // store briefly or use to navigate to view/edit page
      setSavedFileId(returnedId);
      console.log(isUpdate ? 'Updated file id:' : 'Created file id:', returnedId);
    }

    // Success: clear everything and navigate back to files list
    resetForm();
    router.push('/files');
  } catch (err) {
    console.error('Network/save error', err);
    alert('Network error while saving — see console for details.');
  } finally {
    setSaving(false);
  }
};
 
  const addShape = (type) => {
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
      width: 100,
      height: 80,
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
    setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, x, y } : s)));
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
              width: Math.max(5, node.width() * scaleX),
              height: Math.max(5, node.height() * scaleY),
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
    const selectedNode = stage.findOne(`#${selectedId}`);
    transformer.nodes(selectedNode ? [selectedNode] : []);
    transformer.getLayer().batchDraw();
  }, [selectedId, shapes]);

  const isEditing = Boolean(savedFileId || searchParams?.get?.('id'));

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-5 px-4">
      {saving && <Loader fullScreen message={savedFileId ? (t.updating || 'Updating...') : (t.savingFile || 'Saving file...')} />}
      <form
        onSubmit={submitForm}
        className="w-full max-w-6xl bg-white shadow-lg rounded-lg p-8 space-y-6"
      >

<div className="flex items-center justify-between mb-8">
  {/* Title on the left */}
  <div className="flex items-center gap-4">
  <h2 className="text-2xl font-bold text-cyan-700">{isEditing ? (t.update || 'Update File') : t.newFile}</h2>

    {/* Cancel button to go back to files list */}
    <button
      type="button"
      onClick={() => router.push('/files')}
      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
    >
      {t.cancel || 'Cancel'}
    </button>
  </div>

  {/* Step Indicators on the right */}
  <div className="flex items-center space-x-6">
    {steps.map((s) => (
      <div
        key={s.id}
        className="flex flex-col items-center cursor-pointer"
        onClick={() => goToStep(s.id)}
      >
        <div
          className={`w-12 h-12 flex items-center justify-center rounded-full text-white font-bold text-lg shadow-md transition-all ${
            step === s.id
              ? 'bg-cyan-600 scale-110'
              : 'bg-gray-300 hover:bg-cyan-400 hover:scale-105'
          }`}
        >
          {s.id}
        </div>
        <p
          className={`mt-2 text-sm font-medium ${
            step === s.id ? 'text-cyan-700' : 'text-gray-500'
          }`}
        >
          {/* {s.title} */}
        </p>
      </div>
    ))}
  </div>
</div>



        {/* Step 1 */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-4">

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
              <label className="font-semibold mb-1">{t.applicationId}</label>
              <input name="applicationId" value={form.applicationId} onChange={handleChange} className="input" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.farmerId}</label>
              <input name="farmerId" value={form.farmerId} onChange={handleChange} className="input" />
            </div>


            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.fatherName}</label>
              <input name="fatherName" value={form.fatherName} onChange={handleChange} className="input" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.mobile}</label>
              <input name="mobile" value={form.mobile} onChange={handleChange} className="input" />
            </div>

                        <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.aadhaarNo}</label>
              <input name="aadhaarNo" value={form.aadhaarNo} onChange={handleChange} className="input" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.district}</label>
              <select name="district" value={form.district} onChange={handleChange} className="input" required>
                <option value="">{t.district}</option>
                {districts.map(d => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.taluka}</label>
              <select name="taluka" value={form.taluka} onChange={handleChange} className="input" required>
                <option value="">Select Taluka</option>
                {talukas.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.village}</label>
              <input name="village" value={form.village} onChange={handleChange} className="input" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.area8a}</label>
              <input name="area8A" value={form.area8A} onChange={handleChange} className="input" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.gutNo}</label>
              <input name="gutNo" value={form.gutNo} onChange={handleChange} className="input" />
            </div>


          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="grid grid-cols-2 gap-4">

                        <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.selectCompany}</label>
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
              <label className="font-semibold mb-1">{t.salesEngg}</label>
              <input name="salesEngg" value={form.salesEngg} onChange={handleChange} className="input" required />
            </div>


            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.selectCrop}</label>
              <select name="cropName" value={form.cropName} onChange={handleChange} className="input">
                <option value="">{t.selectCrop}</option>
                <option value="Sugarcane">{t.sugarcane}</option>
                <option value="Cotton">{t.cotton}</option>
                <option value="Wheat">{t.wheat}</option>
              </select>
            </div>


            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.irrigationArea}</label>
              <input name="irrigationArea" value={form.irrigationArea} onChange={handleChange} className="input" required />
            </div>

              <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.pumpType}</label>
              <select name="pumpType" value={form.pumpType} onChange={handleChange} className="input" required>
                <option value="">{t.pumpType}</option>
                <option value="electric">{t.electric}</option>
                <option value="solar">{t.solar}</option>
                <option value="diesel">{t.diesel}</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.lateralSpacing}</label>
              <input name="lateralSpacing" value={form.lateralSpacing} onChange={handleChange} className="input" required />
            </div>

                                   <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.twoNozzelDistance}</label>
              <input name="twoNozzelDistance" value={form.twoNozzelDistance} onChange={handleChange} className="input" />
            </div>


            
                                   <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.twoNozzelDistance}</label>
              <input name="twoNozzelDistance" value={form.twoNozzelDistance} onChange={handleChange} className="input" />
            </div>

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
        )}

         {step === 3 && (


    <div className="flex flex-col items-center p-1">
      <h2 className="text-2xl font-bold text-cyan-700 mb-4">{t.graphTitle}</h2>

      {/* Toolbar */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {/* Equipment Buttons */}
        <div className="flex gap-2">
          <button type="button" onClick={() => addShape('well')} className="px-3 py-1 border-2 border-blue-500 text-blue-500 bg-transparent rounded transition-colors duration-150 hover:bg-blue-500 hover:text-white">{t.well}</button>
          <button type="button" onClick={() => addShape('main_pipe')} className="px-3 py-1 border-2 border-orange-500 text-orange-500 bg-transparent rounded transition-colors duration-150 hover:bg-orange-500 hover:text-white">{t.mainPipe}</button>
          <button type="button" onClick={() => addShape('sub_pipe')} className="px-3 py-1 border-2 border-green-800 text-white bg-green-800 rounded transition-colors duration-150 hover:bg-green-900">Sub Pipe</button>
          <button type="button" onClick={() => addShape('lateral_pipe')} className="px-3 py-1 border-2 border-sky-500 text-sky-500 bg-transparent rounded transition-colors duration-150 hover:bg-sky-500 hover:text-white">{t.lateralPipe}</button>
          <button type="button" onClick={() => addShape('border')} className="px-3 py-1 border-2 border-green-600 text-green-600 bg-transparent rounded transition-colors duration-150 hover:bg-green-600 hover:text-white">{t.border}</button>
          <button type="button" onClick={() => addShape('valve_image')} className="px-3 py-1 border-2 border-purple-500 text-purple-500 bg-transparent rounded transition-colors duration-150 hover:bg-purple-500 hover:text-white">{t.valve}</button>
          <button type="button" onClick={() => addShape('filter_image')} className="px-3 py-1 border-2 border-teal-600 text-teal-600 bg-transparent rounded transition-colors duration-150 hover:bg-teal-600 hover:text-white">{t.filter}</button>
          <button type="button" onClick={() => addShape('flush_image')} className="px-3 py-1 border-2 border-sky-600 text-sky-600 bg-transparent rounded transition-colors duration-150 hover:bg-sky-600 hover:text-white">{t.flush}</button>
        </div>
        {/* Action Buttons */}
        <div className="flex gap-2 border-l-3 pl-2">
          <button type="button" onClick={handleDelete} className="px-3 py-1 bg-red-600 text-white rounded">{t.delete}</button>
        </div>
      </div>

      {/* Canvas */}
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
          {shapes.map((s) => {
            const common = {
              id: s.id,
              draggable: !s.type.includes('pipe'),
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

            if (s.type === 'main_pipe' || s.type === 'lateral_pipe' || s.type === 'sub_pipe')
              return (
                <Line
                  key={s.id}
                  {...common}
                  points={s.points}
                  stroke={s.stroke}
                  strokeWidth={s.strokeWidth}
                  dash={s.dash}
                />
              );

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
                />
              );

            return null;
          })}

          <Transformer ref={trRef} rotateEnabled={true} anchorSize={8} borderStroke="black" borderDash={[4, 4]} />
        </Layer>
      </Stage>
{/* 
      <button
        onClick={() => console.log('Exported Layout:', shapes)}
        className="mt-4 px-4 py-2 bg-cyan-700 text-white rounded"
      >
        {t.export}
      </button> */}
    </div>


        )}

{step === 4 && (
  <div className="grid grid-cols-2 gap-4">

    {/* Bill Information */}
    <div className="flex flex-col">
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
    </div>

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

    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.w1District}</label>
      <select
        name="w1District"
        value={form.w1District}
        onChange={handleChange}
        className="input"
      >
        <option value="">{t.w1District}</option>
        {districts.map(d => (
          <option key={d.name} value={d.name}>{d.name}</option>
        ))}
      </select>
    </div>

    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.w1Taluka}</label>
      <select
        name="w1Taluka"
        value={form.w1Taluka}
        onChange={handleChange}
        className="input"
      >
        <option value="">Select Taluka</option>
        {w1Talukas.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
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

    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.w2District}</label>
      <select
        name="w2District"
        value={form.w2District}
        onChange={handleChange}
        className="input"
      >
        <option value="">{t.w2District}</option>
        {districts.map(d => (
          <option key={d.name} value={d.name}>{d.name}</option>
        ))}
      </select>
    </div>

    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.w2Taluka}</label>
      <select
        name="w2Taluka"
        value={form.w2Taluka}
        onChange={handleChange}
        className="input"
      >
        <option value="">Select Taluka</option>
        {w2Talukas.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
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
)}


{/* Navigation Buttons */}
<div className="flex justify-between mt-6">
  {/* Previous button */}
  {step > 1 && (
    <button
      type="button"
      onClick={prevStep}
      className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400"
    >
      {t.previous}
    </button>
  )}

  {/* Next button (only for steps 1–3) */}
  {step < 4 && (
    <button
      type="button"
      onClick={nextStep}
      className="px-6 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
    >
      {t.next}
    </button>

  )}

  {/* Submit button (only for step 4) */}
  {step === 4 && (
        <button type="submit" className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600">
      {saving ? (t.saving || 'Saving...') : (savedFileId ? (t.update || 'Update') : (t.submit || 'Submit'))}
  </button>
    // <button
    //   type="submit"
    //   className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
    // >
    //   {t.submit}
    // </button>
  )}
</div>


        <style jsx>{`
          .input {
            border: 1px solid #e5e7eb;
            padding: 10px;
            border-radius: 6px;
            width: 100%;
          }
        `}</style>
      </form>
    </div>
  );
 

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

}

export default function NewFilePage() {
  return (
    <ProtectedRoute>
      <NewFilePageContent />
    </ProtectedRoute>
  );
}
