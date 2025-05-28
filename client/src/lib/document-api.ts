
const API_BASE = '/api';

export interface DocumentGenerationRequest {
  type: string;
  formData: Record<string, any>;
}

export interface DocumentGenerationResponse {
  documentId: string;
}

export async function generateDocument(request: DocumentGenerationRequest): Promise<DocumentGenerationResponse> {
  const response = await fetch(`${API_BASE}/documents/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to generate document');
  }

  return response.json();
}

export async function downloadDocument(documentId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/documents/${documentId}/download`);
  
  if (!response.ok) {
    throw new Error('Failed to download document');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = `document_${documentId}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function fetchRecentDocuments() {
  const response = await fetch(`${API_BASE}/documents/recent`);
  if (!response.ok) {
    throw new Error('Failed to fetch recent documents');
  }
  return response.json();
}

export async function fetchDocumentStats() {
  const response = await fetch(`${API_BASE}/documents/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch document stats');
  }
  return response.json();
}

export async function fetchCompanyInfo() {
  const response = await fetch(`${API_BASE}/company`);
  if (!response.ok) {
    throw new Error('Failed to fetch company info');
  }
  return response.json();
}
