function createPromptForDocumentType(type: string, formData: Record<string, any>, companyInfo: any, uploadedFiles: any[]): string {
  // ... (openai.ts의 해당 함수 전체 복사)
}

function getDocumentTypeTitle(type: string): string {
  const titles: Record<string, string> = {
    'quotation': '견적서',
    'tax-invoice': '세금계산서',
    'transaction-statement': '거래명세서',
    'contract': '계약서',
    'presentation': '프레젠테이션',
    'proposal': '기획서',
    'minutes': '회의록',
    'email': '이메일'
  };
  return titles[type] || '문서';
}

export { createPromptForDocumentType, getDocumentTypeTitle }; 