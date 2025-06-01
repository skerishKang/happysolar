import { useQuery } from "@tanstack/react-query";
import { DocumentStats, RecentDocument, CompanyInfo } from "./types";

export function useDashboardData() {
  const { data: companyInfo } = useQuery<CompanyInfo>({
    queryKey: ['/api/company'],
  });

  const { data: stats } = useQuery<DocumentStats>({
    queryKey: ['/api/documents/stats'],
  });

  const { data: recentDocs } = useQuery<RecentDocument[]>({
    queryKey: ['/api/documents/recent'],
  });

  return {
    companyInfo,
    stats,
    recentDocs,
  };
} 