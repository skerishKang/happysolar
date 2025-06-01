import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Receipt, FileText, Presentation, Download, Share } from 'lucide-react';
import React from 'react';
import { RecentDocument } from './types';

interface RecentDocumentsProps {
  recentDocs?: RecentDocument[];
  handleDownload: (docId: string, format: 'pdf' | 'pptx') => void;
}

const RecentDocuments: React.FC<RecentDocumentsProps> = ({ recentDocs, handleDownload }) => {
  return (
    <Card className="p-8 shadow-lg border border-gray-100 mb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">최근 생성 문서</h3>
          <p className="text-gray-600">AI가 생성한 최신 문서들을 확인하세요</p>
        </div>
        <Button variant="ghost" className="text-blue-600 hover:text-blue-700 font-medium">
          <span>전체 보기</span>
        </Button>
      </div>
      <div className="space-y-4">
        {recentDocs && recentDocs.length > 0 ? (
          recentDocs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{doc.title}</h4>
                  <p className="text-sm text-gray-600">{doc.createdAt} 생성 • PDF 형식</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(doc.id, 'pdf')}
                  className="text-gray-500 hover:text-blue-600"
                  title="HTML 파일로 다운로드"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(doc.id, 'pptx')}
                  className="text-gray-500 hover:text-orange-600"
                  title="PowerPoint 형식으로 다운로드"
                >
                  <Presentation className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-blue-600"
                >
                  <Share className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">아직 생성된 문서가 없습니다</p>
            <p className="text-sm text-gray-400">위의 기능들을 사용해서 첫 번째 문서를 생성해보세요</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RecentDocuments; 