import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Upload } from 'lucide-react';

interface FileUploadBoxProps {
  uploadedFiles: Array<{ filename: string; originalname: string; mimetype: string; size: number; path: string; }>;
  onRemove: (filename: string) => void;
  onPreview?: (filename: string) => void;
}

export default function FileUploadBox({ uploadedFiles, onRemove, onPreview }: FileUploadBoxProps) {
  return (
    <div className="space-y-2">
      {uploadedFiles.map((file) => (
        <div key={file.filename} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 border border-gray-200">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-800 font-medium">{file.originalname}</span>
            <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
          <div className="flex items-center space-x-2">
            {onPreview && (
              <Button size="sm" variant="outline" onClick={() => onPreview(file.filename)}>
                <Upload className="w-3 h-3 mr-1" /> 미리보기
              </Button>
            )}
            <Button size="sm" variant="destructive" onClick={() => onRemove(file.filename)}>
              <X className="w-3 h-3 mr-1" /> 삭제
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
} 