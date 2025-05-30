import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, documents, company, type User, type Document, type Company, type InsertDocument } from "@shared/schema";

// 실제 PDF 생성 - Puppeteer를 사용한 한글 지원 PDF
async function generatePDFContent(document: Document): Promise<Buffer> {
  try {
    console.log('Starting PDF generation for document:', document.id);
    
    const puppeteer = (await import('puppeteer')).default;
    
    // Puppeteer 브라우저 시작
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    let slides: any[] = [];
    let requestedSlideCount = 5;

    // 슬라이드 수 확인
    if (document.formData && document.formData.field_7 && !isNaN(Number(document.formData.field_7))) {
      requestedSlideCount = Number(document.formData.field_7);
    }

    if (document.content && typeof document.content === 'object' && document.content.slideStructure && Array.isArray(document.content.slideStructure)) {
      slides = document.content.slideStructure.slice(0, requestedSlideCount);
    } else if (document.content && typeof document.content === 'object' && document.content.fullText) {
      // 다른 문서 타입의 경우 fullText 사용
      slides = [{
        title: document.title || '문서',
        content: document.content.fullText || '내용이 없습니다.',
        detailedContent: document.content.fullText || '내용이 없습니다.'
      }];
    } else {
      // 기본 슬라이드 구조
      for (let i = 0; i < requestedSlideCount; i++) {
        slides.push({
          title: `슬라이드 ${i + 1}`,
          content: `슬라이드 ${i + 1} 내용`,
          detailedContent: `• 주요 내용이 여기에 표시됩니다\n• 추가 설명과 데이터\n• 실행 방안 및 결론`
        });
      }
    }

    // HTML 내용 생성
    const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${document.title || '문서'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
    
    body {
      font-family: 'Noto Sans KR', sans-serif;
      margin: 0;
      padding: 20px;
      background: #fff;
      color: #333;
      line-height: 1.6;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding: 30px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 10px;
    }
    
    .header h1 {
      font-size: 36px;
      font-weight: 700;
      margin: 0 0 10px 0;
    }
    
    .header .company {
      font-size: 20px;
      font-weight: 500;
      opacity: 0.9;
    }
    
    .header .date {
      font-size: 16px;
      opacity: 0.8;
      margin-top: 10px;
    }
    
    .slide {
      margin: 40px 0;
      page-break-inside: avoid;
      border: 1px solid #e1e5e9;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .slide-header {
      background: linear-gradient(45deg, #FF6B35, #F7931E);
      color: white;
      padding: 20px;
      font-size: 24px;
      font-weight: 600;
    }
    
    .slide-content {
      padding: 30px;
      background: white;
    }
    
    .slide-content p {
      margin: 15px 0;
      font-size: 16px;
    }
    
    .slide-content ul {
      margin: 20px 0;
      padding-left: 20px;
    }
    
    .slide-content li {
      margin: 10px 0;
      font-size: 16px;
    }
    
    .footer {
      text-align: center;
      margin-top: 50px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      color: #666;
    }
    
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${document.title || '문서'}</h1>
    <div class="company">주식회사 해피솔라</div>
    <div class="date">${new Date().toLocaleDateString('ko-KR')}</div>
  </div>

  ${slides.map((slide: any, index: number) => {
    const content = slide.detailedContent || slide.content || slide.description || '';
    const formattedContent = content
      .split('\n')
      .map((line: string) => {
        if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
          return `<li>${line.replace(/^[•\-]\s*/, '')}</li>`;
        }
        return line.trim() ? `<p>${line}</p>` : '';
      })
      .join('');

    const hasListItems = formattedContent.includes('<li>');
    const finalContent = hasListItems 
      ? formattedContent.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>').replace(/<\/ul><ul>/g, '')
      : formattedContent;

    return `
      <div class="slide ${index > 0 ? 'page-break' : ''}">
        <div class="slide-header">
          ${slide.title || `슬라이드 ${index + 1}`}
        </div>
        <div class="slide-content">
          ${finalContent}
        </div>
      </div>
    `;
  }).join('')}

  <div class="footer">
    <p>주식회사 해피솔라 - AI 문서 생성 시스템</p>
    <p>문서 ID: ${document.id} | 생성 시간: ${new Date().toLocaleString('ko-KR')}</p>
  </div>
</body>
</html>`;

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    
    console.log('PDF generated successfully');
    return Buffer.from(pdfBuffer);

  } catch (error) {
    console.error('PDF generation failed:', error);
    
    // jsPDF를 사용한 폴백 PDF 생성
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // 한글 폰트 설정 (기본 폰트 사용)
      doc.setFont('helvetica');
      doc.setFontSize(20);
      doc.text(document.title || '문서', 20, 30);
      
      doc.setFontSize(12);
      doc.text(`생성일: ${new Date().toLocaleDateString('ko-KR')}`, 20, 50);
      doc.text('회사: 주식회사 해피솔라', 20, 65);
      
      // 콘텐츠 추가
      let yPosition = 90;
      if (document.content && typeof document.content === 'object' && document.content.slideStructure) {
        document.content.slideStructure.forEach((slide: any, index: number) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 30;
          }
          
          doc.setFontSize(14);
          doc.text(`${index + 1}. ${slide.title || `슬라이드 ${index + 1}`}`, 20, yPosition);
          yPosition += 15;
          
          doc.setFontSize(10);
          const content = slide.detailedContent || slide.content || '';
          const lines = typeof content === 'string' ? content.split('\n') : [String(content)];
          lines.forEach(line => {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 30;
            }
            doc.text(line.substring(0, 80), 25, yPosition);
            yPosition += 8;
          });
          yPosition += 10;
        });
      }
      
      return Buffer.from(doc.output('arraybuffer'));
      
    } catch (fallbackError) {
      console.error('Fallback PDF generation also failed:', fallbackError);
      
      // 최종 폴백 - 간단한 텍스트 응답
      const simpleContent = `${document.title || '문서'}\n\n생성일: ${new Date().toLocaleDateString('ko-KR')}\n회사: 주식회사 해피솔라\n\nPDF 생성 중 오류가 발생했습니다.`;
      return Buffer.from(simpleContent, 'utf8');
    }
  }
}

// 간단한 PPTX 생성 - node-html-to-image 없이
async function generatePPTXContent(document: Document): Promise<Buffer> {
  try {
    const PptxGenJS = (await import('pptxgenjs')).default;
    const pptx = new PptxGenJS();

    pptx.layout = 'LAYOUT_16x9';

    let slides: any[] = [];
    let requestedSlideCount = 5;

    if (document.formData && document.formData.field_3 && !isNaN(Number(document.formData.field_3))) {
      requestedSlideCount = Number(document.formData.field_3);
    }

    if (document.content && typeof document.content === 'object' && document.content.slideStructure && Array.isArray(document.content.slideStructure)) {
      slides = document.content.slideStructure.slice(0, requestedSlideCount);
    } else {
      for (let i = 0; i < requestedSlideCount; i++) {
        slides.push({
          title: `슬라이드 ${i + 1}`,
          content: `슬라이드 ${i + 1} 내용`,
          detailedContent: `• 주요 내용이 여기에 표시됩니다\n• 추가 설명과 데이터\n• 실행 방안 및 결론`
        });
      }
    }

    // 타이틀 슬라이드
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: '1e3c72' };

    titleSlide.addText(document.title || '프레젠테이션', {
      x: 1, y: 2, w: 8, h: 1.5,
      fontSize: 42, bold: true, color: 'FFFFFF', align: 'center'
    });

    titleSlide.addText('주식회사 해피솔라', {
      x: 1, y: 4, w: 8, h: 1,
      fontSize: 24, color: 'F39C12', align: 'center'
    });

    titleSlide.addText(new Date().toLocaleDateString('ko-KR'), {
      x: 1, y: 5.5, w: 8, h: 0.5,
      fontSize: 16, color: 'BDC3C7', align: 'center'
    });

    // 컨텐츠 슬라이드들 - 개선된 디자인
    slides.forEach((slide: any, index: number) => {
      const contentSlide = pptx.addSlide();

      // 태양광 테마 그라데이션 헤더
      contentSlide.addShape('rect', {
        x: 0, y: 0, w: 10, h: 1.8,
        fill: { 
          type: 'gradient',
          colors: [
            { color: 'FF6B35', position: 0 },
            { color: 'F7931E', position: 50 },
            { color: 'FFD100', position: 100 }
          ],
          angle: 45
        }
      });

      // 태양광 아이콘 효과
      contentSlide.addShape('ellipse', {
        x: 0.2, y: 0.3, w: 1.2, h: 1.2,
        fill: { color: 'FFFFFF', transparency: 20 },
        line: { color: 'FFFFFF', width: 2 }
      });

      // 슬라이드 번호를 더 눈에 띄게
      contentSlide.addShape('ellipse', {
        x: 8.3, y: 0.1, w: 1.4, h: 1.4,
        fill: { 
          type: 'gradient',
          colors: [
            { color: '27AE60', position: 0 },
            { color: '2ECC71', position: 100 }
          ]
        },
        shadow: { type: 'outer', blur: 3, offset: 2, angle: 45, color: '000000', opacity: 0.3 }
      });

      contentSlide.addText(`${index + 1}`, {
        x: 8.3, y: 0.1, w: 1.4, h: 1.4,
        fontSize: 28, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle'
      });

      // 제목을 더 임팩트 있게
      contentSlide.addText(slide.title || `슬라이드 ${index + 1}`, {
        x: 1.6, y: 0.3, w: 6.5, h: 1.2,
        fontSize: 36, bold: true, color: 'FFFFFF', align: 'left', valign: 'middle',
        shadow: { type: 'outer', blur: 2, offset: 1, angle: 45, color: '000000', opacity: 0.5 }
      });

      // 콘텐츠 영역 배경
      contentSlide.addShape('rect', {
        x: 0.3, y: 2.2, w: 9.4, h: 4.3,
        fill: { color: 'F8F9FA' },
        line: { color: 'E9ECEF', width: 1 },
        shadow: { type: 'outer', blur: 5, offset: 2, angle: 45, color: '000000', opacity: 0.1 }
      });

      // 내용을 구조화하여 표시 - content 타입 체크 및 안전한 처리
      let content = '';
      if (slide.detailedContent) {
        if (typeof slide.detailedContent === 'string') {
          content = slide.detailedContent;
        } else if (typeof slide.detailedContent === 'object') {
          // 객체인 경우 문자열로 변환하거나 기본값 사용
          content = slide.detailedContent.toString ? slide.detailedContent.toString() : JSON.stringify(slide.detailedContent);
        }
      } else if (slide.content) {
        if (typeof slide.content === 'string') {
          content = slide.content;
        } else if (typeof slide.content === 'object') {
          content = slide.content.toString ? slide.content.toString() : JSON.stringify(slide.content);
        }
      } else if (slide.description && typeof slide.description === 'string') {
        content = slide.description;
      } else {
        content = `• 팜솔라그룹 ${slide.title || `슬라이드 ${index + 1}`} 관련 내용
• 태양광 발전 시설의 핵심 기술 및 솔루션
• 고객 맞춤형 서비스 제공
• 지속 가능한 에너지 솔루션 구현`;
      }

      // 문자열이 아닌 경우 강제 변환
      if (typeof content !== 'string') {
        content = String(content);
      }

      const contentLines = content.split('\n').filter(line => line.trim());
      
      // 메인 콘텐츠
      const mainContent = contentLines.slice(0, 3).join('\n');
      const additionalContent = contentLines.slice(3).join('\n');

      if (mainContent) {
        contentSlide.addText(mainContent, {
          x: 0.7, y: 2.5, w: 8.6, h: 2.5,
          fontSize: 20, color: '2C3E50', align: 'left', valign: 'top',
          lineSpacing: 32
        });
      }

      // 추가 내용이 있으면 별도 영역에 표시
      if (additionalContent) {
        contentSlide.addShape('rect', {
          x: 0.5, y: 5.2, w: 9, h: 1.3,
          fill: { color: 'E8F6F3' },
          line: { color: '27AE60', width: 2 }
        });

        contentSlide.addText('✓ ' + additionalContent.replace(/•/g, '✓'), {
          x: 0.8, y: 5.4, w: 8.4, h: 0.9,
          fontSize: 16, color: '27AE60', align: 'left', valign: 'top',
          bold: true
        });
      }

      // 개선된 푸터
      contentSlide.addShape('rect', {
        x: 0, y: 6.8, w: 10, h: 0.7,
        fill: { 
          type: 'gradient',
          colors: [
            { color: '34495E', position: 0 },
            { color: '2C3E50', position: 100 }
          ]
        }
      });

      // 회사 로고 영역
      contentSlide.addShape('rect', {
        x: 0.3, y: 6.95, w: 0.4, h: 0.4,
        fill: { color: 'FFD100' }
      });

      contentSlide.addText('주식회사 해피솔라 | 태양광 전문 기업', {
        x: 0.9, y: 6.8, w: 6, h: 0.7,
        fontSize: 14, color: 'BDC3C7', align: 'left', valign: 'middle',
        bold: true
      });

      // 진행률 표시
      const progressWidth = (index + 1) / slides.length * 2;
      contentSlide.addShape('rect', {
        x: 7.5, y: 7.05, w: progressWidth, h: 0.2,
        fill: { color: '27AE60' }
      });

      contentSlide.addText(`${index + 1} / ${slides.length}`, {
        x: 8.5, y: 6.8, w: 1.2, h: 0.7,
        fontSize: 14, color: 'BDC3C7', align: 'center', valign: 'middle',
        bold: true
      });
    });

    const output = await pptx.write({ outputType: 'arraybuffer' });
    return Buffer.from(output as ArrayBuffer);

  } catch (error) {
    console.error('PPTX generation failed:', error);
    throw new Error('PPTX 생성 중 오류가 발생했습니다.');
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
    return await generatePPTXContent(document);
  }
}

export const storage = new DatabaseStorage();