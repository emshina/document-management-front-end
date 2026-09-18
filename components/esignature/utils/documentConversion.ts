import mammoth from 'mammoth';
import html2pdf from 'html2pdf.js';

export async function convertFileToPdfBlob(file: File): Promise<Blob> {
  const fileName = file.name.toLowerCase();
  
  // If it's a Word document, convert it via HTML to a PDF Blob
  if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    const arrayBuffer = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.width = '800px';
    container.style.padding = '40px';
    container.style.background = '#ffffff';
    document.body.appendChild(container);

    const options = {
      margin: 10,
      filename: `${file.name}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const pdfBlob = await html2pdf().set(options).from(container).outputPdf('blob');
    document.body.removeChild(container);
    return pdfBlob;
  }

  // Otherwise, treat it as a standard PDF or image blob
  return new Blob([file], { type: file.type });
}