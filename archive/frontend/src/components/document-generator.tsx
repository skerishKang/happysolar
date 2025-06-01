import { handleFileUpload as uploadSingleFile } from '../utils/FileUploader';
import { useState, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { generateDocument, downloadDocument } from '@/lib/document-api';
import { FileText, Download, Check, Info, Mic, Languages, Sparkles, Brain, Zap } from 'lucide-react';

export default function DocumentGenerator({ featureId, companyInfo, onClose }: DocumentGeneratorProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
  }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleOverallFileUpload = async (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    console.log('File upload handler triggered.');
    
    const files = event instanceof React.ChangeEvent ? event.target.files : event.dataTransfer.files;
    if (!files || files.length === 0) {
      console.log('No files selected.');
      return;
    }

    console.log(`Processing ${files.length} files...`);
    const newUploadedFiles = [];
    let uploadSuccessCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Attempting to upload file: ${file.name}`);
      
      try {
        const result = await uploadSingleFile(file);
        console.log('Upload result:', result);
        
        if (result && result.file) {
          newUploadedFiles.push(result.file);
          uploadSuccessCount++;
          console.log(`Successfully uploaded: ${file.name}`);
        } else {
          console.error('Upload result missing file information:', result);
        }
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        toast({
          title: "파일 업로드 실패",
          description: `${file.name} 파일 업로드 중 오류가 발생했습니다.`,
          variant: "destructive",
        });
      }
    }

    if (uploadSuccessCount > 0) {
      setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
      toast({
        title: "파일 업로드 완료",
        description: `${uploadSuccessCount}개 파일이 업로드되었습니다.`,
      });
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleOverallFileUpload(e);
  }, []);

  const handleRemoveUploadedFile = (filenameToRemove: string) => {
    setUploadedFiles(prev => prev.filter(file => file.filename !== filenameToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form with files:', uploadedFiles);
    
    try {
      const cleanedFormData = cleanFormData(formData);
      
      generateMutation.mutate({
        type: featureId as any,
        formData: cleanedFormData,
        uploadedFiles: uploadedFiles.map(f => ({
          originalName: f.originalname,
          type: f.mimetype,
          path: f.path
        }))
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "오류 발생",
        description: "문서 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div 
        className={`flex items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className={`w-8 h-8 mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-500'}`} />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">클릭하여 파일 업로드</span> 또는 드래그 앤 드롭
            </p>
            <p className="text-xs text-gray-500">PDF, PPTX, 이미지 파일</p>
          </div>
          <input
            id="file-upload"
            type="file"
            multiple
            className="hidden"
            onChange={handleOverallFileUpload}
            accept=".pdf,.pptx,.ppt,.jpg,.jpeg,.png"
          />
        </label>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-900 mb-2">업로드된 파일:</h4>
          <div className="space-y-2">
            {uploadedFiles.map((fileInfo, index) => (
              <div key={fileInfo.filename || index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm text-gray-700">{fileInfo.originalname}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveUploadedFile(fileInfo.filename)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 