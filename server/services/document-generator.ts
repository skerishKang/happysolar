
import { storage } from "../storage";
import { generateDocumentContent } from "./openai";

export async function generateDocument(type: string, formData: Record<string, any>): Promise<string> {
  try {
    // Get company info from storage
    const companies = await storage.getCompanies();
    const companyInfo = companies[0] || {
      name: "주식회사 해피솔라",
      businessNumber: "578-87-02666",
      address: "전라남도 장흥군 장흥읍 장흥로 30, 2층",
      businessType: "건설업, 전기공사업, 태양광발전소 부대장비",
      representative: "김미희"
    };

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
    'tax-invoice': '세금계산서',
    'transaction-statement': '거래명세서',
    'contract': '계약서',
    'presentation': '프레젠테이션',
    'proposal': '제안서',
    'minutes': '회의록',
    'email': '이메일'
  };
  return typeMap[type] || type;
}
