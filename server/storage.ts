import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, documents, company, type User, type Document, type Company, type InsertDocument } from "@shared/schema";
import puppeteer from "puppeteer";

// PDF generation using Puppeteer for better Korean support
async function generatePDFContent(document: Document): Promise<Buffer> {
  try {
    // Dynamic import for puppeteer and chromium
    const puppeteer = (await import('puppeteer-core')).default;
    const chromium = (await import('@sparticuz/chromium')).default;
    
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

    // Create HTML content with proper Korean font support
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${document.title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
        
        body { 
            font-family: 'Noto Sans KR', 'Malgun Gothic', Arial, sans-serif; 
            margin: 40px; 
            line-height: 1.8; 
            color: #333;
            font-size: 14px;
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 3px solid #4A90E2;
            padding-bottom: 20px;
        }
        .header h1 { 
            color: #2c3e50; 
            font-size: 24px;
            margin: 0 0 10px 0;
            font-weight: 700;
        }
        .date {
            color: #666;
            font-size: 12px;
        }
        .content { 
            white-space: pre-wrap; 
            margin: 20px 0;
            font-size: 13px;
            line-height: 1.6;
        }
        .footer { 
            margin-top: 50px; 
            text-align: center; 
            font-size: 11px; 
            color: #95a5a6;
            border-top: 1px solid #ecf0f1;
            padding-top: 20px;
        }
        @page {
            margin: 20mm;
            size: A4;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${document.title || '문서'}</h1>
        <div class="date">생성일: ${new Date(document.createdAt).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })}</div>
    </div>
    
    <div class="content">${contentText}</div>
    
    <div class="footer">
        <p><strong>주식회사 해피솔라</strong></p>
        <p>AI 자동화 문서 생성 시스템</p>
    </div>
</body>
</html>`;

    // Launch browser and generate PDF
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating PDF with Puppeteer:', error);
    // Fallback to simple text-based PDF
    return Buffer.from(`PDF 생성 오류: ${error}`);
  }
}

// Real PPTX generation using pptxgenjs library
async function generatePPTXContent(document: Document): Promise<Buffer> {
  // Dynamic import for CommonJS module
  const PptxGenJS = (await import('pptxgenjs')).default;
  
  // Create a new presentation
  const pptx = new PptxGenJS();
  
  // Handle content whether it's string or object
  let slides: any[] = [];
  
  if (typeof document.content === 'string') {
    slides = document.content.split('\n\n').filter(slide => slide.trim()).map((slide, index) => ({
      slideNumber: index + 1,
      title: slide.split('\n')[0] || `슬라이드 ${index + 1}`,
      content: slide
    }));
  } else if (document.content && Array.isArray(document.content)) {
    slides = document.content;
  } else if (document.content && typeof document.content === 'object') {
    // Check for structured presentation content
    if (document.content.content && Array.isArray(document.content.content)) {
      slides = document.content.content;
    } else if (document.content.slides && Array.isArray(document.content.slides)) {
      slides = document.content.slides;
    } else if (document.content.slideStructure && Array.isArray(document.content.slideStructure)) {
      // Parse slideStructure format
      slides = document.content.slideStructure.map((slide: any, index: number) => ({
        slideNumber: slide.slideNumber || index + 1,
        title: slide.title || slide.designElements || `슬라이드 ${index + 1}`,
        content: slide.content || slide.description || slide.designElements || ''
      }));
    } else {
      // Extract meaningful content from structured object
      const content = document.content;
      slides = [];
      
      // Try to extract from fullText first
      if (content.fullText) {
        const sections = content.fullText.split(/\n\n+/).filter(section => section.trim());
        slides = sections.map((section, index) => ({
          slideNumber: index + 1,
          title: section.split('\n')[0] || `슬라이드 ${index + 1}`,
          content: section
        }));
      }
      
      // If no slides from fullText, try to extract from other properties
      if (slides.length === 0) {
        Object.keys(content).forEach((key, index) => {
          if (key !== 'documentType' && key !== 'title' && content[key]) {
            const value = typeof content[key] === 'object' ? JSON.stringify(content[key], null, 2) : String(content[key]);
            slides.push({
              slideNumber: index + 1,
              title: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
              content: value
            });
          }
        });
      }
      
      // Fallback if no meaningful content found
      if (slides.length === 0) {
        slides = [
          { slideNumber: 1, title: document.title || '프레젠테이션', content: '프레젠테이션 내용' },
          { slideNumber: 2, title: '주요 내용', content: '자세한 내용이 포함됩니다.' }
        ];
      }
    }
  }

  // Add title slide
  const titleSlide = pptx.addSlide();
  titleSlide.addText(document.title || '프레젠테이션', {
    x: 1,
    y: 2,
    w: 8,
    h: 2,
    fontSize: 44,
    bold: true,
    color: '363636',
    align: 'center'
  });
  
  titleSlide.addText('주식회사 해피솔라', {
    x: 1,
    y: 4.5,
    w: 8,
    h: 1,
    fontSize: 20,
    color: '666666',
    align: 'center'
  });
  
  titleSlide.addText(new Date().toLocaleDateString('ko-KR'), {
    x: 1,
    y: 5.5,
    w: 8,
    h: 0.5,
    fontSize: 16,
    color: '999999',
    align: 'center'
  });

  // Add content slides
  slides.forEach((slide, index) => {
    const contentSlide = pptx.addSlide();
    
    // Add title
    contentSlide.addText(slide.title || `슬라이드 ${index + 1}`, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 1,
      fontSize: 28,
      bold: true,
      color: '363636'
    });
    
    // Add content
    const content = typeof slide.content === 'string' ? slide.content : JSON.stringify(slide.content, null, 2);
    contentSlide.addText(content, {
      x: 0.5,
      y: 1.8,
      w: 9,
      h: 4,
      fontSize: 18,
      color: '666666',
      valign: 'top'
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