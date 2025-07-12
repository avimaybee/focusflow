// src/ai/pdf-parser.ts
import pdf from 'pdf-parse';

export async function parsePdfToText(pdfBuffer: Buffer): Promise<string> {
  try {
    const data = await pdf(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    // Return an empty string or throw a custom error as needed
    return '';
  }
}
