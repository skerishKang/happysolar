
import { storage } from "../storage";
import { generateDocumentContent } from "./openai";
import { processUploadedFiles, type ProcessedFile } from "./file-processor";

export async function generateDocument(type: string, formData: Record<string, any>, uploadedFiles: any[] = []): Promise<string> {
  try {
    console.log('=== Document Generation Process ===');
    console.log('Type:', type);
    console.log('Form Data:', formData);
    console.log('Uploaded Files Count:', uploadedFiles.length);

    // Get company info from storage
    const companyInfo = await storage.getCompanyInfo();

    // Process uploaded files with detailed logging
    console.log('Processing uploaded files...');
    const processedFiles = await processUploadedFiles(uploadedFiles);
    console.log('Processed Files:', processedFiles.map(f => ({ name: f.originalName, type: f.type, contentLength: f.content.length })));

    // Generate document content using OpenAI with uploaded file content
    console.log('Sending to OpenAI with processed files...');
    const result = await generateDocumentContent({
      type,
      formData,
      companyInfo,
      uploadedFiles: processedFiles
    });
    
    console.log('OpenAI result received:', { title: result.title, contentType: typeof result.content });

    // Create document record in database
    const document = await storage.createDocument({
      type,
      title: result.title,
      content: result.content,
      formData: {
        ...formData,
        processedFiles: processedFiles.map(f => ({ originalName: f.originalName, type: f.type })) // 파일 정보 저장
      },
      status: "completed",
      userId: null // No user association for now
    });

    console.log('Document created with ID:', document.id);
    return document.id.toString();
  } catch (error) {
    console.error("Error generating document:", error);
    throw new Error(`Failed to generate document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function getDocumentTypeKorean(type: string): string {
  const typeMap: Record<string, string> = {
    'quotation': '견적서',
    'transaction-statement': '거래명세서',
    'contract': '계약서',
    'presentation': '프레젠테이션',
    'proposal': '제안서',
    'minutes': '회의록',
    'email': '이메일'
  };
  return typeMap[type] || type;
}
