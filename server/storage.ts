import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, documents, company, type User, type Document, type Company, type InsertDocument } from "@shared/schema";

// Simple PDF generation placeholder
function generatePDFContent(document: Document): Buffer {
  // In production, use proper PDF generation library like puppeteer or pdfkit
  const content = JSON.stringify(document.content, null, 2);
  return Buffer.from(`PDF Content for: ${document.title}\n\n${content}`);
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
}

export const storage = new DatabaseStorage();