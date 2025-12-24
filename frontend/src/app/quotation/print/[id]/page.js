'use client';
import { useEffect, useState } from 'react';
import { API_BASE, getCurrentUser } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import QuotationInvoice from '@/components/QuotationInvoice';

function QuotationPrintContent({ params }) {
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

    const quotationElement = document.getElementById('quotation-content');
    const clonedQuotation = quotationElement.cloneNode(true);

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
    copyComputedStyles(quotationElement, clonedQuotation, true);
    
    // Remove all inline styles from root - let CSS handle it
    clonedQuotation.removeAttribute('style');
    clonedQuotation.style.cssText = '';

    // Generate filename from farmer name and quotation number
    const farmerName = fileData?.farmer_name || bill.farmer_name || 'Customer';
    const quotationNo = bill.bill_no || 'Quotation';
    const fileName = `${farmerName}_Quotation_${quotationNo}`.replace(/[^a-zA-Z0-9\u0900-\u097F_-]/g, '_');

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
    #quotation-content {
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
      #quotation-content {
        width: 210mm;
        min-height: 297mm;
        height: auto;
        margin: 0;
        padding: 8mm;
        page-break-inside: auto;
      }
      .quotation-invoice-container > div { page-break-inside: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
    }
  </style>
</head>
<body>
  ${clonedQuotation.outerHTML}
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

  // Fetch quotation and linked file data
  useEffect(() => {
    if (!routeId) return;
    let mounted = true;
    (async () => {
      try {
        // Fetch quotation
        const quotationRes = await fetch(`${API}/api/quotations/${routeId}`);
        const quotationText = await quotationRes.text();
        const quotationData = JSON.parse(quotationText || '{}');
        console.log('Fetched quotation data:', routeId, quotationData);
        if (!mounted) return;
        const quotationObj = quotationData.quotation || null;
        
        // Map quotation fields to bill-like structure for QuotationInvoice
        if (quotationObj) {
          const billLikeObj = {
            ...quotationObj,
            bill_no: quotationObj.quotation_no,
            bill_date: quotationObj.quotation_date,
            items: quotationObj.items || []
          };
          setBill(billLikeObj);
          console.log('Quotation data loaded for print:', billLikeObj);
        }

        // If quotation is linked to a file, fetch file details
        if (quotationObj && quotationObj.file_id) {
          try {
            const fileRes = await fetch(`${API}/api/files/${quotationObj.file_id}`);
            const fileText = await fileRes.text();
            const fileRespData = JSON.parse(fileText || '{}');
            console.log('Fetched file data for quotation print:', quotationObj.file_id, fileRespData);
            if (mounted && fileRespData.success) {
              setFileData(fileRespData.file || null);
              console.log('File data loaded for quotation print:', fileRespData.file);
            }
          } catch (err) {
            console.error('Failed to fetch file data:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching quotation:', err);
      }
    })();
    return () => { mounted = false; };
  }, [routeId, API]);

  if (!bill) return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-gray-600">Loading quotation...</div>
    </div>
  );

  return (
    <div
      className="bg-gray-100 min-h-screen p-0 m-0"
      style={{ backgroundColor: "#f5f5f5", padding: "20px 0" }}
    >
      {/* A4 Page with shadow for screen preview - autoHeight for multi-page quotations */}
      <div style={{ margin: "20px auto", boxShadow: "0 0 10px rgba(0,0,0,0.2)", width: "210mm" }}>
        <QuotationInvoice 
          bill={bill} 
          fileData={fileData} 
          userData={userData} 
          id="quotation-content"
          showWatermark={true}
          autoHeight={true}
        />
      </div>

      {/* Print / Back buttons */}
      <div
        className="fixed bottom-6 right-6 flex gap-2"
        style={{ display: "flex", zIndex: 50 }}
      >
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 font-semibold text-sm"
        >
          🖨️ Print Quotation
        </button>
        <button
          onClick={() => router.push(`/quotations/new?id=${routeId}`)}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-lg hover:bg-yellow-600 font-semibold text-sm"
        >
          ✏️ Edit
        </button>
        <button
          onClick={() => router.push("/quotations")}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow-lg hover:bg-gray-700 font-semibold text-sm"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

export default function QuotationPrint({ params }) {
  return (
    <ProtectedRoute>
      <QuotationPrintContent params={params} />
    </ProtectedRoute>
  );
}
