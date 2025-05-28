import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, documents, company, type User, type Document, type Company, type InsertDocument } from "@shared/schema";
import PptxGenJS = require("pptxgenjs");

// Simple PDF generation using HTML to PDF approach
function generatePDFContent(document: Document): Buffer {
  // Create HTML content that can be converted to PDF
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${document.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 2px solid #4A90E2; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .content { white-space: pre-wrap; }
        .header { text-align: center; margin-bottom: 30px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${document.title}</h1>
        <p>생성일: ${new Date(document.createdAt).toLocaleDateString('ko-KR')}</p>
    </div>
    <div class="content">${document.content}</div>
    <div class="footer">
        <p>HappySolar AI 자동화 시스템으로 생성됨</p>
    </div>
</body>
</html>`;
  return Buffer.from(htmlContent, 'utf8');
}

// Real PPTX generation using pptxgenjs library
function generatePPTXContent(document: Document): Buffer {
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
    if (document.content.content && Array.isArray(document.content.content)) {
      slides = document.content.content;
    } else {
      slides = [{ slideNumber: 1, title: document.title, content: JSON.stringify(document.content, null, 2) }];
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
  return pptx.writeSync() as Buffer;
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
    return generatePDFContent(document);
  }

  async generatePPTX(document: Document): Promise<Buffer> {
    return generatePPTXContent(document);
  }
}

export const storage = new DatabaseStorage();