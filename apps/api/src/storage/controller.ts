import { db } from "../db";
import { users, documents, company, type User, type Document, type Company, type InsertDocument } from "@shared/schema";
import { IStorage } from "./types";
import { generatePDFContent, generatePPTX } from "./service";

export class DatabaseStorage implements IStorage {
  // ... (storage.ts의 DatabaseStorage 클래스 전체 복사)
} 