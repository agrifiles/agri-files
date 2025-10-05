// src/lib/pdfmakeClient.js
import dynamic from 'next/dynamic';

export const PdfMake = dynamic(
  async () => {
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');

    pdfMakeModule.default.vfs = pdfFontsModule.default.pdfMake.vfs;
    return pdfMakeModule.default; // <- default export
  },
  { ssr: false }
);
