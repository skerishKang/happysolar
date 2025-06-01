import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface PreviewModalProps {
  visible: boolean;
  onClose: () => void;
  previewData: any;
}

export default function PreviewModal({ visible, onClose, previewData }: PreviewModalProps) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>문서 미리보기</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent>
          {/* 실제 미리보기 데이터 렌더링 */}
          <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 rounded-lg p-4 overflow-x-auto">
            {JSON.stringify(previewData, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
} 