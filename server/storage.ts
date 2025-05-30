import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, documents, company, type User, type Document, type Company, type InsertDocument } from "@shared/schema";

// 실제 PDF 생성 - jsPDF 사용
async function generatePDFContent(document: Document): Promise<Buffer> {
  try {
    console.log('Starting PDF generation for document:', document.id);

    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF();

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

    // 첫 페이지 - 표지
    doc.setFillColor(30, 60, 114); // 진한 파란색
    doc.rect(0, 0, 210, 297, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text(document.title || '프레젠테이션', 105, 80, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(243, 156, 18); // 주황색
    doc.text('주식회사 해피솔라', 105, 120, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(189, 195, 199); // 회색
    doc.text(new Date().toLocaleDateString('ko-KR'), 105, 150, { align: 'center' });

    // 각 슬라이드를 새 페이지로 추가
    slides.forEach((slide: any, index: number) => {
      doc.addPage();

      // 헤더 배경
      doc.setFillColor(52, 152, 219); // 파란색
      doc.rect(0, 0, 210, 30, 'F');

      // 슬라이드 번호 원
      doc.setFillColor(231, 76, 60); // 빨간색
      doc.circle(180, 15, 8, 'F');

      // 슬라이드 번호 텍스트
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text(`${index + 1}`, 180, 18, { align: 'center' });

      // 슬라이드 제목
      doc.setFontSize(18);
      doc.text(slide.title || `슬라이드 ${index + 1}`, 20, 18);

      // 슬라이드 내용
      doc.setTextColor(44, 62, 80); // 어두운 회색
      doc.setFontSize(12);
      
      const content = slide.detailedContent || slide.content || slide.description || '';
      const lines = content.split('\n').filter(line => line.trim());
      
      let yPosition = 50;
      lines.forEach((line: string) => {
        if (yPosition > 250) return; // 페이지 하단 근처에서 멈춤
        doc.text(line, 20, yPosition);
        yPosition += 8;
      });

      // 푸터
      doc.setFillColor(52, 73, 94); // 어두운 회색
      doc.rect(0, 280, 210, 17, 'F');

      doc.setTextColor(189, 195, 199);
      doc.setFontSize(10);
      doc.text('주식회사 해피솔라 - AI 문서 생성 시스템', 20, 290);
      doc.text(`${index + 1} / ${slides.length}`, 180, 290, { align: 'center' });
    });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    console.log('PDF generated successfully');
    return pdfBuffer;

  } catch (error) {
    console.error('PDF generation failed:', error);
    
    // 폴백으로 간단한 PDF 생성
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(document.title || '문서', 20, 30);
    doc.setFontSize(12);
    doc.text(`생성일: ${new Date(document.createdAt).toLocaleDateString('ko-KR')}`, 20, 50);
    doc.text('주식회사 해피솔라', 20, 70);
    
    const content = typeof document.content === 'string' ? document.content : '문서 내용을 불러올 수 없습니다.';
    const lines = content.split('\n').slice(0, 20); // 최대 20줄
    
    let yPosition = 90;
    lines.forEach((line: string) => {
      if (yPosition > 250) return;
      doc.text(line, 20, yPosition);
      yPosition += 10;
    });
    
    return Buffer.from(doc.output('arraybuffer'));
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

    // 컨텐츠 슬라이드들
    slides.forEach((slide: any, index: number) => {
      const contentSlide = pptx.addSlide();

      // 헤더 배경
      contentSlide.addShape('rect', {
        x: 0, y: 0, w: 10, h: 1.5,
        fill: { color: '3498DB' }
      });

      // 슬라이드 번호
      contentSlide.addShape('ellipse', {
        x: 8.5, y: 0.25, w: 1, h: 1,
        fill: { color: 'E74C3C' }
      });

      contentSlide.addText(`${index + 1}`, {
        x: 8.5, y: 0.25, w: 1, h: 1,
        fontSize: 24, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle'
      });

      // 제목
      contentSlide.addText(slide.title || `슬라이드 ${index + 1}`, {
        x: 0.5, y: 0.25, w: 7.5, h: 1,
        fontSize: 32, bold: true, color: 'FFFFFF', align: 'left', valign: 'middle'
      });

      // 내용
      const content = slide.detailedContent || slide.content || slide.description || '';
      const contentLines = content.split('\n').filter(line => line.trim());

      contentSlide.addText(contentLines.join('\n'), {
        x: 0.5, y: 2, w: 9, h: 4.5,
        fontSize: 18, color: '2C3E50', align: 'left', valign: 'top'
      });

      // 푸터
      contentSlide.addShape('rect', {
        x: 0, y: 7, w: 10, h: 0.5,
        fill: { color: '34495E' }
      });

      contentSlide.addText('주식회사 해피솔라 - AI 문서 생성 시스템', {
        x: 0.5, y: 7, w: 6, h: 0.5,
        fontSize: 12, color: 'BDC3C7', align: 'left', valign: 'middle'
      });

      contentSlide.addText(`${index + 1} / ${slides.length}`, {
        x: 8.5, y: 7, w: 1, h: 0.5,
        fontSize: 12, color: 'BDC3C7', align: 'center', valign: 'middle'
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