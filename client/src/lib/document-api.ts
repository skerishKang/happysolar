
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

export async function downloadDocument(documentId: string, format: 'pdf' | 'pptx' = 'pptx'): Promise<void> {
  const response = await fetch(`${API_BASE}/documents/${documentId}/download?format=${format}`);
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error('Download error:', errorData);
    throw new Error(`다운로드 실패: ${response.status}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  
  // Get filename from Content-Disposition header if available
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = `document_${documentId}.${format === 'pptx' ? 'pptx' : 'html'}`;
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }
  
  a.download = filename;
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
