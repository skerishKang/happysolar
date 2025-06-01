function createPromptForDocumentType(_type: string, _formData: Record<string, any>, _companyInfo: any, _uploadedFiles: any[]): string {
  // TODO: 실제 구현 필요
  return "";
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