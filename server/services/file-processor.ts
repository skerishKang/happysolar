
import fs from 'fs';
import path from 'path';

export interface ProcessedFile {
  originalName: string;
  content: string;
  type: 'pdf' | 'text' | 'image' | 'unknown';
}

export interface ProcessedFile {
  originalName: string;
  content: string;
  type: 'pdf' | 'text' | 'image' | 'unknown';
  extractedTitle?: string;
  extractedKeywords?: string[];
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
      let extractedTitle = '';
      let extractedKeywords: string[] = [];
      
      if (ext === '.pdf') {
        type = 'pdf';
        try {
          const pdfParse = (await import('pdf-parse')).default;
          const dataBuffer = fs.readFileSync(filePath);
          const pdfData = await pdfParse(dataBuffer);
          content = pdfData.text;
          
          // PDF에서 제목과 키워드 추출
          const lines = content.split('\n').filter(line => line.trim());
          if (lines.length > 0) {
            extractedTitle = lines[0].trim().substring(0, 50);
          }
          
          // 키워드 추출 (팜솔라, 태양광, 사업, 제안 등)
          const keywords = content.match(/팜솔라|해피솔라|태양광|발전|사업|제안|계약|견적|에너지|설치|공급/g);
          if (keywords) {
            extractedKeywords = [...new Set(keywords)];
          }
          
        } catch (error) {
          console.error('PDF parsing error:', error);
          content = `[PDF 파일 처리 오류: ${originalName}]`;
        }
      } else if (ext === '.txt' || ext === '.md') {
        type = 'text';
        content = fs.readFileSync(filePath, 'utf8');
        
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          extractedTitle = lines[0].trim().substring(0, 50);
        }
      } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
        type = 'image';
        content = `[이미지 파일: ${originalName}]`;
        extractedTitle = originalName.replace(/\.[^/.]+$/, ""); // 확장자 제거
      }
      
      // 파일명에서도 제목 추출 시도
      if (!extractedTitle) {
        extractedTitle = originalName
          .replace(/\.[^/.]+$/, "") // 확장자 제거
          .replace(/[_-]/g, ' ') // 언더스코어, 하이픈을 공백으로
          .trim();
      }
      
      processedFiles.push({
        originalName,
        content,
        type,
        extractedTitle,
        extractedKeywords
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
