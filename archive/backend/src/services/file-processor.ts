import fs from 'fs/promises';
import path from 'path';

export interface ProcessedFile {
  originalName: string;
  type: string;
  content: string; // Base64 encoded content
}

export async function processUploadedFiles(uploadedFileInfos: Array<{
  originalName: string;
  type: string;
  path: string;
}>): Promise<ProcessedFile[]> {
  console.log('=== Processing Uploaded Files ===');
  console.log(`Total files to process: ${uploadedFileInfos.length}`);

  const processed: ProcessedFile[] = [];

  for (const fileInfo of uploadedFileInfos) {
    try {
      console.log(`Processing file: ${fileInfo.originalName}`);
      
      // 파일 내용 읽기
      const fileBuffer = await fs.readFile(fileInfo.path);
      const base64Content = fileBuffer.toString('base64');
      
      processed.push({
        originalName: fileInfo.originalName,
        type: fileInfo.type,
        content: base64Content
      });

      console.log(`Successfully processed: ${fileInfo.originalName}`);
      console.log(`Content length: ${base64Content.length}`);

      // 임시 파일 삭제
      try {
        await fs.unlink(fileInfo.path);
        console.log(`Deleted temporary file: ${fileInfo.path}`);
      } catch (deleteError) {
        console.error(`Error deleting temporary file ${fileInfo.path}:`, deleteError);
      }
    } catch (error) {
      console.error(`Error processing file ${fileInfo.originalName}:`, error);
      // 파일 처리 실패 시에도 빈 콘텐츠로 추가
      processed.push({
        originalName: fileInfo.originalName,
        type: fileInfo.type,
        content: ''
      });
    }
  }

  console.log('=== File Processing Complete ===');
  console.log(`Successfully processed ${processed.length} files`);
  
  return processed;
} 