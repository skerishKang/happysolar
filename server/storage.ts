import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, documents, company, type User, type Document, type Company, type InsertDocument } from "@shared/schema";
import puppeteer from "puppeteer";

// PDF generation using simple HTML to text conversion
async function generatePDFContent(document: Document): Promise<Buffer> {
  try {
    // Parse content whether it's string or object
    let contentText = '';
    
    if (typeof document.content === 'string') {
      contentText = document.content;
    } else if (document.content && typeof document.content === 'object') {
      if (Array.isArray(document.content)) {
        contentText = document.content.map((item: any) => {
          if (typeof item === 'string') return item;
          if (item.title && item.content) return `${item.title}\n${item.content}`;
          if (item.content) return item.content;
          return typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item);
        }).join('\n\n');
      } else if (document.content.content && Array.isArray(document.content.content)) {
        contentText = document.content.content.map((slide: any) => {
          return `${slide.title || ''}\n${slide.content || ''}`;
        }).join('\n\n');
      } else if (document.content.slideStructure && Array.isArray(document.content.slideStructure)) {
        contentText = document.content.slideStructure.map((slide: any) => {
          return `${slide.title || ''}\n${slide.content || slide.description || ''}`;
        }).join('\n\n');
      } else if (document.content.fullText) {
        contentText = document.content.fullText;
      } else {
        // Extract meaningful text from structured object
        const extractText = (obj: any): string[] => {
          const texts: string[] = [];
          if (typeof obj === 'string') {
            texts.push(obj);
          } else if (typeof obj === 'object' && obj !== null) {
            Object.entries(obj).forEach(([key, value]) => {
              if (key !== 'documentType' && key !== 'title') {
                if (typeof value === 'string' && value.length > 10) {
                  texts.push(`${key}: ${value}`);
                } else if (typeof value === 'object') {
                  texts.push(...extractText(value));
                }
              }
            });
          }
          return texts;
        };
        
        const extractedTexts = extractText(document.content);
        contentText = extractedTexts.join('\n\n') || '문서 내용을 처리 중입니다.';
      }
    }
    
    // Clean up content text
    contentText = contentText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/\{[^}]*\}/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    // Create formatted text content for PDF
    const pdfContent = `
=============================================================
                   ${document.title || '문서'}
=============================================================

생성일: ${new Date(document.createdAt).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })}

-------------------------------------------------------------

${contentText}

-------------------------------------------------------------

주식회사 해피솔라
AI 자동화 문서 생성 시스템

=============================================================
`;

    return Buffer.from(pdfContent, 'utf-8');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Buffer.from(`PDF 생성 오류: ${error.message}`, 'utf-8');
  }
}

// Real PPTX generation using pptxgenjs library
async function generatePPTXContent(document: Document): Promise<Buffer> {
  // Dynamic import for CommonJS module
  const PptxGenJS = (await import('pptxgenjs')).default;
  
  // Create a new presentation
  const pptx = new PptxGenJS();
  
  // Set presentation properties
  pptx.theme = {
    headFontFace: 'Noto Sans KR',
    bodyFontFace: 'Noto Sans KR'
  };
  
  // Handle content whether it's string or object
  let slides: any[] = [];
  let requestedSlideCount = 5; // Default
  
  // Extract requested slide count from form data if available
  if (document.formData) {
    const slideCountField = Object.values(document.formData).find((value: any) => 
      typeof value === 'string' && !isNaN(Number(value)) && Number(value) > 0 && Number(value) <= 50
    );
    if (slideCountField) {
      requestedSlideCount = Number(slideCountField);
    }
  }
  
  if (typeof document.content === 'string') {
    const sections = document.content.split(/\n\n+/).filter(section => section.trim());
    slides = sections.slice(0, requestedSlideCount).map((section, index) => ({
      slideNumber: index + 1,
      title: section.split('\n')[0] || `슬라이드 ${index + 1}`,
      content: section,
      detailedContent: section.split('\n').slice(1).join('\n') || '상세 내용이 여기에 포함됩니다.'
    }));
  } else if (document.content && typeof document.content === 'object') {
    // Check for structured presentation content
    if (document.content.slideStructure && Array.isArray(document.content.slideStructure)) {
      slides = document.content.slideStructure.slice(0, requestedSlideCount).map((slide: any, index: number) => ({
        slideNumber: index + 1,
        title: slide.title || `슬라이드 ${index + 1}`,
        content: slide.content || slide.description || '',
        detailedContent: slide.content || slide.description || '이 슬라이드의 상세 내용이 포함됩니다.',
        designElements: slide.designElements || ''
      }));
    } else if (document.content.content && Array.isArray(document.content.content)) {
      slides = document.content.content.slice(0, requestedSlideCount);
    } else {
      // Create slides from available content, expanding to requested count
      const baseContent = document.content.fullText || JSON.stringify(document.content, null, 2);
      const sections = baseContent.split(/\n\n+/).filter(section => section.trim());
      
      // Generate slides to match requested count
      for (let i = 0; i < requestedSlideCount; i++) {
        const sectionIndex = i % sections.length;
        const section = sections[sectionIndex] || `슬라이드 ${i + 1} 내용`;
        
        slides.push({
          slideNumber: i + 1,
          title: `슬라이드 ${i + 1}: ${section.split('\n')[0] || '제목'}`,
          content: section,
          detailedContent: section.length > 100 ? section : section + '\n\n• 핵심 포인트 1\n• 핵심 포인트 2\n• 핵심 포인트 3\n\n더 자세한 설명과 분석이 포함됩니다.'
        });
      }
    }
  }

  // Ensure we have the requested number of slides
  while (slides.length < requestedSlideCount) {
    const slideNum = slides.length + 1;
    slides.push({
      slideNumber: slideNum,
      title: `추가 슬라이드 ${slideNum}`,
      content: `이 슬라이드는 추가로 생성된 내용입니다.`,
      detailedContent: `• 주요 내용 포인트\n• 상세 설명\n• 분석 및 인사이트\n• 실행 방안\n\n구체적인 데이터와 사례가 포함됩니다.`
    });
  }

  // Add title slide with better design
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: 'F8F9FA' };
  
  titleSlide.addText(document.title || '프레젠테이션', {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 1.5,
    fontSize: 36,
    bold: true,
    color: '2C3E50',
    align: 'center'
  });
  
  titleSlide.addText('주식회사 해피솔라', {
    x: 0.5,
    y: 3.5,
    w: 9,
    h: 0.8,
    fontSize: 20,
    color: '3498DB',
    align: 'center',
    bold: true
  });
  
  titleSlide.addText(new Date().toLocaleDateString('ko-KR'), {
    x: 0.5,
    y: 4.5,
    w: 9,
    h: 0.5,
    fontSize: 14,
    color: '7F8C8D',
    align: 'center'
  });

  // Add content slides with better formatting
  slides.forEach((slide, index) => {
    const contentSlide = pptx.addSlide();
    contentSlide.background = { color: 'FFFFFF' };
    
    // Add slide number
    contentSlide.addText(`${slide.slideNumber}`, {
      x: 9.2,
      y: 0.1,
      w: 0.5,
      h: 0.3,
      fontSize: 12,
      color: '95A5A6',
      align: 'center'
    });
    
    // Add title with background
    contentSlide.addShape('rect', {
      x: 0.3,
      y: 0.3,
      w: 9.4,
      h: 0.8,
      fill: { color: 'E8F4FD' },
      line: { color: '3498DB', width: 2 }
    });
    
    contentSlide.addText(slide.title || `슬라이드 ${index + 1}`, {
      x: 0.5,
      y: 0.4,
      w: 9,
      h: 0.6,
      fontSize: 24,
      bold: true,
      color: '2C3E50',
      align: 'left',
      valign: 'middle'
    });
    
    // Add main content
    const contentText = slide.detailedContent || slide.content || '내용이 여기에 표시됩니다.';
    contentSlide.addText(contentText, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 4,
      fontSize: 16,
      color: '34495E',
      valign: 'top',
      lineSpacing: 24
    });
    
    // Add footer
    contentSlide.addText('주식회사 해피솔라 - AI 문서 생성 시스템', {
      x: 0.5,
      y: 6.8,
      w: 9,
      h: 0.3,
      fontSize: 10,
      color: '95A5A6',
      align: 'center'
    });
  });

  // Generate and return the PPTX file as buffer
  const output = await pptx.write();
  
  // Handle different output types from pptx.write()
  if (output instanceof Buffer) {
    return output;
  } else if (output instanceof Uint8Array) {
    return Buffer.from(output);
  } else if (output instanceof ArrayBuffer) {
    return Buffer.from(output);
  } else {
    // If it's a Blob or other type, convert to buffer
    const arrayBuffer = await (output as Blob).arrayBuffer();
    return Buffer.from(arrayBuffer);
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

// Database Storage implementation
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
      // Insert default company info if none exists
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