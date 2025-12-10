'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/utils';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getCurrentUser } from '@/lib/utils';
import BillInvoice from '@/components/BillInvoice';

// Dynamic import for farm map canvas to avoid SSR issues
const FarmMapCanvas = dynamic(() => import('./FarmMapCanvas'), { ssr: false });

function FilePrintPageContent({ params }) {
  const API = API_BASE;
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [routeId, setRouteId] = useState(null);
  const [shapes, setShapes] = useState([]);
  const [canvasImage, setCanvasImage] = useState(null);
  const [billData, setBillData] = useState(null);
  const [userData, setUserData] = useState(null);


  // Format date to readable DD/MM/YYYY (removes timestamp)
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr; // fallback if invalid
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Convert ASCII digits to Devanagari numerals
  const toDevanagariDigits = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    const map = {
      '0': '\u0966',
      '1': '\u0967',
      '2': '\u0968',
      '3': '\u0969',
      '4': '\u096A',
      '5': '\u096B',
      '6': '\u096C',
      '7': '\u096D',
      '8': '\u096E',
      '9': '\u096F',
    };
    return str.replace(/[0-9]/g, (d) => map[d] || d);
  };

  const handlePrint = () => {
    if (!file) return;
    
    const printWindow = window.open('', '_blank', 'width=900,height=1200');

    if (!printWindow) {
      alert('Please disable popup blocker and try again');
      return;
    }

    // Capture canvas as image before printing
    const canvasElement = document.querySelector('#farm-map-canvas canvas');
    let canvasDataUrl = '';
    
    if (canvasElement) {
      try {
        // Canvas is now properly sized (660x320), capture directly
        canvasDataUrl = canvasElement.toDataURL('image/png');
      } catch (err) {
        console.error('Error capturing canvas:', err);
      } 
    }

    const fileElement = document.getElementById('file-content');
    const clonedFile = fileElement.cloneNode(true);

    // Function to copy all computed styles as inline styles
    const copyComputedStyles = (source, target, skipIds = []) => {
      // Skip elements with specific IDs
      if (skipIds.includes(target.id)) {
        return;
      }
      
      const computed = window.getComputedStyle(source);
      let cssText = '';
      for (let i = 0; i < computed.length; i++) {
        const prop = computed[i];
        cssText += `${prop}:${computed.getPropertyValue(prop)};`;
      }
      target.style.cssText = cssText;

      // Recursively copy styles to children
      for (let i = 0; i < source.children.length; i++) {
        if (target.children[i]) {
          copyComputedStyles(source.children[i], target.children[i], skipIds);
        }
      }
    };

    // Apply all computed styles as inline styles FIRST (before modifying canvas)
    copyComputedStyles(fileElement, clonedFile, ['farm-map-canvas']);

    // NOW replace canvas with image in clone (after copyComputedStyles)
    const canvasContainer = clonedFile.querySelector('#farm-map-canvas');
    if (canvasContainer && canvasDataUrl) {
      // Set container to have fixed height matching web preview and center the image
      canvasContainer.style.cssText = 'width: 100%; height: 75mm; display: flex; align-items: center; justify-content: center; background: transparent; border: none;';
      canvasContainer.innerHTML = `<img src="${canvasDataUrl}" style="width: 100%; height: 75mm; object-fit: contain; display: block;" />`;
      
      // Add graph paper grid to parent container
      const parentContainer = canvasContainer.parentElement;
      if (parentContainer) {
        parentContainer.style.cssText = `
          height: 85mm;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid black;
          background-color: #ffffff;
          background-image: 
            linear-gradient(to right, rgba(144, 238, 144, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(144, 238, 144, 0.3) 1px, transparent 1px),
            linear-gradient(to right, rgba(34, 139, 34, 0.35) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(34, 139, 34, 0.35) 1px, transparent 1px);
          background-size: 1mm 1mm, 1mm 1mm, 10mm 10mm, 10mm 10mm;
        `;
      }
    }

    // Override styles on each sheet to ensure proper A4 sizing
    const sheets = clonedFile.querySelectorAll('.sheet');
    sheets.forEach((sheet) => {
      // Check if this sheet contains the bill invoice (file-bill-content)
      const isBillSheet = sheet.querySelector('#file-bill-content') !== null;
      
      sheet.style.cssText = `
        width: 210mm;
        height: 297mm;
        min-height: 297mm;
        max-height: 297mm;
        margin: 15px 15px;
        padding: ${isBillSheet ? '0' : '10mm'};
        background: white;
        font-size: 11px;
        box-sizing: border-box;
        overflow: hidden;
        page-break-after: always;
        page-break-inside: avoid;
        border: 4px solid black;
      `;
    });
    // Remove page-break-after from last sheet
    if (sheets.length > 0) {
      sheets[sheets.length - 1].style.pageBreakAfter = 'auto';
    }

    // Fix bill section container styling for print (multi-page support)
    const billSection = clonedFile.querySelector('.bill-section');
    if (billSection) {
      billSection.style.cssText = `
        width: 210mm;
        min-height: auto;
        height: auto;
        margin: 0;
        padding: 0;
        border: none;
        box-sizing: border-box;
        background: white;
        page-break-inside: auto;
      `;
    }

    // Fix bill invoice content styling for print
    const billContent = clonedFile.querySelector('#file-bill-content');
    if (billContent) {
      billContent.style.cssText = `
        width: 100%;
        min-height: auto;
        height: auto;
        margin: 0;
        padding: 5mm;
        font-size: 11px;
        position: relative;
        box-sizing: border-box;
        background: white;
      `;
    }

    // Override the file-content container
    clonedFile.style.cssText = `
      margin: 0 auto;
      padding: 0;
      display: block;
      width: 210mm;
    `;

    // Generate filename
    const farmerName = file?.farmer_name || 'Farmer';
    const fileId = file?.id || 'File';
    const fileName = `${farmerName}_File_${fileId}`.replace(/[^a-zA-Z0-9\u0900-\u097F_-]/g, '_');

    const htmlContent =  `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${fileName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    html, body {
      display: flex;
  justify-content: center;
  align-items: flex-start; /* keep from vertical shifting */
  padding: 0;
  margin: 0;
      margin: 0;
      padding: 0;
      background: #f5f5f5;
      width: 100%;
      height: 100%;
    }

    /* Preview in browser (center the physical A4 page) */
    #file-content { width: 210mm; margin: 0 auto; }

    .sheet {
      width: 210mm;
      height: 297mm;
      background: white;
      border: 4px solid black;
      box-shadow: 0 0 10px rgba(0,0,0,0.2);
      box-sizing: border-box;
    }

    /* Real print settings */
    /* Printer margin off; we create inner whitespace via padding */
    @page { size: A4 portrait; margin: 0; }

    /* Named page for bill section to allow margins */
    @page bill-page {
      size: A4 portrait;
      margin: 10mm 0; /* Top and bottom margins */
    }

    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      html, body { margin: 0; padding: 0; background: white; }

      #file-content { margin: 0; padding: 0; width: auto; }

      .sheet {
        box-shadow: none !important;
        margin: 0 !important;
        width: 210mm !important;
        height: 297mm !important;
        border: 4px solid black !important;
        padding: 8mm !important;   /* UNIFORM inner space around border */
        page-break-after: always !important;
        box-sizing: border-box !important;
      }

      .sheet:last-child {
        page-break-after: auto !important;
      }

      /* Bill invoice section - special handling for multi-page */
      .bill-section {
        width: 210mm !important;
        min-height: 297mm !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        page-break-inside: auto !important;
        page-break-after: auto !important;
        box-sizing: border-box !important;
        page: bill-page;
      }

      #file-bill-content {
        width: 100% !important;
        min-height: 289mm !important;
        height: auto !important;
        margin: 0 !important;
        padding: 5mm !important;
        box-sizing: border-box !important;
        display: block !important;
      }

      /* Prevent splitting of important sections in bill */
      .bill-invoice-container > div:not(.items-table-container) { page-break-inside: avoid !important; }
      .items-table-container { page-break-inside: auto !important; }

      /* Allow tables to break across pages but keep rows together */
      table { page-break-inside: auto !important; }
      tr { page-break-inside: avoid !important; page-break-after: auto !important; }
      thead { display: table-header-group !important; }
      tfoot { display: table-footer-group !important; }
      
      /* Keep totals, amount in words, and signatures together */
      [style*="pageBreakInside"] { page-break-inside: avoid !important; }

      /* Farm map canvas - ensure proper sizing in print */
      #farm-map-canvas {
        width: 100% !important;
        height: 75mm !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      #farm-map-canvas img {
        width: auto !important;
        height: 70mm !important;
        max-width: 100% !important;
        object-fit: contain !important;
      }
    }
  </style>
</head>
<body>
  ${clonedFile.outerHTML}
  <script>
    window.onload = function() {
      setTimeout(function() {
        //window.print();
      }, 300);
    };
    window.onafterprint = function() {
      window.close();
    };
    window.addEventListener('focus', function() {
      setTimeout(function() {
       //window.close();
      }, 500);
    });
  </script>
</body>
</html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  useEffect(() => {
    (async () => {
      const p = await params;
      setRouteId(p?.id ?? null);
    })();
  }, [params]);

  useEffect(() => {
    if (!routeId) return;
    
    const fetchFile = async () => {
      try {
        const res = await fetch(`${API}/api/files/${routeId}`);
        const data = await res.json();
        const fileData = data.file || data;
        console.log('Fetched file data:', fileData);
        setFile(fileData);
        
        // Parse shapes_json if it exists
        if (fileData.shapes_json) {
          try {
            const parsedShapes = typeof fileData.shapes_json === 'string' 
              ? JSON.parse(fileData.shapes_json) 
              : fileData.shapes_json;
            setShapes(Array.isArray(parsedShapes) ? parsedShapes : []);
          } catch (err) {
            console.error('Error parsing shapes_json:', err);
            setShapes([]);
          }
        }

        // Fetch linked bill
        if (fileData.id) {
          try {
            const billListRes = await fetch(`${API}/api/bills?file_id=${fileData.id}`);
            const billListResult = await billListRes.json();
            console.log('Fetched bill list for file psa:', fileData.id, billListRes);
            if (billListResult.success && billListResult.bills && billListResult.bills.length > 0) {
              const linkedBillId = billListResult.bills[0].bill_id;
              const billRes = await fetch(`${API}/api/bills/${linkedBillId}`);
              const billData = await billRes.json();
              console.log('Fetched linked bill data psa:', linkedBillId, billData);
              if (billData.success && billData.bill) {
                setBillData(billData.bill);
                console.log('Bill data loaded:', billData.bill);
              }
            }
          } catch (err) {
            console.error('Error fetching bill:', err);
          }
        }

        // Load user details from utils (if available)
        try {
          const details = await getCurrentUser();
          setUserData(details || null);
          console.log('Loaded user details:', details);
        } catch (e) {
          console.warn('Could not load user details:', e);
        }
      } catch (error) {
        console.error('Error fetching file:', error);
      }
    };
    
    fetchFile();
  }, [routeId, API]);

  if (!file) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading file...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen" style={{ backgroundColor: "#f5f5f5", padding: "20px 0" }}>
      <div id="file-content" className="w-screen px-6">
        {/* Page 1 - Application Header */}
        <div
          className="sheet mx-auto bg-white shadow-lg border-4 border-black"
          style={{
            width: "210mm",
            height: "297mm",
            minHeight: "297mm",
            maxHeight: "297mm",
            fontSize: "11px",
            padding: "5mm",
            position: "relative",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {/* Header Row */}
                      <div className='text-center' >
                          <h1 className="text-xl font-black mb-1">प्रधानमंत्री कृषी सिंचाई योजने अंतर्गत</h1>
              <h1 className="text-xl font-black mb-1">केंद्र पुरस्कृत सिंचन योजना</h1>
              <h5 className="text-sm font-semibold mb-2">प्रति थेंब अधिक पीक (PER DROP MORE CROP)</h5>
              <hr className="border-black my-2" />
                            <h2 className="text-4xl font-black">अनुदान मागणी प्रस्ताव</h2>
              <h2 className="text-lg m-3 font-black">सन {toDevanagariDigits(file.fy_year || '')}</h2>
               </div>
          <div className="flex justify-between items-start">
            {/* Left Box */}
            <div className="text-left" >
              <div className="p-2 text-center text-xs mb-1" style={{minWidth: "220px"}}>
                <div className='p-2 text-md font-bold border border-black'>APPLICATION ID</div>
                <div className=" p-2 text-xl border border-black border-t-0 font-bold">{file.application_id}</div>
              </div>
              {/* <div className="border border-black p-2 text-center text-xs">
                <div className="font-bold">FMR-{file.id}</div>
              </div> */}
            </div>

            {/* Center */}

            <div className="text-center flex-2">


              
              {/* Emblem */}
              <div className="flex flex-col items-center mt-4">
                <div className="p-2 mt-5 w-60 h-74 flex items-center justify-center bg-white">
                  <img src="/emblem1.png" alt="Indian Emblem" className=" object-contain" />
                </div>

              </div>
            </div>

            {/* Right Box */}
            <div className="text-right">
              <div className="p-2 text-center text-xs mb-1" style={{minWidth: "220px"}}>
                <div className='p-2 text-md font-bold border border-black'>FARMER ID</div>
                <div className=" p-2 text-xl border border-black border-t-0 font-bold">{file.farmer_id}</div>
              </div>
            </div>
          </div>
                          <div className="text-center mt-2">
                  <h2 className="text-2xl m-2 font-bold">महाराष्ट्र शासन</h2>
                  <h2 className="text-xl font-bold">कृषि विभाग</h2>
                  <h2 className="text-lg font-bold">तालुका कृषी अधिकारी </h2>
                  <div className="flex-1  border-black px-2 py-1 font-bold text-xl"> {file.taluka || 'N/A'} जिल्हा: {file.district || 'N/A'}</div>
                </div>

          {/* Farmer Identity Box */}
          <div className="border border-black pb-1.5 p-1 mt-1">
            <div className="grid grid-cols-2 gap-1">
              <div className="flex gap-1 items-center col-span-2">
                <div className=" text-lg  w-35">शेतकऱ्याचे नाव :</div>
                <div className="flex-1 font-bold text-base border-b border-black px-2 py-1">श्री/श्रीमती {file.farmer_name || 'N/A'}</div>
              </div>
              <div className="flex gap-1 items-center">
                <div className=" text-lg w-35">आधार क्रमांक :</div>
                <div className="flex-1 font-bold text-base border-b border-black px-2 py-1">{file.aadhaar_no || 'N/A'}</div>
              </div>
              <div className="flex gap-1 items-center ">
                <div className="text-lg  w-35">मोबाईल क्रमांक :</div>
                <div className="flex-1  font-bold text-base border-b border-black px-2 py-1">{file.mobile || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Address Box */}
          <div className="border border-black pb-1.5 p-1 mt-1">
            <div className="grid grid-cols-3 gap-1">
              <div className="flex gap-1 items-center">
                <div className="text-lg w-10">गाव :</div>
                <div className="flex-1 font-bold text-base border-b border-black px-2 py-1">{file.village || 'N/A'}</div>
              </div>
              <div className="flex gap-1 items-center">
                <div className="text-lg w-15 ">तालुका :</div>
                <div className="flex-1 font-bold text-base border-b border-black px-2 py-1">{file.taluka || 'N/A'}</div>
              </div>
              <div className="flex gap-1 items-center">
                <div className="text-lg w-13 ">जिल्हा :</div>
                <div className="flex-1 font-bold text-base border-b border-black px-2 py-1">{file.district || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Land Details Box */}
          <div className="border border-black pb-1.5 p-1 mt-1">
            <div className="grid grid-cols-2 gap-1">
              <div className="flex gap-1 items-center">
                <div className="text-lg w-30">८अ क्षेत्रफळ :</div>
                <div className="flex-1 font-bold text-base border-b border-black px-2 py-1">{file.area8a || 'N/A'} हेक्टर</div>
              </div>
              <div className="flex gap-1 items-center">
                <div className="text-lg w-30">गट/सर्व्हे क्रमांक :</div>
                <div className="flex-1 font-bold text-base border-b border-black px-2 py-1">{file.gut_no || file.survey_no || 'N/A'}</div>
              </div>
              <div className="flex gap-1 items-center">
                <div className="text-lg w-30">सिंचन क्षेत्र :</div>

                <div className="flex-1 font-bold text-base border-b border-black px-2 py-1">{file.irrigation_area || 'N/A'} हेक्टर </div>

              </div>
                            <div className="flex gap-1 items-center">
                
                <div className="text-lg w-30">पीक प्रकार:</div>
                <div className="flex-1 font-bold text-base border-b border-black px-2 py-1">{file.crop_name || 'N/A'}</div>
              </div>
            </div>
          </div>
          {/* Company Box */}
          <div className="border border-black pb-1.5 p-1 mt-1">
            <div className="flex gap-1 items-center">
              <div className="text-lg w-35">कंपनीचे नाव :</div>
              <div className="flex-1 font-bold text-base border-b border-black px-2 py-1">{file.company || 'N/A'}</div>
            </div>
          </div>

          {/* Owner Details (from user data) */}
          <div className="border border-black pb-1.5 p-1 mt-1">
            <div className="grid grid-cols-1 gap-1">
              <div className="flex gap-1 items-center">
                <div className="text-lg w-35">वितरकाचे नाव :</div>
                <div className="flex-1 font-bold text-base border-b border-black px-2 py-1">{userData?.business_name || 'N/A'}</div>
              </div>
              <div className="flex gap-1 items-center col-span-2">
                <div className="text-lg w-35">पत्ता:</div>
                <div className="flex-1 font-bold text-base border-b border-black px-2 py-1">{userData?.short_address}, {userData?.taluka}, {userData?.district}, मो नं: {userData?.mobile || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-700 mt-7">AgriFiles - 8055554030, 7057878572</div>
        </div>

        {/* Page 2 - Signature Page */}
        <div
          className="sheet mx-auto bg-white my-2 shadow-lg border-4 border-black"
          style={{
            width: "210mm",
            height: "297mm",
            minHeight: "297mm",
            maxHeight: "297mm",
            fontSize: "11px",
            padding: "10mm",
            position: "relative",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <div className="text-center m-0">
           
                        <h2 className="text-lg font-bold m-0"> परिशिष्ट - ७</h2>

            <h2 className="text-base font-bold">शेतकऱ्याने द्यावयाचे हमीपत्र </h2>
          </div>

          <div className="mt-1">
            <div className="p-1 text-xs leading-relaxed">
              <p className="mb-1">
                
                मी / आम्ही श्री/सौ <span className="font-bold">{file.farmer_name || '________'}</span> गाव <span className="font-bold">{file.village || '________'}</span> तालुका <span className="font-bold">{file.taluka || '________'}</span> जिल्हा <span className="font-bold">{file.district || '________'}</span>
                {' '}दिनांक <span className="font-bold">{formatDate(file.file_date) || '________'}</span> रोजी सर्वे/गट <span className="font-bold">{file.gut_no || file.survey_no || '________'}</span> मधील <span className="font-bold">{file.area8a || '________'}</span> हेक्टर क्षेत्रावर <span className="font-bold">{ file.crop_name || '________'}</span> पिकांसाठी ठिबक/तुषार सिंचन अनुदानासाठी अर्ज केला आहे. मला आपणाकडून पूर्वसंमती मिळाली असून त्यानुसार मी ठिबक/तुषार संच बसविला आहे व अनुदानासाठी प्रस्ताव सादर करत आहे.
              </p>

              <ol className="list-decimal ml-2 space-y-2">
                <li>
                  मी खालील कागदपत्रे सोबत जोडली आहेत व ती सर्व माहिती कागदपत्रांशी सुसंगत आहे:
                  <ul className="list-disc ml-9 mt-1 space-y-1">
                    <li>शेतकर्‍याचे स्वयंघोषणापत्र</li>
                    <li>७/१२ उतारा (मालकी हक्कासाठी)</li>
                    <li>८अ उतारा (एकूण क्षेत्र)</li>
                    <li>कंपनी प्रतिनिधीने तयार केलेला सूक्ष्म सिंचन आराखडा व प्रमाणपत्र</li>
                    <li>बिलाची मूळ प्रत (Tax Invoice)</li>
                  </ul>
                </li>
                <li>सदर ठिबक/तुषार सिंचनासाठी आवश्यक सिंचन सुविधा माझ्याकडे उपलब्ध आहे.</li>
                <li>ऊर्जा साधने <span className="font-bold">{file.pump_type || '________'}</span> पंप माझ्याकडे असून अधिकृत विद्युत जोडणीची सुविधा उपलब्ध आहे.</li>
                <li>ज्या क्षेत्रासाठी ठिबक/ तुषार सिंचनचा अर्ज केला आहे त्या क्षेत्रावर यापूर्वीच्या सात वर्षांमध्ये मी शासनाच्या कोणत्याही योजनेतून ठिबक तुषार संचाच्या अनुदानाचा लाभ घेतलेले नाही.</li>
                <li>या क्षेत्रासाठी ठिबक/तुषार संचाच्या अनुदानाची मागणी केली आहे. त्यासह मी एकूण <span className="font-bold">{file.irrigation_area || '________'}</span>  हेक्टर क्षेत्र पेक्षा जास्त क्षेत्रासाठी तसेच माझे एकूण जमिनी धारणे पैकी ८ अ नुसार जास्त क्षेत्रासाठी अनुदानाचा लाभ घेतलेला नाही.</li>

                <li>संयुक्त ७/१२ मध्ये इतर खातेदाराकडून भविष्यात वाद निर्माण झाल्यास त्याची जबाबदारी माझी राहील.</li>

                <li>बिलामध्ये नमूद केलेले साहित्य मला प्राप्त झाले असून ते योग्य दर्जाचे असल्याची खात्री करून ते स्वीकारले असून त्याबद्दल माझी काही हरकत नाही.</li>

                <li>उत्पादक कंपनी / वितरक यांनी मराठी भाषेतील संघ देखभाल मार्गदर्शक पुस्तिका (Operational & Maintanace Manual) मला उपलब्ध करून देण्यात आली या मार्गदर्शक पुस्तके मध्ये नमूद सूचनांचे मी पालन करेल. </li>
                <li>अनुदान ठिबक/तुषार संचाच्या प्राप्त झाल्यावर पुढील पाच वर्षापर्यंत संच सुव्यवस्थेत व वापरात ठेवण्याचे असून त्याची अथवा त्यातील कोणत्याही भागाची विक्री करणार नाही.</li>


                <li>ठिबक तुषार सिंचन संचाच्या उत्पादक कंपनीच्या इंजिनियरने करून द्यावयाच्या आराखड्‌यासाठी आवश्यक ती कागदपत्रे माहिती उदा. माती-पाणी परीक्षण अहवाल, विद्युत मोटर/ डिझेल इंजिन क्षमता, सिंचन सुविधांपासून ठिबक / तुषार संचाच्या अंतर, हेड, घ्यायचे/ घेत असलेले पीक, पाणी उपलब्धता इतर सर्व तांत्रिक बाबीची माहिती त्यांना उपलब्ध करून द्यायची जबाबदारी माझी असून त्यानुसार त्यांनी आराखडा तयार करून दिलेला आहे.
</li>
                <li>उत्पादक कंपनी किंवा त्याचे प्रतिनिधी सोबत विहित नमुन्यातील साध्या कागदावर करारनामा मी करून घेतला असून तो माझ्याकडे ठेवला आहे.</li>
                <li>अंमल बजावणी यंत्रणेच्या अधिकार्‍यांना सदरचा संघ तपासणी करण्यासाठी माझी मुभा आहे. तपासणीसाठी कोणत्याही प्रकारचा अडथळा अथवा हरकत केल्यास मी अनुदान मिळण्यासाठी पात्र राहील / मिळालेले अनुदान वसूल करण्यात मी पात्र राहील याची मला जाणीव आहे.
</li>
                <li>प्रधानमंत्री कृषी सिंचन योजनेतून सूक्ष्म सिंचन घटकाचा लाभ मिळण्यासाठी मी सादर केलेली कागदपत्रे खरी आहेत. </li>
              </ol>

              <p className="mt-3">
                वरील सर्व माहिती मी सत्य प्रतिज्ञेवर प्रमाणित करून देत आहे सदर माहिती खोटी आढळून आल्यास, भारतीय दंड संहिता अन्वये आणि किंवा संबंधित काय‌द्यानुसार माझ्यावर खटला भरला जाईल व त्यानुसार मी शिक्षेस पात्र राहील याची मला पूर्ण जाणीव आहे.
              </p>

              <p className="mt-2">तरी माझ्या अर्जाचा अनुदानासाठी विचार करावा ही विनंती.</p>

              <div className="grid grid-cols-2 gap-6 mt-1">
                <div>
                <div>
                  <div className="text-xs mt-3">दिनांक :  <span className="font-bold">  {formatDate(file.file_date) || '________'} </span></div>
                </div>
                <div>
                  <div className="text-md ">स्थळ :  <span className="font-bold"> {file.village || '________'}</span></div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-md  mb-2">लाभार्थी शेतकऱ्याची स्वाक्षरी</div>
                <div className="font-bold">{file.farmer_name || '________'}</div>
                <div className="border border-black w-48 h-15 bg-white"></div>
              </div>
</div>
    

              <div className="mt-0">
                <div className="text-sm font-bold mb-0">साक्षीदार -</div>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <div className=" py-1">१) <span className="font-bold"> {file?.w1_name || '________'}, </span>  स्वाक्षरी : '______________'</div>
                    <div className="border-b border-black py-1 mt-2">पत्ता: <span className="font-bold"> {file?.w1_village || '________'}</span>, तालुका : <span className="font-bold">{file?.w1_taluka || '________'}</span> जिल्हा : <span className="font-bold">{file?.w1_district || '________'}</span></div>
                  </div>
                  <div>
                    <div className=" py-1">२) <span className="font-bold"> {file?.w2_name || '________'}, </span>  स्वाक्षरी : '______________'</div>
                    <div className="border-b border-black py-1 mt-2">पत्ता: <span className="font-bold">{file?.w2_village || '________'}</span>, तालुका : <span className="font-bold">{file?.w2_taluka || '________'}</span> जिल्हा : <span className="font-bold">{file?.w2_district || '________'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page 3 - Farm Map */}

        <div
          className="sheet mx-auto bg-white my-6 shadow-lg border-4 border-black"
          style={{
            width: "210mm",
            height: "297mm",
            minHeight: "297mm",
            maxHeight: "297mm",
            fontSize: "11px",
            padding: "10mm",
            position: "relative",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <div className="text-center">
            <h2 className="text-lg font-bold m-0">परिशिष्ट - ६</h2>
          </div>

          <div className="mt-0">
            <h3 className="text-base text-center font-bold">कंपनी प्रतिनिधीने तयार केलेल्या सूक्ष्म सिंचन आराखडा व प्रमाणपत्र</h3>

            <div className="text-xs leading-relaxed">
              <p className="mb-3 text-xs ">प्रति ,</p>

              <p className="text-xs leading-normal">
                शेतकऱ्याचे नाव: <span className="font-bold">{file.farmer_name || '________'}</span>, गाव : <span className="font-bold">{file.village || '________'}</span>, तालुका : <span className="font-bold">{file.taluka || '________'}</span>, जिल्हा: <span className="font-bold">{file.district || '________'}</span>
              </p>

              <div className=" text-xs leading-normal ">
                <p>८ अ प्रमाणे क्षेत्र : <span className="font-bold">{file.area8a || '________'}</span> हेक्टर, सिंचना खालील क्षेत्र : <span className="font-bold">{file.irrigation_area || '________'}</span> हेक्टर पिकाचे नाव : <span className="font-bold">{file.crop_name || '________'}</span></p>
              </div>


              <p className="mb-3 mt-1">
                     आपले शेतातील सर्वे नंबर / गट नंबर: <span className="font-bold">{file.gut_no || file.survey_no || '________'}</span> मध्ये सूक्ष्म सिंचन संच घटक बसवण्या करता मी <span className="font-bold">{file.company || '________'}</span> या कंपनीचा तांत्रिक प्रतिनिधी म्हणून आपले समक्ष सर्वेक्षण केले असून खालील प्रमाणे आराखडा तयार करण्यात आला असून आपणास सिंचन संच बनविण्या करता उपलब्ध करून देण्यात येत आहे.
              </p>
            </div>

            {/* Plan/Graph placeholder with graph paper grid */}
            <div 
              className="border border-black p-2 flex items-center justify-center mt-3" 
              style={{ 
                height: "85mm", 
                backgroundColor: "#ffffff",
                backgroundImage: `
                  linear-gradient(to right, rgba(144, 238, 144, 0.3) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(144, 238, 144, 0.3) 1px, transparent 1px),
                  linear-gradient(to right, rgba(34, 139, 34, 0.35) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(34, 139, 34, 0.35) 1px, transparent 1px)
                `,
                backgroundSize: `
                  1mm 1mm,
                  1mm 1mm,
                  10mm 10mm,
                  10mm 10mm
                `,
                backgroundPosition: '0 0, 0 0, 0 0, 0 0'
              }}
            >
              <div id="farm-map-canvas" className="w-full h-full flex items-center justify-center">
                <FarmMapCanvas shapes={shapes} />
              </div>
            </div>

            {/* Direction and Indications Images */}
            <div className="flex gap-2 mt-2">

              

                            <div className="flex-1 flex items-center justify-center w-90 p-1" style={{ height: "40mm" }}>
                            <div className="">
              <table className="w-full border-collapse text-xs">
                <tbody>
                  <tr className="border border-black">
                    <td className="border border-black p-1 ">पीक</td>
                    <td className="border border-black p-1 font-bold">{file.crop_name || '________'}</td>
                  </tr>
                  <tr className="border border-black">
                    <td className="border border-black p-1 ">दोन लॅटरल अंतर (मीटर)</td>
                    <td className="border border-black p-1 font-bold">{file.lateral_spacing || '________'}</td>
                  </tr>
                                  <tr className="border border-black">
                    <td className="border border-black p-1 ">दोन नोजल अंतर (मीटर)</td>
                    <td className="border border-black p-1 font-bold">{file.two_nozzel_distance || '________'}</td>
                  </tr>
                  <tr className="border border-black">
                    <td className="border border-black p-1">ड्रिपर डिस्चार्ज (ली/तास)</td>
                    <td className="border border-black p-1 font-bold">{file.dripper_discharge || '________'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
              </div>
              <div className="flex-1 flex items-center justify-center mt-7 p-1" style={{ height: "25mm" }}>
                <img src="/direction.png" alt="Direction" className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex-1 flex items-center justify-center p-1" style={{ height: "40mm" }}>
                <img src="/indications.png" alt="Indications" className="max-w-full max-h-full object-contain" />
              </div>
            </div>

            {/* Irrigation System Details Table */}


            {/* Certificate Section */}
            <div className="mt-4">
              <h3 className="text-base text-center font-bold">कंपनीच्या प्रतिनिधीने संकल्प चित्रावर द्यावयाचे प्रमाणपत्र</h3>

              <p className="text-xs leading-relaxed">
                वरील प्रमाणे संकल्प चित्र शेतकर्‍यांनी दिलेल्या पाणी परिक्षण अहवाल, पाणी उपलब्धता, डिझेल / विद्युत मोटर क्षमता, मातीचा प्रकार, घ्यावेची पिक, जमिनीचा चढ-उतार, पाण्याच्या सुविधेपासून ठिबक संचाचे अंतर, इत्यादी., माहितीच्या आधारे व प्रत्यक्ष पाहणी करून तयार केलेला आहे ठिबक सिंचन संच व्यवस्थित चालण्याच्या दृष्टीने वरील संकल्पचित्र तांत्रिकदृष्ट्या व आर्थिकदृष्ट्या योग्य आहे.
              </p>

                  <div className="text-xs mt-5  mb-2">दिनांक:  <span className=" font-bold py-1">{formatDate(file.file_date) || '________'} <div><span className="font-normal">गाव :</span> <span className="font-bold">{file.village || '________'}</span></div></span></div>
                 


                  {/* ================= SIGNATURES ================= */}
    <div className="px-1 py-3 mt-3 grid grid-cols-3 gap-4" style={{fontSize: "11px", position: "relative", zIndex: 1}}>
      <div className="flex flex-col border border-black p-3 h-32">
        <div className="h-16 flex-1" />
        <div className="text-xs border-t-2 border-black pt-1 text-center leading-normal ">
          <div>शेतकरी</div>
          <div className='font-bold'>{file?.farmer_name}</div>
        </div>
      </div>

      <div className="flex flex-col border border-black p-3 h-32">
        <div className="h-16 flex-1" />
        <div className="text-xs border-t-2 border-black pt-1 text-center leading-normal ">
          <div>सेल्स इंजिनियर </div>
          <div className="font-bold"> {file?.company} {file?.sales_engg ? `(${file?.sales_engg})` : ''} </div>
        </div>
      </div>

      <div className="flex flex-col border border-black p-3 h-32">
        <div className="h-16 flex-1" />
        <div className="text-xs border-t-2 border-black pt-1 text-center leading-normal overflow-hidden">
          <div>विक्रेता / वितरक </div>
          <div className="font-bold truncate">{userData?.business_name}</div>
        </div>
      </div>
    </div>

            </div>
          </div>
        </div>

        {/* Page 4 - Completion Certificate */}
        <div
          className="sheet mx-auto bg-white my-6 shadow-lg border-4 border-black"
          style={{
            width: "210mm",
            height: "297mm",
            minHeight: "297mm",
            maxHeight: "297mm",
            fontSize: "11px",
            padding: "15mm",
            position: "relative",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <h2 className="text-center text-xl font-bold">पूर्णत्वाचा दाखला</h2>
          <h3 className="text-center text-base font-bold mt-2">वितरक कंपनीचे तांत्रिक प्रतिनिधी व शेतकरी यांनी संयुक्तपणे द्यावयाचा सुक्ष्म सिंचन संचाचा पूर्णत्वाचा दाखला.</h3>

          <div className="p-4 mt-6">
            <p className="text-sm leading-relaxed">
              आम्ही मार्गदर्शक सुचनेतील मापदंडानुसार व संमतीनुसार खालील सही करणार लिहून देतो की, प्रधानमंत्री राष्ट्रीय कृषि विकास योजना प्रति थेंब अधिक पीक (सुक्ष्म सिंचन) सन <span className="font-bold">{toDevanagariDigits(file.fy_year || '')}</span> अंतर्गत लाभार्थी श्री/श्रीमती <span className="font-bold">{file.farmer_name || '________'}</span> गाव - <span className="font-bold">{file.village || '________'}</span> तालुका - <span className="font-bold">{file.taluka || '________'}</span> यांचे शेतावर सर्वे नं/गट नं. - <span className="font-bold">{file.gut_no || file.survey_no || '________'}</span> मध्ये एकूण क्षेत्र - <span className="font-bold">{file.area8a || '________'}</span> हेक्टर वर पिकाचे नाव <span className="font-bold">{file.crop_name || '________'}</span> आज दिनांक - <span className="font-bold">{formatDate(file.file_date) || '________'}</span> ठिबक/तुषार सिंचन संच उभारणी पुर्वसंमती, योजनेच्या मार्गदर्शक सुचना व आराखड्‌यानुसार कार्यान्वित करून दिला आहे.
            </p>

            <div className="mt-6 flex justify-between items-start">
              <div>
                <div className="text-sm">दिनांक: <span className="font-bold">{formatDate(file.file_date) || '________'}</span></div>
                <div className="text-sm mt-1">ठिकाण: <span className="font-bold">{file.village || '________'}</span></div>
              </div>
            </div>
          </div>
          {/* Signatures Section */}
          <div className="px-1 py-3 mt-8 flex justify-between" style={{fontSize: "11px"}}>

            <div className="flex flex-col border border-black p-3 h-32 w-48">
              <div className="h-16 flex-1" />
              <div className="text-xs border-t-2 border-black pt-1 text-center leading-normal">
                <div>सेल्स इंजिनियर</div>
                <div className="font-bold">{file?.company} {file?.sales_engg ? `(${file?.sales_engg})` : ''}</div>
              </div>
            </div>

            <div className="flex flex-col border border-black p-3 h-32 w-48">
              <div className="h-16 flex-1" />
              <div className="text-xs border-t-2 border-black pt-1 text-center leading-normal overflow-hidden">
                <div>विक्रेता / वितरक</div>
                <div className="font-bold truncate">{userData?.business_name}</div>
              </div>
            </div>
          </div>
          <div className=" p-4 mt-6">
            <p className="text-sm leading-relaxed">
              मी श्री/श्रीमती <span className="font-bold">{file.farmer_name || '________'}</span> गाव - <span className="font-bold">{file.village || '________'}</span> तालुका - <span className="font-bold">{file.taluka || '________'}</span> ठिबक सिंचन / तुषार सिंचन संच माझ्या शेतावरील वितरक यांनी उभारणी केली असून मी स्वत कार्यान्वित करुन खात्री केली आहे. तरी माझा प्रस्ताव अनुदानासाठी तात्काळ सादर करण्यात यावा.
            </p>

          </div>
          {/* Signatures Section */}
          <div className="px-1 py-3 mt-8 flex justify-end" style={{fontSize: "11px"}}>
            <div className="flex flex-col border border-black p-3 h-32 w-48">
              <div className="h-16 flex-1" />
              <div className="text-xs border-t-2 border-black pt-1 text-center leading-normal">
                <div>शेतकरी</div>
                <div className='font-bold'>{file?.farmer_name}</div>
              </div>
            </div>    </div>


        </div>

        {/* Page 5 - Agreement (करारनामा) */}
        <div
          className="sheet mx-auto bg-white my-6 shadow-lg border-4 border-black"
          style={{
            width: "210mm",
            height: "297mm",
            minHeight: "297mm",
            maxHeight: "297mm",
            fontSize: "10px",
            padding: "10mm",
            position: "relative",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <h2 className="text-center text-lg font-bold">परिशिष्ट - १६</h2>
          <h6 className="text-base text-center font-bold">करारनामा - (उत्पादक कंपनी किंवा त्याच्या प्रतिनिधीने शेतकऱ्या बरोबर करावयाचा)</h6>

          <div className="mt-4 text-xs leading-relaxed">
            <p>
              मी <span className="font-bold">{file?.sales_engg || '________'}</span> ठिबक/ तुषार सिंचन संच याचे राज्य शासन मान्यताप्राप्त उत्पादक मे. <span className="font-bold">{file?.company || '________'}</span> यांचे अधिकृत प्रतिनिधी असून खालील नमूद केलेल्या शेतकर्‍याच्या शेतावर ठिबक / तुषार सिंचन संच पुरवला आहे व तो दिनांक <span className="font-bold">{formatDate(file?.file_date) || '________'}</span> रोजी कार्यान्वित करून दिला आहे.
            </p>

            <div className="mt-3 space-y-1">
              <p>१) शेतकऱ्याचे नाव: <span className="font-bold">{file?.farmer_name || '________'}</span> गाव: <span className="font-bold">{file?.village || '________'}</span> तालुका: <span className="font-bold">{file?.taluka || '________'}</span> जिल्हा: <span className="font-bold">{file?.district || '________'}</span></p>
              <p>२) पिकाचे नाव: <span className="font-bold">{file?.crop_name || '________'}</span> ठिबक खालील क्षेत्र- <span className="font-bold">{file?.irrigation_area || '________'}</span> हेक्टर गट नंबर: <span className="font-bold">{file?.gut_no || file?.survey_no || '________'}</span></p>
              <p>३) बिल क्रमांक- <span className="font-bold">{billData?.bill_no || '________'}</span> तारीख- <span className="font-bold">{formatDate(billData?.bill_date) || '________'}</span> रक्कम रुपये- <span className="font-bold">{billData?.items?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toFixed(2) || '________'}</span></p>
            </div>

            <ol className="list-decimal ml-4 mt-3 space-y-1">
              <li>मी उत्पादक कंपनीच्या वतीने आम्ही घेतो की पुरवलेल्या ठिबक तुषार सिंचन संच यातील सर्व साहित्य कृषी आयुक्त यांनी ठरवून दिलेल्या निकषानुसार योग्य दर्जाचे चा आहे.</li>
              <li>जमिनीचा उतार मातीचा प्रकार, खोली, पाण्याची क्षारता, जमिनीचा सामू, माती परीक्षण अहवाल इत्यादी तांत्रिक बाबी तपासून संच बसवण्याचा आराखडा तयार करण्यात आला आहे. ठिबक सिंचन संच व्यवस्थित कार्यान्वित राहण्यास कोणतीही तांत्रिक चूक राहिलेली नाही.</li>
              <li>बसवलेल्या ठिबक सिंचन संचाची तपासणी केली असून सर्व ठिकाणी समान दाबाने पाणी मिळत आहे.</li>
              <li>संच बसवलेले साहित्य बी.आय.एस मार्कचे व माननीय आयुक्त कृषी यांच्याकडे माझ्या कंपनीने दिलेल्या मेकचे आहे.</li>
              <li>शेतकऱ्यास ठिबक तुषार सिंचन संच कसा चालवायचा याबाबतचे प्रशिक्षण दिनांक- <span className="font-bold">{formatDate(file?.file_date) || '________'}</span> रोजी दिली आहे संच व्यवस्थित कार्यान्वित राहण्यासाठी शेतकऱ्याच्या शेतात नियमित भेटी देण्यात येतील तसेच विक्री नंतरची सेवा देण्यात येईल.</li>
              <li>संच तीन वर्षाच्या कालावधीत व्यवस्थित कार्यान्वित राहण्यासाठी कंपनी कडील तांत्रिक प्रतिनिधी शेतकर्‍यांच्या शेतात तीन वर्षापर्यंत शेतकर्‍यांच्या मागणीनुसार व आवश्यकतेनुसार नियमित भेट देण्यात येतील. तसेच उत्पादक कंपनी मार्फत जिल्हा करता जे विक्रीपश्चात सेवा केंद्र सुरू केले आहे त्या मार्फत विक्री नंतरची मोफत सेवा देण्यात येईल</li>
              <li>शेतकर्याची संच चालवण्याबाबत ची तक्रार मला प्राप्त झाल्यास माझ्याकडील प्रतिनिधी तक्रार मिळाल्याच्या सात दिवसाच्या आत प्रत्यक्ष शेतावर भेट देऊन शेतकऱ्यांची अडचण सात दिवसाच्या आत सोडण्यात येईल.</li>
              <li>ठिबक/ तुषार सिंचन संच कसा चालवावा प्रत्येक घटकाची कोणती निगा राखावी याबाबतची माहिती असलेली मराठी पुस्तिका शेतकऱ्यास संच कार्यान्वित झाला त्यावेळी दिली आहे.</li>
              <li>मी सदर ठिबक / तुषार सिंचन संच याचा कोणताही घटक तांत्रिक दृष्टीने खराब झाला असेल तर तो तीन वर्षाच्या कालावधीपर्यंत कंपनी बदलून दिली (परफॉर्मन्स गॅरंटी) या कालावधीत आराखड्‌यात दोष असल्याच्या कारणामुळे किंवा इतर तांत्रिक कारणामुळे संच नाकाम झाल्यास मी शेतकऱ्यास संचाची किंमत परत करण्यास बांधील आहे.</li>
              <li>संच कार्यान्वित केलेल्या दिवसापासून संचाची देखभाल व निगा राखण्याच्या संदर्भात तीन रासायनिक प्रक्रिया (आम्ल व क्लोरिन) मोफत देणे करून देण्यात येतील.</li>
            </ol>

            <h4 className="font-bold mt-0 text-center">या मुदतीत लाभार्थी शेतकऱ्यांची जबाबदारी खालील प्रमाणे राहील</h4>
            <ol className="list-decimal ml-4 mt-1 text-xs ">
              <li>दिलेल्या सूचनांनुसार फिल्टरची वेळोवेळी व नियमित स्वच्छता करणे.</li>
              <li>संपूर्ण संचाचे नियमितपणे फ्लशिंग करेल.</li>
              <li>जमिनीची वाफसा स्थिती कायम योग्य राहण्यासाठी दिलेल्या सूचना प्रमाणे चालवणे.</li>
              <li>संचाची योग्य निगा व जोपासना राखण्यास संदर्भात संबंधित उत्पादकांनी दिलेल्या तांत्रिक सूचनेचे योग्य पालन करणे.</li>
              <li>शेवाळ क्षार इत्यादी कारणांमुळे ड्रीपर ई मीटर बंद होऊ नयेत यासाठी उत्पादकांनी सुचवल्याप्रमाणे क्लोरीन व आम्ल प्रक्रिया करणे.</li>
            </ol>

            <p className="mt-1">
              वरील प्रमाणे उत्पादक व लाभार्थी शेतकऱ्यांमध्ये जवाबदारी पार पडताना वाद निर्माण झाल्यास माननीय आयुक्त कृषी यांचा निर्णय अंतिम व संबंधितावर बंधनकारक राहील. माननीय आयुक्त यांचे निर्णयाशी समाधान न झाल्यास दोन्ही पक्षाला तक्रारीचे निराकरण करण्याकरता ग्राहक मंच किंवा इतर न्याय कार्यप्रणाली वापरण्याचा अधिकार राहील.
            </p>

            <div className="mt-1 flex justify-between">
              <div>
                <p>स्थळ - <span className="font-bold">{file?.village || '________'}</span></p>
                <p>दिनांक - <span className="font-bold">{formatDate(file?.file_date) || '________'}</span></p>
              </div>
            </div>

          {/* Signatures Section */}
          <div className="px-1 pt-1 mt-0 flex justify-between" style={{fontSize: "11px"}}>

            <div className="flex flex-col border border-black p-3 h-30 w-64">
              <div className="h-10 flex-1" />
              <div className="text-xs border-t-2 border-black pt-1 text-center leading-normal">
                <div>सेल्स इंजिनियर - {file?.company} {file?.sales_engg ? `(${file?.sales_engg})` : ''}</div>
              </div>
            </div>

            <div className="flex flex-col border border-black p-3 h-30 w-64">
              <div className="h-16 flex-1" />
              <div className="text-xs border-t-2 border-black pt-1 text-center leading-normal">
                <div>शेतकरी</div>
                <div className='font-bold'>{file?.farmer_name}</div>
              </div>
            </div> 
          </div>

            {/* Witnesses */}
              <div className="mt-1">
                <div className="text-sm font-bold mb-0">साक्षीदार -</div>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <div className=" py-1">१) <span className="font-bold"> {file?.w1_name || '________'}, </span>  स्वाक्षरी : '______________'</div>
                    <div className=" py-0 mt-0">पत्ता: <span className="font-bold"> {file?.w1_village || '________'}</span>, तालुका : <span className="font-bold">{file?.w1_taluka || '________'}</span> जिल्हा : <span className="font-bold">{file?.w1_district || '________'}</span></div>
                  </div>
                  <div>
                    <div className=" py-1">२) <span className="font-bold"> {file?.w2_name || '________'}, </span>  स्वाक्षरी : '______________'</div>
                    <div className=" py-0 mt-0">पत्ता: <span className="font-bold">{file?.w2_village || '________'}</span>, तालुका : <span className="font-bold">{file?.w2_taluka || '________'}</span> जिल्हा : <span className="font-bold">{file?.w2_district || '________'}</span></div>
                  </div>
                </div>
              </div>
          </div>
        </div>

        {/* Page 6+ - Bill Invoice (using shared BillInvoice component) - supports multi-page */}
        <div 
          className="bill-section mx-auto bg-white shadow-lg border-4 border-black"
          style={{
            width: "210mm",
            minHeight: "297mm",
            height: "auto",
            margin: "15px auto",
            padding: "0",
            position: "relative",
            boxSizing: "border-box",
          }}
        >
          <BillInvoice 
            bill={billData} 
            fileData={file} 
            userData={userData} 
            id="file-bill-content"
            showWatermark={true}
            embedded={true}
            autoHeight={true}
          />
        </div>
      </div>

      {/* Action Buttons - Bottom Fixed */}
      <div className="no-print fixed bottom-6 right-6 flex gap-2" style={{ zIndex: 50 }}>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 font-semibold text-sm"
        >
          🖨️ Print File
        </button>
        <button
          onClick={() => router.push("/files")}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow-lg hover:bg-gray-700 font-semibold text-sm"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

export default function FilePrintPage({ params }) {
  return (
    <ProtectedRoute>
      <FilePrintPageContent params={params} />
    </ProtectedRoute>
  );
}
