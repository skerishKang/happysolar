import puppeteer from "puppeteer";
import { Document } from "./types";

export async function generatePDF(document: Document): Promise<Buffer> {
  // PDF 생성 로직 (실제 구현은 storage.ts에서 복사/이동 필요)
  return Buffer.from([]);
} 