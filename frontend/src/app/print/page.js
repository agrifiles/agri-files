// 'use client';

// import { useState } from 'react';
// import { PDFDocument, rgb } from 'pdf-lib';
// import fontkit from '@pdf-lib/fontkit';
// import 'regenerator-runtime/runtime'; // ensures async/await works in client

// export default function TestPrintPage() {
//   const [loading, setLoading] = useState(false);

//   const handleGeneratePDF = async () => {
//     try {
//       setLoading(true);

//       // 1️⃣ Create a new PDF
//       const pdfDoc = await PDFDocument.create();
//       pdfDoc.registerFontkit(fontkit);

//       const page = pdfDoc.addPage([595, 842]); // A4
//       page.setFontSize(14);

//       // 2️⃣ Load your Marathi font from public folder
//       const fontUrl = '/fonts/2.ttf'; // put TTF in public/fonts/
//       const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
//       const marathiFont = await pdfDoc.embedFont(fontBytes);

//       // 3️⃣ Draw text
//       const textColor = rgb(0.1, 0.2, 0.4);
//       page.drawText('Agri Files – Test PDF', { x: 180, y: 800, size: 18, font: marathiFont, color: textColor });
//       page.drawText('जिल्हा: Pune', { x: 50, y: 740, size: 14, font: marathiFont });
//       page.drawText('तालुजिल्हाका: Haveli', { x: 50, y: 710, size: 14, font: marathiFont });
//       page.drawText('Farmer Name: Prashant Sable', { x: 50, y: 680, size: 14, font: marathiFont });
//       page.drawText('Crop: Sugarcane', { x: 50, y: 650, size: 14, font: marathiFont });
//       page.drawText('Business Name: Agri Solutions', { x: 50, y: 620, size: 14, font: marathiFont });

//       // 4️⃣ Generate PDF bytes
//       const pdfBytes = await pdfDoc.save();

//       // 5️⃣ Trigger download
//       const blob = new Blob([pdfBytes], { type: 'application/pdf' });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = 'AgriFile_Test.pdf';
//       link.click();

//     } catch (err) {
//       console.error('PDF generation failed:', err);
//       alert('Error generating PDF. Check console.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-6 p-4">
//       <h2 className="text-2xl font-bold text-cyan-700">🧾 Test PDF Generator</h2>
//       <button
//         onClick={handleGeneratePDF}
//         disabled={loading}
//         className="px-6 py-3 bg-cyan-600 text-white rounded-full shadow-lg hover:bg-cyan-700 hover:scale-105 transition-all disabled:opacity-50"
//       >
//         {loading ? 'Generating...' : 'Generate & Download PDF'}
//       </button>
//     </div>
//   );
// }


//'use client';

// import { useContext } from 'react';
// import { LangContext } from '../layout';

// export default function TestPrintPage() {
//   const { t } = useContext(LangContext);

//   const handleGeneratePDF = async () => {
//     const pdfMakeModule = await import('pdfmake/build/pdfmake.js');
//     const pdfFontsModule = await import('pdfmake/build/vfs_fonts.js');

//     const pdfMake = pdfMakeModule.default || pdfMakeModule;
//     const pdfFonts = pdfFontsModule.default || pdfFontsModule;

//     pdfMake.vfs = pdfFonts.vfs || (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs);

//     const docDefinition = {
//       content: [
//         { text: 'Agri Files – Test PDF', style: 'header' },
//         { text: 'जिल्हा: Pune', style: 'field' },
//         { text: 'तालुका: Haveli', style: 'field' },
//         { text: 'Farmer Name: Prashant Sable', style: 'field' },
//         { text: 'Crop: Sugarcane', style: 'field' },
//         { text: 'Business Name: Agri Solutions', style: 'field' },
//       ],
//       styles: {
//         header: { fontSize: 18, bold: true, color: '#0f447a', margin: [0, 0, 0, 10] },
//         field: { fontSize: 14, margin: [0, 2, 0, 2] },
//       },
//       defaultStyle: { font: 'Roboto' },
//     };

//     pdfMake.createPdf(docDefinition).download('AgriFile_Test.pdf');
//   };

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-6">
//       <h2 className="text-2xl font-bold text-cyan-700">🧾 Test PDF Generator</h2>
//       <button
//         onClick={handleGeneratePDF}
//         className="px-6 py-3 bg-cyan-600 text-white rounded-full shadow-lg hover:bg-cyan-700 hover:scale-105 transition-all"
//       >
//         Generate & Download PDF
//       </button>
//     </div>
//   );
// }

// 'use client';

// import { useRef } from 'react';

// export default function PrintMarathiPage() {
//   const printRef = useRef();

//   const handlePrint = () => {
//     const printContents = printRef.current.innerHTML;
//     const newWindow = window.open('', '', 'width=800,height=600');
//     newWindow.document.write(`
//       <html>
//         <head>
//           <title>Print Marathi Text</title>
//           <style>
//             body { font-family: 'Noto Sans Devanagari', sans-serif; padding: 20px; }
//             h1 { color: #0f4c81; }
//             .field { margin-bottom: 10px; }
//             .label { font-weight: bold; }
//           </style>
//           <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari&display=swap" rel="stylesheet">
//         </head>
//         <body>${printContents}</body>
//       </html>
//     `);
//     newWindow.document.close();
//     newWindow.focus();
//     newWindow.print();
//     newWindow.close();
//   };

//   return (
//     <div className="p-6">
//       <div ref={printRef} className="bg-white p-6 shadow-lg rounded-lg">
//         <h1>🧾 Agri File – Test Print</h1>
//         <div className="field"><span className="label">जिल्हा:</span> Pune</div>
//         <div className="field"><span className="label">तालुका:</span> Haveli</div>
//         <div className="field"><span className="label">Farmer Name:</span> Prashant Sable</div>
//         <div className="field"><span className="label">Crop:</span> Sugarcane</div>
//         <div className="field"><span className="label">Business Name:</span> Agri Solutions</div>
//       </div>

//       <button
//         onClick={handlePrint}
//         className="mt-4 px-6 py-3 bg-cyan-600 text-white rounded-full shadow hover:bg-cyan-700"
//       >
//         Print
//       </button>
//     </div>
//   );
// }

// 'use client';

// import { useRef } from 'react';
// import html2pdf from 'html2pdf.js';

// export default function PrintPDFButton() {
//   const printRef = useRef();

//   const handleGeneratePDF = () => {
//     // Build HTML content as a string (hidden from page)
//     const content = `
//       <div style="font-family: 'Noto Sans Devanagari', sans-serif; padding: 20px;">
//         <h1 style="text-align:center; color:#0f4c81;">🧾 Agri File – Test Print</h1>
//         <p><strong>जिल्हाd:</strong> Pune</p>
//         <p><strong>तालुका:</strong> Haveli</p>
//         <p><strong>Farmer Name:</strong> Prashant Sable</p>
//         <p><strong>Crop:</strong> Sugarcane</p>
//         <p><strong>Business Name:</strong> Agri Solutions</p>
//       </div>
//     `;

//     const opt = {
//       margin: 10,
//       filename: 'AgriFile_Test.pdf',
//       image: { type: 'jpeg', quality: 0.98 },
//       html2canvas: { scale: 2, letterRendering: true },
//       jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
//     };

//     html2pdf().from(content).set(opt).save();
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center">
//       <button
//         onClick={handleGeneratePDF}
//         className="px-6 py-3 bg-cyan-600 text-white rounded-full shadow-lg hover:bg-cyan-700 hover:scale-105 transition-all"
//       >
//         Generate & Download PDF
//       </button>
//     </div>
//   );
// }




// 'use client';

// import { useRef } from 'react';

// export default function PrintTestPage() {
//   const contentRef = useRef();

//   const handlePrint = () => {
//     const printContent = contentRef.current;
//     if (!printContent) {
//       console.error('No content to print!');
//       return;
//     }

//     const iframe = document.createElement('iframe');
//     iframe.style.display = 'none';
//     document.body.appendChild(iframe);

//     const doc = iframe.contentDocument || iframe.contentWindow.document;
//     doc.open();
//     doc.write(`
//       <html>
//       <head>
//         <title>Print PDF</title>
//         <style>
//           @media print {
//             body { margin: 0; font-family: "Noto Sans Devanagari", sans-serif; }
//             .page { page-break-after: always; width: 210mm; height: 297mm; padding: 20mm; box-sizing: border-box; position: relative; overflow: hidden; }
//             .page-inner { border: 2px solid #0b3d91; padding: 15mm; height: 100%; box-sizing: border-box; }
//             .page img { display: block; margin: 0 auto; width: 80px; height: auto; }
//             .page-number { position: absolute; bottom: 15mm; right: 15mm; font-size: 12px; }
//           }
//           .page { width: 210mm; height: 297mm; padding: 20mm; box-sizing: border-box; position: relative; overflow: hidden; }
//           .page-inner { border: 2px solid #0b3d91; padding: 15mm; height: 100%; box-sizing: border-box; }
//           h1 { font-size: 24px; color: #0b3d91; text-align: center; margin: 12px 0; }
//           h2 { font-size: 18px; color: #0b3d91; text-align: center; margin: 8px 0; }
//           p { font-size: 16px; line-height: 1.5; margin: 6px 0; text-align: justify; }
//         </style>
//       </head>
//       <body>
//         ${printContent.innerHTML}
//       </body>
//       </html>
//     `);
//     doc.close();

//     setTimeout(() => {
//       iframe.contentWindow.focus();
//       iframe.contentWindow.print();
//       document.body.removeChild(iframe);
//     }, 500);
//   };

//   const marathiText = `
//     हा एक नमुना मजकूर आहे जो पान भरून ठेवण्यासाठी वापरला जातो. 
//     येथे विविध माहिती, तपशील आणि विवरण भरलेले आहेत. 
//     हा मजकूर फक्त परीक्षणासाठी आहे.
//   `;

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-6 p-4">
//       <h2 className="text-2xl font-bold text-cyan-700">🖨️ Print Marathi PDF Test</h2>
//       <button
//         onClick={handlePrint}
//         className="px-6 py-3 bg-cyan-600 text-white rounded-full shadow-lg hover:bg-cyan-700 hover:scale-105 transition-all"
//       >
//         Print PDF
//       </button>

//       <div ref={contentRef} style={{ display: 'none' }}>
//         {/* Page 1 */}
//         <div className="page">
//           <div className="page-inner">
//             <h1>भारत सरकार</h1>
//             <h2>राष्ट्रीय प्रतीक</h2>
//             <img src="/bharat.png" alt="National Emblem" />
//             <h2>कृषी विभाग - नमुना फॉर्म</h2>
//             {[...Array(10)].map((_, i) => (
//               <p key={i}>{marathiText}</p>
//             ))}
//             <div className="page-number">Page 1</div>
//           </div>
//         </div>

//         {/* Page 2 */}
//         <div className="page">
//           <div className="page-inner">
//             <h1>कृषी माहिती</h1>
//             {[...Array(25)].map((_, i) => (
//               <p key={i}>{marathiText}</p>
//             ))}
//             <div className="page-number">Page 2</div>
//           </div>
//         </div>

//         {/* Page 3 */}
//         <div className="page">
//           <div className="page-inner">
//             <h1>बिल माहिती</h1>
//             {[...Array(30)].map((_, i) => (
//               <p key={i}>{marathiText}</p>
//             ))}
//             <div className="page-number">Page 3</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// import { PDFDocument, rgb } from 'pdf-lib';
// import fontkit from '@pdf-lib/fontkit';
// import 'regenerator-runtime/runtime';

// async function generatePDF() {
//   const pdfDoc = await PDFDocument.create();
//   pdfDoc.registerFontkit(fontkit);

//   const fontBytes = await fetch('/fonts/NotoSansDevanagari-Regular.ttf').then(r => r.arrayBuffer());
//   const marathiFont = await pdfDoc.embedFont(fontBytes);

//   const emblemBytes = await fetch('/images/bharat.png').then(r => r.arrayBuffer());
//   const emblemImage = await pdfDoc.embedPng(emblemBytes);

//   const pagesContent = [
//     { title: 'भारत सरकार', subtitle: 'राष्ट्रीय प्रतीक', paragraphs: 10 },
//     { title: 'कृषी माहिती', paragraphs: 25 },
//     { title: 'बिल माहिती', paragraphs: 30 },
//   ];

//   for (let i = 0; i < pagesContent.length; i++) {
//     const page = pdfDoc.addPage([595, 842]); // A4
//     const { width, height } = page.getSize();

//     // Optional: border
//     page.drawRectangle({ x: 20, y: 20, width: width-40, height: height-40, borderColor: rgb(0,0,0), borderWidth: 2 });

//     let y = height - 60;

//     // First page emblem
//     if (i === 0) {
//       page.drawImage(emblemImage, { x: width/2 - 40, y: y-80, width: 80, height: 80 });
//       y -= 100;
//     }

//     page.drawText(pagesContent[i].title, { x: 50, y, size: 22, font: marathiFont, color: rgb(0,0.2,0.5) });
//     y -= 30;

//     if (pagesContent[i].subtitle) {
//       page.drawText(pagesContent[i].subtitle, { x: 50, y, size: 16, font: marathiFont });
//       y -= 30;
//     }

//     for (let p = 0; p < pagesContent[i].paragraphs; p++) {
//       page.drawText(`हा एक नमुना मजकूर आहे - ${p+1}`, { x: 50, y, size: 14, font: marathiFont });
//       y -= 18;
//       if (y < 50) break; // simple line wrap for demo
//     }

//     // Page number
//     page.drawText(`Page ${i+1}`, { x: width - 80, y: 30, size: 12, font: marathiFont });
//   }

//   const pdfBytes = await pdfDoc.save();
//   const blob = new Blob([pdfBytes], { type: 'application/pdf' });
//   const link = document.createElement('a');
//   link.href = URL.createObjectURL(blob);
//   link.download = 'AgriForm.pdf';
//   link.click();
// }


// 'use client';

// import { useState } from 'react';
// import { Stage, Layer, Rect, Circle, Line, Group } from 'react-konva';

// export default function GraphDrawTest() {
//   const [shapes, setShapes] = useState([]);
//   const [tool, setTool] = useState('rect'); // current selected tool

//   const handleAddShape = () => {
//     const newShape = {
//       id: Date.now(),
//       type: tool,
//       x: 100,
//       y: 100,
//       width: 100,
//       height: 60,
//       radius: 40,
//       points: [50, 50, 150, 150],
//       stroke: 'black',
//       strokeWidth: 2,
//     };
//     setShapes([...shapes, newShape]);
//   };

//   const handleDragEnd = (id, e) => {
//     const newShapes = shapes.map((s) => {
//       if (s.id === id) {
//         return { ...s, x: e.target.x(), y: e.target.y() };
//       }
//       return s;
//     });
//     setShapes(newShapes);
//   };

//   const handleSave = () => {
//     console.log('Exported Shapes:', JSON.stringify(shapes, null, 2));
//     alert('Shapes data logged in console!');
//   };

//   // Graph paper lines
//   const gridSize = 20;
//   const gridLines = [];
//   for (let i = 0; i < 800; i += gridSize) {
//     gridLines.push(<Line key={`v${i}`} points={[i, 0, i, 600]} stroke="#ddd" strokeWidth={1} />);
//     gridLines.push(<Line key={`h${i}`} points={[0, i, 800, i]} stroke="#ddd" strokeWidth={1} />);
//   }

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 p-4 space-y-4">
//       <h2 className="text-2xl font-bold text-cyan-700 mb-2">Interactive Graph Drawing</h2>

//       {/* Toolbar */}
//       <div className="flex space-x-4 mb-2">
//         <button
//           onClick={() => setTool('rect')}
//           className={`px-4 py-2 border ${tool === 'rect' ? 'border-cyan-600' : 'border-gray-400'}`}
//         >
//           Rectangle
//         </button>
//         <button
//           onClick={() => setTool('circle')}
//           className={`px-4 py-2 border ${tool === 'circle' ? 'border-cyan-600' : 'border-gray-400'}`}
//         >
//           Circle
//         </button>
//         <button
//           onClick={() => setTool('line')}
//           className={`px-4 py-2 border ${tool === 'line' ? 'border-cyan-600' : 'border-gray-400'}`}
//         >
//           Line
//         </button>
//         <button
//           onClick={handleAddShape}
//           className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
//         >
//           Add Shape
//         </button>
//         <button
//           onClick={handleSave}
//           className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
//         >
//           Save Shapes
//         </button>
//       </div>

//       {/* Stage */}
//       <Stage width={800} height={600} className="border border-gray-400 shadow-lg">
//         <Layer>
//           {/* Draw grid */}
//           {gridLines}

//           {/* Draw shapes */}
//           {shapes.map((s) => {
//             if (s.type === 'rect')
//               return (
//                 <Rect
//                   key={s.id}
//                   x={s.x}
//                   y={s.y}
//                   width={s.width}
//                   height={s.height}
//                   stroke={s.stroke}
//                   strokeWidth={s.strokeWidth}
//                   draggable
//                   onDragEnd={(e) => handleDragEnd(s.id, e)}
//                 />
//               );
//             if (s.type === 'circle')
//               return (
//                 <Circle
//                   key={s.id}
//                   x={s.x}
//                   y={s.y}
//                   radius={s.radius}
//                   stroke={s.stroke}
//                   strokeWidth={s.strokeWidth}
//                   draggable
//                   onDragEnd={(e) => handleDragEnd(s.id, e)}
//                 />
//               );
//             if (s.type === 'line')
//               return (
//                 <Line
//                   key={s.id}
//                   points={s.points.map((p, i) => (i % 2 === 0 ? p + s.x : p + s.y))}
//                   stroke={s.stroke}
//                   strokeWidth={s.strokeWidth}
//                   draggable
//                   onDragEnd={(e) => handleDragEnd(s.id, e)}
//                 />
//               );
//             return null;
//           })}
//         </Layer>
//       </Stage>
//     </div>
//   );
// }


// 'use client';

// import { useState, useRef } from 'react';
// import { Stage, Layer, Rect, Circle, Line, Image as KImage, Transformer } from 'react-konva';
// import useImage from 'use-image';

// function DraggableShape({ shape, isSelected, onSelect, onChange }) {
//   const shapeRef = useRef();
//   const trRef = useRef();

//   // For images
//   const [img] = useImage(shape.src || null);

//   // Attach transformer if selected
//   if (isSelected && trRef.current && shapeRef.current) {
//     trRef.current.nodes([shapeRef.current]);
//     trRef.current.getLayer().batchDraw();
//   }

//   const commonProps = {
//     ref: shapeRef,
//     x: shape.x,
//     y: shape.y,
//     stroke: 'black',
//     strokeWidth: 2,
//     draggable: true,
//     onClick: onSelect,
//     onTap: onSelect,
//     onDragEnd: (e) => onChange({ ...shape, x: e.target.x(), y: e.target.y() }),
//     onTransformEnd: () => {
//       const node = shapeRef.current;
//       if (shape.type === 'rect') {
//         onChange({
//           ...shape,
//           x: node.x(),
//           y: node.y(),
//           width: node.width() * node.scaleX(),
//           height: node.height() * node.scaleY(),
//         });
//       } else if (shape.type === 'circle') {
//         onChange({
//           ...shape,
//           x: node.x(),
//           y: node.y(),
//           radius: node.radius() * node.scaleX(),
//         });
//       } else if (shape.type === 'line') {
//         // For line, scale transform is tricky, skipping scaling for line
//       } else if (shape.type === 'image') {
//         onChange({
//           ...shape,
//           x: node.x(),
//           y: node.y(),
//           width: node.width() * node.scaleX(),
//           height: node.height() * node.scaleY(),
//         });
//       }
//       node.scaleX(1);
//       node.scaleY(1);
//     },
//   };

//   switch (shape.type) {
//     case 'rect':
//       return (
//         <>
//           <Rect {...commonProps} width={shape.width} height={shape.height} />
//           {isSelected && <Transformer ref={trRef} />}
//         </>
//       );
//     case 'circle':
//       return (
//         <>
//           <Circle {...commonProps} radius={shape.radius} />
//           {isSelected && <Transformer ref={trRef} />}
//         </>
//       );
//     case 'line':
//       return <Line {...commonProps} points={shape.points} />;
//     case 'image':
//       return (
//         <>
//           <KImage {...commonProps} image={img} width={shape.width} height={shape.height} />
//           {isSelected && <Transformer ref={trRef} />}
//         </>
//       );
//     default:
//       return null;
//   }
// }

// export default function InteractiveGraph() {
//   const [shapes, setShapes] = useState([]);
//   const [selectedId, setSelectedId] = useState(null);
//   const [tool, setTool] = useState('rect');

//   const handleAddShape = () => {
//     const id = Date.now();
//     let newShape = { id, type: tool, x: 50, y: 50, stroke: 'black' };

//     switch (tool) {
//       case 'rect':
//         newShape = { ...newShape, width: 100, height: 60 };
//         break;
//       case 'circle':
//         newShape = { ...newShape, radius: 40 };
//         break;
//       case 'line':
//         newShape = { ...newShape, points: [0, 0, 100, 100] };
//         break;
//       case 'image':
//         newShape = { ...newShape, src: '/valve.png', width: 50, height: 50 };
//         break;
//       default:
//         break;
//     }
//     setShapes([...shapes, newShape]);
//   };

//   const handleChangeShape = (updatedShape) => {
//     const updated = shapes.map((s) => (s.id === updatedShape.id ? updatedShape : s));
//     setShapes(updated);
//   };

//   const handleSave = () => {
//     console.log('Saved shapes:', JSON.stringify(shapes, null, 2));
//     alert('Shapes data logged in console');
//   };

//   // Graph paper
//   const gridSize = 20;
//   const gridLines = [];
//   for (let i = 0; i < 800; i += gridSize) {
//     gridLines.push(<Line key={`v${i}`} points={[i, 0, i, 600]} stroke="#eee" strokeWidth={1} />);
//     gridLines.push(<Line key={`h${i}`} points={[0, i, 800, i]} stroke="#eee" strokeWidth={1} />);
//   }

//   return (
//     <div className="p-4 flex flex-col items-center space-y-4">
//       <h2 className="text-2xl font-bold text-cyan-700">Interactive Graph with Shapes & Images</h2>

//       <div className="flex space-x-4 mb-2">
//         <button onClick={() => setTool('rect')} className={`px-4 py-2 border ${tool === 'rect' ? 'border-cyan-600' : 'border-gray-400'}`}>Rectangle</button>
//         <button onClick={() => setTool('circle')} className={`px-4 py-2 border ${tool === 'circle' ? 'border-cyan-600' : 'border-gray-400'}`}>Circle</button>
//         <button onClick={() => setTool('line')} className={`px-4 py-2 border ${tool === 'line' ? 'border-cyan-600' : 'border-gray-400'}`}>Line</button>
//         <button onClick={() => setTool('image')} className={`px-4 py-2 border ${tool === 'image' ? 'border-cyan-600' : 'border-gray-400'}`}>Image</button>
//         <button onClick={handleAddShape} className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700">Add</button>
//         <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Save</button>
//       </div>

//       <Stage width={800} height={600} className="border border-gray-400 shadow-lg">
//         <Layer>
//           {gridLines}
//           {shapes.map((s) => (
//             <DraggableShape
//               key={s.id}
//               shape={s}
//               isSelected={s.id === selectedId}
//               onSelect={() => setSelectedId(s.id)}
//               onChange={handleChangeShape}
//             />
//           ))}
//         </Layer>
//       </Stage>
//     </div>
//   );
// }

// 'use client';

// import { useState, useRef, useEffect } from 'react';
// import { Stage, Layer, Rect, Circle, Line, Image, Transformer } from 'react-konva';
// import useImage from 'use-image';

// export default function GraphTool() {
//   const stageRef = useRef(null);
//   const trRef = useRef(null);

//   // shapes on canvas
//   const [shapes, setShapes] = useState([]);
//   const [selectedId, setSelectedId] = useState(null);
//   const [tool, setTool] = useState('select'); // circle, rect, line, image
//   const [img] = useImage('/valve.png'); // example icon, put in public folder

//   // add new shape on click
//   const handleStageClick = (e) => {
//     // ignore if clicking on shape
//     if (e.target === e.target.getStage()) {
//       setSelectedId(null);
//       return;
//     }
//   };

//   const addShape = (type) => {
//     const id = `shape_${shapes.length + 1}`;
//     const newShape = { id, type, x: 100, y: 100, width: 80, height: 80, radius: 40, points: [50, 50, 150, 150], rotation: 0 };
//     setShapes((prev) => [...prev, newShape]);
//     setSelectedId(id);
//   };

//   const handleDragEnd = (id, e) => {
//     const { x, y } = e.target.position();
//     setShapes((prev) => prev.map(s => s.id === id ? { ...s, x, y } : s));
//   };

//   const handleTransformEnd = (id, node) => {
//     const scaleX = node.scaleX();
//     const scaleY = node.scaleY();
//     node.scaleX(1);
//     node.scaleY(1);

//     setShapes((prev) =>
//       prev.map(s => {
//         if (s.id === id) {
//           if (s.type === 'rect' || s.type === 'image') {
//             return {
//               ...s,
//               x: node.x(),
//               y: node.y(),
//               width: Math.max(5, node.width() * scaleX),
//               height: Math.max(5, node.height() * scaleY),
//               rotation: node.rotation()
//             };
//           }
//           if (s.type === 'circle') {
//             return {
//               ...s,
//               x: node.x(),
//               y: node.y(),
//               radius: Math.max(5, s.radius * scaleX),
//               rotation: node.rotation()
//             };
//           }
//           if (s.type === 'line') {
//             return { ...s, points: node.points() };
//           }
//         }
//         return s;
//       })
//     );
//   };

//   const handleDelete = () => {
//     if (selectedId) {
//       setShapes((prev) => prev.filter(s => s.id !== selectedId));
//       setSelectedId(null);
//     }
//   };

//   // attach transformer
//   useEffect(() => {
//     if (trRef.current && selectedId) {
//       const stage = stageRef.current;
//       const selectedNode = stage.findOne(`#${selectedId}`);
//       if (selectedNode) {
//         trRef.current.nodes([selectedNode]);
//         trRef.current.getLayer().batchDraw();
//       }
//     } else if (trRef.current) {
//       trRef.current.nodes([]);
//       trRef.current.getLayer().batchDraw();
//     }
//   }, [selectedId, shapes]);

//   return (
//     <div className="flex flex-col items-center p-4">
//       <h2 className="text-2xl font-bold text-cyan-700 mb-4">Graph Tool Test</h2>

//       {/* Toolbar */}
//       <div className="flex space-x-2 mb-4">
//         <button onClick={() => addShape('circle')} className="px-3 py-1 bg-blue-500 text-white rounded">Circle</button>
//         <button onClick={() => addShape('rect')} className="px-3 py-1 bg-green-500 text-white rounded">Rectangle</button>
//         <button onClick={() => addShape('line')} className="px-3 py-1 bg-yellow-500 text-white rounded">Line</button>
//         <button onClick={() => addShape('image')} className="px-3 py-1 bg-purple-500 text-white rounded">Image</button>
//         <button onClick={handleDelete} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
//       </div>

//       {/* Stage */}
//       <Stage
//         width={800}
//         height={600}
//         ref={stageRef}
//         onMouseDown={handleStageClick}
//         style={{ border: '2px solid #ccc', backgroundSize: '20px 20px', backgroundImage: 'linear-gradient(to right, #eee 1px, transparent 1px), linear-gradient(to bottom, #eee 1px, transparent 1px)' }}
//       >
//         <Layer>
//           {shapes.map((s) => {
//             if (s.type === 'circle') {
//               return (
//                 <Circle
//                   key={s.id}
//                   id={s.id}
//                   x={s.x}
//                   y={s.y}
//                   radius={s.radius}
//                   stroke="blue"
//                   strokeWidth={2}
//                   fill="transparent"
//                   draggable
//                   rotation={s.rotation}
//                   onClick={() => setSelectedId(s.id)}
//                   onTap={() => setSelectedId(s.id)}
//                   onDragEnd={(e) => handleDragEnd(s.id, e)}
//                   onTransformEnd={(e) => handleTransformEnd(s.id, e.target)}
//                 />
//               );
//             } else if (s.type === 'rect') {
//               return (
//                 <Rect
//                   key={s.id}
//                   id={s.id}
//                   x={s.x}
//                   y={s.y}
//                   width={s.width}
//                   height={s.height}
//                   stroke="green"
//                   strokeWidth={2}
//                   fill="transparent"
//                   draggable
//                   rotation={s.rotation}
//                   onClick={() => setSelectedId(s.id)}
//                   onTap={() => setSelectedId(s.id)}
//                   onDragEnd={(e) => handleDragEnd(s.id, e)}
//                   onTransformEnd={(e) => handleTransformEnd(s.id, e.target)}
//                 />
//               );
//             } else if (s.type === 'line') {
//               return (
//                 <Line
//                   key={s.id}
//                   id={s.id}
//                   points={s.points}
//                   stroke="orange"
//                   strokeWidth={2}
//                   draggable
//                   onClick={() => setSelectedId(s.id)}
//                   onTap={() => setSelectedId(s.id)}
//                   onDragEnd={(e) => handleDragEnd(s.id, e)}
//                   onTransformEnd={(e) => handleTransformEnd(s.id, e.target)}
//                 />
//               );
//             } else if (s.type === 'image') {
//               return (
//                 <Image
//                   key={s.id}
//                   id={s.id}
//                   x={s.x}
//                   y={s.y}
//                   width={s.width}
//                   height={s.height}
//                   image={img}
//                   draggable
//                   rotation={s.rotation}
//                   onClick={() => setSelectedId(s.id)}
//                   onTap={() => setSelectedId(s.id)}
//                   onDragEnd={(e) => handleDragEnd(s.id, e)}
//                   onTransformEnd={(e) => handleTransformEnd(s.id, e.target)}
//                 />
//               );
//             }
//             return null;
//           })}
//           <Transformer
//             ref={trRef}
//             rotateEnabled={true}
//             anchorSize={8}
//             borderStroke="black"
//             borderDash={[4, 4]}
//           />
//         </Layer>
//       </Stage>

//       {/* Export / Console Button */}
//       <button
//         onClick={() => console.log('Exported Data:', shapes)}
//         className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded"
//       >
//         Export Data (Console)
//       </button>
//     </div>
//   );
// }


// 'use client';

// import { useState, useRef, useEffect } from 'react';
// import { Stage, Layer, Rect, Circle, Line, Image, Transformer } from 'react-konva';
// import useImage from 'use-image';

// export default function GraphTool() {
//   const stageRef = useRef(null);
//   const trRef = useRef(null);
//   const [img] = useImage('/valve.png'); // place your image in public/

//   const [shapes, setShapes] = useState([]);
//   const [selectedId, setSelectedId] = useState(null);
//   const [tool, setTool] = useState(null); // 'circle' | 'rect' | 'line' | 'image'
//   const [isDrawing, setIsDrawing] = useState(false);
//   const [currentLine, setCurrentLine] = useState(null);

//   // add shape except line
//   const addShape = (type) => {
//     if (type === 'line') {
//       setTool('line');
//       return;
//     }
//     const id = `shape_${Date.now()}`;
//     const newShape = {
//       id,
//       type,
//       x: 120,
//       y: 100,
//       width: 100,
//       height: 80,
//       radius: 40,
//       rotation: 0,
//     };
//     setShapes((prev) => [...prev, newShape]);
//     setSelectedId(id);
//   };

//   // ------------------ DRAWING LOGIC ------------------
//   const handleMouseDown = (e) => {
//     const stage = e.target.getStage();
//     const pos = stage.getPointerPosition();

//     // start line drawing
//     if (tool === 'line') {
//       const id = `shape_${Date.now()}`;
//       const newLine = {
//         id,
//         type: 'line',
//         points: [pos.x, pos.y, pos.x, pos.y],
//         stroke: 'orange',
//         strokeWidth: 2,
//         draggable: false,
//       };
//       setShapes((prev) => [...prev, newLine]);
//       setCurrentLine(id);
//       setIsDrawing(true);
//       return;
//     }

//     // deselect if clicked on empty area
//     if (e.target === stage) setSelectedId(null);
//   };

//   const handleMouseMove = (e) => {
//     if (!isDrawing || !currentLine) return;
//     const stage = e.target.getStage();
//     const pos = stage.getPointerPosition();

//     setShapes((prev) =>
//       prev.map((s) =>
//         s.id === currentLine
//           ? { ...s, points: [s.points[0], s.points[1], pos.x, pos.y] }
//           : s
//       )
//     );
//   };

//   const handleMouseUp = () => {
//     if (isDrawing) {
//       setIsDrawing(false);
//       setCurrentLine(null);
//       setTool(null);
//     }
//   };

//   // ------------------ SHAPE CONTROL ------------------
//   const handleDragEnd = (id, e) => {
//     const { x, y } = e.target.position();
//     setShapes((prev) =>
//       prev.map((s) => (s.id === id ? { ...s, x, y } : s))
//     );
//   };

//   const handleTransformEnd = (id, node) => {
//     const scaleX = node.scaleX();
//     const scaleY = node.scaleY();
//     node.scaleX(1);
//     node.scaleY(1);

//     setShapes((prev) =>
//       prev.map((s) => {
//         if (s.id === id) {
//           if (s.type === 'rect' || s.type === 'image') {
//             return {
//               ...s,
//               x: node.x(),
//               y: node.y(),
//               width: Math.max(5, node.width() * scaleX),
//               height: Math.max(5, node.height() * scaleY),
//               rotation: node.rotation(),
//             };
//           }
//           if (s.type === 'circle') {
//             return {
//               ...s,
//               x: node.x(),
//               y: node.y(),
//               radius: Math.max(5, s.radius * scaleX),
//               rotation: node.rotation(),
//             };
//           }
//         }
//         return s;
//       })
//     );
//   };

//   const handleDelete = () => {
//     if (selectedId) {
//       setShapes((prev) => prev.filter((s) => s.id !== selectedId));
//       setSelectedId(null);
//     }
//   };

//   // ------------------ TRANSFORMER LOGIC ------------------
//   useEffect(() => {
//     const transformer = trRef.current;
//     if (!transformer) return;

//     const stage = stageRef.current;
//     const selectedNode = stage.findOne(`#${selectedId}`);
//     if (selectedNode) {
//       transformer.nodes([selectedNode]);
//       transformer.getLayer().batchDraw();
//     } else {
//       transformer.nodes([]);
//       transformer.getLayer().batchDraw();
//     }
//   }, [selectedId, shapes]);

//   // ------------------ RENDER ------------------
//   return (
//     <div className="flex flex-col items-center p-4">
//       <h2 className="text-2xl font-bold text-cyan-700 mb-4">
//         Graph Tool – Stroke-only Selectable Shapes
//       </h2>

//       {/* Toolbar */}
//       <div className="flex space-x-2 mb-4">
//         <button onClick={() => addShape('circle')} className="px-3 py-1 bg-blue-500 text-white rounded">Circle</button>
//         <button onClick={() => addShape('rect')} className="px-3 py-1 bg-green-500 text-white rounded">Rectangle</button>
//         <button onClick={() => addShape('line')} className={`px-3 py-1 ${tool === 'line' ? 'bg-orange-700' : 'bg-orange-500'} text-white rounded`}>
//           Draw Line
//         </button>
//         <button onClick={() => addShape('image')} className="px-3 py-1 bg-purple-500 text-white rounded">Image</button>
//         <button onClick={handleDelete} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
//       </div>

//       {/* Canvas */}
//       <Stage
//         width={900}
//         height={600}
//         ref={stageRef}
//         onMouseDown={handleMouseDown}
//         onMouseMove={handleMouseMove}
//         onMouseUp={handleMouseUp}
//         style={{
//           border: '2px solid #ccc',
//           backgroundSize: '20px 20px',
//           backgroundImage:
//             'linear-gradient(to right, #eee 1px, transparent 1px), linear-gradient(to bottom, #eee 1px, transparent 1px)',
//           cursor: tool === 'line' ? 'crosshair' : 'default',
//         }}
//       >
//         <Layer>
//           {shapes.map((s) => {
//             const commonProps = {
//               key: s.id,
//               id: s.id,
//               draggable: s.type !== 'line',
//               onClick: () => setSelectedId(s.id),
//               onDragEnd: (e) => handleDragEnd(s.id, e),
//               onTransformEnd: (e) => handleTransformEnd(s.id, e.target),
//               hitStrokeWidth: 20, // 👈 Makes stroke easier to click
//               listening: true,
//             };

//             if (s.type === 'circle')
//               return <Circle {...commonProps} x={s.x} y={s.y} radius={s.radius} stroke="blue" strokeWidth={2} fillEnabled={false} />;
//             if (s.type === 'rect')
//               return <Rect {...commonProps} x={s.x} y={s.y} width={s.width} height={s.height} stroke="green" strokeWidth={2} fillEnabled={false} />;
//             if (s.type === 'line')
//               return <Line {...commonProps} points={s.points} stroke={s.stroke} strokeWidth={s.strokeWidth} />;
//             if (s.type === 'image')
//               return <Image {...commonProps} x={s.x} y={s.y} width={s.width} height={s.height} image={img} />;

//             return null;
//           })}

//           <Transformer ref={trRef} rotateEnabled={true} anchorSize={8} borderStroke="black" borderDash={[4, 4]} />
//         </Layer>
//       </Stage>

//       <button
//         onClick={() => console.log('Exported Shapes:', shapes)}
//         className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded"
//       >
//         Export Data (Console)
//       </button>
//     </div>
//   );
// }




// 'use client';

// import { useState, useRef, useEffect } from 'react';
// import { Stage, Layer, Rect, Circle, Line, Image, Transformer } from 'react-konva';
// import useImage from 'use-image';

// export default function FarmLayoutTool() {
//   const stageRef = useRef(null);
//   const trRef = useRef(null);

//   // Load images (place them in /public)
//   const [valveImg] = useImage('/valve.png');
//   const [filterImg] = useImage('/screen_filter.png');
//   const [flushImg] = useImage('/flush_valve.png');

//   const [shapes, setShapes] = useState([]);
//   const [selectedId, setSelectedId] = useState(null);
//   const [tool, setTool] = useState(null);
//   const [isDrawing, setIsDrawing] = useState(false);
//   const [currentLine, setCurrentLine] = useState(null);
//   const [lang, setLang] = useState('en'); // 'en' or 'mr'

//   // ---------------- LOCALIZATION ----------------
//   const t = (key) => {
//     const dict = {
//       en: {
//         title: 'Farm Layout Designer',
//         well: 'Well',
//         mainPipe: 'Main Pipe',
//         lateralPipe: 'Lateral Pipe',
//         border: 'Farm Border',
//         valve: 'Valve',
//         filter: 'Screen Filter',
//         flush: 'Flush Valve',
//         delete: 'Delete',
//         export: 'Export Data (Console)',
//       },
//       mr: {
//         title: 'शेती आराखडा रेखाचित्र',
//         well: 'विहीर',
//         mainPipe: 'मुख्य नळी',
//         lateralPipe: 'लॅटरल नळी',
//         border: 'शेताची सीमारेषा',
//         valve: 'व्हॉल्व',
//         filter: 'स्क्रीन फिल्टर',
//         flush: 'फ्लश व्हॉल्व',
//         delete: 'काढून टाका',
//         export: 'माहिती निर्यात करा (कन्सोल)',
//       },
//     };
//     return dict[lang][key];
//   };

//   // ---------------- SHAPE ADDING ----------------
//   const addShape = (type) => {
//     if (type.includes('pipe')) {
//       setTool(type);
//       return;
//     }

//     const id = `shape_${Date.now()}`;
//     const newShape = {
//       id,
//       type,
//       x: 120,
//       y: 100,
//       width: 100,
//       height: 80,
//       radius: 40,
//       rotation: 0,
//     };
//     setShapes((prev) => [...prev, newShape]);
//     setSelectedId(id);
//   };

//   // ---------------- DRAWING LOGIC ----------------
//   const handleMouseDown = (e) => {
//     const stage = e.target.getStage();
//     const pos = stage.getPointerPosition();

//     if (tool === 'main_pipe' || tool === 'lateral_pipe') {
//       const id = `shape_${Date.now()}`;
//       const newLine = {
//         id,
//         type: tool,
//         points: [pos.x, pos.y, pos.x, pos.y],
//         stroke: tool === 'main_pipe' ? 'orange' : 'blue',
//         strokeWidth: tool === 'main_pipe' ? 3 : 2,
//         dash: tool === 'lateral_pipe' ? [10, 5] : [],
//         draggable: false,
//       };
//       setShapes((prev) => [...prev, newLine]);
//       setCurrentLine(id);
//       setIsDrawing(true);
//       return;
//     }

//     if (e.target === stage) setSelectedId(null);
//   };

//   const handleMouseMove = (e) => {
//     if (!isDrawing || !currentLine) return;
//     const stage = e.target.getStage();
//     const pos = stage.getPointerPosition();

//     setShapes((prev) =>
//       prev.map((s) =>
//         s.id === currentLine
//           ? { ...s, points: [s.points[0], s.points[1], pos.x, pos.y] }
//           : s
//       )
//     );
//   };

//   const handleMouseUp = () => {
//     if (isDrawing) {
//       setIsDrawing(false);
//       setCurrentLine(null);
//       setTool(null);
//     }
//   };

//   // ---------------- EDIT / TRANSFORM ----------------
//   const handleDragEnd = (id, e) => {
//     const { x, y } = e.target.position();
//     setShapes((prev) =>
//       prev.map((s) => (s.id === id ? { ...s, x, y } : s))
//     );
//   };

//   const handleTransformEnd = (id, node) => {
//     const scaleX = node.scaleX();
//     const scaleY = node.scaleY();
//     node.scaleX(1);
//     node.scaleY(1);

//     setShapes((prev) =>
//       prev.map((s) => {
//         if (s.id === id) {
//           if (s.type === 'border' || s.type.includes('image')) {
//             return {
//               ...s,
//               x: node.x(),
//               y: node.y(),
//               width: Math.max(5, node.width() * scaleX),
//               height: Math.max(5, node.height() * scaleY),
//               rotation: node.rotation(),
//             };
//           }
//           if (s.type === 'well') {
//             return {
//               ...s,
//               x: node.x(),
//               y: node.y(),
//               radius: Math.max(5, s.radius * scaleX),
//               rotation: node.rotation(),
//             };
//           }
//         }
//         return s;
//       })
//     );
//   };

//   const handleDelete = () => {
//     if (selectedId) {
//       setShapes((prev) => prev.filter((s) => s.id !== selectedId));
//       setSelectedId(null);
//     }
//   };

//   // ---------------- TRANSFORMER ----------------
//   useEffect(() => {
//     const transformer = trRef.current;
//     if (!transformer) return;
//     const stage = stageRef.current;
//     const selectedNode = stage.findOne(`#${selectedId}`);
//     if (selectedNode) {
//       transformer.nodes([selectedNode]);
//       transformer.getLayer().batchDraw();
//     } else {
//       transformer.nodes([]);
//       transformer.getLayer().batchDraw();
//     }
//   }, [selectedId, shapes]);

//   // ---------------- RENDER ----------------
//   return (
//     <div className="flex flex-col items-center p-4">
//       <h2 className="text-2xl font-bold text-cyan-700 mb-4">{t('title')}</h2>

//       {/* Language Toggle */}
//       <div className="mb-4 flex items-center gap-2">
//         <span className="text-sm font-medium text-gray-600">🌐</span>
//         <button
//           className={`px-2 py-1 rounded ${lang === 'en' ? 'bg-cyan-600 text-white' : 'bg-gray-200'}`}
//           onClick={() => setLang('en')}
//         >
//           English
//         </button>
//         <button
//           className={`px-2 py-1 rounded ${lang === 'mr' ? 'bg-cyan-600 text-white' : 'bg-gray-200'}`}
//           onClick={() => setLang('mr')}
//         >
//           मराठी
//         </button>
//       </div>

//       {/* Toolbar */}
//       <div className="flex flex-wrap justify-center gap-2 mb-4">
//         <button onClick={() => addShape('well')} className="px-3 py-1 bg-blue-500 text-white rounded">{t('well')}</button>
//         <button onClick={() => addShape('main_pipe')} className="px-3 py-1 bg-orange-500 text-white rounded">{t('mainPipe')}</button>
//         <button onClick={() => addShape('lateral_pipe')} className="px-3 py-1 bg-sky-500 text-white rounded">{t('lateralPipe')}</button>
//         <button onClick={() => addShape('border')} className="px-3 py-1 bg-green-600 text-white rounded">{t('border')}</button>
//         <button onClick={() => addShape('valve_image')} className="px-3 py-1 bg-purple-500 text-white rounded">{t('valve')}</button>
//         <button onClick={() => addShape('filter_image')} className="px-3 py-1 bg-teal-600 text-white rounded">{t('filter')}</button>
//         <button onClick={() => addShape('flush_image')} className="px-3 py-1 bg-red-600 text-white rounded">{t('flush')}</button>
//         <button onClick={handleDelete} className="px-3 py-1 bg-gray-700 text-white rounded">{t('delete')}</button>
//       </div>

//       {/* Canvas */}
//       <Stage
//         width={900}
//         height={600}
//         ref={stageRef}
//         onMouseDown={handleMouseDown}
//         onMouseMove={handleMouseMove}
//         onMouseUp={handleMouseUp}
//         style={{
//           border: '2px solid #ccc',
//           backgroundSize: '20px 20px',
//           backgroundImage:
//             'linear-gradient(to right, #eee 1px, transparent 1px), linear-gradient(to bottom, #eee 1px, transparent 1px)',
//           cursor: tool?.includes('pipe') ? 'crosshair' : 'default',
//         }}
//       >
//         <Layer>
//           {shapes.map((s) => {
//             const common = {
//               key: s.id,
//               id: s.id,
//               draggable: !s.type.includes('pipe'),
//               onClick: () => setSelectedId(s.id),
//               onDragEnd: (e) => handleDragEnd(s.id, e),
//               onTransformEnd: (e) => handleTransformEnd(s.id, e.target),
//               hitStrokeWidth: 20,
//             };

//             if (s.type === 'well')
//               return <Circle {...common} x={s.x} y={s.y} radius={s.radius} stroke="blue" strokeWidth={2} fillEnabled={false} />;

//             if (s.type === 'border')
//               return <Rect {...common} x={s.x} y={s.y} width={s.width} height={s.height} stroke="green" strokeWidth={2} fillEnabled={false} />;

//             if (s.type === 'main_pipe' || s.type === 'lateral_pipe')
//               return <Line {...common} points={s.points} stroke={s.stroke} strokeWidth={s.strokeWidth} dash={s.dash} />;

//             if (s.type === 'valve_image')
//               return <Image {...common} x={s.x} y={s.y} width={s.width} height={s.height} image={valveImg} />;

//             if (s.type === 'filter_image')
//               return <Image {...common} x={s.x} y={s.y} width={s.width} height={s.height} image={filterImg} />;

//             if (s.type === 'flush_image')
//               return <Image {...common} x={s.x} y={s.y} width={s.width} height={s.height} image={flushImg} />;

//             return null;
//           })}

//           <Transformer ref={trRef} rotateEnabled={true} anchorSize={8} borderStroke="black" borderDash={[4, 4]} />
//         </Layer>
//       </Stage>

//       <button
//         onClick={() => console.log('Exported Layout:', shapes)}
//         className="mt-4 px-4 py-2 bg-cyan-700 text-white rounded"
//       >
//         {t('export')}
//       </button>
//     </div>
//   );
// }


'use client';

import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Line, Image, Transformer } from 'react-konva';
import useImage from 'use-image';

export default function FarmLayoutTool() {
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
  const [lang, setLang] = useState('en');

  // ---------- Localization ----------
  const t = (key) => {
    const dict = {
      en: {
        title: 'Farm Layout Designer',
        well: 'Well',
        mainPipe: 'Main Pipe',
        lateralPipe: 'Lateral Pipe',
        border: 'Farm Border',
        valve: 'Valve',
        filter: 'Screen Filter',
        flush: 'Flush Valve',
        delete: 'Delete',
        export: 'Export Data (Console)',
      },
      mr: {
        title: 'शेती आराखडा रेखाचित्र',
        well: 'विहीर',
        mainPipe: 'मुख्य नळी',
        lateralPipe: 'लॅटरल नळी',
        border: 'शेताची सीमारेषा',
        valve: 'व्हॉल्व',
        filter: 'स्क्रीन फिल्टर',
        flush: 'फ्लश व्हॉल्व',
        delete: 'काढून टाका',
        export: 'माहिती निर्यात करा (कन्सोल)',
      },
    };
    return dict[lang][key];
  };

  // ---------- Add Shapes ----------
  const addShape = (type) => {
    if (type.includes('pipe')) {
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

    if (tool === 'main_pipe' || tool === 'lateral_pipe') {
      const id = `shape_${Date.now()}`;
      const newLine = {
        id,
        type: tool,
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: tool === 'main_pipe' ? 'orange' : 'blue',
        strokeWidth: tool === 'main_pipe' ? 3 : 2,
        dash: tool === 'lateral_pipe' ? [10, 5] : [],
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

  // ---------- Render ----------
  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-2xl font-bold text-cyan-700 mb-4">{t('title')}</h2>

      {/* Language Toggle */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">🌐</span>
        <button
          className={`px-2 py-1 rounded ${lang === 'en' ? 'bg-cyan-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setLang('en')}
        >
          English
        </button>
        <button
          className={`px-2 py-1 rounded ${lang === 'mr' ? 'bg-cyan-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setLang('mr')}
        >
          मराठी
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <button onClick={() => addShape('well')} className="px-3 py-1 bg-blue-500 text-white rounded">{t('well')}</button>
        <button onClick={() => addShape('main_pipe')} className="px-3 py-1 bg-orange-500 text-white rounded">{t('mainPipe')}</button>
        <button onClick={() => addShape('lateral_pipe')} className="px-3 py-1 bg-sky-500 text-white rounded">{t('lateralPipe')}</button>
        <button onClick={() => addShape('border')} className="px-3 py-1 bg-green-600 text-white rounded">{t('border')}</button>
        <button onClick={() => addShape('valve_image')} className="px-3 py-1 bg-purple-500 text-white rounded">{t('valve')}</button>
        <button onClick={() => addShape('filter_image')} className="px-3 py-1 bg-teal-600 text-white rounded">{t('filter')}</button>
        <button onClick={() => addShape('flush_image')} className="px-3 py-1 bg-red-600 text-white rounded">{t('flush')}</button>
        <button onClick={handleDelete} className="px-3 py-1 bg-gray-700 text-white rounded">{t('delete')}</button>
      </div>

      {/* Canvas */}
      <Stage
        width={900}
        height={600}
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          border: '2px solid #ccc',
          backgroundSize: '20px 20px',
          backgroundImage:
            'linear-gradient(to right, #eee 1px, transparent 1px), linear-gradient(to bottom, #eee 1px, transparent 1px)',
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

            if (s.type === 'main_pipe' || s.type === 'lateral_pipe')
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

      <button
        onClick={() => console.log('Exported Layout:', shapes)}
        className="mt-4 px-4 py-2 bg-cyan-700 text-white rounded"
      >
        {t('export')}
      </button>
    </div>
  );
}
