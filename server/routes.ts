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
      // 기본 회사 정보로 응답
      res.json({
        id: 1,
        name: "주식회사 해피솔라",
        businessNumber: "123-45-67890",
        address: "전라남도 장흥군",
        businessType: "태양광 발전 사업",
        representative: "김대표"
      });
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
      
      let errorMessage = "문서 생성 중 오류가 발생했습니다.";
      if (error instanceof Error) {
        if (error.message.includes("Control plane request failed")) {
          errorMessage = "데이터베이스 연결 오류입니다. 잠시 후 다시 시도해주세요.";
        } else {
          errorMessage = error.message;
        }
      }
      
      res.status(500).json({ 
        message: errorMessage
      });
    }
  });

  // Download document as PPTX or PDF
  app.get('/api/documents/:id/download', async (req, res) => {
    try {
      const documentId = req.params.id;
      const format = req.query.format as string || 'pptx';
      
      console.log(`Download request: ID=${documentId}, format=${format}`);
      
      // ID 유효성 검사
      if (!documentId || isNaN(parseInt(documentId))) {
        console.error('Invalid document ID:', documentId);
        return res.status(400).json({ error: 'Invalid document ID' });
      }

      const document = await storage.getDocument(documentId);

      if (!document) {
        console.error('Document not found:', documentId);
        return res.status(404).json({ error: 'Document not found' });
      }

      console.log('Document found:', document.title);

      if (format === 'pdf') {
        try {
          const pdfBuffer = await storage.generatePDF(document);
          const sanitizedTitle = (document.title || 'document')
            .replace(/[^a-zA-Z0-9가-힣\s\-_]/g, '')
            .replace(/\s+/g, '_')
            .trim();
          const filename = `${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.pdf`;

          // 실제 PDF 파일로 제공
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
          res.send(pdfBuffer);
          
          console.log('PDF (Text format) download completed');
        } catch (pdfError) {
          console.error('PDF generation error:', pdfError);
          return res.status(500).json({ error: 'PDF generation failed' });
        }
      } else if (format === 'pptx') {
        try {
          const pptxBuffer = await storage.generatePPTX(document);
          const sanitizedTitle = (document.title || 'document')
            .replace(/[^a-zA-Z0-9가-힣\s\-_]/g, '')
            .replace(/\s+/g, '_')
            .trim();
          const filename = `${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.pptx`;

          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
          res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
          res.send(pptxBuffer);
          
          console.log('PPTX download completed');
        } catch (pptxError) {
          console.error('PPTX generation error:', pptxError);
          return res.status(500).json({ error: 'PPTX generation failed' });
        }
      } else {
        return res.status(400).json({ error: 'Invalid format. Use pdf or pptx' });
      }
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ 
        error: 'Failed to process download request',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}