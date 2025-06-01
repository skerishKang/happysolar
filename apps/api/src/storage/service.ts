import puppeteer from 'puppeteer';
// @ts-ignore
const PptxGenJS = require('pptxgenjs');
import { formatDocumentContent } from "./utils";

// PDF 생성 함수
export async function generatePDFContent(document: any): Promise<Buffer> {
  // ... (storage.ts의 해당 함수 전체 복사)
}

// PPTX 생성 함수
export async function generatePPTX(document: any): Promise<Buffer> {
  // ... (storage.ts의 해당 함수 전체 복사)
} 