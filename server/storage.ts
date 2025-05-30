import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, documents, company, type User, type Document, type Company, type InsertDocument } from "@shared/schema";
import puppeteer from "puppeteer";

// Real PDF generation using puppeteer
async function generatePDFContent(document: Document): Promise<Buffer> {
  // Parse content whether it's string or object
  let contentText = '';
  
  if (typeof document.content === 'string') {
    contentText = document.content;
  } else if (document.content && typeof document.content === 'object') {
    if (Array.isArray(document.content)) {
      contentText = document.content.map((item: any) => {
        if (typeof item === 'string') return item;
        if (item.content) return item.content;
        return JSON.stringify(item, null, 2);
      }).join('\n\n');
    } else if (document.content.content && Array.isArray(document.content.content)) {
      contentText = document.content.content.map((slide: any) => {
        return `${slide.title || ''}\n${slide.content || ''}`;
      }).join('\n\n');
    } else {
      contentText = JSON.stringify(document.content, null, 2);
    }
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${document.title}</title>
    <style>
        @page { size: A4; margin: 2cm; }
        body { 
            font-family: 'Malgun Gothic', Arial, sans-serif; 
            margin: 0; 
            padding: 20px;
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
            font-weight: bold;
        }
        .header .date {
            color: #7f8c8d;
            font-size: 12px;
        }
        .content { 
            white-space: pre-wrap; 
            margin: 20px 0;
            text-align: justify;
        }
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .section-title {
            color: #2980b9;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            border-left: 4px solid #4A90E2;
            padding-left: 15px;
        }
        .footer { 
            margin-top: 50px; 
            text-align: center; 
            font-size: 11px; 
            color: #95a5a6;
            border-top: 1px solid #ecf0f1;
            padding-top: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${document.title}</h1>
        <div class="date">생성일: ${new Date(document.createdAt).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</div>
    </div>
    
    <div class="content">
        ${contentText.split('\n\n').map(section => `
            <div class="section">
                ${section}
            </div>
        `).join('')}
    </div>
    
    <div class="footer">
        <p><strong>주식회사 해피솔라</strong></p>
        <p>AI 자동화 문서 생성 시스템</p>
        <p>본 문서는 AI를 활용하여 자동 생성되었습니다.</p>
    </div>
</body>
</html>`;

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-features=VizDisplayCompositor',
      '--single-process'
    ]
  });
  
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    margin: {
      top: '2cm',
      right: '2cm',
      bottom: '2cm',
      left: '2cm'
    },
    printBackground: true
  });
  
  await browser.close();
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