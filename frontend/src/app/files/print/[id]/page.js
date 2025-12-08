'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/utils';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getCurrentUser } from '@/lib/utils';

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
        canvasDataUrl = canvasElement.toDataURL('image/png');
      } catch (err) {
        console.error('Error capturing canvas:', err);
      }
    }

    const fileElement = document.getElementById('file-content');
    const clonedFile = fileElement.cloneNode(true);

    // Replace canvas with image in clone
    const canvasContainer = clonedFile.querySelector('#farm-map-canvas');
    if (canvasContainer && canvasDataUrl) {
      canvasContainer.innerHTML = `<img src="${canvasDataUrl}" style="width: 100%; height: 100%; object-fit: contain; display: block;" />`;
    }

    // Function to copy all computed styles as inline styles
    const copyComputedStyles = (source, target) => {
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
          copyComputedStyles(source.children[i], target.children[i]);
        }
      }
    };

    // Apply all computed styles as inline styles
    copyComputedStyles(fileElement, clonedFile);

    // Override styles on each sheet to ensure proper A4 sizing
    const sheets = clonedFile.querySelectorAll('.sheet');
    sheets.forEach((sheet) => {
      sheet.style.cssText = `
        width: 210mm;
        height: 297mm;
        min-height: 297mm;
        max-height: 297mm;
        margin: 15px 15px;
        padding: 10mm;
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
    }
  </style>
</head>
<body>
  ${clonedFile.outerHTML}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
    window.onafterprint = function() {
      window.close();
    };
    window.addEventListener('focus', function() {
      setTimeout(function() {
        window.close();
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
            
            if (billListResult.success && billListResult.bills && billListResult.bills.length > 0) {
              const linkedBillId = billListResult.bills[0].bill_id;
              const billRes = await fetch(`${API}/api/bills/${linkedBillId}`);
              const billData = await billRes.json();
              
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
                <div className="flex-1 font-bold text-base border-b border-black px-2 py-1">{file.area_8a || 'N/A'} हेक्टर</div>
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
            padding: "15mm",
            position: "relative",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <div className="text-center">
            <h2 className="text-lg font-bold">शेती नकाशा / विहंगावलोकन</h2>
          </div>

          <div className="mt-4">
            <div className="border border-black p-2 flex items-center justify-center" style={{ height: "190mm" }}>
              <div id="farm-map-canvas" className="w-full h-full flex items-center justify-center">
                <FarmMapCanvas shapes={shapes} />
              </div>
            </div>
          </div>

          <div className="text-xs mt-3">नकाशावर उत्तरे-बिंदू, पाणी पुरवठा आणि शेतीच्या सीमारेषा स्पष्ट दाखवा.</div>
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
          <h2 className="text-center text-lg font-bold">पूर्णत्वाची घोषणपत्र</h2>

          <div className="border border-black p-4 mt-4">
            <p className="text-sm">मी/आम्ही खाली स्वाक्षर करणारे, वरील आराखडा व दस्तऐवज येथे सादर करतो/करतो. सर्व माहिती आणि संलग्न कागदपत्रे खरी व समर्थनीय आहेत.</p>

            <div className="mt-6 flex justify-between items-end">
              <div>
                <div className="text-xs font-bold">दिनांक:</div>
                <div className="border-b border-black w-40 py-1">{formatDate(file.file_date) || 'N/A'}</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold mb-2">विक्रेता / कंपनीचे नाव</div>
                <div className="border-b border-black w-56 py-1">{file.company || 'N/A'}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold mb-2">स्वाक्षरी (प्रोप्रायटेअर / अधिकारी)</div>
                <div className="border border-black w-32 h-20 bg-white ml-auto"></div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-bold mb-3">बिल तपशील:</h3>
            <div className="border border-black p-4">
              <div className="flex gap-2 items-center mb-2">
                <div className="font-bold w-28">बिल क्रमांक:</div>
                <div className="flex-1 border-b border-black px-2 py-1">{file.bill_no || 'N/A'}</div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="font-bold w-28">बिल दिनांक:</div>
                <div className="flex-1 border-b border-black px-2 py-1">{formatDate(file.bill_date) || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Page 5 - Terms & Conditions */}
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
          <h2 className="text-center text-lg font-bold">नियम व अटी / मार्गदर्शक सूचना</h2>

          <ol className="list-decimal ml-6 mt-4 text-sm leading-relaxed space-y-2">
            <li>योजना अंतर्गत दिलेल्या साधनांचा उपयोग केवळ नमूद केलेल्या प्रकारसाठी करावा.</li>
            <li>उत्पादनाची प्रतिष्ठा व व्यवहार नियमांनुसार ठेवावी.</li>
            <li>अनुदान मिळाल्यानंतर १२ महिन्यांपर्यंत तपासणीसाठी अधिकारी भेट देऊ शकतात.</li>
            <li>या पत्रातील चुकीची माहिती आढळल्यास अनुदान रद्द केले जाऊ शकते.</li>
            <li>सर्व कागदपत्रे योग्य प्रकारे सुरक्षित ठेवावी.</li>
          </ol>

          <div className="mt-12 flex justify-between gap-4">
            <div className="w-1/3 border-t border-black pt-2 text-center text-sm">सत्यवटीचे नाव<br />(नाम व पद)</div>
            <div className="w-1/3 border-t border-black pt-2 text-center text-sm">तपासण अधिकारी<br />(नाम व पद)</div>
            <div className="w-1/3 border-t border-black pt-2 text-center text-sm">प्राधिकृत स्वाक्षरी</div>
          </div>

          <div className="mt-12">
            <div className="border border-black p-3 text-sm bg-gray-50">
              <strong>Status:</strong> {file.status || 'N/A'}
            </div>
          </div>
        </div>

        {/* Page 6 - Bill Invoice */}
        <div
          className="sheet mx-auto bg-white shadow-lg border-4 border-black"
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
          {billData ? (
            <div className="h-full flex flex-col">
              {/* Bill Header */}
              <div className="border-b-2 border-black p-4 bg-gray-100">
                <div className="text-center mb-2">
                  <h1 className="text-2xl font-black">AGRIFILES</h1>
                  <p className="text-xs text-gray-700">Agricultural Solutions & Support Services</p>
                </div>
                <div className="text-center text-xs text-gray-700">
                  <div>Address: Plot No. XYZ, Agricultural Complex, Pune - 411005</div>
                  <div>GST No: 27AABCT1234H1Z0 | Phone: +91-9876543210</div>
                </div>
              </div>

              {/* Bill Title */}
              <div className="text-center py-3 border-b border-gray-400 bg-gray-50">
                <h2 className="text-lg font-black">TAX INVOICE / BILL</h2>
              </div>

              {/* Bill Info */}
              <div className="p-4 border-b-2 border-gray-400 flex gap-6 text-xs">
                <div className="flex-1">
                  <div className="font-bold mb-2">BILL DETAILS</div>
                  <div><strong>Bill No:</strong> {billData.bill_no || 'N/A'}</div>
                  <div><strong>Bill Date:</strong> {billData.bill_date || 'N/A'}</div>
                </div>
                <div className="flex-1">
                  <div className="font-bold mb-2">SOLD TO</div>
                  <div><strong>Name:</strong> {file.farmer_name || 'N/A'}</div>
                  <div><strong>Mobile:</strong> {file.mobile || 'N/A'}</div>
                  <div><strong>Village:</strong> {file.village || 'N/A'}</div>
                </div>
                <div className="flex-1">
                  <div className="font-bold mb-2">STATUS</div>
                  <div><strong>Status:</strong> {billData.status || 'DRAFT'}</div>
                  <div><strong>Crop:</strong> {file.crop_name || 'N/A'}</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="p-4 flex-1">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-black text-white">
                      <th className="border border-black p-2 text-left">Sr</th>
                      <th className="border border-black p-2 text-left">Description</th>
                      <th className="border border-black p-2 text-center">HSN</th>
                      <th className="border border-black p-2 text-right">Qty</th>
                      <th className="border border-black p-2 text-right">Rate</th>
                      <th className="border border-black p-2 text-center">GST%</th>
                      <th className="border border-black p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billData.items && billData.items.length > 0 ? (
                      billData.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-400 p-2 text-center">{idx + 1}</td>
                          <td className="border border-gray-400 p-2">{item.description || 'N/A'}</td>
                          <td className="border border-gray-400 p-2 text-center">{item.hsn || 'N/A'}</td>
                          <td className="border border-gray-400 p-2 text-right">{Number(item.qty || 0).toFixed(2)}</td>
                          <td className="border border-gray-400 p-2 text-right">₹ {Number(item.sales_rate || 0).toFixed(2)}</td>
                          <td className="border border-gray-400 p-2 text-center">{Number(item.gst_percent || 0).toFixed(1)}%</td>
                          <td className="border border-gray-400 p-2 text-right font-bold">₹ {Number(item.amount || 0).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="border border-gray-400 p-6 text-center text-gray-500">No items</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="mt-4 flex justify-end">
                  <div className="w-1/2">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b border-gray-400">
                          <td className="p-2 font-bold">Taxable Amount:</td>
                          <td className="p-2 text-right font-bold">₹ {Number(billData.taxable_amount || 0).toFixed(2)}</td>
                        </tr>
                        <tr className="border-b border-gray-400">
                          <td className="p-2 font-bold">Total GST:</td>
                          <td className="p-2 text-right font-bold">₹ {Number(billData.total_gst || 0).toFixed(2)}</td>
                        </tr>
                        <tr className="bg-black text-white">
                          <td className="p-3 font-bold">TOTAL AMOUNT:</td>
                          <td className="p-3 text-right font-bold text-lg">₹ {Number(billData.final_amount || 0).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-black p-3 text-center text-xs text-gray-500">
                Thank you for your business | This is a computer-generated document
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center flex-col gap-4">
              <div className="text-5xl">⚠️</div>
              <h2 className="text-xl font-bold text-red-600">No Bill Linked</h2>
              <p className="text-sm text-gray-500 text-center">
                This file does not have a linked bill.<br />
                Please link a bill to this file first before printing.
              </p>
              <div className="border border-black p-4 bg-yellow-50 mt-4">
                <strong>Instructions:</strong>
                <ol className="list-decimal ml-5 text-sm mt-2">
                  <li>Go back to the files list</li>
                  <li>Click "Link Bill" for this file</li>
                  <li>Select or create a bill</li>
                  <li>Return here to print with bill details</li>
                </ol>
              </div>
            </div>
          )}
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
