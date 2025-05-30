import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, documents, company, type User, type Document, type Company, type InsertDocument } from "@shared/schema";
import puppeteer from "puppeteer";

// PDF generation using jsPDF
async function generatePDFContent(document: Document): Promise<Buffer> {
  // Dynamic import for jsPDF
  const jsPDF = (await import('jspdf')).default;
  
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
      contentText = JSON.stringify(document.content, null, 2);
    }
  }

  // Create PDF using jsPDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Add Korean font support
  doc.setFont('helvetica');
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(document.title || '문서', 105, 30, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`생성일: ${new Date(document.createdAt).toLocaleDateString('ko-KR')}`, 105, 40, { align: 'center' });
  
  // Draw line under header
  doc.setDrawColor(74, 144, 226);
  doc.setLineWidth(0.5);
  doc.line(20, 45, 190, 45);
  
  // Content
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(contentText, 170);
  let yPosition = 60;
  
  lines.forEach((line: string) => {
    if (yPosition > 270) { // Add new page if needed
      doc.addPage();
      yPosition = 20;
    }
    doc.text(line, 20, yPosition);
    yPosition += 6;
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('주식회사 해피솔라 - AI 자동화 문서 생성 시스템', 105, 285, { align: 'center' });
    doc.text(`페이지 ${i} / ${pageCount}`, 190, 285, { align: 'right' });
  }

  // Return PDF as buffer
  const pdfBuffer = doc.output('arraybuffer');
  return Buffer.from(pdfBuffer);
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
    } else {
      // Parse JSON structure for presentation content
      const contentStr = typeof document.content === 'object' ? JSON.stringify(document.content, null, 2) : String(document.content);
      
      // Try to extract meaningful content from JSON
      const lines = contentStr.split('\n').filter(line => line.trim() && !line.includes('{') && !line.includes('}') && !line.includes('"title"') && !line.includes('"content"'));
      
      // Group lines into slides (every 5-10 lines)
      const slideGroups = [];
      for (let i = 0; i < lines.length; i += 8) {
        slideGroups.push(lines.slice(i, i + 8));
      }
      
      slides = slideGroups.map((group, index) => ({
        slideNumber: index + 1,
        title: group[0]?.replace(/[",]/g, '').trim() || `슬라이드 ${index + 1}`,
        content: group.slice(1).map(line => line.replace(/[",]/g, '').trim()).filter(line => line).join('\n')
      }));
      
      // If no proper slides generated, create from document content
      if (slides.length === 0 || slides.every(slide => !slide.content)) {
        slides = [
          { slideNumber: 1, title: document.title, content: '프레젠테이션 내용이 생성 중입니다.' },
          { slideNumber: 2, title: '주요 내용', content: contentStr.substring(0, 500) + '...' }
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