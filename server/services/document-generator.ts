import { generateDocumentContent } from "./openai";
import { storage } from "../storage";
import type { DocumentGenerationRequest } from "@shared/schema";

export async function generateDocument(request: DocumentGenerationRequest) {
  try {
    // Get company information
    const companyInfo = await storage.getCompanyInfo();
    
    // Generate document content using OpenAI
    const result = await generateDocumentContent({
      type: request.type,
      formData: request.formData,
      companyInfo
    });
    
    return {
      title: result.title,
      content: result.content,
      status: "completed"
    };
  } catch (error) {
    console.error("Document generation error:", error);
    throw new Error("Failed to generate document. Please try again.");
  }
}
