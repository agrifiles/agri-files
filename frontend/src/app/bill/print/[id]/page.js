'use client';
import { useEffect, useState } from 'react';
import { API_BASE } from '@/lib/utils';
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

  const handlePrint = () => {
    // Create a new window with just the bill content
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    
    const billHTML = document.getElementById('bill-content').innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bill ${bill.bill_no}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', sans-serif;
            background: white;
            color: black;
            padding: 20px;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          .bill-container {
            width: 210mm;
            height: 297mm;
            margin: auto;
            background: white;
            padding: 0;
          }
          /* Copy all your bill styles here */
          .border-b-2 { border-bottom: 2px solid #111; }
          .border-b { border-bottom: 1px solid #ccc; }
          .border-t-2 { border-top: 2px solid #111; }
          .border { border: 1px solid #111; }
          .bg-gray-50 { background-color: #f9fafb; }
          .bg-gray-900 { background-color: #111; }
          .text-white { color: white; }
          .text-gray-900 { color: #111; }
          .text-gray-700 { color: #374151; }
          .text-gray-600 { color: #4b5563; }
          .text-gray-500 { color: #6b7280; }
          .text-gray-400 { color: #d1d5db; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .font-semibold { font-weight: 600; }
          .text-xs { font-size: 0.75rem; }
          .text-sm { font-size: 0.875rem; }
          .text-lg { font-size: 1.125rem; }
          .text-xl { font-size: 1.25rem; }
          .text-2xl { font-size: 1.5rem; }
          .text-3xl { font-size: 1.875rem; }
          .p-3 { padding: 0.75rem; }
          .p-4 { padding: 1rem; }
          .p-6 { padding: 1.5rem; }
          .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
          .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
          .py-0.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
          .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
          .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
          .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
          .mb-1 { margin-bottom: 0.25rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mb-3 { margin-bottom: 0.75rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-6 { margin-bottom: 1.5rem; }
          .mt-1 { margin-top: 0.25rem; }
          .mt-2 { margin-top: 0.5rem; }
          .mt-4 { margin-top: 1rem; }
          .mt-6 { margin-top: 1.5rem; }
          .gap-2 { gap: 0.5rem; }
          .gap-4 { gap: 1rem; }
          .gap-6 { gap: 1.5rem; }
          .gap-8 { gap: 2rem; }
          .grid { display: grid; }
          .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .grid-cols-7 { grid-template-columns: repeat(7, minmax(0, 1fr)); }
          .flex { display: flex; }
          .flex-col { flex-direction: column; }
          .items-center { align-items: center; }
          .items-start { align-items: flex-start; }
          .items-end { align-items: flex-end; }
          .justify-center { justify-content: center; }
          .justify-between { justify-content: space-between; }
          .justify-end { justify-content: flex-end; }
          .table { display: table; width: 100%; }
          .table-collapse { border-collapse: collapse; }
          .th { font-weight: bold; padding: 0.5rem 0.75rem; text-align: left; }
          .td { padding: 0.5rem 0.75rem; }
          .hover\:bg-gray-50:hover { background-color: #f9fafb; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 0.5rem 0.75rem; }
          th { background-color: #111; color: white; font-weight: bold; }
          thead tr { background-color: #111; color: white; }
          .rounded-lg { border-radius: 0.5rem; }
          .rounded-xl { border-radius: 0.75rem; }
          .space-y-0.5 > * + * { margin-top: 0.125rem; }
          .space-y-1 > * + * { margin-top: 0.25rem; }
          .capitalize { text-transform: capitalize; }
          .min-w-full { min-width: 100%; }
          .w-full { width: 100%; }
          .h-12 { height: 3rem; }
          .overflow-x-auto { overflow-x: auto; }
          .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
          .rounded { border-radius: 0.25rem; }
        </style>
      </head>
      <body>
        <div class="bill-container">
          ${billHTML}
        </div>
        <script>
          (function(){
            function closeWin(){
              try{ window.close(); }catch(e){}
            }
            window.onload = function() {
              try{ window.print(); }catch(e){}
            };
            if ('onafterprint' in window) {
              window.onafterprint = closeWin;
            } else {
              // fallback: when window regains focus after print dialog closes
              window.onfocus = function(){ setTimeout(closeWin, 200); };
            }
            // safety fallback: close after 20s in case events don't fire
            setTimeout(closeWin, 20000);
          })();
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

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

        // If bill is linked to a file, fetch file details
        if (billObj && billObj.file_id) {
          try {
            const fileRes = await fetch(`${API}/api/files/${billObj.file_id}`);
            const fileText = await fileRes.text();
            const fileRespData = JSON.parse(fileText || '{}');
            if (mounted && fileRespData.success) {
              setFileData(fileRespData.file || null);
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
  
  const amountInWords = numberToWords(Math.floor(finalAmount)) + ' rupees';

  return (
    <div className="bg-gray-100 min-h-screen p-0 m-0" style={{ backgroundColor: '#f5f5f5', padding: '20px 0' }}>
      {/* A4 Page */}
      <div id="bill-content" className="mx-auto bg-white" style={{ width: '210mm', height: '297mm', margin: '20px auto', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
        
        {/* Header Section */}
        <div className="border-b-2 border-gray-900 p-6 bg-gray-50">
          <div className="text-center mb-2">
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>AGRIFILES</h1>
            <p className="text-xs text-gray-700 mt-1">Agricultural Solutions & Support Services</p>
          </div>
          <div className="text-center text-xs text-gray-700 space-y-0.5">
            <div>Address: Plot No. XYZ, Agricultural Complex, Pune - 411005</div>
            <div>GST No: 27AABCT1234H1Z0 | Phone: +91-9876543210 | Email: billing@agrifiles.com</div>
          </div>
        </div>

        {/* Bill Title */}
        <div className="text-center py-4 border-b border-gray-300 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>TAX INVOICE / BILL</h2>
        </div>

        {/* Bill Info & Farmer Details */}
        <div className="p-6 border-b-2 border-gray-300">
          <div className="grid grid-cols-3 gap-6 mb-4">
            {/* Bill Details - Left */}
            <div className="text-xs">
              <div className="font-bold text-gray-900 mb-2">BILL DETAILS</div>
              <div className="space-y-1 text-gray-700">
                <div><span className="font-semibold">Bill No:</span> {bill.bill_no || 'N/A'}</div>
                <div><span className="font-semibold">Bill Date:</span> {bill.bill_date ? new Date(bill.bill_date).toLocaleDateString('en-IN') : 'N/A'}</div>
              </div>
            </div>

            {/* Farmer/Customer Details - Center */}
            <div className="text-xs">
              <div className="font-bold text-gray-900 mb-2">SOLD TO</div>
              <div className="space-y-1 text-gray-700">
                <div><span className="font-semibold">Name:</span> {fileData?.farmer_name || bill.farmer_name || 'N/A'}</div>
                <div><span className="font-semibold">Mobile:</span> {fileData?.mobile || bill.farmer_mobile || 'N/A'}</div>
                {fileData?.village && <div><span className="font-semibold">Village:</span> {fileData.village}</div>}
                {fileData?.taluka && <div><span className="font-semibold">Taluka:</span> {fileData.taluka}</div>}
                {fileData?.district && <div><span className="font-semibold">District:</span> {fileData.district}</div>}
              </div>
            </div>

            {/* Additional Info - Right */}
            <div className="text-xs">
              <div className="font-bold text-gray-900 mb-2">STATUS</div>
              <div className="space-y-1 text-gray-700">
                <div><span className="font-semibold">Status:</span> <span className="capitalize px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">{bill.status || 'DRAFT'}</span></div>
                {fileData?.crop_name && <div><span className="font-semibold">Crop:</span> {fileData.crop_name}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="p-6">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="border border-gray-900 px-3 py-2 text-left font-semibold">Sr</th>
                <th className="border border-gray-900 px-3 py-2 text-left font-semibold">Description of Goods</th>
                <th className="border border-gray-900 px-3 py-2 text-center font-semibold">HSN</th>
                <th className="border border-gray-900 px-3 py-2 text-right font-semibold">Qty</th>
                <th className="border border-gray-900 px-3 py-2 text-right font-semibold">Rate</th>
                <th className="border border-gray-900 px-3 py-2 text-center font-semibold">GST%</th>
                <th className="border border-gray-900 px-3 py-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 text-center">{idx + 1}</td>
                  <td className="border border-gray-300 px-3 py-2">{item.description || 'N/A'}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{item.hsn || 'N/A'}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{Number(item.qty || 0).toFixed(2)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">₹ {Number(item.sales_rate || 0).toFixed(2)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{Number(item.gst_percent || 0).toFixed(1)}%</td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-semibold">₹ {Number(item.amount || 0).toFixed(2)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="7" className="border border-gray-300 px-3 py-8 text-center text-gray-500">No items</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="p-6 border-t-2 border-gray-300">
          <div className="flex justify-end">
            <div className="w-1/2">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="py-2 font-semibold text-gray-900">Taxable Amount:</td>
                    <td className="text-right py-2 font-semibold">₹ {taxableAmount.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-2 font-semibold text-gray-900">Total GST:</td>
                    <td className="text-right py-2 font-semibold">₹ {totalGst.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-gray-900 text-white">
                    <td className="py-3 font-bold">TOTAL AMOUNT:</td>
                    <td className="text-right py-3 font-bold text-lg">₹ {finalAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-300 text-xs">
          <span className="font-semibold text-gray-900">Amount in Words:</span> <span className="capitalize">{amountInWords}</span>
        </div>

        {/* Footer - Signature Section */}
        <div className="p-6">
          <div className="grid grid-cols-4 gap-4 text-xs">
            {/* Sales Engineer */}
            <div className="text-center border-t-2 border-gray-900 pt-4">
              <div className="h-12 mb-2"></div>
              <div className="font-semibold text-gray-900">Sales Engineer</div>
              <div className="text-gray-600 mt-1">(Signature & Seal)</div>
            </div>

            {/* Company Stamp */}
            <div className="text-center border-t-2 border-gray-900 pt-4">
              <div className="h-12 mb-2 flex items-center justify-center">
                <div className="text-gray-400 text-3xl">●</div>
              </div>
              <div className="font-semibold text-gray-900">Company Stamp</div>
              <div className="text-gray-600 mt-1">(Stamp/Seal)</div>
            </div>

            {/* Owner/Authorized */}
            <div className="text-center border-t-2 border-gray-900 pt-4">
              <div className="h-12 mb-2"></div>
              <div className="font-semibold text-gray-900">Authorized Signatory</div>
              <div className="text-gray-600 mt-1">(Owner/Director)</div>
            </div>

            {/* Terms */}
            <div className="text-xs text-gray-600 pt-4">
              <div className="font-semibold text-gray-900 mb-2">Terms & Conditions:</div>
              <div className="space-y-1">
                <div>1. Payment due on or before 15 days</div>
                <div>2. Cheque/DD in favor of AGRIFILES</div>
                <div>3. Subject to Pune jurisdiction</div>
              </div>
            </div>
          </div>
        </div>

        {/* Print Footer */}
        <div className="border-t-2 border-gray-900 p-3 text-center text-xs text-gray-600" style={{ pageBreakAfter: 'always' }}>
          <div>Thank you for your business | This is a computer-generated document, signature not required</div>
        </div>
      </div>

      {/* Print Button */}
      <div className="fixed bottom-6 right-6 flex gap-2" style={{ display: 'flex', zIndex: 50 }}>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 font-semibold text-sm"
        >
          🖨️ Print Bill
        </button>
        <button
                   onClick={() => router.push('/bill')}
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
