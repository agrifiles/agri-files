'use client';

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
 */
export default function BillInvoice({ bill, fileData, userData, id = "bill-content", showWatermark = true, embedded = false, autoHeight = false }) {
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
  
  // Quotation type - always show as QUOTATION
  const billType = 'QUOTATION / कोटेशन';
  const billHeader = '*हे कोटेशन आहे, टॅक्स इनव्हॉइस नाही / This is a quotation, not a tax invoice*';
  
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
      <div className="border-b-2 border-black px-3 py-2 bg-gray-100" style={{ position: "relative", zIndex: 1 }}>
        {/* Top Row: Firm Name | Authorized Dealer For */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="font-black text-3xl tracking-wide text-gray-900 mb-1">{userData?.business_name}</div>
            <div className="font-bold text-[11px] leading-tight text-gray-800 mb-1">
             {userData?.short_address} तालुका : {userData?.taluka} जिल्हा :  {userData?.district}<br/>
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
        <div className="border-b-2 border-t-2 border-black mt-2 py-1.5 text-center bg-white-200">
          <div className="font-black text-2xl tracking-widest text-blue-700 mb-0.5">{billType}</div>
          <div className="text-[8px] font-semibold text-red-700">{billHeader}</div>
        </div>

        {/* Farmer/Client details - IMPROVED LAYOUT */}
        <div className="mt-2 border-1 border-black p-2" style={{fontSize: "10px"}}>
          {/* Row 1: Aadhar and Applicant Name */}
          <div className="grid grid-cols-3 gap-3 mb-1">
                        <div className="col-span-2">
              <div className="font-bold text-[8px] text-gray-700">ग्राहकाचे नाव</div>
              <div className="border-b border-black py-0.5 text-[12px] font-semibold">{fileData?.farmer_name || bill.farmer_name || "____________________"}</div>
            </div>
            <div>
              <div className="font-bold text-[8px] text-gray-700">आधार नंबर</div>
              <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.aadhaar_no || "____________________"}</div>
            </div>

          </div>

          {/* Row 2: Mobile and Farmer/Client ID */}
          <div className="grid grid-cols-3 gap-3 mb-1">
                                    <div>
              <div className="font-bold text-[8px] text-gray-700">गाव</div>
              <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.village || "____________________"}</div>
            </div>

    
            <div>
              <div className="font-bold text-[8px] text-gray-700">मोबाइल नंबर</div>
              <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.mobile || bill.farmer_mobile || "____________________"}</div>
            </div>
                    <div className="">
              <div className="font-bold text-[8px] text-gray-700">शेतकरी ओळख क्रमांक </div>
              <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.farmer_id || "____________________"}</div>
            </div>
          </div>

          {/* Row 3: Village, Taluka, District (single line) */}
          <div className="grid grid-cols-3 gap-3 mb-1">

            <div>
              <div className="font-bold text-[8px] text-gray-700">तालुका</div>
              <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.taluka || "____________________"}</div>
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

          {/* Row 4: Area, Crop, Application ID */}
          <div className="grid grid-cols-3 gap-3 mb-1">
           
                        <div>
              <div className="font-bold text-[8px] text-gray-700">जिल्हा</div>
              <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.district || "____________________"}</div>
            </div>
            <div>
              <div className="font-bold text-[8px] text-gray-700">क्षेत्रफळ (हेक्टर)</div>
              <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.area8a || "____________________"}</div>
            </div>
                        <div>
              <div className="font-bold text-[8px] text-gray-700">ड्रिप क्षेत्र</div>
              <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.irrigation_area || "____________________"}</div>
            </div>


          </div>

          {/* Row 5: Drip Area and Lateral Distance */}
          <div className="grid grid-cols-3 gap-3 mb-1">

            <div>
              <div className="font-bold text-[8px] text-gray-700">लॅटरल अंतर</div>
              <div className="border-b border-black py-0.5 text-[11px] font-semibold">{fileData?.lateral_spacing || "____________________"}</div>
            </div>
            <div>
              <div className="font-bold text-[8px] text-gray-700"> दिनांक</div>
              <div className="border-b border-black py-0.5 text-[11px] font-semibold">{bill?.bill_date ? new Date(bill.bill_date).toLocaleDateString("en-IN") : "N/A"}</div>
            </div>
                      <div>
              <div className="font-bold text-[8px] text-gray-700">कोटेशन क्रमांक</div>
              <div className="border-b border-black py-0.5 text-[12px] font-semibold">{bill?.bill_no ? bill.bill_no.replace(/_(\d+)$/, '_QT$1') : "N/A"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ITEMS TABLE ================= */}
      <div className="items-table-container px-1 my-3 pt-0.5" style={{ position: "relative", zIndex: 1 }}>
        <table className="w-full border border-black border-collapse" style={{fontSize: "10px"}}>
          <thead>
            <tr className="bg-blue-200">
              <th className="border border-black px-0.5 py-0.5 text-center w-6">SR.</th>
              <th className="border border-black px-0.5 py-0.5 text-left">DESCRIPTION OF GOODS</th>
              {/* <th className="border border-black px-0.5 py-0.5 text-center w-10">HSN</th> */}
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
                {/* <td className="border border-black px-0.5 py-0.5 text-center">{item.hsn || ""}</td> */}
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
            {!autoHeight && Array.from({ length: Math.max(0, 7 - items.length) }).map((_, i) => (
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
      <div className="px-1 pt-0.5 grid grid-cols-2 gap-1" style={{ position: "relative", zIndex: 1, pageBreakInside: "avoid" }}>
        {/* Left: GST Summary */}
        <div>
          <table className="w-full border border-black border-collapse" style={{fontSize: "9px"}}>
            <thead>
              <tr>
                <td className="border border-black px-0.5 py-0.5 w-12 text-center" rowSpan="2">GST %</td>
                <td className="border border-black px-0.5 py-0.5  text-center" rowSpan="2">Tax. Amount</td>
                <td className="border border-black px-0.5 py-0.5  text-center text-[8px]" colSpan="2">CGST</td>
                <td className="border border-black px-0.5 py-0.5  text-center text-[8px]" colSpan="2">SGST</td>
                <td className="border border-black px-0.5 py-0.5  text-center" rowSpan="2">Total GST</td>
                <td className="border border-black px-0.5 py-0.5  text-center" rowSpan="2">Total </td>
              </tr>
              <tr>
                <td className="border border-black px-0.5 py-0.5  text-center text-[8px]">%</td>
                <td className="border border-black px-0.5 py-0.5  text-center text-[8px]">Amount</td>
                <td className="border border-black px-0.5 py-0.5  text-center text-[8px]">%</td>
                <td className="border border-black px-0.5 py-0.5  text-center text-[8px]">Amount</td>
              </tr>
            </thead>
            <tbody>
              {gstGroupsArray.map((group, idx) => (
                <tr key={idx}>
                  <td className="border border-black px-0.5 py-0.5 text-center font-bold">{group.gstPercent.toFixed(1)}%</td>
                  <td className="border border-black px-0.5 py-0.5 text-center font-bold">{group.taxableAmount.toFixed(2)}</td>
                  <td className="border border-black px-0.5 py-0.5 text-center font-bold">{(group.gstPercent / 2).toFixed(1)}%</td>
                  <td className="border border-black px-0.5 py-0.5 text-center font-bold">{(group.gstAmount / 2).toFixed(2)}</td>
                  <td className="border border-black px-0.5 py-0.5 text-center font-bold">{(group.gstPercent / 2).toFixed(1)}%</td>
                  <td className="border border-black px-0.5 py-0.5 text-center font-bold">{(group.gstAmount / 2).toFixed(2)}</td>
                  <td className="border border-black px-0.5 py-0.5 text-center font-bold">{group.gstAmount.toFixed(2)}</td>
                  <td className="border border-black px-0.5 py-0.5 text-center font-bold">{(group.taxableAmount + group.gstAmount).toFixed(2)}</td>
                </tr>
              ))}
              {/* Total row if multiple GST groups */}
              {/* {gstGroupsArray.length > 1 && (
                <tr className="bg-gray-100">
                  <td className="border border-black px-0.5 py-0.5 text-center font-bold">{(taxableAmount > 0 ? (totalGst / taxableAmount) * 100 : 0).toFixed(1)}%</td>
                  <td className="border border-black px-0.5 py-0.5 text-center font-bold">{taxableAmount.toFixed(2)}</td>
                  <td className="border border-black px-0.5 py-0.5 text-center font-bold">{(taxableAmount > 0 ? (totalGst / taxableAmount) * 100 / 2 : 0).toFixed(1)}%</td>
                  <td className="border border-black px-0.5 py-0.5 text-center font-bold">{(totalGst / 2).toFixed(2)}</td>
                  <td className="border border-black px-0.5 py-0.5 text-center font-bold">{(taxableAmount > 0 ? (totalGst / taxableAmount) * 100 / 2 : 0).toFixed(1)}%</td>
                  <td className="border border-black px-0.5 py-0.5 text-center font-bold">{(totalGst / 2).toFixed(2)}</td>
                  <td className="border border-black px-0.5 py-0.5 text-center font-bold">{totalGst.toFixed(2)}</td>
                  <td className="border border-black px-0.5 py-0.5 text-center font-bold">{finalAmount.toFixed(2)}</td>
                </tr>
              )} */}
            </tbody>
          </table>
        </div>

        {/* Right: Total/Rounded/Grand Total */}
        <div>
          <table className="w-full border border-black border-collapse" style={{fontSize: "9px"}}>
            <tbody>
              <tr>
                <td className="border border-black px-0.5 py-0.5 font-bold">TAXABLE AMOUNT</td>
                <td className="border border-black px-0.5 py-0.5 text-right font-bold">{taxableAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="border border-black px-0.5 py-0.5 font-bold">TOTAL GST</td>
                <td className="border border-black px-0.5 py-0.5 text-right font-bold">{totalGst.toFixed(2)}</td>
              </tr>
              {/* <tr>
                <td className="border border-black px-0.5 py-0.5 font-bold">TOTAL</td>
                <td className="border border-black px-0.5 py-0.5 text-right font-bold">{finalAmount.toFixed(2)}</td>
              </tr> */}
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
      <div className="px-1 border border-black my-1 py-2" style={{fontSize: "11px", position: "relative", zIndex: 1, pageBreakInside: "avoid"}}>
        <span className="font-bold">AMOUNT IN WORDS - </span><span> {amountInWords.toUpperCase()} ONLY</span>
      </div>

      {/* ================= NOTES SECTION ================= */}
      <div className="px-1 border border-black my-1 py-2" style={{fontSize: "9px", position: "relative", zIndex: 1, pageBreakInside: "avoid"}}>
        <div className="font-bold text-[10px] mb-1">टीप / Notes:</div>
        <ol className="list-decimal list-inside space-y-0.5 text-[8px]">
          <li>हे कोटेशन 15 दिवसांसाठी वैध आहे / This quotation is valid for 15 days from the date of issue.</li>
          {/* <li>किंमती GST सह दर्शविल्या आहेत / Prices shown are inclusive of applicable GST.</li> */}
          <li>वितरण तारीख ऑर्डर कन्फर्मेशनवर अवलंबून आहे / Delivery date is subject to order confirmation and stock availability.</li>
          {/* <li>पेमेंट अटी: ऑर्डर देताना 50% आगाऊ, वितरणापूर्वी उर्वरित 50% / Payment Terms: 50% advance with order, balance 50% before delivery.</li> */}
          <li>साहित्याची किंमत बाजारभावानुसार बदलू शकते / Material prices are subject to change based on market conditions.</li>
        </ol>
      </div>

      {/* Spacer to push signatures to bottom when content is less */}
      <div style={{ flexGrow: 1, minHeight: "10px" }}></div>

      {/* ================= SIGNATURES ================= */}
      <div className="px-1 py-3 grid grid-cols-3 gap-4" style={{fontSize: "11px", position: "relative", zIndex: 1, pageBreakInside: "avoid", marginBottom: "5mm"}}>
        <div className="flex flex-col border border-black p-3 h-32">
          <div className="h-16 flex-1" />
          <div className="text-[12px] border-t-2 border-black pt-1 text-center leading-normal font-bold">
            <div>ग्राहक</div>
            <div className="text-[9px]">{fileData?.farmer_name || bill?.farmer_name}</div>
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
  );
}
