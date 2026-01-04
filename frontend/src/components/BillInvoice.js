'use client';

import { formatBillNo } from '@/lib/utils';

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

/**
 * BillInvoice - Shared bill invoice component
 * @param {Object} props
 * @param {Object} props.bill - Bill data object with items, bill_no, bill_date, etc.
 * @param {Object} props.fileData - Linked file data (farmer details, area, etc.)
 * @param {Object} props.userData - Current user/business data
 * @param {string} props.id - Optional id for the container div (default: "bill-content")
 * @param {boolean} props.showWatermark - Whether to show watermark (default: true)
 * @param {boolean} props.embedded - If true, uses 100% width/height instead of fixed A4 size (default: false)
 * @param {boolean} props.autoHeight - If true, allows content to grow beyond single page (default: false)
 * @param {string} props.displayBillNo - Formatted bill number for display (optional, defaults to bill.bill_no)
 */
export default function BillInvoice({ bill, fileData, userData, id = "bill-content", showWatermark = true, embedded = false, autoHeight = false, displayBillNo = null }) {
  if (!bill) {
    return (
      <div className="h-full flex items-center justify-center flex-col gap-4">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-xl font-bold text-red-600">No Bill Data</h2>
        <p className="text-sm text-gray-500 text-center">
          Bill data is not available.
        </p>
      </div>
    );
  }

  // Use displayBillNo if provided, otherwise format bill_no internally
  // If displayBillNo not provided and we have bill_no + bill_date, format it
  let billNoDisplay = displayBillNo;
  if (!billNoDisplay && bill?.bill_no) {
    // Format the bill number if not already provided
    billNoDisplay = formatBillNo(bill.bill_no, bill.bill_date) || bill.bill_no;
  }
  billNoDisplay = billNoDisplay || "N/A";
  
  // Get items from bill - could be bill.items or bill.billItems
  const items = bill?.items || bill?.billItems || [];
  
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

  // Determine height based on props
  const getHeight = () => {
    if (autoHeight) return 'auto';
    if (embedded) return '100%';
    return '297mm';
  };

  return (
    <div
      id={id}
      className={`bill-invoice-container ${embedded ? "bg-white" : "mx-auto bg-white"}`}
      style={{
        width: embedded ? "100%" : "210mm",
        minHeight: autoHeight ? "297mm" : undefined,
        height: autoHeight ? "auto" : (embedded ? "100%" : "297mm"),
        margin: embedded ? "0" : "0 auto",
        fontSize: "11px",
        padding: embedded ? "5mm" : "8px",
        paddingBottom: autoHeight ? "15mm" : undefined,
        position: "relative",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Watermark Logo */}
      {showWatermark && (
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
      )}

      {/* ================= HEADER ================= */}
      <div className="border-b-2 border-\[#8B6F47\] px-3 py-2" style={{ position: "relative", zIndex: 1, backgroundColor: "linear-gradient(135deg, #FAF3EB 0%, #F5E6D3 50%, #E8D4BF 100%)" }}>
        {/* Top Row: Firm Name | Authorized Dealer For */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="font-black text-3xl tracking-wide mb-1" style={{ color: "#5D4037" }}>{userData?.business_name}</div>
            <div className="font-bold text-[11px] leading-tight mb-1  flex justify-center" style={{ color: "#334155"  , backgroundColor: "#FDFAF3" }}>
             {userData?.short_address} तालुका : {userData?.taluka}, जिल्हा :  {userData?.district},<br/>
              ई-मेल : {userData?.email } मोबाइल : {userData?.mobile}
            </div>
            <div className="font-bold text-[11px] flex justify-center m-2" style={{ color: "#8B6F47" , backgroundColor: "#FDFAF3"}}>GST क्रमांक - {userData?.gst_no}</div>
          </div>
          <div className="text-right leading-tight">
            <div className="font-bold text-[9px] mb-1" style={{ color: "#8B6F47" }}>AUTHORISED DEALER FOR-</div>
            <div className="font-bold text-[13px] mb-1" style={{ color: "#5D4037" }}>{fileData?.company || "_________"}</div>
            <div className="font-bold text-[11px]" style={{ color: "#334155" }}>राज्य : {userData?.gst_state }</div>
          </div>
        </div>

        {/* BILL OF SUPPLY title */}
        <div className="border-b-2 border-t-2 border-\[#8B6F47\] mt-2 py-1.5 text-center" style={{ backgroundColor: "#FDFAF3" }}>
          <div className="font-black text-2xl tracking-widest mb-0.5" style={{ color: "#5D4037" }}>{billType}</div>
          <div className="text-[8px] font-semibold" style={{ color: "#8B6F47" }}>{billHeader}</div>
                    <div className="text-[12px] font-semibold" style={{ color: "black" }}>Under Jurisdication of : {userData?.taluka}</div>
              <div className="font-bold text-[14px]" style={{ color: "red" }}>संच प्रकार : {fileData?.dripline_product || bill?.dripline_product || "_________"}</div>

        </div>

        {/* Farmer/Client details - IMPROVED LAYOUT */}
        <div className="mt-2 border-1 border-\[#8B6F47\] p-2" style={{fontSize: "13px", backgroundColor: "#FDFAF3"}}>
          {/* Row 1: Aadhar and Applicant Name */}
          <div className="grid grid-cols-3 gap-3 mb-1">
                        <div className="col-span-1">
              <div className="font-bold text-[11px]" style={{ color: "#334155" }}>ग्राहकाचे नाव</div>
              <div className="border-b border-\[#8B6F47\] py-0.5 text-[15px] font-semibold" style={{ color: "#334155" }}>{fileData?.farmer_name || bill.farmer_name || "_________"}</div>
            </div>
                        <div>
              <div className="font-bold text-[11px]" style={{ color: "#334155" }}> दिनांक</div>
              <div className="border-b border-\[#8B6F47\] py-0.5 text-[14px] font-semibold" style={{ color: "#334155" }}>{bill?.bill_date ? new Date(bill.bill_date).toLocaleDateString("en-IN") : "N/A"}</div>
            </div>
                                 <div>
              <div className="font-bold text-[11px]" style={{ color: "#334155" }}>बिल क्रमांक</div>
              <div className="border-b border-\[#8B6F47\] py-0.5 text-[15px] font-semibold" style={{ color: "#334155" }}>{billNoDisplay}</div>
            </div>
 

          </div>

          {/* Row 2: Mobile and Farmer/Client ID */}
          <div className="grid grid-cols-6 gap-3 mb-1">
                                    <div  className="col-span-2">
              <div className="font-bold text-[11px]" style={{ color: "#334155" }}>गाव</div>
              <div className="border-b border-\[#8B6F47\] py-0.5 text-[14px] font-semibold" style={{ color: "#334155" }}>{fileData?.village || "_________"}</div>
            </div>

    
            <div className="col-span-2">
              <div className="font-bold text-[11px]" style={{ color: "#334155" }}>मोबाइल नंबर</div>
              <div className="border-b border-\[#8B6F47\] py-0.5 text-[14px] font-semibold" style={{ color: "#334155" }}>{fileData?.mobile || bill.farmer_mobile || "_________"}</div>
            </div>
                    <div className="">
              <div className="font-bold text-[11px]" style={{ color: "#334155" }}>शेतकरी ओळख क्रमांक </div>
              <div className="border-b border-\[#8B6F47\] py-0.5 text-[14px] font-semibold" style={{ color: "#334155" }}>{fileData?.farmer_id || "_________"}</div>
            </div>
            
            <div  >
              <div className="font-bold text-[11px]" style={{ color: "#334155" }}>आधार नंबर</div>
              <div className="border-b border-\[#8B6F47\] py-0.5 text-[14px] font-semibold" style={{ color: "#334155" }}>{fileData?.aadhaar_no || "_________"}</div>
            </div>
          </div>

          {/* Row 3: Village, Taluka, District (single line) */}
          <div className="grid grid-cols-3 gap-3 mb-1">

            <div>
              <div className="font-bold text-[11px]" style={{ color: "#334155" }}>तालुका</div>
              <div className="border-b border-\[#8B6F47\] py-0.5 text-[14px] font-semibold" style={{ color: "#334155" }}>{fileData?.taluka || "_________"}</div>
            </div>
             <div>
              <div className="font-bold text-[11px]" style={{ color: "#334155" }}>पीकाचे नाव</div>
              <div className="border-b border-\[#8B6F47\] py-0.5 text-[14px] font-semibold" style={{ color: "#334155" }}>{fileData?.crop_name || bill?.crop_name || "_________"}</div>
            </div>
                        <div>
              <div className="font-bold text-[11px]" style={{ color: "#334155" }}>अर्ज क्रमांक</div>
              <div className="border-b border-\[#8B6F47\] py-0.5 text-[14px] font-semibold" style={{ color: "#334155" }}>{fileData?.application_id || "_________"}</div>
            </div>
            
          </div>

          {/* Row 4: Area, Crop, Application ID */}
          <div className="grid grid-cols-6 gap-3 mb-1">
           
                        <div className="col-span-2">
              <div className="font-bold text-[11px]" style={{ color: "#334155" }}>जिल्हा</div>
              <div className="border-b border-\[#8B6F47\] py-0.5 text-[14px] font-semibold" style={{ color: "#334155" }}>{fileData?.district || "_________"}</div>
            </div>
            <div className="col-span-2">
              <div className="font-bold text-[11px]" style={{ color: "#334155" }}>क्षेत्रफळ (हेक्टर)</div>
              <div className="border-b border-\[#8B6F47\] py-0.5 text-[14px] font-semibold" style={{ color: "#334155" }}>{fileData?.area8a || "_________"}</div>
            </div>
                        <div>
              <div className="font-bold text-[11px]" style={{ color: "#334155" }}>ड्रिप क्षेत्र</div>
              <div className="border-b border-\[#8B6F47\] py-0.5 text-[14px] font-semibold" style={{ color: "#334155" }}>{fileData?.irrigation_area || "_________"}</div>
            </div>
                        <div>
              <div className="font-bold text-[11px]" style={{ color: "#334155" }}>लॅटरल अंतर</div>
              <div className="border-b border-\[#8B6F47\] py-0.5 text-[14px] font-semibold" style={{ color: "#334155" }}>{fileData?.lateral_spacing || "_________"}</div>
            </div>



          </div>

          {/* Row 5: Drip Area and Lateral Distance */}
          {/* <div className="grid grid-cols-3 gap-3 mb-1">

            <div>
              <div className="font-bold text-[8px] text-gray-700">लॅटरल अंतर</div>
              <div className="border-b border-\[#8B6F47\] py-0.5 text-[11px] font-semibold">{fileData?.lateral_spacing || "____________________"}</div>
            </div>

            <div>
              <div className="font-bold text-[8px] text-gray-700">आधार नंबर</div>
              <div className="border-b border-\[#8B6F47\] py-0.5 text-[11px] font-semibold">{fileData?.aadhaar_no || "____________________"}</div>
            </div>
          </div> */}

        </div>
      </div>

      {/* ================= ITEMS TABLE ================= */}
      <div className="items-table-container px-1 my-3 pt-0.5" style={{ position: "relative", zIndex: 1 }}>
        <table className="w-full border border-\[#8B6F47\] border-collapse" style={{fontSize: "12px"}}>
          <thead>
            <tr>
              <th className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center w-6" style={{ color: "#5D4037", fontWeight: "bold" }}>SR.</th>
              <th className="border border-\[#8B6F47\] px-0.5 py-0.5 text-left" style={{ color: "#5D4037", fontWeight: "bold" }}>DESCRIPTION OF GOODS</th>
              {/* <th className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center w-10">HSN</th> */}
              <th className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center w-12" style={{ color: "#5D4037", fontWeight: "bold" }}>BATCH NO.</th>
              <th className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center w-10" style={{ color: "#5D4037", fontWeight: "bold" }}>CML NO.</th>
              <th className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center w-8" style={{ color: "#5D4037", fontWeight: "bold" }}>SIZE</th>
              <th className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center w-10" style={{ color: "#5D4037", fontWeight: "bold" }}>QUANTITY</th>
              <th className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center w-12" style={{ color: "#5D4037", fontWeight: "bold" }}>GOVT RATE</th>
              <th className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center w-12" style={{ color: "#5D4037", fontWeight: "bold" }}>SALES RATE</th>
              <th className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center w-8" style={{ color: "#5D4037", fontWeight: "bold" }}>UNIT</th>
              <th className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center w-8" style={{ color: "#5D4037", fontWeight: "bold" }}>GST</th>
              <th className="border border-\[#8B6F47\] px-0.5 py-0.5 text-right w-12" style={{ color: "#5D4037", fontWeight: "bold" }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center" style={{ color: "#334155" }}>{idx + 1}</td>
                <td className="border border-\[#8B6F47\] font-bold px-0.5 py-0.5" style={{ color: "#334155" }}>{item.description || "N/A"}</td>
                {/* <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center">{item.hsn || ""}</td> */}
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center" style={{ color: "#334155" }}>{item.batch_no || ""}</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center" style={{ color: "#334155" }}>{item.cml_no || ""}</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center" style={{ color: "#334155" }}>{item.size || ""}</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center" style={{ color: "#334155" }}>{Number(item.qty || 0).toFixed(2)}</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-right" style={{ color: "#334155" }}>{item.gov_rate ? Number(item.gov_rate).toFixed(2) : ""}</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-right" style={{ color: "#334155" }}>{Number(item.sales_rate || 0).toFixed(2)}</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center" style={{ color: "#334155" }}>{item.uom || "NO"}</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center" style={{ color: "#334155" }}>{Number(item.gst_percent || 0).toFixed(1)}%</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-right pr-0.5 font-semibold" style={{ color: "#334155" }}>{Number(item.amount || 0).toFixed(2)}</td>
              </tr>
            ))}
            {!autoHeight && Array.from({ length: Math.max(0, 7 - items.length) }).map((_, i) => (
              <tr key={`empty-${i}`} className="h-4">
                <td className="border border-\[#8B6F47\]" />
                <td className="border border-\[#8B6F47\]" />
                <td className="border border-\[#8B6F47\]" />
                <td className="border border-\[#8B6F47\]" />
                <td className="border border-\[#8B6F47\]" />
                <td className="border border-\[#8B6F47\]" />
                <td className="border border-\[#8B6F47\]" />
                <td className="border border-\[#8B6F47\]" />
                <td className="border border-\[#8B6F47\]" />
                <td className="border border-\[#8B6F47\]" />
                <td className="border border-\[#8B6F47\]" />
                <td className="border border-\[#8B6F47\]" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= TOTALS SECTION ================= */}
      <div className="px-1 pt-0.5 grid grid-cols-2 gap-1" style={{ position: "relative", zIndex: 1, pageBreakInside: "avoid" }}>
        {/* Left: GST Summary */}
        <div>
          <table className="w-full border border-\[#8B6F47\] border-collapse" style={{fontSize: "11px"}}>
            <thead>
              <tr>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 w-12 text-center" rowSpan="2" style={{ color: "#5D4037", fontWeight: "bold" }}>GST %</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5  text-center" rowSpan="2" style={{ color: "#5D4037", fontWeight: "bold" }}>Tax. Amount</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5  text-center text-[10px]" colSpan="2" style={{ color: "#5D4037", fontWeight: "bold" }}>CGST</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5  text-center text-[10px]" colSpan="2" style={{ color: "#5D4037", fontWeight: "bold" }}>SGST</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5  text-center" rowSpan="2" style={{ color: "#5D4037", fontWeight: "bold" }}>Total GST</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5  text-center" rowSpan="2" style={{ color: "#5D4037", fontWeight: "bold" }}>Total </td>
              </tr>
              <tr>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5  text-center text-[10px]" style={{ color: "#5D4037", fontWeight: "bold" }}>%</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5  text-center text-[10px]" style={{ color: "#5D4037", fontWeight: "bold" }}>Amount</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5  text-center text-[10px]" style={{ color: "#5D4037", fontWeight: "bold" }}>%</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5  text-center text-[10px]" style={{ color: "#5D4037", fontWeight: "bold" }}>Amount</td>
              </tr>
            </thead>
            <tbody>
              {gstGroupsArray.map((group, idx) => (
                <tr key={idx}>
                  <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center font-bold" style={{ color: "#334155" }}>{group.gstPercent.toFixed(1)}%</td>
                  <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center font-bold" style={{ color: "#334155" }}>{group.taxableAmount.toFixed(2)}</td>
                  <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center font-bold" style={{ color: "#334155" }}>{(group.gstPercent / 2).toFixed(1)}%</td>
                  <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center font-bold" style={{ color: "#334155" }}>{(group.gstAmount / 2).toFixed(2)}</td>
                  <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center font-bold" style={{ color: "#334155" }}>{(group.gstPercent / 2).toFixed(1)}%</td>
                  <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center font-bold" style={{ color: "#334155" }}>{(group.gstAmount / 2).toFixed(2)}</td>
                  <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center font-bold" style={{ color: "#334155" }}>{group.gstAmount.toFixed(2)}</td>
                  <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center font-bold" style={{ color: "#334155" }}>{(group.taxableAmount + group.gstAmount).toFixed(2)}</td>
                </tr>
              ))}
              {/* Total row if multiple GST groups */}
              {/* {gstGroupsArray.length > 1 && (
                <tr className="bg-gray-100">
                  <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center font-bold">{(taxableAmount > 0 ? (totalGst / taxableAmount) * 100 : 0).toFixed(1)}%</td>
                  <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center font-bold">{taxableAmount.toFixed(2)}</td>
                  <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center font-bold">{(taxableAmount > 0 ? (totalGst / taxableAmount) * 100 / 2 : 0).toFixed(1)}%</td>
                  <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center font-bold">{(totalGst / 2).toFixed(2)}</td>
                  <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center font-bold">{(taxableAmount > 0 ? (totalGst / taxableAmount) * 100 / 2 : 0).toFixed(1)}%</td>
                  <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center font-bold">{(totalGst / 2).toFixed(2)}</td>
                  <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center font-bold">{totalGst.toFixed(2)}</td>
                  <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-center font-bold">{finalAmount.toFixed(2)}</td>
                </tr>
              )} */}
            </tbody>
          </table>
        </div>

        {/* Right: Total/Rounded/Grand Total */}
        <div className="flex justify-self-end ">
          <table className="border border-\[#8B6F47\] border-collapse" style={{fontSize: "11px"}}>
            <tbody>
              <tr>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 font-bold" style={{ color: "#334155" }}>TAXABLE AMOUNT</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-right font-bold" style={{ color: "#334155" }}>{taxableAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 font-bold" style={{ color: "#334155" }}>TOTAL GST</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-right font-bold" style={{ color: "#334155" }}>{totalGst.toFixed(2)}</td>
              </tr>
              {/* <tr>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 font-bold">TOTAL</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-right font-bold">{finalAmount.toFixed(2)}</td>
              </tr> */}
              <tr>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 font-bold" style={{ color: "#334155" }}>ROUNDED</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-right font-bold" style={{ color: "#334155" }}>{(Math.round(finalAmount) - finalAmount).toFixed(2)}</td>
              </tr>
              <tr>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 font-bold" style={{ color: "#334155" }}>GRAND TOTAL</td>
                <td className="border border-\[#8B6F47\] px-0.5 py-0.5 text-right font-bold text-base" style={{ color: "#334155" }}>{Math.round(finalAmount).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Amount in words */}
      <div className="px-1 border border-\[#8B6F47\] my-1 py-2" style={{fontSize: "11px", position: "relative", zIndex: 1, pageBreakInside: "avoid", backgroundColor: "linear-gradient(135deg, #F5E6D3 0%, #D4A574 50%, #C19A6B 100%)"}}>
        <span className="font-bold" style={{ color: "#5D4037" }}>AMOUNT IN WORDS - </span><span style={{ color: "black", fontWeight: "500" }}>{amountInWords.toUpperCase()} ONLY</span>
      </div>

      {/* Spacer to push signatures to bottom when content is less */}
      <div style={{ flexGrow: 1, minHeight: "10px" }}></div>

      {/* ================= SIGNATURES ================= */}
      <div className="px-1 py-3 grid grid-cols-3 gap-4" style={{fontSize: "11px", position: "relative", zIndex: 1, pageBreakInside: "avoid", marginBottom: "5mm"}}>
        <div className="flex flex-col border border-\[#8B6F47\] p-3 h-32">
          <div className="h-16 flex-1" />
          <div className="text-[14px] border-t-2 border-\[#8B6F47\] pt-1 text-center leading-normal ">
            <div>ग्राहक</div>
            <div className="text-[12px] font-bold">{fileData?.farmer_name || bill?.farmer_name}</div>
          </div>
        </div>

        <div className="flex flex-col border border-\[#8B6F47\] p-3 h-32">
          <div className="h-16 flex-1" />
          <div className="text-[14px] border-t-2 border-\[#8B6F47\] pt-1 text-center leading-normal ">
            <div>सेल्स इंजिनियर </div>
            <div className="text-[11px] font-bold"> {fileData?.company} {fileData?.sales_engg ? `(${fileData?.sales_engg})` : ''} </div>
          </div>
        </div>

        <div className="flex flex-col border border-\[#8B6F47\] p-3 h-32">
          <div className="h-16 flex-1" />
          <div className="text-[14px] border-t-2 border-\[#8B6F47\] pt-1 text-center leading-normal  overflow-hidden">
            <div>मालक / विक्रेता</div>
            <div className="text-[12px] font-bold truncate">{userData?.business_name}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
