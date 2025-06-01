import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, documents, company, type User, type Document, type Company, type InsertDocument } from "@shared/schema";
// @ts-ignore
const PptxGenJS = require('pptxgenjs');
import puppeteer from 'puppeteer';

// 개선된 PDF 생성 함수 (Windows 및 시스템 폰트 최적화, 안정성 강화)
async function generatePDFContent(document: any): Promise<Buffer> {
  let browser = null;
  let page = null;
  
  try {
    console.log('Starting PDF generation for document:', document.id);
    
    // Windows 환경에 최적화된 Puppeteer 설정
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--font-render-hinting=none',
        '--enable-font-antialiasing',
        '--force-device-scale-factor=1'
      ],
      timeout: 60000,
      protocolTimeout: 60000,
      slowMo: 100
    });

    page = await browser.newPage();
    await page.setDefaultTimeout(60000);
    await page.setDefaultNavigationTimeout(60000);
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

    const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.title}</title>
    <style>
        @font-face {
            font-family: 'KoreanFont';
            src: local('Noto Sans KR'), 
                 local('NotoSansKR-Regular'),
                 local('맑은 고딕'),
                 local('Malgun Gothic'),
                 local('나눔고딕'),
                 local('NanumGothic');
            font-weight: normal;
            font-style: normal;
        }
        @font-face {
            font-family: 'KoreanFont';
            src: local('Noto Sans KR Bold'), 
                 local('NotoSansKR-Bold'),
                 local('맑은 고딕 Bold'),
                 local('Malgun Gothic Bold');
            font-weight: bold;
            font-style: normal;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'KoreanFont', 'Noto Sans KR', '맑은 고딕', 'Malgun Gothic', '나눔고딕', 'NanumGothic', Arial, sans-serif;
            font-size: 14px;
            line-height: 1.8;
            color: #333;
            background: white;
            padding: 40px;
            word-break: keep-all;
            word-wrap: break-word;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        h1 {
            font-family: 'KoreanFont', 'Noto Sans KR', '맑은 고딕', 'Malgun Gothic', sans-serif;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 30px;
            text-align: center;
            color: #2563eb;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 15px;
        }
        h2 {
            font-family: 'KoreanFont', 'Noto Sans KR', '맑은 고딕', 'Malgun Gothic', sans-serif;
            font-size: 18px;
            font-weight: bold;
            margin: 30px 0 15px 0;
            color: #1e40af;
            page-break-after: avoid;
        }
        h3 {
            font-family: 'KoreanFont', 'Noto Sans KR', '맑은 고딕', 'Malgun Gothic', sans-serif;
            font-size: 16px;
            font-weight: bold;
            margin: 25px 0 10px 0;
            color: #1e40af;
        }
        p {
            margin-bottom: 15px;
            text-align: justify;
            line-height: 1.8;
        }
        .company-info {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 30px;
            border-left: 5px solid #2563eb;
            page-break-inside: avoid;
        }
        .company-info h3 {
            color: #2563eb;
            margin-bottom: 15px;
        }
        .company-info p {
            margin-bottom: 8px;
            font-size: 13px;
        }
        .section {
            margin-bottom: 35px;
            page-break-inside: avoid;
        }
        @page {
            margin: 2.5cm;
            size: A4;
        }
        @media print {
            body {
                padding: 0;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    ${formatDocumentContent(document)}
</body>
</html>`;

    console.log('Setting HTML content...');
    await page.setContent(htmlContent, { 
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 60000 
    });

    // 폰트 로딩 완료 대기
    console.log('Waiting for fonts to load...');
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        if (document.fonts.ready) {
          document.fonts.ready.then(() => {
            console.log('Fonts loaded successfully');
            resolve();
          });
        } else {
          setTimeout(() => resolve(), 2000);
        }
      });
    });
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Starting PDF generation...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '2.5cm',
        right: '2.5cm',
        bottom: '2.5cm',
        left: '2.5cm'
      },
      preferCSSPageSize: false,
      timeout: 60000
    });
    console.log('PDF generated successfully, size:', pdfBuffer.length);
    return pdfBuffer;
  } catch (error: any) {
    console.error('PDF generation failed:', error);
    if (error.message && error.message.includes('Target closed')) {
      throw new Error('PDF 생성 중 브라우저가 예기치 않게 종료되었습니다. 다시 시도해주세요.');
    } else if (error.message && error.message.includes('timeout')) {
      throw new Error('PDF 생성 시간이 초과되었습니다. 문서 크기를 줄이거나 다시 시도해주세요.');
    } else {
      throw new Error(`PDF 생성 실패: ${error.message}`);
    }
  } finally {
    try {
      if (page && !page.isClosed()) {
        await page.close();
        console.log('Page closed successfully');
      }
    } catch (e) {
      console.error('Error closing page:', e);
    }
    try {
      if (browser && browser.process()) {
        await browser.close();
        console.log('Browser closed successfully');
      }
    } catch (e) {
      console.error('Error closing browser:', e);
    }
  }
}

function formatDocumentContent(document: any): string {
  const content = document.content;
  let html = `<h1>${document.title}</h1>`;
  html += `
    <div class="company-info">
      <h3>회사 정보</h3>
      <p><strong>회사명:</strong> 주식회사 해피솔라</p>
      <p><strong>사업자등록번호:</strong> 578-87-02666</p>
      <p><strong>주소:</strong> 전라남도 장흥군 장흥읍 장흥로 30, 2층</p>
      <p><strong>대표자:</strong> 김미희</p>
    </div>
  `;
  if (typeof content === 'object' && content !== null) {
    Object.entries(content).forEach(([key, value]) => {
      if (key === 'slides' && Array.isArray(value)) {
        value.forEach((slide: any, index: number) => {
          html += `
            <div class="section">
              <h2>슬라이드 ${index + 1}: ${slide.title || ''}</h2>
              <div>${Array.isArray(slide.content) ? slide.content.join('<br>') : slide.content || ''}</div>
            </div>
          `;
        });
      } else if (typeof value === 'string') {
        html += `
          <div class="section">
            <h2>${key.replace(/([A-Z])/g, ' $1').trim()}</h2>
            <p>${value.replace(/\n/g, '<br>')}</p>
          </div>
        `;
      }
    });
  } else if (typeof content === 'string') {
    html += `<div class="section"><p>${content.replace(/\n/g, '<br>')}</p></div>`;
  }
  return html;
}

// PptxGenJS 사용 예시 (타입 안전성 확보)
async function generatePPTX(document: any): Promise<Buffer> {
  try {
    console.log('Starting PPTX generation for document:', document.id);
    // @ts-ignore
    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: 'A4', width: 10, height: 7.5 });
    pptx.layout = 'A4';
    const koreanFont = 'Malgun Gothic';
    const fallbackFonts = ['Noto Sans KR', '맑은 고딕', 'NanumGothic', 'Arial Unicode MS'];
    const titleSlide = pptx.addSlide();
    titleSlide.background = { fill: 'F8F9FA' };
    // @ts-ignore
    titleSlide.addShape(PptxGenJS.ShapeType.rect, {
      x: 4, y: 0.5, w: 2, h: 0.8, fill: { color: '2563EB' }, line: { width: 0 }
    });
    titleSlide.addText('해피솔라', {
      x: 4, y: 0.5, w: 2, h: 0.8, fontSize: 16, fontFace: koreanFont, color: 'FFFFFF', bold: true, align: 'center', valign: 'middle'
    });
    titleSlide.addText(document.title || '프레젠테이션 제목', {
      x: 1, y: 2.5, w: 8, h: 1.2, fontSize: 32, fontFace: koreanFont, color: '1E293B', bold: true, align: 'center', valign: 'middle'
    });
    titleSlide.addText('주식회사 해피솔라 사업 제안서', {
      x: 1, y: 4, w: 8, h: 0.8, fontSize: 18, fontFace: koreanFont, color: '64748B', align: 'center', valign: 'middle'
    });
    const today = new Date().toLocaleDateString('ko-KR');
    titleSlide.addText(today, {
      x: 1, y: 5.5, w: 8, h: 0.6, fontSize: 14, fontFace: koreanFont, color: '94A3B8', align: 'center'
    });
    const content = document.content;
    if (typeof content === 'object' && content !== null) {
      if (content.slides && Array.isArray(content.slides)) {
        content.slides.forEach((slideData: any, index: number) => {
          const slide = pptx.addSlide();
          slide.background = { fill: 'FFFFFF' };
          // @ts-ignore
          slide.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 10, h: 1, fill: { color: 'F1F5F9' }, line: { width: 0 } });
          slide.addText(`${index + 1}`, { x: 9, y: 0.1, w: 0.8, h: 0.8, fontSize: 12, fontFace: koreanFont, color: '64748B', align: 'center', valign: 'middle' });
          if (slideData.title) {
            slide.addText(slideData.title, { x: 0.5, y: 0.1, w: 8, h: 0.8, fontSize: 24, fontFace: koreanFont, color: '1E293B', bold: true, valign: 'middle' });
          }
          if (slideData.content) {
            let contentText = '';
            if (Array.isArray(slideData.content)) {
              contentText = slideData.content.join('\n\n');
            } else {
              contentText = String(slideData.content);
            }
            const fontSize = contentText.length > 500 ? 12 : contentText.length > 300 ? 14 : 16;
            slide.addText(contentText, { x: 0.5, y: 1.5, w: 9, h: 5.5, fontSize: fontSize, fontFace: koreanFont, color: '374151', valign: 'top', lineSpacing: 24 });
          }
        });
      } else {
        let slideIndex = 0;
        Object.entries(content).forEach(([key, value]) => {
          slideIndex++;
          const slide = pptx.addSlide();
          slide.background = { fill: 'FFFFFF' };
          // @ts-ignore
          slide.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 10, h: 1, fill: { color: 'F1F5F9' }, line: { width: 0 } });
          slide.addText(`${slideIndex}`, { x: 9, y: 0.1, w: 0.8, h: 0.8, fontSize: 12, fontFace: koreanFont, color: '64748B', align: 'center', valign: 'middle' });
          const sectionTitle = key.replace(/([A-Z])/g, ' $1').trim();
          slide.addText(sectionTitle, { x: 0.5, y: 0.1, w: 8, h: 0.8, fontSize: 20, fontFace: koreanFont, color: '1E293B', bold: true, valign: 'middle' });
          const contentText = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
          slide.addText(contentText, { x: 0.5, y: 1.5, w: 9, h: 5.5, fontSize: 14, fontFace: koreanFont, color: '374151', valign: 'top', lineSpacing: 22 });
        });
      }
    } else {
      const contentSlide = pptx.addSlide();
      contentSlide.background = { fill: 'FFFFFF' };
      contentSlide.addText('문서 내용', { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 24, fontFace: koreanFont, color: '1E293B', bold: true, align: 'center' });
      contentSlide.addText(String(content), { x: 0.5, y: 2, w: 9, h: 5, fontSize: 14, fontFace: koreanFont, color: '374151', valign: 'top', lineSpacing: 22 });
    }
    console.log('Converting PPTX to buffer...');
    const pptxData = await pptx.write({ outputType: 'buffer' });
    const pptxBuffer = Buffer.from(pptxData as Uint8Array);
    console.log('PPTX generated successfully, size:', pptxBuffer.length);
    return pptxBuffer;
  } catch (error: any) {
    console.error('PPTX generation error:', error);
    throw new Error(`PPTX 생성 실패: ${error.message}`);
  }
}

interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(userData: { username: string; password: string }): Promise<User>;
  createDocument(documentData: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getDocuments(userId?: number): Promise<Document[]>;
  getRecentDocuments(limit: number): Promise<Document[]>;
  getDocumentStats(): Promise<{
    monthlyDocuments: number;
    timeSaved: string;
    efficiency: string;
    activeUsers: number;
  }>;
  getCompanyInfo(): Promise<Company>;
  generatePDF(document: Document): Promise<Buffer>;
  generatePPTX(document: Document): Promise<Buffer>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(userData: { username: string; password: string }): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async createDocument(documentData: InsertDocument): Promise<Document> {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const [document] = await db.insert(documents).values(documentData).returning();
        return document;
      } catch (error) {
        attempts++;
        console.error(`Document creation attempt ${attempts} failed:`, error);
        
        if (attempts >= maxAttempts) {
          throw new Error('문서 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
        
        // 지수적 백오프
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
      }
    }

    throw new Error('문서 저장에 실패했습니다.');
  }

  async getDocument(id: string): Promise<Document | undefined> {
    try {
      console.log('Fetching document with ID:', id);

      const numericId = parseInt(id);
      if (isNaN(numericId)) {
        console.error('Invalid document ID:', id);
        return undefined;
      }

      // 재시도 로직 강화
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        try {
          const [document] = await db.select().from(documents).where(eq(documents.id, numericId));
          if (document) {
            console.log('Document fetched successfully:', document.id);
            return document;
          }
          break;
        } catch (error) {
          attempts++;
          console.error(`Database query attempt ${attempts} failed:`, error);

          if (attempts >= maxAttempts) {
            console.error('Max retry attempts reached, returning undefined');
            return undefined;
          }

          // 지수적 백오프
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
        }
      }

      return undefined;
    } catch (error) {
      console.error('Error fetching document:', error);
      return undefined;
    }
  }

  async getDocuments(userId?: number): Promise<Document[]> {
    if (userId) {
      return await db.select().from(documents).where(eq(documents.userId, userId));
    }
    return await db.select().from(documents);
  }

  async getRecentDocuments(limit: number): Promise<Document[]> {
    const docs = await db.select().from(documents).limit(limit).orderBy(documents.createdAt);
    return docs.map(doc => ({
      ...doc,
      createdAt: doc.createdAt.toLocaleDateString('ko-KR') + ' ' + doc.createdAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    })) as Document[];
  }

  async getDocumentStats(): Promise<{
    monthlyDocuments: number;
    timeSaved: string;
    efficiency: string;
    activeUsers: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyDocs = await db.select().from(documents)
      .where(eq(documents.createdAt, startOfMonth));

    return {
      monthlyDocuments: monthlyDocs.length,
      timeSaved: `${monthlyDocs.length * 2}시간`,
      efficiency: "95%",
      activeUsers: 28
    };
  }

  async getCompanyInfo(): Promise<Company> {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const [companyInfo] = await db.select().from(company).limit(1);
        if (!companyInfo) {
          const [newCompany] = await db.insert(company).values({}).returning();
          return newCompany;
        }
        return companyInfo;
      } catch (error) {
        attempts++;
        console.error(`Company info query attempt ${attempts} failed:`, error);
        
        if (attempts >= maxAttempts) {
          // 기본 회사 정보 반환
          return {
            id: 1,
            name: "주식회사 해피솔라",
            businessNumber: "123-45-67890",
            address: "전라남도 장흥군",
            businessType: "태양광 발전 사업",
            representative: "김대표"
          } as Company;
        }
        
        // 지수적 백오프
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
      }
    }

    // 기본값 반환 (타입스크립트 만족용)
    return {
      id: 1,
      name: "주식회사 해피솔라",
      businessNumber: "123-45-67890",
      address: "전라남도 장흥군",
      businessType: "태양광 발전 사업",
      representative: "김대표"
    } as Company;
  }

  async generatePDF(document: Document): Promise<Buffer> {
    return await generatePDFContent(document);
  }

  async generatePPTX(document: Document): Promise<Buffer> {
    return await generatePPTX(document);
  }
}

export const storage = new DatabaseStorage();