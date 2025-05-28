
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
      const filePath = file.path;
      const ext = path.extname(file.originalname).toLowerCase();
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
          content = `[PDF 파일 처리 오류: ${file.originalname}]`;
        }
      } else if (ext === '.txt' || ext === '.md') {
        type = 'text';
        content = fs.readFileSync(filePath, 'utf8');
      } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
        type = 'image';
        content = `[이미지 파일: ${file.originalname}]`;
      }
      
      processedFiles.push({
        originalName: file.originalname,
        content,
        type
      });
      
      // Clean up uploaded file
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(`Error processing file ${file.originalname}:`, error);
    }
  }
  
  return processedFiles;
}
