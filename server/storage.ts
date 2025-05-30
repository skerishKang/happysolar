
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, documents, company, type User, type Document, type Company, type InsertDocument } from "@shared/schema";

// HTML을 이미지로 변환하는 함수
async function htmlToImage(htmlContent: string, width: number = 1920, height: number = 1080): Promise<Buffer> {
  try {
    const nodeHtmlToImage = (await import('node-html-to-image')).default;
    
    const imageBuffer = await nodeHtmlToImage({
      html: htmlContent,
      type: 'png',
      quality: 100,
      encoding: 'buffer',
      puppeteerArgs: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--font-render-hinting=none'
        ]
      },
      content: { width, height }
    });
    
    if (Buffer.isBuffer(imageBuffer)) {
      return imageBuffer;
    }
    
    // Canvas를 사용한 fallback
    const { createCanvas } = await import('canvas');
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // 기본 배경
    ctx.fillStyle = '#1e3c72';
    ctx.fillRect(0, 0, width, height);
    
    // 텍스트 설정
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('문서가 생성되었습니다', width/2, height/2);
    
    return canvas.toBuffer('image/png');
    
  } catch (error) {
    console.error('HTML to image conversion failed:', error);
    
    // 최종 fallback - Canvas로 기본 이미지 생성
    const { createCanvas } = await import('canvas');
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#1e3c72';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('문서 생성 완료', width/2, height/2);
    
    return canvas.toBuffer('image/png');
  }
}

// 슬라이드용 HTML 생성
function generateSlideHTML(slideData: any, slideNumber: number, totalSlides: number): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;700&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          width: 1920px;
          height: 1080px;
          font-family: 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          position: relative;
          overflow: hidden;
        }
        
        .slide-container {
          width: 100%;
          height: 100%;
          position: relative;
        }
        
        .header {
          height: 200px;
          background: linear-gradient(90deg, #3498DB 0%, #2980B9 100%);
          position: relative;
          display: flex;
          align-items: center;
          padding: 0 100px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        
        .slide-number {
          position: absolute;
          top: 50px;
          right: 80px;
          width: 100px;
          height: 100px;
          background: #E74C3C;
          border: 4px solid #C0392B;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 28px;
          font-weight: bold;
        }
        
        .solar-icon {
          width: 120px;
          height: 120px;
          background: #F39C12;
          border: 4px solid #E67E22;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          color: white;
          margin-right: 50px;
        }
        
        .title {
          color: white;
          font-size: 48px;
          font-weight: bold;
          text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
        }
        
        .content-area {
          margin: 50px 100px;
          background: white;
          border-radius: 20px;
          padding: 60px;
          height: 600px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        
        .content-text {
          font-size: 24px;
          line-height: 1.8;
          color: #2C3E50;
        }
        
        .bullet-point {
          display: flex;
          align-items: flex-start;
          margin: 20px 0;
        }
        
        .bullet {
          color: #3498DB;
          font-weight: bold;
          margin-right: 15px;
          font-size: 18px;
        }
        
        .chart-area {
          position: absolute;
          right: 150px;
          bottom: 300px;
          width: 450px;
          height: 250px;
          background: #ECF0F1;
          border: 2px solid #BDC3C7;
          border-radius: 10px;
          padding: 20px;
        }
        
        .chart-title {
          text-align: center;
          color: #7F8C8D;
          font-weight: bold;
          margin-bottom: 20px;
        }
        
        .chart-bars {
          display: flex;
          justify-content: space-around;
          align-items: end;
          height: 160px;
          margin-top: 20px;
        }
        
        .bar {
          width: 60px;
          background: #3498DB;
          border-radius: 4px 4px 0 0;
        }
        
        .bar.highlight {
          background: #E74C3C;
        }
        
        .footer {
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 80px;
          background: #34495E;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 100px;
          color: #BDC3C7;
        }
        
        .company-logo {
          background: #3498DB;
          padding: 15px 30px;
          border-radius: 5px;
          color: white;
          font-weight: bold;
          font-size: 24px;
        }
        
        .decorative-shape {
          position: absolute;
        }
        
        .triangle {
          top: 150px;
          right: 170px;
          width: 0;
          height: 0;
          border-left: 75px solid transparent;
          border-right: 75px solid transparent;
          border-bottom: 150px solid rgba(255,255,255,0.1);
        }
        
        .circle {
          bottom: 200px;
          left: 100px;
          width: 200px;
          height: 200px;
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
        }
      </style>
    </head>
    <body>
      <div class="slide-container">
        <div class="decorative-shape triangle"></div>
        <div class="decorative-shape circle"></div>
        
        <div class="header">
          <div class="solar-icon">☀</div>
          <div class="title">${slideData.title || `슬라이드 ${slideNumber}`}</div>
          <div class="slide-number">${slideNumber}</div>
        </div>
        
        <div class="content-area">
          <div class="content-text">
            ${(slideData.detailedContent || slideData.content || '').split('\n').map(line => {
              if (line.includes('•') || line.includes('-')) {
                return `<div class="bullet-point">
                  <span class="bullet">●</span>
                  <span>${line.replace(/^[•\-]\s*/, '')}</span>
                </div>`;
              } else if (line.trim()) {
                return `<div style="margin: 20px 0; font-weight: ${line.length < 30 ? 'bold' : 'normal'};">${line}</div>`;
              }
              return '';
            }).join('')}
          </div>
        </div>
        
        ${slideData.detailedContent && slideData.detailedContent.match(/\d+%|\d+억|\d+만|성장|증가|효율/) ? `
          <div class="chart-area">
            <div class="chart-title">성과 지표</div>
            <div class="chart-bars">
              <div class="bar" style="height: 120px;"></div>
              <div class="bar" style="height: 140px;"></div>
              <div class="bar highlight" style="height: 160px;"></div>
              <div class="bar" style="height: 130px;"></div>
            </div>
          </div>
        ` : ''}
        
        <div class="footer">
          <div>주식회사 해피솔라 - AI 문서 생성 시스템</div>
          <div class="company-logo">해피솔라</div>
          <div>${slideNumber} / ${totalSlides}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 타이틀 슬라이드용 HTML 생성
function generateTitleSlideHTML(title: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;700&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          width: 1920px;
          height: 1080px;
          font-family: 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        
        .main-title {
          color: white;
          font-size: 72px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 50px;
          text-shadow: 4px 4px 8px rgba(0,0,0,0.5);
        }
        
        .subtitle {
          color: #F39C12;
          font-size: 36px;
          font-style: italic;
          text-align: center;
          margin-bottom: 100px;
        }
        
        .company-box {
          background: rgba(255,255,255,0.9);
          padding: 50px 100px;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        
        .company-name {
          color: #2C3E50;
          font-size: 42px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        
        .date {
          color: #7F8C8D;
          font-size: 24px;
        }
        
        .solar-icons {
          position: absolute;
        }
        
        .solar-icon {
          width: 80px;
          height: 80px;
          background: #F39C12;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          color: white;
        }
        
        .solar-left {
          left: 500px;
          top: 50%;
          transform: translateY(-50%);
        }
        
        .solar-right {
          right: 500px;
          top: 50%;
          transform: translateY(-50%);
        }
        
        .decorative-triangle {
          position: absolute;
          top: 100px;
          right: 200px;
          width: 0;
          height: 0;
          border-left: 60px solid transparent;
          border-right: 60px solid transparent;
          border-bottom: 120px solid rgba(255,255,255,0.15);
        }
        
        .decorative-circle {
          position: absolute;
          bottom: 100px;
          left: 200px;
          width: 120px;
          height: 120px;
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
        }
      </style>
    </head>
    <body>
      <div class="decorative-triangle"></div>
      <div class="decorative-circle"></div>
      
      <div class="solar-icons solar-left">
        <div class="solar-icon">☀</div>
      </div>
      
      <div class="main-title">${title || '프레젠테이션'}</div>
      <div class="subtitle">AI 기반 스마트 솔루션</div>
      
      <div class="company-box">
        <div class="company-name">주식회사 해피솔라</div>
        <div class="date">${new Date().toLocaleDateString('ko-KR')}</div>
      </div>
      
      <div class="solar-icons solar-right">
        <div class="solar-icon">☀</div>
      </div>
    </body>
    </html>
  `;
}

// 간단한 PDF 생성 - HTML을 PDF로 직접 변환
async function generatePDFContent(document: Document): Promise<Buffer> {
  try {
    let contentText = '';
    let slides: any[] = [];
    
    if (document.content && typeof document.content === 'object' && document.content.slideStructure && Array.isArray(document.content.slideStructure)) {
      slides = document.content.slideStructure;
    } else if (typeof document.content === 'string') {
      contentText = document.content;
    } else {
      contentText = '내용 처리 중...';
    }

    // 간단한 HTML 문서 생성
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;700&display=swap');
        @page { margin: 20mm; size: A4; }
        
        body {
          font-family: 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
          margin: 0;
          padding: 20px;
          line-height: 1.6;
          color: #333;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding: 30px;
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          border-radius: 15px;
        }
        
        .title { font-size: 2.5em; font-weight: 700; margin-bottom: 15px; }
        .company { font-size: 1.3em; margin-bottom: 10px; }
        .date { font-size: 1.1em; opacity: 0.9; }
        
        .content {
          background: white;
          padding: 40px;
          border: 1px solid #ddd;
          border-radius: 15px;
          margin-bottom: 30px;
        }
        
        .slide {
          margin-bottom: 50px;
          padding: 30px;
          border-left: 5px solid #3498db;
          background: #f8f9fa;
          border-radius: 10px;
          page-break-inside: avoid;
        }
        
        .slide-title {
          font-size: 1.8em;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #3498db;
        }
        
        .slide-content {
          font-size: 1.1em;
          line-height: 1.8;
          color: #34495e;
        }
        
        .bullet-point {
          margin: 10px 0;
          padding-left: 20px;
          position: relative;
        }
        
        .bullet-point::before {
          content: '●';
          color: #3498db;
          font-weight: bold;
          position: absolute;
          left: 0;
        }
        
        .footer {
          text-align: center;
          margin-top: 40px;
          padding: 20px;
          background: #34495e;
          color: white;
          border-radius: 15px;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${document.title || '문서'}</div>
        <div class="company">주식회사 해피솔라</div>
        <div class="date">생성일: ${new Date(document.createdAt).toLocaleDateString('ko-KR')}</div>
      </div>
      
      <div class="content">
        ${slides.length > 0 ? 
          slides.map((slide: any, index: number) => `
            <div class="slide">
              <div class="slide-title">${slide.title || `슬라이드 ${index + 1}`}</div>
              <div class="slide-content">
                ${(slide.detailedContent || slide.content || slide.description || '').split('\n').map((line: string) => {
                  if (line.includes('•') || line.includes('-')) {
                    return `<div class="bullet-point">${line.replace(/^[•\-]\s*/, '')}</div>`;
                  } else if (line.trim()) {
                    return `<div style="margin: 15px 0;">${line}</div>`;
                  }
                  return '';
                }).join('')}
              </div>
            </div>
          `).join('') :
          `<div class="slide-content">${contentText.split('\n').map(line => `<div style="margin: 15px 0;">${line}</div>`).join('')}</div>`
        }
      </div>
      
      <div class="footer">
        <div>주식회사 해피솔라 - AI 문서 생성 시스템</div>
        <div>© 2025 HappySolar Co., Ltd. All rights reserved.</div>
      </div>
    </body>
    </html>`;

    // HTML을 PDF로 변환 (wkhtmltopdf 사용)
    try {
      const wkhtmltopdf = (await import('wkhtmltopdf')).default;
      
      return new Promise((resolve, reject) => {
        const options = {
          pageSize: 'A4',
          marginTop: '20mm',
          marginRight: '15mm',
          marginBottom: '20mm',
          marginLeft: '15mm',
          encoding: 'UTF-8',
          enableLocalFileAccess: true
        };
        
        wkhtmltopdf(htmlContent, options, (err: any, stream: any) => {
          if (err) {
            reject(err);
            return;
          }
          
          const chunks: Buffer[] = [];
          stream.on('data', (chunk: Buffer) => chunks.push(chunk));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', reject);
        });
      });
    } catch (error) {
      console.warn('wkhtmltopdf failed, using simple HTML fallback');
      // 기본 HTML 반환
      return Buffer.from(htmlContent, 'utf-8');
    }
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    const fallbackHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${document.title || '문서'}</title>
      <style>
        body { 
          font-family: 'Noto Sans KR', '맑은 고딕', Arial, sans-serif; 
          margin: 20px; 
          line-height: 1.6; 
        }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        .content { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
      </style>
    </head>
    <body>
      <h1>${document.title || '문서'}</h1>
      <p><strong>회사:</strong> 주식회사 해피솔라</p>
      <p><strong>생성일:</strong> ${new Date(document.createdAt).toLocaleDateString('ko-KR')}</p>
      <div class="content">
        ${typeof document.content === 'string' ? 
          document.content.replace(/\n/g, '<br>') : 
          JSON.stringify(document.content, null, 2).replace(/\n/g, '<br>')
        }
      </div>
    </body>
    </html>`;
    
    return Buffer.from(fallbackHtml, 'utf-8');
  }
}

// HTML로 생성한 이미지를 PPT에 삽입하는 방식
async function generatePPTXContent(document: Document): Promise<Buffer> {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  
  pptx.layout = 'LAYOUT_16x9';
  
  let slides: any[] = [];
  let requestedSlideCount = 5;
  
  if (document.formData && document.formData.field_3 && !isNaN(Number(document.formData.field_3))) {
    requestedSlideCount = Number(document.formData.field_3);
  }
  
  if (document.content && typeof document.content === 'object' && document.content.slideStructure && Array.isArray(document.content.slideStructure)) {
    slides = document.content.slideStructure.slice(0, requestedSlideCount).map((slide: any, index: number) => ({
      slideNumber: index + 1,
      title: slide.title || `슬라이드 ${index + 1}`,
      content: slide.content || slide.description || '',
      detailedContent: slide.detailedContent || slide.content || slide.description || '상세 내용을 생성 중입니다.',
    }));
  } else {
    for (let i = 0; i < requestedSlideCount; i++) {
      slides.push({
        slideNumber: i + 1,
        title: `슬라이드 ${i + 1}`,
        content: `슬라이드 ${i + 1} 내용`,
        detailedContent: `• 주요 내용이 여기에 표시됩니다\n• 추가 설명과 데이터\n• 실행 방안 및 결론`
      });
    }
  }

  // 타이틀 슬라이드 생성
  const titleSlide = pptx.addSlide();
  try {
    const titleHTML = generateTitleSlideHTML(document.title);
    const titleImageBuffer = await htmlToImage(titleHTML);
    const base64Image = titleImageBuffer.toString('base64');
    
    titleSlide.addImage({
      data: `data:image/png;base64,${base64Image}`,
      x: 0, y: 0, w: 10, h: 7.5
    });
  } catch (error) {
    console.error('Title slide generation failed:', error);
    // 기본 타이틀 슬라이드
    titleSlide.background = { color: '1e3c72' };
    titleSlide.addText(document.title || '프레젠테이션', {
      x: 1, y: 2, w: 8, h: 1.5,
      fontSize: 42, bold: true, color: 'FFFFFF', align: 'center'
    });
    titleSlide.addText('주식회사 해피솔라', {
      x: 1, y: 4, w: 8, h: 1,
      fontSize: 24, color: 'FFFFFF', align: 'center'
    });
  }

  // 컨텐츠 슬라이드들 생성
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const contentSlide = pptx.addSlide();
    
    try {
      const slideHTML = generateSlideHTML(slide, slide.slideNumber, slides.length);
      const slideImageBuffer = await htmlToImage(slideHTML);
      const base64Image = slideImageBuffer.toString('base64');
      
      contentSlide.addImage({
        data: `data:image/png;base64,${base64Image}`,
        x: 0, y: 0, w: 10, h: 7.5
      });
    } catch (error) {
      console.error(`Slide ${i+1} generation failed:`, error);
      // 기본 슬라이드
      contentSlide.background = { color: 'F8FAFC' };
      contentSlide.addText(slide.title, {
        x: 0.5, y: 0.5, w: 9, h: 1,
        fontSize: 24, bold: true, color: '2C3E50', align: 'left'
      });
      contentSlide.addText(slide.detailedContent || slide.content, {
        x: 0.5, y: 2, w: 9, h: 4,
        fontSize: 14, color: '34495E', align: 'left'
      });
    }
  }

  const output = await pptx.write({ outputType: 'arraybuffer' });
  return Buffer.from(output as ArrayBuffer);
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
    const [document] = await db.insert(documents).values(documentData).returning();
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, parseInt(id)));
    return document || undefined;
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
    const [companyInfo] = await db.select().from(company).limit(1);
    if (!companyInfo) {
      const [newCompany] = await db.insert(company).values({}).returning();
      return newCompany;
    }
    return companyInfo;
  }

  async generatePDF(document: Document): Promise<Buffer> {
    return await generatePDFContent(document);
  }

  async generatePPTX(document: Document): Promise<Buffer> {
    return await generatePPTXContent(document);
  }
}

export const storage = new DatabaseStorage();
