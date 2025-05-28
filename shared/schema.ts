import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'quotation', 'transaction-statement', 'contract', 'presentation', 'proposal', 'minutes', 'email'
  title: text("title").notNull(),
  content: jsonb("content").notNull(), // Generated document content
  formData: jsonb("form_data").notNull(), // Original form input data
  status: text("status").notNull().default("completed"), // 'generating', 'completed', 'error'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: integer("user_id").references(() => users.id).default(null),
});

export const company = pgTable("company", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("주식회사 해피솔라"),
  businessNumber: text("business_number").notNull().default("578-87-02666"),
  address: text("address").notNull().default("전라남도 장흥군 장흥읍 장흥로 30, 2층"),
  businessType: text("business_type").notNull().default("건설업, 전기공사업, 태양광발전소 부대장비"),
  representative: text("representative").notNull().default("김미희"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  type: true,
  title: true,
  content: true,
  formData: true,
  status: true,
  userId: true,
});

export const documentGenerationSchema = z.object({
  type: z.enum(['quotation', 'transaction-statement', 'contract', 'presentation', 'proposal', 'minutes', 'email']),
  formData: z.record(z.any()),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type Company = typeof company.$inferSelect;
export type DocumentGenerationRequest = z.infer<typeof documentGenerationSchema>;
