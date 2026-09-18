export async function processAndMergeFiles(
  filesToProcess: File[],
  setMergedBlobUrl: (url: string | null) => void,
  setIsImageFile: (isImage: boolean) => void,
  setCurrentPage: (page: number) => void,
  setTotalPages: (pages: number) => void,
  setIsMerging: (merging: boolean) => void
) {
  if (filesToProcess.length === 0) return;
  setIsMerging(true);

  try {
    if (filesToProcess.length === 1 && filesToProcess[0].type.startsWith('image/')) {
      setMergedBlobUrl(URL.createObjectURL(filesToProcess[0]));
      setIsImageFile(true);
      setCurrentPage(1);
      setTotalPages(1);
      setIsMerging(false);
      return;
    }

    const { PDFDocument } = await import('pdf-lib');
    const mergedPdfDoc = await PDFDocument.create();

    for (const file of filesToProcess) {
      const arrayBuffer = await file.arrayBuffer();
      const fileType = file.type;
      const fileName = file.name.toLowerCase();

      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdfDoc.addPage(page));
      } else if (fileType.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(fileName)) {
        let embeddedImage;
        if (fileType === 'image/png' || fileName.endsWith('.png')) {
          embeddedImage = await mergedPdfDoc.embedPng(arrayBuffer);
        } else {
          embeddedImage = await mergedPdfDoc.embedJpg(arrayBuffer);
        }
        const page = mergedPdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: embeddedImage.width,
          height: embeddedImage.height,
        });
      } else {
        const page = mergedPdfDoc.addPage([600, 800]);
        page.drawText(`Document: ${file.name}`, { x: 50, y: 700, size: 18 });
      }
    }

    const mergedPdfBytes = await mergedPdfDoc.save();
    const mergedBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    setMergedBlobUrl(URL.createObjectURL(mergedBlob));
    setIsImageFile(false);
    setCurrentPage(1);
  } catch (error) {
    console.error('Error merging documents:', error);
    alert('Failed to merge documents. Please verify file types.');
  } finally {
    setIsMerging(false);
  }
}