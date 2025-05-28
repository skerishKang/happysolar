import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { documentGenerationSchema } from "@shared/schema";
import { generateDocument } from "./services/document-generator";

export async function registerRoutes(app: Express): Promise<Server> {
  // Company information endpoint
  app.get("/api/company", async (req, res) => {
    try {
      const companyInfo = await storage.getCompanyInfo();
      res.json(companyInfo);
    } catch (error) {
      console.error("Error fetching company info:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Document statistics endpoint
  app.get("/api/documents/stats", async (req, res) => {
    try {
      const stats = await storage.getDocumentStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching document stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Recent documents endpoint
  app.get("/api/documents/recent", async (req, res) => {
    try {
      const recentDocs = await storage.getRecentDocuments(10);
      res.json(recentDocs);
    } catch (error) {
      console.error("Error fetching recent documents:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Document generation endpoint
  app.post("/api/documents/generate", async (req, res) => {
    try {
      const validatedData = documentGenerationSchema.parse(req.body);
      
      // Generate document using AI - returns document ID
      const documentId = await generateDocument(validatedData.type, validatedData.formData);
      
      // Get the saved document
      const savedDoc = await storage.getDocument(documentId);

      res.json({ 
        documentId: documentId,
        title: savedDoc?.title || "Generated Document",
        message: "Document generated successfully" 
      });
    } catch (error) {
      console.error("Error generating document:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate document" 
      });
    }
  });

  // Document download endpoint
  app.get("/api/documents/:id/download", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const format = req.query.format as string || 'pptx';
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Create safe filename using only English characters and numbers
      const safeTitle = document.title
        .replace(/[^a-zA-Z0-9]/g, '_')  // Replace all non-alphanumeric with underscore
        .substring(0, 20);  // Limit length
      
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const filename = `PPT_${safeTitle || 'document'}_${timestamp}.pptx`;
      
      // Generate PowerPoint file
      const pptxBuffer = await storage.generatePPTX(document);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.send(pptxBuffer);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}