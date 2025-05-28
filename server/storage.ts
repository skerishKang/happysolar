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

// Simple PPTX generation using XML structure
function generatePPTXContent(document: Document): Buffer {
  // Create basic PowerPoint XML structure
  const slides = document.content.split('\n\n').filter(slide => slide.trim());
  
  let pptxContent = `<?xml version="1.0" encoding="UTF-8"?>
<presentation xmlns="http://schemas.openxmlformats.org/presentationml/2006/main">
  <title>${document.title}</title>
  <slides>`;

  slides.forEach((slide, index) => {
    pptxContent += `
    <slide id="${index + 1}">
      <title>슬라이드 ${index + 1}</title>
      <content>${slide}</content>
    </slide>`;
  });

  pptxContent += `
  </slides>
  <footer>HappySolar AI로 생성됨 - ${new Date().toLocaleDateString('ko-KR')}</footer>
</presentation>`;

  return Buffer.from(pptxContent, 'utf8');
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