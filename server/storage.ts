import { users, documents, company, type User, type InsertUser, type Document, type InsertDocument, type Company } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Simple PDF generation mock - in production use libraries like jsPDF or puppeteer
function generatePDFContent(document: Document): Buffer {
  const content = `
    PDF Document: ${document.title}
    Type: ${document.type}
    Created: ${document.createdAt}
    
    Content:
    ${JSON.stringify(document.content, null, 2)}
  `;
  return Buffer.from(content, 'utf-8');
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getCompanyInfo(): Promise<Company>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  getRecentDocuments(limit: number): Promise<Document[]>;
  getDocumentStats(): Promise<{
    monthlyDocuments: number;
    timeSaved: string;
    efficiency: string;
    activeUsers: number;
  }>;
  generatePDF(document: Document): Promise<Buffer>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private company: Company;
  private currentUserId: number;
  private currentDocId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.currentUserId = 1;
    this.currentDocId = 1;
    
    // Initialize company info with HappySolar details
    this.company = {
      id: 1,
      name: "주식회사 해피솔라",
      businessNumber: "578-87-02666",
      address: "전라남도 장흥군 장흥읍 장흥로 30, 2층",
      businessType: "건설업, 전기공사업, 태양광발전소 부대장비",
      representative: "김미희"
    };

    // Add sample documents for demo
    this.initializeSampleDocuments();
  }

  private initializeSampleDocuments() {
    const sampleDocs: Document[] = [
      {
        id: 1,
        type: "tax-invoice",
        title: "세금계산서_해피솔라_2025001",
        content: { type: "pdf", pages: 1 },
        formData: { customer: "ABC건설", amount: 5000000 },
        status: "completed",
        createdAt: new Date("2025-01-15T14:32:00"),
        userId: 1
      },
      {
        id: 2,
        type: "presentation",
        title: "태양광 사업 제안서_ABC건설",
        content: { type: "pptx", slides: 15 },
        formData: { topic: "태양광 사업 제안", audience: "ABC건설" },
        status: "completed",
        createdAt: new Date("2025-01-14T16:45:00"),
        userId: 1
      },
      {
        id: 3,
        type: "contract",
        title: "태양광 설치 계약서_DEF아파트",
        content: { type: "docx", pages: 8 },
        formData: { client: "DEF아파트", contractType: "태양광 설치 계약" },
        status: "completed",
        createdAt: new Date("2025-01-14T11:20:00"),
        userId: 1
      }
    ];

    sampleDocs.forEach(doc => {
      this.documents.set(doc.id, doc);
      if (doc.id >= this.currentDocId) {
        this.currentDocId = doc.id + 1;
      }
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getCompanyInfo(): Promise<Company> {
    return this.company;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocId++;
    const document: Document = {
      ...insertDocument,
      id,
      createdAt: new Date()
    };
    this.documents.set(id, document);
    return document;
  }

  async getRecentDocuments(limit: number): Promise<Document[]> {
    const allDocs = Array.from(this.documents.values());
    return allDocs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .map(doc => ({
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
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyDocs = Array.from(this.documents.values()).filter(doc => {
      const docDate = new Date(doc.createdAt);
      return docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear;
    });

    return {
      monthlyDocuments: monthlyDocs.length,
      timeSaved: `${monthlyDocs.length * 2}시간`, // Assume 2 hours saved per document
      efficiency: "95%",
      activeUsers: 28
    };
  }

  async generatePDF(document: Document): Promise<Buffer> {
    // In production, use proper PDF generation library
    return generatePDFContent(document);
  }
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getCompanyInfo(): Promise<Company> {
    let [companyInfo] = await db.select().from(company);
    
    if (!companyInfo) {
      // Initialize with HappySolar group info if not exists
      [companyInfo] = await db
        .insert(company)
        .values({
          name: "주식회사 해피솔라 (팜솔라, 해피솔라, 탑솔라 그룹)",
          businessNumber: "578-87-02666",
          address: "전라남도 장흥군 장흥읍 장흥로 30, 2층",
          businessType: "태양광 발전사업, 신재생에너지 설비 시공 및 유지보수",
          representative: "노유봉"
        })
        .returning();
    }
    
    return companyInfo;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values({
        ...insertDocument,
        status: insertDocument.status || "pending"
      })
      .returning();
    return document;
  }

  async getRecentDocuments(limit: number): Promise<Document[]> {
    const recentDocs = await db
      .select()
      .from(documents)
      .orderBy(documents.createdAt)
      .limit(limit);
    return recentDocs;
  }

  async getDocumentStats(): Promise<{
    monthlyDocuments: number;
    timeSaved: string;
    efficiency: string;
    activeUsers: number;
  }> {
    const allDocs = await db.select().from(documents);
    const allUsers = await db.select().from(users);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyDocs = allDocs.filter(doc => {
      const docDate = new Date(doc.createdAt);
      return docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear;
    });
    
    return {
      monthlyDocuments: monthlyDocs.length,
      timeSaved: `${monthlyDocs.length * 2}시간`,
      efficiency: "95%",
      activeUsers: allUsers.length
    };
  }

  async generatePDF(document: Document): Promise<Buffer> {
    return generatePDFContent(document);
  }
}

export const storage = new DatabaseStorage();
