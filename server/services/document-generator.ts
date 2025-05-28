
import { storage } from "../storage";
import { generateDocumentContent } from "./openai";

export async function generateDocument(type: string, formData: Record<string, any>): Promise<string> {
  try {
    // Get company info from storage
    const companyInfo = await storage.getCompanyInfo();

    // Generate document content using OpenAI
    const result = await generateDocumentContent({
      type,
      formData,
      companyInfo
    });
    
    // Create document record in database
    const document = await storage.createDocument({
      type,
      title: result.title,
      content: result.content,
      formData,
      status: "completed",
      userId: 1 // Default user for now
    });

    return document.id.toString();
  } catch (error) {
    console.error("Error generating document:", error);
    throw new Error("Failed to generate document");
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
