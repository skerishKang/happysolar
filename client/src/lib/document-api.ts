import { apiRequest } from "./queryClient";
import type { DocumentGenerationRequest } from "@shared/schema";

export async function generateDocument(data: DocumentGenerationRequest) {
  const response = await apiRequest("POST", "/api/documents/generate", data);
  return await response.json();
}

export async function downloadDocument(documentId: string) {
  const response = await apiRequest("GET", `/api/documents/${documentId}/download`);
  
  // Create blob and download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `HappySolar_Document_${documentId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  return { success: true };
}
