
import fs from 'fs';
import path from 'path';

export interface ProcessedFile {
  originalName: string;
  content: string;
  type: 'pdf' | 'text' | 'image' | 'unknown';
}

export async function processUploadedFiles(files: any[]): Promise<ProcessedFile[]> {
  const processedFiles: ProcessedFile[] = [];
  
  for (const file of files) {
    try {
      // 안전한 파일명 처리
      const originalName = file.originalname || file.originalName || `file_${Date.now()}`;
      const filePath = file.path;
      
      if (!filePath || !originalName) {
        console.log('Invalid file data:', file);
        continue;
      }
      
      const ext = path.extname(originalName).toLowerCase();
      let content = '';
      let type: ProcessedFile['type'] = 'unknown';
      
      if (ext === '.pdf') {
        type = 'pdf';
        try {
          const pdfParse = (await import('pdf-parse')).default;
          const dataBuffer = fs.readFileSync(filePath);
          const pdfData = await pdfParse(dataBuffer);
          content = pdfData.text;
        } catch (error) {
          console.error('PDF parsing error:', error);
          content = `[PDF 파일 처리 오류: ${originalName}]`;
        }
      } else if (ext === '.txt' || ext === '.md') {
        type = 'text';
        content = fs.readFileSync(filePath, 'utf8');
      } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
        type = 'image';
        content = `[이미지 파일: ${originalName}]`;
      }
      
      processedFiles.push({
        originalName,
        content,
        type
      });
      
      // Clean up uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Error processing file ${file?.originalname || 'unknown'}:`, error);
    }
  }
  
  return processedFiles;
}
