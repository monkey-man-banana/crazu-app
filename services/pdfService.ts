import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Point to the local worker file we just copied to /public
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Use standard loading
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    const totalPages = pdf.numPages;

    // Limit to first 10 pages for performance/context limits
    const pagesToRead = Math.min(totalPages, 10);

    for (let i = 1; i <= pagesToRead; i++) {
      const page = await pdf.getPage(i);
      
      // 1. Try extracting text layer
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');

      // Check if the page has usable text (not just whitespace or random chars)
      if (pageText.replace(/\s/g, '').length > 50) {
        fullText += `
--- Page ${i} ---
${pageText}`;
      } else {
        // 2. Fallback to OCR (Image Extraction)
        console.warn(`Page ${i} has no text layer. Running OCR...`);
        
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          const imageBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve));
          
          if (imageBlob) {
            const { data: { text } } = await Tesseract.recognize(imageBlob, 'eng', {
              // logger: m => console.log(m) // Uncomment to see OCR progress
            });
            fullText += `
--- Page ${i} (OCR) ---
${text}`;
          }
        }
      }
    }

    return fullText;
  } catch (error) {
    console.error("PDF Extraction Failed:", error);
    throw new Error("Failed to extract text from PDF.");
  }
};