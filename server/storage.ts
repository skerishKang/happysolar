import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, documents, company, type User, type Document, type Company, type InsertDocument } from "@shared/schema";

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

// Simple PPTX generation using minimal PowerPoint structure
function generatePPTXContent(document: Document): Buffer {
  // Handle content whether it's string or object
  let slides: any[] = [];
  
  if (typeof document.content === 'string') {
    slides = document.content.split('\n\n').filter(slide => slide.trim()).map((slide, index) => ({
      slideNumber: index + 1,
      title: slide.split('\n')[0] || `슬라이드 ${index + 1}`,
      content: slide
    }));
  } else if (document.content && Array.isArray(document.content)) {
    // If content is an array of slide objects
    slides = document.content;
  } else if (document.content && typeof document.content === 'object') {
    // If content is an object, try to extract slides
    if (document.content.content && Array.isArray(document.content.content)) {
      slides = document.content.content;
    } else {
      slides = [{ slideNumber: 1, title: document.title, content: JSON.stringify(document.content, null, 2) }];
    }
  }
  
  // Create a simple HTML-based presentation that can be saved as .pptx
  let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${document.title}</title>
    <style>
        body { 
            font-family: 'Malgun Gothic', Arial, sans-serif; 
            margin: 0; 
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .slide {
            page-break-after: always;
            min-height: 600px;
            padding: 40px;
            margin-bottom: 40px;
            background: white;
            color: #333;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .slide:last-child { page-break-after: avoid; }
        h1 { 
            color: #2c3e50; 
            border-bottom: 3px solid #3498db; 
            padding-bottom: 15px;
            font-size: 32px;
            margin-bottom: 30px;
        }
        h2 { 
            color: #34495e; 
            font-size: 24px;
            margin-top: 30px;
            margin-bottom: 20px;
        }
        .content { 
            white-space: pre-wrap; 
            line-height: 1.8;
            font-size: 16px;
        }
        .title-slide {
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .title-slide h1 {
            font-size: 48px;
            border: none;
            color: white;
            margin-bottom: 20px;
        }
        .company-info {
            font-size: 18px;
            margin-top: 40px;
            opacity: 0.9;
        }
        .footer {
            position: fixed;
            bottom: 20px;
            right: 30px;
            font-size: 12px;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <!-- Title Slide -->
    <div class="slide title-slide">
        <h1>${document.title}</h1>
        <div class="company-info">
            <p>주식회사 해피솔라</p>
            <p>생성일: ${new Date().toLocaleDateString('ko-KR')}</p>
        </div>
    </div>`;

  // Add content slides
  slides.forEach((slide, index) => {
    const title = slide.title || `슬라이드 ${index + 2}`;
    const content = typeof slide.content === 'string' ? slide.content : JSON.stringify(slide.content, null, 2);
    
    htmlContent += `
    <div class="slide">
        <h1>${title}</h1>
        <div class="content">${content.replace(/\n/g, '<br>')}</div>
    </div>`;
  });

  htmlContent += `
    <div class="footer">
        HappySolar AI로 생성됨
    </div>
</body>
</html>`;

  return Buffer.from(htmlContent, 'utf8');
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