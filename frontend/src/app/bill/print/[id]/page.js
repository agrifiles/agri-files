'use client';
import { useEffect, useState } from 'react';
import { API_BASE, getCurrentUser, formatBillNo } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import BillInvoice from '@/components/BillInvoice';
import AppendixForm from '@/components/AppendixForm';

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
    const copyComputedStyles = (source, target, isRoot = false) => {
      // Skip the root element - we'll set its styles manually
      if (!isRoot) {
        const computed = window.getComputedStyle(source);
        let cssText = '';
        for (let i = 0; i < computed.length; i++) {
          const prop = computed[i];
          cssText += `${prop}:${computed.getPropertyValue(prop)};`;
        }
        target.style.cssText = cssText;
      }

      // Recursively copy styles to children
      for (let i = 0; i < source.children.length; i++) {
        if (target.children[i]) {
          copyComputedStyles(source.children[i], target.children[i], false);
        }
      }
    };

    // Apply all computed styles as inline styles (skip root element)
    copyComputedStyles(billElement, clonedBill, true);
    
    // Remove all inline styles from root - let CSS handle it
    clonedBill.removeAttribute('style');
    clonedBill.style.cssText = '';

    // Generate filename from farmer name and bill number
    const farmerName = fileData?.farmer_name || bill.farmer_name || 'Customer';
    const formattedBillNo = formatBillNo(bill.bill_no, bill.bill_date) || 'Bill';
    const fileName = `${farmerName}_${formattedBillNo}`.replace(/[^a-zA-Z0-9\u0900-\u097F_-]/g, '_');

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${fileName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      margin: 0; 
      padding: 0; 
      background: white;
    }
    #bill-content {
      width: 210mm;
      min-height: 297mm;
      height: auto;
      margin: 0;
      padding: 8mm;
      background: white;
      box-sizing: border-box;
    }
    @page { 
      size: A4 portrait; 
      margin: 0; 
    }
    @media print {
      * { 
        -webkit-print-color-adjust: exact !important; 
        print-color-adjust: exact !important;
      }
      #bill-content {
        width: 210mm;
        min-height: 297mm;
        height: auto;
        margin: 0;
        padding: 8mm;
        page-break-inside: auto;
      }
      .bill-invoice-container > div { page-break-inside: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
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
        console.log('Fetched bill data:',routeId, billData);
        if (!mounted) return;
         console.log('Fetched bill data:',routeId, billData);
        const billObj = billData.bill || null;
        setBill(billObj);
        console.log('Bill data loaded for print:', billObj);

        // If bill is linked to a file, fetch file details
        if (billObj && billObj.file_id) {
          try {
            const fileRes = await fetch(`${API}/api/files/${billObj.file_id}`);
            const fileText = await fileRes.text();
            const fileRespData = JSON.parse(fileText || '{}');
            console.log('Fetched file data for bill print:', billObj.file_id, fileRespData);
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

  return (
    <div
      className="bg-gray-100 min-h-screen p-0 m-0"
      style={{ backgroundColor: "#f5f5f5", padding: "20px 0" }}
    >
      {/* A4 Page with shadow for screen preview - autoHeight for multi-page bills */}
      <div style={{ margin: "20px auto", boxShadow: "0 0 10px rgba(0,0,0,0.2)", width: "210mm" }}>
        {/* Appendix Form (परिशिष्ट - ३) - Before Bill Invoice */}
        <AppendixForm 
          userData={userData}
          fileData={fileData}
        />
        
        {/* Bill Invoice */}
        <BillInvoice 
          bill={bill} 
          fileData={fileData} 
          userData={userData} 
          id="bill-content"
          showWatermark={true}
          autoHeight={true}
          displayBillNo={formatBillNo(bill?.bill_no, bill?.bill_date)}
        />
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
