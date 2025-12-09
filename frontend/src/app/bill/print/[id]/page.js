'use client';
import { useEffect, useState } from 'react';
import { API_BASE, getCurrentUser } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

// Convert number to words (Indian English)
function numberToWords(num) {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  
  if (num === 0) return 'zero';
  
  function convert(n) {
    if (n === 0) return '';
    else if (n < 10) return ones[n];
    else if (n < 20) return teens[n - 10];
    else if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    else if (n < 1000) return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    else if (n < 100000) return convert(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    else if (n < 10000000) return convert(Math.floor(n / 100000)) + ' lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    else return convert(Math.floor(n / 10000000)) + ' crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }
  
  return convert(Math.floor(num));
}

function BillPrintContent({ params }) {
    const router = useRouter();
  const API = API_BASE;
  const [bill, setBill] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [routeId, setRouteId] = useState(null);
  const [userData, setUserData] = useState(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=1200');

    if (!printWindow) {
      alert('Please disable popup blocker and try again');
      return;
    }

    const billElement = document.getElementById('bill-content');
    const clonedBill = billElement.cloneNode(true);

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
    copyComputedStyles(billElement, clonedBill);
    
    // Override the bill container to ensure proper A4 sizing and centering
    clonedBill.style.cssText = `
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      padding: 8px;
      background: white;
      font-size: 11px;
      box-sizing: border-box;
    `;

    // Generate filename from farmer name and bill number
    const farmerName = fileData?.farmer_name || bill.farmer_name || 'Customer';
    const billNo = bill.bill_no || 'Bill';
    const fileName = `${farmerName}_${billNo}`.replace(/[^a-zA-Z0-9\u0900-\u097F_-]/g, '_');

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${fileName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      margin: 0; 
      padding: 20px; 
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
    }
    #bill-content {
      width: 210mm !important;
      height: 297mm !important;
      margin: 0 auto !important;
      background: white !important;
      box-shadow: 0 0 10px rgba(0,0,0,0.2);
    }
    @page { size: A4 portrait; margin: 0; }
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      html, body { 
        margin: 0; 
        padding: 0; 
        background: white;
        display: block;
      }
      #bill-content {
        box-shadow: none !important;
        margin: 0 !important;
      }
    }
  </style>
</head>
<body>
  ${clonedBill.outerHTML}
  <script>
    window.onload = function() { 
      setTimeout(function() { 
        window.print(); 
      }, 300); 
    };
    // Auto close after print (whether printed or cancelled)
    window.onafterprint = function() {
      window.close();
    };
    // Fallback: close window if user cancels or after print dialog
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

  // Fetch user data from localStorage using utility function
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUserData(user);
      console.log('User data loaded:', user);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = params && typeof params.then === 'function' ? await params : params;
        if (!mounted) return;
        setRouteId(p?.id ?? null);
      } catch (e) {
        console.error('Failed to resolve params', e);
      }
    })();
    return () => { mounted = false; };
  }, [params]);

  // Fetch bill and linked file data
  useEffect(() => {
    if (!routeId) return;
    let mounted = true;
    (async () => {
      try {
        // Fetch bill
        const billRes = await fetch(`${API}/api/bills/${routeId}`);
        const billText = await billRes.text();
        const billData = JSON.parse(billText || '{}');
        if (!mounted) return;
        
        const billObj = billData.bill || null;
        setBill(billObj);
        console.log('Bill data loaded for print:', billObj);

        // If bill is linked to a file, fetch file details
        if (billObj && billObj.file_id) {
          try {
            const fileRes = await fetch(`${API}/api/files/${billObj.file_id}`);
            const fileText = await fileRes.text();
            const fileRespData = JSON.parse(fileText || '{}');
            if (mounted && fileRespData.success) {
              setFileData(fileRespData.file || null);
              console.log('File data loaded for bill print:', fileRespData.file);
            }
          } catch (err) {
            console.error('Failed to fetch file data:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching bill:', err);
      }
    })();
    return () => { mounted = false; };
  }, [routeId, API]);

  if (!bill) return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-gray-600">Loading bill...</div>
    </div>
  );

  // Compute totals
  const items = Array.isArray(bill.items) ? bill.items : [];
  let taxableAmount = 0;
  let totalGst = 0;
  
  items.forEach(item => {
    const itemAmount = Number(item.amount || 0);
    taxableAmount += itemAmount;
    const gst = (Number(item.gst_percent || 0) / 100) * itemAmount;
    totalGst += gst;
  });
  
  taxableAmount = Math.round(taxableAmount * 100) / 100;
  totalGst = Math.round(totalGst * 100) / 100;
  const finalAmount = Math.round((taxableAmount + totalGst) * 100) / 100;
  
  // Group items by GST percentage
  const gstGroups = {};
  items.forEach(item => {
    const gstPercent = Number(item.gst_percent || 0);
    const itemAmount = Number(item.amount || 0);
    const gstAmount = (gstPercent / 100) * itemAmount;
    
    if (!gstGroups[gstPercent]) {
      gstGroups[gstPercent] = {
        gstPercent,
        taxableAmount: 0,
        gstAmount: 0
      };
    }
    gstGroups[gstPercent].taxableAmount += itemAmount;
    gstGroups[gstPercent].gstAmount += gstAmount;
  });
  
  // Convert to array and sort by GST %
  const gstGroupsArray = Object.values(gstGroups).sort((a, b) => a.gstPercent - b.gstPercent);
  
  // Determine bill type: TAX INVOICE if any item has GST > 0, else BILL OF SUPPLY
  const hasGst = items.some(item => Number(item.gst_percent || 0) > 0);
  const billType = hasGst ? 'TAX INVOICE' : 'BILL OF SUPPLY';
  const billHeader = hasGst ? '' : '*COMPOSITION TAXABLE PERSON, NOT ELIGIBLE TO COLLECT TAX ON SUPPLIES*';
  
  const amountInWords = numberToWords(Math.floor(finalAmount)) + ' rupees';

  return (

    <div
  className="bg-gray-100 min-h-screen p-0 m-0"
  style={{ backgroundColor: "#f5f5f5", padding: "20px 0" }}
>
  {/* A4 Page */}
  <div
    id="bill-content"
    className="mx-auto bg-white"
    style={{
      width: "210mm",
      height: "297mm",
      margin: "20px auto",
      boxShadow: "0 0 10px rgba(0,0,0,0.2)",
      fontSize: "11px",
      padding: "8px",
      position: "relative",
    }}
  >
    {/* Watermark Logo */}
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        opacity: 0.15,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <img
        src="/logo-full.png"
        alt="Watermark"
        style={{
          width: "400px",
          height: "auto",
        }}
      />
    </div>

    {/* ================= HEADER ================= */}
    <div className="border-b-2 border-black px-3 py-2 bg-gray-100" style={{ position: "relative", zIndex: 1 }}>
      {/* Top Row: Firm Name | Authorized Dealer For */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="font-black text-3xl tracking-wide text-gray-900 mb-1">{userData?.business_name}</div>
          <div className="font-bold text-[11px] leading-tight text-gray-800 mb-1">
            तालुका : {userData?.taluka} जिल्हा :  {userData?.district}<br/>
            ईमेल : {userData?.email } मोबाइल : {userData?.mobile}
          </div>
          <div className="font-bold text-[11px] text-gray-800">GST क्रमांक - {userData?.gst_no}</div>
        </div>
        <div className="text-right leading-tight">
          <div className="font-bold text-[9px] text-gray-800 mb-1">AUTHORISED DEALER FOR-</div>
          <div className="font-bold text-[13px] text-gray-900 mb-1">{fileData?.company || "____________________"}</div>
          <div className="font-bold text-[11px] text-gray-800">राज्य : {userData?.gst_state }</div>
        </div>
      </div>

      {/* BILL OF SUPPLY title */}
      <div className="border-b-2 border-t-2 border-black mt-2 py-1.5 text-center bg-white">
        <div className="font-black text-2xl tracking-widest text-gray-900 mb-0.5">{billType}</div>
        <div className="text-[8px] font-semibold text-gray-700">{billHeader}</div>
      </div>

      {/* Farmer/Client details - IMPROVED LAYOUT */}
      <div className="mt-2 border-1 border-black p-2" style={{fontSize: "10px"}}>
        {/* Row 1: Aadhar and Applicant Name */}
        <div className="grid grid-cols-3 gap-3 mb-1">
          <div>
            <div className="font-bold text-[8px] text-gray-700">आधार नंबर</div>
            <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.aadhaar_no || "____________________"}</div>
          </div>
          <div className="col-span-2">
            <div className="font-bold text-[8px] text-gray-700">ग्राहकाचे नाव</div>
            <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.farmer_name || bill.farmer_name || "____________________"}</div>
          </div>
        </div>

        {/* Row 2: Mobile and Farmer/Client ID */}
        <div className="grid grid-cols-3 gap-3 mb-1">
          <div>
            <div className="font-bold text-[8px] text-gray-700">मोबाइल नंबर</div>
            <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.mobile || bill.farmer_mobile || "____________________"}</div>
          </div>
          <div className="col-span-2">
            <div className="font-bold text-[8px] text-gray-700">शेतकरी ओळख क्रमांक </div>
            <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.farmer_id || "____________________"}</div>
          </div>
        </div>

        {/* Row 3: Village, Taluka, District (single line) */}
        <div className="grid grid-cols-3 gap-3 mb-1">
          <div>
            <div className="font-bold text-[8px] text-gray-700">गाव</div>
            <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.village || "आठेगॉन "}</div>
          </div>
          <div>
            <div className="font-bold text-[8px] text-gray-700">तालुका</div>
            <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.taluka || "____________________"}</div>
          </div>
          <div>
            <div className="font-bold text-[8px] text-gray-700">जिल्हा</div>
            <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.district || "____________________"}</div>
          </div>
        </div>

        {/* Row 4: Area, Crop, Application ID */}
        <div className="grid grid-cols-3 gap-3 mb-1">
          <div>
            <div className="font-bold text-[8px] text-gray-700">क्षेत्रफळ (हेक्टर)</div>
            <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.area8a || "____________________"}</div>
          </div>
          <div>
            <div className="font-bold text-[8px] text-gray-700">पीकाचे नाव</div>
            <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.crop_name || bill?.crop_name || "____________________"}</div>
          </div>
          <div>
            <div className="font-bold text-[8px] text-gray-700">अर्ज क्रमांक</div>
            <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.application_id || "____________________"}</div>
          </div>
        </div>

        {/* Row 5: Drip Area and Lateral Distance */}
        <div className="grid grid-cols-3 gap-3 mb-1">
          <div>
            <div className="font-bold text-[8px] text-gray-700">ड्रिप क्षेत्र</div>
            <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.irrigation_area || "____________________"}</div>
          </div>
          <div>
            <div className="font-bold text-[8px] text-gray-700">लॅटरल अंतर</div>
            <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.lateral_spacing || "____________________"}</div>
          </div>
          <div>
            <div className="font-bold text-[8px] text-gray-700">बिल क्रमांक / दिनांक</div>
            <div className="border-b border-black py-0.5 text-[11px] font-semibold">{bill?.bill_no || "N/A"} / {bill?.bill_date ? new Date(bill.bill_date).toLocaleDateString("en-IN") : "N/A"}</div>
          </div>
        </div>
      </div>
    </div>

    {/* ================= ITEMS TABLE ================= */}
    <div className="px-1 my-3 pt-0.5" style={{ position: "relative", zIndex: 1 }}>
      <table className="w-full border border-black border-collapse" style={{fontSize: "10px"}}>
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-black px-0.5 py-0.5 text-center w-6">SR.</th>
            <th className="border border-black px-0.5 py-0.5 text-left">DESCRIPTION OF GOODS</th>
            <th className="border border-black px-0.5 py-0.5 text-center w-10">HSN</th>
            <th className="border border-black px-0.5 py-0.5 text-center w-12">BATCH NO.</th>
            <th className="border border-black px-0.5 py-0.5 text-center w-10">CML NO.</th>
            <th className="border border-black px-0.5 py-0.5 text-center w-8">SIZE</th>
            <th className="border border-black px-0.5 py-0.5 text-center w-10">QUANTITY</th>
            <th className="border border-black px-0.5 py-0.5 text-center w-12">GOVT RATE</th>
            <th className="border border-black px-0.5 py-0.5 text-center w-12">SALES RATE</th>
            <th className="border border-black px-0.5 py-0.5 text-center w-8">UNIT</th>
            <th className="border border-black px-0.5 py-0.5 text-center w-8">GST</th>
            <th className="border border-black px-0.5 py-0.5 text-right w-12">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="border border-black px-0.5 py-0.5 text-center">{idx + 1}</td>
              <td className="border border-black font-bold px-0.5 py-0.5">{item.description || "N/A"}</td>
              <td className="border border-black px-0.5 py-0.5 text-center">{item.hsn || ""}</td>
              <td className="border border-black px-0.5 py-0.5 text-center">{item.batch_no || ""}</td>
              <td className="border border-black px-0.5 py-0.5 text-center">{item.cml_no || ""}</td>
              <td className="border border-black px-0.5 py-0.5 text-center">{item.size || ""}</td>
              <td className="border border-black px-0.5 py-0.5 text-center">{Number(item.qty || 0).toFixed(2)}</td>
              <td className="border border-black px-0.5 py-0.5 text-right">{item.gov_rate ? Number(item.gov_rate).toFixed(2) : ""}</td>
              <td className="border border-black px-0.5 py-0.5 text-right">{Number(item.sales_rate || 0).toFixed(2)}</td>
              <td className="border border-black px-0.5 py-0.5 text-center">{item.uom || "NO"}</td>
              <td className="border border-black px-0.5 py-0.5 text-center">{Number(item.gst_percent || 0).toFixed(1)}%</td>
              <td className="border border-black px-0.5 py-0.5 text-right pr-0.5 font-semibold">{Number(item.amount || 0).toFixed(2)}</td>
            </tr>
          ))}
          {Array.from({ length: Math.max(0, 7 - items.length) }).map((_, i) => (
            <tr key={`empty-${i}`} className="h-4">
              <td className="border border-black" />
              <td className="border border-black" />
              <td className="border border-black" />
              <td className="border border-black" />
              <td className="border border-black" />
              <td className="border border-black" />
              <td className="border border-black" />
              <td className="border border-black" />
              <td className="border border-black" />
              <td className="border border-black" />
              <td className="border border-black" />
              <td className="border border-black" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* ================= TOTALS SECTION ================= */}
    <div className="px-1 pt-0.5 grid grid-cols-2 gap-1" style={{ position: "relative", zIndex: 1 }}>
      {/* Left: GST Summary */}
      <div>
        <table className="w-full border border-black border-collapse" style={{fontSize: "9px"}}>
          <tbody>
            <tr>
              <td className="border border-black px-0.5 py-0.5 font-bold w-12">GST %</td>
              <td className="border border-black px-0.5 py-0.5 font-bold text-right">TAX. AMOUNT</td>
              <td className="border border-black px-0.5 py-0.5 font-bold text-right">CGST</td>
              <td className="border border-black px-0.5 py-0.5 font-bold text-right">SGST</td>
              <td className="border border-black px-0.5 py-0.5 font-bold text-right">TOTAL</td>
            </tr>
            {gstGroupsArray.map((group, idx) => (
              <tr key={idx}>
                <td className="border border-black px-0.5 py-0.5 text-center">{group.gstPercent.toFixed(1)}%</td>
                <td className="border border-black px-0.5 py-0.5 text-right">{group.taxableAmount.toFixed(2)}</td>
                <td className="border border-black px-0.5 py-0.5 text-right">{(group.gstAmount / 2).toFixed(2)}</td>
                <td className="border border-black px-0.5 py-0.5 text-right">{(group.gstAmount / 2).toFixed(2)}</td>
                <td className="border border-black px-0.5 py-0.5 text-right font-bold">{(group.taxableAmount + group.gstAmount).toFixed(2)}</td>
              </tr>
            ))}
            {/* Total row if multiple GST groups */}
            {gstGroupsArray.length > 1 && (
              <tr className="bg-gray-100">
                <td className="border border-black px-0.5 py-0.5 text-center font-bold">TOTAL</td>
                <td className="border border-black px-0.5 py-0.5 text-right font-bold">{taxableAmount.toFixed(2)}</td>
                <td className="border border-black px-0.5 py-0.5 text-right font-bold">{(totalGst / 2).toFixed(2)}</td>
                <td className="border border-black px-0.5 py-0.5 text-right font-bold">{(totalGst / 2).toFixed(2)}</td>
                <td className="border border-black px-0.5 py-0.5 text-right font-bold">{finalAmount.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Right: Total/Rounded/Grand Total */}
      <div>
        <table className="w-full border border-black border-collapse" style={{fontSize: "9px"}}>
          <tbody>
            <tr>
              <td className="border border-black px-0.5 py-0.5 font-bold">TOTAL</td>
              <td className="border border-black px-0.5 py-0.5 text-right font-bold">{finalAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="border border-black px-0.5 py-0.5 font-bold">ROUNDED</td>
              <td className="border border-black px-0.5 py-0.5 text-right font-bold">{(Math.round(finalAmount) - finalAmount).toFixed(2)}</td>
            </tr>
            <tr>
              <td className="border border-black px-0.5 py-0.5 font-bold">GRAND TOTAL</td>
              <td className="border border-black px-0.5 py-0.5 text-right font-bold text-base">{Math.round(finalAmount).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    {/* Amount in words */}
    <div className="px-1 border border-black my-1 py-2" style={{fontSize: "11px", position: "relative", zIndex: 1}}>
      <span className="font-bold">AMOUNT IN WORDS - </span><span> {amountInWords.toUpperCase()} ONLY</span>
    </div>

    {/* ================= SIGNATURES ================= */}
    <div className="px-1 py-3 mt-3 grid grid-cols-3 gap-4" style={{fontSize: "11px", position: "relative", zIndex: 1}}>
      <div className="flex flex-col border border-black p-3 h-32">
        <div className="h-16 flex-1" />
        <div className="text-[12px] border-t-2 border-black pt-1 text-center leading-normal font-bold">
          <div>ग्राहक</div>
          <div className="text-[9px]">{fileData?.farmer_name}</div>
        </div>
      </div>

      <div className="flex flex-col border border-black p-3 h-32">
        <div className="h-16 flex-1" />
        <div className="text-[12px] border-t-2 border-black pt-1 text-center leading-normal font-bold">
          <div>सेल्स इंजिनियर </div>
          <div className="text-[9px]"> {fileData?.company} {fileData?.sales_engg ? `(${fileData?.sales_engg})` : ''} </div>
        </div>
      </div>

      <div className="flex flex-col border border-black p-3 h-32">
        <div className="h-16 flex-1" />
        <div className="text-[12px] border-t-2 border-black pt-1 text-center leading-normal font-bold overflow-hidden">
          <div>मालक / विक्रेता</div>
          <div className="text-[8px] truncate">{userData?.business_name}</div>
        </div>
      </div>
    </div>
  </div>

  {/* Print / Edit / Back buttons */}
  <div
    className="fixed bottom-6 right-6 flex gap-2"
    style={{ display: "flex", zIndex: 50 }}
  >
    <button
      onClick={handlePrint}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 font-semibold text-sm"
    >
      🖨️ Print Bill
    </button>
    <button
      onClick={() => router.push(`/bill/${bill.bill_id}`)}
      className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-lg hover:bg-yellow-600 font-semibold text-sm"
    >
      ✏️ Edit Bill
    </button>
    <button
      onClick={() => router.push("/bill")}
      className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow-lg hover:bg-gray-700 font-semibold text-sm"
    >
      ← Back
    </button>
  </div>
</div>

  );
}

export default function BillPrint({ params }) {
  return (
    <ProtectedRoute>
      <BillPrintContent params={params} />
    </ProtectedRoute>
  );
}
