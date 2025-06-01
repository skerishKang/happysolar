export interface DocumentStats {
  monthlyDocuments: number;
  timeSaved: string;
  efficiency: string;
  activeUsers: number;
}

export interface RecentDocument {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  status: string;
}

export interface CompanyInfo {
  name: string;
  businessNumber: string;
  address: string;
  businessType: string;
  representative: string;
} 