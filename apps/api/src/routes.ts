import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { documentGenerationSchema } from "@shared/schema";
import { generateDocument } from "./services/document-generator";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 업로드 디렉토리가 없으면 생성
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-powerpoint', // .ppt
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/plain', // .txt
  'image/jpeg',
  'image/png',
  'image/gif',
  'audio/mpeg', // .mp3
  'audio/wav', // .wav
  'audio/x-m4a' // .m4a
];

const uploadMiddleware = multer({
  storage: storageConfig,
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('FILE_TYPE_NOT_ALLOWED: 지원하지 않는 파일 형식입니다.'));
    }
  }
  // limits 객체를 완전히 제거하여 파일 사이즈 제한을 없앱니다.
});

export async function registerRoutes(app: Express): Promise<Server> {
  // File upload endpoint
  app.post("/api/upload", uploadMiddleware.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
      }

      const fileInfo = {
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      };

      res.json({ message: "파일이 성공적으로 업로드되었습니다.", file: fileInfo });
    } catch (error) {
      console.error("Error uploading files:", error);
      if (error instanceof multer.MulterError) {
        return res.status(400).json({ message: error.code || "Multer 파일 업로드 오류", details: error.message });
      }
      res.status(500).json({ message: "파일 업로드 중 오류가 발생했습니다." });
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