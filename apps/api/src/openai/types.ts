export interface DocumentGenerationParams {
  type: string;
  formData: Record<string, any>;
  companyInfo: {
    name: string;
    businessNumber: string;
    address: string;
    businessType: string;
    representative: string;
  };
  uploadedFiles: { originalName: string; type: string; content: string; }[];
} 