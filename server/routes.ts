import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { documentGenerationSchema } from "@shared/schema";
import { generateDocument } from "./services/document-generator";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // File upload endpoint
  app.post("/api/upload", upload.array('files', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const fileInfos = [];

      for (const file of files) {
        const fileInfo = {
          originalName: file.originalname,
          filename: file.filename,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size
        };
        fileInfos.push(fileInfo);
      }

      res.json({ files: fileInfos });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "File upload failed" });
    }
  });
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
      const documentId = await generateDocument(validatedData.type, validatedData.formData, validatedData.uploadedFiles || []);

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

  // Download document as PPTX or PDF
  app.get('/api/documents/:id/download', async (req, res) => {
    try {
      const documentId = req.params.id;
      const format = req.query.format as string || 'pptx';
      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      if (format === 'pdf') {
        const pdfBuffer = await storage.generatePDF(document);
        let filename = `${document.title || 'document'}_${new Date().toISOString().split('T')[0]}`;
        let contentType = 'application/pdf';
        
        // Check if it's actually HTML fallback (when PDF generation fails)
        const content = pdfBuffer.toString('utf8');
        if (content.includes('<!DOCTYPE html>') || content.includes('<html>')) {
          filename += '.html';
          contentType = 'text/html';
        } else {
          filename += '.pdf';
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.send(pdfBuffer);
      } else if (format === 'pptx') {
        const pptxBuffer = await storage.generatePPTX(document);
        const filename = `${document.title || 'document'}_${new Date().toISOString().split('T')[0]}.pptx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.send(pptxBuffer);
      } else {
        return res.status(400).json({ error: 'Invalid format. Use pdf or pptx' });
      }
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Failed to generate document' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}