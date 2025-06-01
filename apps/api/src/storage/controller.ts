import { IStorage } from "./types";

export class DatabaseStorage implements IStorage {
  async getUser(_id: number): Promise<any> { return undefined; }
  async getUserByUsername(_username: string): Promise<any> { return undefined; }
  async createUser(_userData: { username: string; password: string }): Promise<any> { throw new Error('Not implemented'); }
  async createDocument(_documentData: any): Promise<any> { throw new Error('Not implemented'); }
  async getDocument(_id: string): Promise<any> { return undefined; }
  async getDocuments(_userId?: number): Promise<any[]> { return []; }
  async getRecentDocuments(_limit: number): Promise<any[]> { return []; }
  async getDocumentStats(): Promise<any> { return { monthlyDocuments: 0, timeSaved: '', efficiency: '', activeUsers: 0 }; }
  async getCompanyInfo(): Promise<any> { return { name: '', businessNumber: '', address: '', businessType: '', representative: '' } as any; }
  async generatePDF(_document: any): Promise<Buffer> { return Buffer.from([]); }
  async generatePPTX(_document: any): Promise<Buffer> { return Buffer.from([]); }
} 