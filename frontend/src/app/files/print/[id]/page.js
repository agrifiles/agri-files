'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/utils';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/ProtectedRoute';

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

  useEffect(() => {
    // Add styles to the page
    const style = document.createElement('style');
    style.textContent = `
      .sheet {
        width: 210mm;
        min-height: 297mm;
        padding: 12mm;
        box-sizing: border-box;
        position: relative;
        background: white;
        border: 2px solid #000;
        border-radius: 2px;
        box-shadow: 0 0 0 1px #000, 0 4px 20px rgba(0,0,0,0.15);
      }
      #farm-map-canvas canvas {
        max-width: 100% !important;
        max-height: 100% !important;
        //width: auto !important;
        height: auto !important;
        display: block;
        margin: 0 auto;
      }
      .row { display: flex; gap: 12px; align-items: center; }
      .col { flex: 1; }
      .left { text-align: left; }
      .center { text-align: center; }
      .right { text-align: right; }
      h1 { font-size: 18px; margin: 4px 0; }
      h2 { font-size: 14px; margin: 4px 0; }
      .small { font-size: 11px; }
      .box { border: 1px solid #000; padding: 6px; }
      .image-box { border: 1px solid #000; width: 120px; height: 90px; display: inline-block; box-sizing: border-box; background: #fff; }
      .emblem-box { width: 120px; height: 90px; border: 1px solid #000; display: inline-block; }
      .field { margin: 6px 0; display: flex; gap: 8px; align-items: center; }
      .label { width: 140px; font-weight: 700; }
      .value { flex: 1; border-bottom: 1px solid #000; padding: 2px 6px; min-height: 20px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      table th, table td { border: 1px solid #000; padding: 6px; }
      .signature { margin-top: 18px; display: flex; justify-content: space-between; gap: 12px; }
      .sig-box { width: 30%; border-top: 1px solid #000; padding-top: 6px; text-align: center; font-size: 12px; }
      .doc-ref { font-size: 11px; margin-top: 6px; color: #222; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

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

        // Fetch linked bill (same logic as bill print page)
        // The bills table has file_id column that links to files.id
        if (fileData.id) {
          try {
            // First, query bills to find if there's a bill linked to this file
            const billListRes = await fetch(`${API}/api/bills?file_id=${fileData.id}`);
            const billListResult = await billListRes.json();
            
            if (billListResult.success && billListResult.bills && billListResult.bills.length > 0) {
              // Found a linked bill, now fetch the full bill with items by ID
              const linkedBillId = billListResult.bills[0].bill_id;
              
              const billRes = await fetch(`${API}/api/bills/${linkedBillId}`);
              const billData = await billRes.json();
              
              if (billData.success && billData.bill) {
                setBillData(billData.bill);
                console.log('Bill data loaded:', billData.bill);
              }
            } else {
              console.log('No bill linked to file:', fileData.id);
            }
          } catch (err) {
            console.error('Error fetching bill:', err);
          }
        }
      } catch (error) {
        console.error('Error fetching file:', error);
      }
    };
    
    fetchFile();
  }, [routeId, API]);

  const handlePrint = () => {
    if (!file) return;
    
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
    
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    
    // Clone the content but replace canvas with image
    const contentClone = document.getElementById('file-content').cloneNode(true);
    const canvasContainer = contentClone.querySelector('#farm-map-canvas');
    
    if (canvasContainer && canvasDataUrl) {
      canvasContainer.innerHTML = `<img src="${canvasDataUrl}" style="width: 100%; height: 100%; object-fit: contain; display: block;" />`;
    }
    
    const fileHTML = contentClone.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="mr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>File ${file.id}</title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap" rel="stylesheet" />
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Noto Sans Devanagari', 'Segoe UI', Roboto, Arial, sans-serif;
            background: white;
            color: #111;
            padding: 20px;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
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
            .no-print {
              display: none !important;
            }
          }
          .sheet {
            width: 210mm;
            min-height: 297mm;
            padding: 12mm;
            page-break-after: always;
            box-sizing: border-box;
            position: relative;
            background: white;
            border: 1px solid #333;
          }
          @media screen {
            .sheet {
              box-shadow: 0 0 0 1px #000, 0 4px 20px rgba(0,0,0,0.15);
              border: 2px solid #000;
              border-radius: 2px;
              margin-bottom: 0;
            }
          }
          @media print {
            .sheet {
              border: 1px solid #000;
            }
          }
          .row { display: flex; gap: 12px; align-items: center; }
          .col { flex: 1; }
          .left { text-align: left; }
          .center { text-align: center; }
          .right { text-align: right; }
          h1 { font-size: 18px; margin: 4px 0; }
          h2 { font-size: 14px; margin: 4px 0; }
          .small { font-size: 11px; }
          .box { border: 1px solid #000; padding: 6px; }
          .image-box { border: 1px solid #000; width: 120px; height: 90px; display: inline-block; box-sizing: border-box; background: #fff; }
          .emblem-box { width: 120px; height: 90px; border: 1px solid #000; display: inline-block; }
          .field { margin: 6px 0; display: flex; gap: 8px; align-items: center; }
          .label { width: 140px; font-weight: 700; }
          .value { flex: 1; border-bottom: 1px solid #000; padding: 2px 6px; min-height: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          table th, table td { border: 1px solid #000; padding: 6px; }
          .signature { margin-top: 18px; display: flex; justify-content: space-between; gap: 12px; }
          .sig-box { width: 30%; border-top: 1px solid #000; padding-top: 6px; text-align: center; font-size: 12px; }
          .doc-ref { font-size: 11px; margin-top: 6px; color: #222; }
        </style>
      </head>
      <body>
        ${fileHTML}
        <script>
          window.onload = () => {
            window.print();
          };
          window.onafterprint = () => {
            window.close();
          };
          window.onfocus = () => {
            setTimeout(() => {
              window.close();
            }, 200);
          };
          setTimeout(() => {
            window.close();
          }, 20000);
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  if (!file) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading file...</div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen py-12 pb-24">
      <div className="max-w-[210mm] mx-auto px-4">
        <div id="file-content" className="space-y-8">
        {/* Page 1 - Application Header */}
        <section className="sheet">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="left">
              <div className="emblem-box" aria-hidden="true"></div>
            </div>

            <div className="center" style={{ flex: 2 }}>
              <h1>अनुदान मागणी प्रस्ताव</h1>
              <h2>पेर Drop More Crop — सत्र 2025-2026</h2>
              <div className="small">महाराष्ट्र शासन — कृषि विभाग</div>
            </div>

            <div className="right">
              <div style={{ textAlign: 'right' }}>
                <div className="box small">
                  <div>APPLICATION ID</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{file.id}</div>
                </div>
                <div style={{ height: 8 }} />
                <div className="box small">
                  <div>शेतकऱ्याचे ओळख क्रमांक</div>
                  <div style={{ fontWeight: 700 }}>FMR-{file.id}</div>
                </div>
              </div>
            </div>
          </div>

          <hr style={{ margin: '12px 0' }} />

          <div className="box">
            <div className="field">
              <div className="label">शेतकऱ्याचे नाव:</div>
              <div className="value">श्री/श्रीमती {file.farmer_name || 'N/A'}</div>
            </div>

            <div className="field">
              <div className="label">गाव / तालुका:</div>
              <div className="value">गाव: {file.village || 'N/A'} , तालुका: {file.taluka || 'N/A'} , जिल्हा: {file.district || 'N/A'}</div>
            </div>

            <div className="field">
              <div className="label">मोबाईल क्रमांक:</div>
              <div className="value">{file.mobile || 'N/A'}</div>
            </div>

            <div className="field">
              <div className="label">पीक प्रकार:</div>
              <div className="value">{file.crop_name || 'N/A'}</div>
            </div>

            <div className="field">
              <div className="label">कंपनी:</div>
              <div className="value">{file.company || 'N/A'}</div>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div className="small doc-ref">File Date: {file.file_date || 'N/A'} | FY: {file.fy_year || 'N/A'}</div>
        </section>

        {/* Page 2 - Signature Page */}
        <section className="sheet">
          <div className="center">
            <h2>अनुरोधकर्त्याचे स्वाक्षरी पृष्ठ</h2>
          </div>

          <div style={{ marginTop: 10 }}>
            <div className="box small">
              खालील घोषणांना मी/आम्ही संमती देतो:
              <ol style={{ margin: '8px 0 0 20px' }}>
                <li>मी/आम्ही वरील सर्व माहिती खरी आहे.</li>
                <li>मी/आम्ही अनुदान नियम व अटी मान्य करतो/करतो.</li>
                <li>कोणतीही चुकीची माहिती आढळल्यास मला/आम्हाला जबाबदार धरले जाईल.</li>
              </ol>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="label small">दिनांक:</div>
                  <div className="value small" style={{ border: 'none', borderBottom: '1px solid #000', width: 140 }}>{file.file_date || 'N/A'}</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div className="image-box" aria-label="signature placeholder" />
                  <div style={{ fontSize: 12, marginTop: 6 }}>स्वाक्षरी / हस्ताक्षर</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div className="label small">ठिकाण:</div>
                  <div className="value small" style={{ border: 'none', borderBottom: '1px solid #000', width: 160 }}>{file.village || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Page 3 - Farm Map */}
        <section className="sheet">
          <div className="center">
            <h2>शेती नकाशा / विहंगावलोकन</h2>
          </div>

          <div style={{ marginTop: 10 }}>
            <div style={{ border: '1px solid #000', height: '190mm', padding: 8, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div id="farm-map-canvas" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FarmMapCanvas shapes={shapes} />
              </div>
            </div>
          </div>

          <div className="small" style={{ marginTop: 8 }}>नकाशावर उत्तरे-बिंदू, पाणी पुरवठा आणि शेतीच्या सीमारेषा स्पष्ट दाखवा.</div>
        </section>

        {/* Page 4 - Completion Certificate */}
        <section className="sheet">
          <div>
            <h2 className="center">पूर्णत्वाची घोषणपत्र</h2>

            <div className="box" style={{ marginTop: 12 }}>
              <p className="small">मी/आम्ही खाली स्वाक्षर करणारे, वरील आराखडा व दस्तऐवज येथे सादर करतो/करतो. सर्व माहिती आणि संलग्न कागदपत्रे खरी व समर्थनीय आहेत.</p>

              <div style={{ marginTop: 18 }}>
                <div className="row">
                  <div className="col">
                    <div className="small">दिनांक:</div>
                    <div className="value" style={{ border: 'none', borderBottom: '1px solid #000', width: 160 }}>{file.file_date || 'N/A'}</div>
                  </div>

                  <div className="col" style={{ textAlign: 'center' }}>
                    <div className="small">विक्रेता / कंपनीचे नाव</div>
                    <div className="value" style={{ border: 'none', borderBottom: '1px solid #000', width: 220 }}>{file.company || 'N/A'}</div>
                  </div>

                  <div className="col" style={{ textAlign: 'right' }}>
                    <div className="small">स्वाक्षरी (प्रोप्रायटेअर / अधिकारी)</div>
                    <div className="image-box" style={{ marginLeft: 'auto' }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <h3 className="small" style={{ fontWeight: 700, marginBottom: 8 }}>बिल तपशील:</h3>
              <div className="box">
                <div className="field">
                  <div className="label">बिल क्रमांक:</div>
                  <div className="value">{file.bill_no || 'N/A'}</div>
                </div>
                <div className="field">
                  <div className="label">बिल दिनांक:</div>
                  <div className="value">{file.bill_date || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Page 5 - Terms & Conditions */}
        <section className="sheet">
          <div>
            <h2 className="center">नियम व अटी / मार्गदर्शक सूचना</h2>

            <ol style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6 }}>
              <li>योजना अंतर्गत दिलेल्या साधनांचा उपयोग केवळ नमूद केलेल्या प्रकारसाठी करावा.</li>
              <li>उत्पादनाची प्रतिष्ठा व व्यवहार नियमांनुसार ठेवावी.</li>
              <li>अनुदान मिळाल्यानंतर १२ महिन्यांपर्यंत तपासणीसाठी अधिकारी भेट देऊ शकतात.</li>
              <li>या पत्रातील चुकीची माहिती आढळल्यास अनुदान रद्द केले जाऊ शकते.</li>
              <li>सर्व कागदपत्रे योग्य प्रकारे सुरक्षित ठेवावी.</li>
            </ol>

            <div className="signature">
              <div className="sig-box">सत्यवटीचे नाव<br />(नाम व पद)</div>
              <div className="sig-box">तपासण अधिकारी<br />(नाम व पद)</div>
              <div className="sig-box">प्राधिकृत स्वाक्षरी</div>
            </div>

            <div style={{ marginTop: 30 }}>
              <div className="box small">
                <strong>Status:</strong> {file.status || 'N/A'}
              </div>
            </div>
          </div>
        </section>

        
        {/* Page 6 - Bill Invoice */}
        <section className="sheet">
          {billData ? (
            <div style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Bill Header */}
              <div style={{ borderBottom: '2px solid #000', padding: '16px', background: '#f9fafb' }}>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>AGRIFILES</h1>
                  <p style={{ fontSize: '10px', color: '#374151', margin: 0 }}>Agricultural Solutions & Support Services</p>
                </div>
                <div style={{ textAlign: 'center', fontSize: '10px', color: '#374151' }}>
                  <div>Address: Plot No. XYZ, Agricultural Complex, Pune - 411005</div>
                  <div>GST No: 27AABCT1234H1Z0 | Phone: +91-9876543210</div>
                </div>
              </div>

              {/* Bill Title */}
              <div style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #d1d5db', background: '#f9fafb' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>TAX INVOICE / BILL</h2>
              </div>

              {/* Bill Info */}
              <div style={{ padding: '16px', borderBottom: '2px solid #d1d5db', display: 'flex', gap: '24px', fontSize: '11px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>BILL DETAILS</div>
                  <div><strong>Bill No:</strong> {billData.bill_no || 'N/A'}</div>
                  <div><strong>Bill Date:</strong> {billData.bill_date || 'N/A'}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>SOLD TO</div>
                  <div><strong>Name:</strong> {file.farmer_name || 'N/A'}</div>
                  <div><strong>Mobile:</strong> {file.mobile || 'N/A'}</div>
                  <div><strong>Village:</strong> {file.village || 'N/A'}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>STATUS</div>
                  <div><strong>Status:</strong> {billData.status || 'DRAFT'}</div>
                  <div><strong>Crop:</strong> {file.crop_name || 'N/A'}</div>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ padding: '16px', flex: 1 }}>
                <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#111', color: 'white' }}>
                      <th style={{ border: '1px solid #111', padding: '8px', textAlign: 'left' }}>Sr</th>
                      <th style={{ border: '1px solid #111', padding: '8px', textAlign: 'left' }}>Description</th>
                      <th style={{ border: '1px solid #111', padding: '8px', textAlign: 'center' }}>HSN</th>
                      <th style={{ border: '1px solid #111', padding: '8px', textAlign: 'right' }}>Qty</th>
                      <th style={{ border: '1px solid #111', padding: '8px', textAlign: 'right' }}>Rate</th>
                      <th style={{ border: '1px solid #111', padding: '8px', textAlign: 'center' }}>GST%</th>
                      <th style={{ border: '1px solid #111', padding: '8px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billData.items && billData.items.length > 0 ? (
                      billData.items.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ border: '1px solid #d1d5db', padding: '6px' }}>{item.description || 'N/A'}</td>
                          <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'center' }}>{item.hsn || 'N/A'}</td>
                          <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'right' }}>{Number(item.qty || 0).toFixed(2)}</td>
                          <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'right' }}>₹ {Number(item.sales_rate || 0).toFixed(2)}</td>
                          <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'center' }}>{Number(item.gst_percent || 0).toFixed(1)}%</td>
                          <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>₹ {Number(item.amount || 0).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ border: '1px solid #d1d5db', padding: '24px', textAlign: 'center', color: '#6b7280' }}>No items</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '50%' }}>
                    <table style={{ width: '100%', fontSize: '11px' }}>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #d1d5db' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>Taxable Amount:</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>₹ {Number(billData.taxable_amount || 0).toFixed(2)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #d1d5db' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>Total GST:</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>₹ {Number(billData.total_gst || 0).toFixed(2)}</td>
                        </tr>
                        <tr style={{ background: '#111', color: 'white' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold' }}>TOTAL AMOUNT:</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>₹ {Number(billData.final_amount || 0).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div style={{ borderTop: '2px solid #111', padding: '12px', textAlign: 'center', fontSize: '10px', color: '#6b7280' }}>
                Thank you for your business | This is a computer-generated document
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '48px' }}>⚠️</div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>No Bill Linked</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
                This file does not have a linked bill.<br />
                Please link a bill to this file first before printing.
              </p>
              <div className="box" style={{ marginTop: '16px', padding: '12px', background: '#fef3c7' }}>
                <strong>Instructions:</strong>
                <ol style={{ margin: '8px 0 0 20px', fontSize: '12px' }}>
                  <li>Go back to the files list</li>
                  <li>Click "Link Bill" for this file</li>
                  <li>Select or create a bill</li>
                  <li>Return here to print with bill details</li>
                </ol>
              </div>
            </div>
          )}
        </section>
        </div>
      </div>

      {/* Action Buttons - Bottom Fixed */}
      <div className="no-print fixed bottom-0 left-0 right-0 bg-gradient-to-r from-white to-gray-50 border-t-2 border-gray-300 shadow-2xl backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-5 flex justify-between items-center">
          <button
            onClick={() => router.push('/files')}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            ← Back to Files
          </button>
          <button
            onClick={handlePrint}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-10 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <span className="text-xl">🖨️</span>
            Print File
          </button>
        </div>
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
