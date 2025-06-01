import type { Express } from "express";
import { createServer, type Server } from "http";
import { DatabaseStorage } from "./storage";
import { documentGenerationSchema } from "@shared/shared/schema";
import { generateDocument } from "./services/document-generator";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = new DatabaseStorage();

// 업로드 디렉토리가 없으면 생성
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storageConfig = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, _file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(_file.originalname));
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
  fileFilter: (_req, _file, cb) => {
    if (ALLOWED_MIMETYPES.includes(_file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('FILE_TYPE_NOT_ALLOWED: 지원하지 않는 파일 형식입니다.'));
    }
  }
  // limits 객체를 완전히 제거하여 파일 사이즈 제한을 없앱니다.
});

export async function registerRoutes(app: Express): Promise<Server> {
  // File upload endpoint
  app.post("/api/upload", uploadMiddleware.single('file'), (_req: any, res: any, next: any) => {
    (async () => {
      if (!_req.file) {
        return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
      }
      const fileInfo = {
        originalName: _req.file.originalname,
        filename: _req.file.filename,
        path: _req.file.path,
        mimetype: _req.file.mimetype,
        size: _req.file.size
      };
      res.json({ message: "파일이 성공적으로 업로드되었습니다.", file: fileInfo });
    })().catch(next);
  });
  // Company information endpoint
  app.get("/api/company", (_req: any, res: any, next: any) => {
    (async () => {
      try {
        const companyInfo = await storage.getCompanyInfo();
        res.json(companyInfo);
      } catch (error) {
        console.error("Error fetching company info:", error);
        res.json({
          id: 1,
          name: "주식회사 해피솔라",
          businessNumber: "123-45-67890",
          address: "전라남도 장흥군",
          businessType: "태양광 발전 사업",
          representative: "김대표"
        });
      }
    })().catch(next);
  });

  // Document statistics endpoint
  app.get("/api/documents/stats", (_req: any, res: any, next: any) => {
    (async () => {
      try {
        const stats = await storage.getDocumentStats();
        res.json(stats);
      } catch (error) {
        console.error("Error fetching document stats:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    })().catch(next);
  });

  // Recent documents endpoint
  app.get("/api/documents/recent", (_req: any, res: any, next: any) => {
    (async () => {
      try {
        const recentDocs = await storage.getRecentDocuments(10);
        res.json(recentDocs);
      } catch (error) {
        console.error("Error fetching recent documents:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    })().catch(next);
  });

  // Document generation endpoint
  app.post("/api/documents/generate", (_req: any, res: any, next: any) => {
    (async () => {
      try {
        const validatedData = documentGenerationSchema.parse(_req.body);

        // Generate document using AI - returns document ID
        const documentId = await generateDocument(validatedData.type, validatedData.formData, validatedData.uploadedFiles || []);

        // Get the saved document
        const savedDoc = await storage.getDocument(documentId) as any;

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
    })().catch(next);
  });

  // Download document as PPTX or PDF
  app.get('/api/documents/:id/download', (_req: any, res: any, next: any) => {
    (async () => {
      try {
        const documentId = _req.params.id;
        const format = _req.query.format as string || 'pptx';
        
        console.log(`Download request: ID=${documentId}, format=${format}`);
        
        // ID 유효성 검사
        if (!documentId || isNaN(parseInt(documentId))) {
          console.error('Invalid document ID:', documentId);
          return res.status(400).json({ error: 'Invalid document ID' });
        }

        const document = await storage.getDocument(documentId) as any;

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
    })().catch(next);
  });

  const httpServer = createServer(app);
  return httpServer;
}