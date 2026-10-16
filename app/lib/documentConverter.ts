/**
 * Document Conversion Engine for TokiConvert
 * Client-side document generation and conversion using pdf-lib, mammoth, and DOMPurify.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import mammoth from "mammoth";
import DOMPurify from "dompurify";

export interface DocxConversionResult {
  html: string;
  warnings: string[];
}

export type ImageToPdfLayout = "fit-image" | "a4-portrait" | "a4-landscape";

/**
 * Convert plain text (.txt) file into a multi-page PDF document.
 * Handles text wrapping, Unicode ASCII normalization, and page numbers.
 */
export async function convertTxtToPdf(file: File): Promise<Blob> {
  const text = await file.text();
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = 10;
  const lineHeight = 14;
  const margin = 45;
  const pageWidth = 595.28; // A4 width
  const pageHeight = 841.89; // A4 height
  const printableWidth = pageWidth - margin * 2;
  const printableHeight = pageHeight - margin * 2 - 25; // reserve bottom space for page number

  // Normalize text lines and wrap to fit page width
  const lines: string[] = [];
  const rawParagraphs = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  for (const para of rawParagraphs) {
    if (!para.trim()) {
      lines.push("");
      continue;
    }
    // Word wrapping
    const words = para.split(" ");
    let currentLine = "";

    for (const word of words) {
      // Filter out characters outside WinAnsi to prevent PDF font encoding errors
      const sanitizedWord = word.replace(/[^\x00-\x7F]/g, "?");
      const testLine = currentLine ? `${currentLine} ${sanitizedWord}` : sanitizedWord;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth <= printableWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = sanitizedWord;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }

  const linesPerPage = Math.floor(printableHeight / lineHeight);
  const totalPages = Math.max(1, Math.ceil(lines.length / linesPerPage));

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const startLine = pageIdx * linesPerPage;
    const endLine = Math.min(startLine + linesPerPage, lines.length);

    // Document header on page 1
    let y = pageHeight - margin;
    if (pageIdx === 0) {
      const headerTitle = file.name.replace(/\.[^/.]+$/, "");
      page.drawText(headerTitle, {
        x: margin,
        y: y - 5,
        size: 14,
        font: boldFont,
        color: rgb(0.19, 0.18, 0.16),
      });
      y -= 30;
    }

    // Text content
    for (let i = startLine; i < endLine; i++) {
      const lineText = lines[i];
      if (lineText) {
        page.drawText(lineText, {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
      }
      y -= lineHeight;
    }

    // Page footer
    const pageNumberText = `Halaman ${pageIdx + 1} dari ${totalPages}`;
    const pageNumberWidth = font.widthOfTextAtSize(pageNumberText, 9);
    page.drawText(pageNumberText, {
      x: pageWidth - margin - pageNumberWidth,
      y: margin - 15,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = new Uint8Array(pdfBytes);
  return new Blob([pdfBuffer], { type: "application/pdf" });
}

/**
 * Convert Image (PNG / JPEG) files into a single PDF document.
 */
export async function convertImagesToPdf(
  files: File[],
  layout: ImageToPdfLayout = "a4-portrait"
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
    const image = isPng
      ? await pdfDoc.embedPng(arrayBuffer)
      : await pdfDoc.embedJpg(arrayBuffer);

    const imgWidth = image.width;
    const imgHeight = image.height;

    if (layout === "fit-image") {
      const page = pdfDoc.addPage([imgWidth, imgHeight]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: imgWidth,
        height: imgHeight,
      });
    } else {
      const isLandscape = layout === "a4-landscape";
      const pageWidth = isLandscape ? 841.89 : 595.28;
      const pageHeight = isLandscape ? 595.28 : 841.89;
      const margin = 36;
      const maxW = pageWidth - margin * 2;
      const maxH = pageHeight - margin * 2;

      // Scale to fit within margins maintaining aspect ratio
      const scale = Math.min(maxW / imgWidth, maxH / imgHeight, 1);
      const renderW = imgWidth * scale;
      const renderH = imgHeight * scale;
      const x = margin + (maxW - renderW) / 2;
      const y = margin + (maxH - renderH) / 2;

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(image, {
        x,
        y,
        width: renderW,
        height: renderH,
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = new Uint8Array(pdfBytes);
  return new Blob([pdfBuffer], { type: "application/pdf" });
}

/**
 * Convert Word DOCX file into clean, sanitized HTML.
 */
export async function convertDocxToHtml(file: File): Promise<DocxConversionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const rawHtml = result.value;
  const warnings = result.messages.map((m) => m.message);

  // Sanitize HTML strictly to prevent XSS
  const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      "p", "h1", "h2", "h3", "h4", "h5", "h6",
      "strong", "em", "u", "s", "ul", "ol", "li",
      "table", "thead", "tbody", "tr", "th", "td",
      "blockquote", "hr", "br", "span", "a", "img"
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "class", "style"],
  });

  return {
    html: sanitizedHtml,
    warnings,
  };
}
