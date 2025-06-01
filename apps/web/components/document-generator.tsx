import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { generateDocument, downloadDocument } from "@/lib/document-api";
import { X, FileText, Download, Check, Info, Upload, Mic, Languages, Sparkles, Brain, Zap } from "lucide-react";
import type { DocumentGenerationRequest } from "@shared/schema";
import jsPDF from 'jspdf';
import { handleFileUpload as uploadFileToServer } from '../../../frontend/src/utils/FileUploader';
import { DocumentForm, FileUploadBox, useDocumentForm, PreviewModal, featureTemplates } from './document-generator';

export interface DocumentGeneratorProps {
  featureId: string;
  companyInfo?: {
    name: string;
    businessNumber: string;
    address: string;
    businessType: string;
    representative: string;
  };
  onClose: () => void;
}

export interface FormField {
  label: string;
  type: 'text' | 'number' | 'date' | 'datetime-local' | 'textarea' | 'select' | 'checkbox' | 'file';
  placeholder?: string;
  options?: string[];
  required: boolean;
}

// NotoSansKR-Regular.ttf를 base64로 변환한 문자열을 아래에 임시로 추가 (실제 프로젝트에서는 별도 파일로 분리 권장)
const NotoSansKR = "(여기에 base64 문자열을 붙여넣으세요)";

export function handleWebPDFDownload() {
  const doc = new jsPDF();
  doc.addFileToVFS("NotoSansKR-Regular.ttf", NotoSansKR);
  doc.addFont("NotoSansKR-Regular.ttf", "NotoSansKR", "normal");
  doc.setFont("NotoSansKR");
  doc.setFontSize(18);
  doc.text("한글이 깨지지 않는 PDF 예시입니다!", 20, 30);
  doc.save("web_generated.pdf");
}

console.log('DEBUG: 8. document-generator.tsx started.');

export default function DocumentGenerator({ featureId, companyInfo, onClose }: DocumentGeneratorProps) {
  console.log('DEBUG: 9. DocumentGenerator component rendering.');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
  }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [generatedDocId, setGeneratedDocId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const template = featureTemplates[featureId];
  if (!template) return null;

  const generateMutation = useMutation({
    mutationFn: (data: any) => generateDocument({
      ...data,
    }),
    onSuccess: (result) => {
      setGeneratedDocId(result.documentId);
      queryClient.invalidateQueries({ queryKey: ['/api/documents/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/stats'] });
      toast({
        title: "문서 생성 완료!",
        description: `${template.title}이(가) 성공적으로 생성되었습니다.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "문서 생성 실패",
        description: error.message || "문서 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (documentId: string) => downloadDocument(documentId),
    onSuccess: () => {
      toast({
        title: "다운로드 시작됨",
        description: "문서 다운로드가 시작되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "다운로드 실패",
        description: error.message || "다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (fieldIndex: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      [`field_${fieldIndex}`]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('DEBUG: handleSubmit called with:', {
      type: featureId,
      formDataKeys: Object.keys(formData),
      uploadedFilesCount: uploadedFiles.length,
      uploadedFiles: uploadedFiles.map(f => ({ originalName: f.originalname, filename: f.filename }))
    });
    generateMutation.mutate({
      type: featureId,
      formData,
      uploadedFiles: uploadedFiles,
    });
  };

  const handlePPTDownload = async () => {
    if (generatedDocId) {
      try {
        await downloadDocument(generatedDocId, 'pptx');
        toast({
          title: "PPT 다운로드 완료!",
          description: "PowerPoint 문서가 성공적으로 다운로드되었습니다.",
        });
      } catch (error) {
        console.error('PPT Download failed:', error);
        toast({
          title: "PPT 다운로드 실패",
          description: "PowerPoint 다운로드 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    }
  };

  const handlePDFDownload = async () => {
    if (generatedDocId) {
      try {
        await downloadDocument(generatedDocId, 'pdf');
        toast({
          title: "PDF 다운로드 완료!",
          description: "PDF 문서가 성공적으로 다운로드되었습니다.",
        });
      } catch (error) {
        console.error('PDF Download failed:', error);
        toast({
          title: "PDF 다운로드 실패",
          description: "PDF 다운로드 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    }
  };

  // 파일 업로드 핸들러 예시
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent, fieldIndex: number) => {
    console.log('DEBUG: 10. handleFileChange triggered!');
    let files: FileList | null = null;
    if ('dataTransfer' in event) {
      files = event.dataTransfer.files;
    } else if ('target' in event && event.target instanceof HTMLInputElement) {
      files = event.target.files;
    }
    if (!files || files.length === 0) {
      console.log('DEBUG: No files selected or dropped.');
      return;
    }
    const file = files[0];
    console.log('DEBUG: 11. Attempting to call uploadFileToServer.');
    try {
      const serverFileResponse = await uploadFileToServer(file);
      console.log('DEBUG: Server response for file upload:', serverFileResponse);
      setUploadedFiles(prev => {
        const newFiles = [...prev, serverFileResponse.file];
        console.log('DEBUG: updated uploadedFiles state:', newFiles);
        return newFiles;
      });
      handleInputChange(fieldIndex, file);
      toast({
        title: "파일 업로드 완료",
        description: `${file.name} 파일이 성공적으로 업로드되었습니다.`,
      });
    } catch (error) {
      console.error('DEBUG: Error during file upload process:', error);
      toast({
        title: "파일 업로드 실패",
        description: `파일 업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  if (generatedDocId) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">문서 생성 완료!</CardTitle>
            <p className="text-gray-600">{template.title}이(가) 성공적으로 생성되었습니다.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handlePPTDownload}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3"
                disabled={downloadMutation.isPending}
              >
                {downloadMutation.isPending ? "다운로드 중..." : "📊 PPT 다운로드"}
              </Button>

              <Button 
                onClick={handlePDFDownload}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-3"
                disabled={downloadMutation.isPending}
              >
                {downloadMutation.isPending ? "다운로드 중..." : "📄 PDF 다운로드"}
              </Button>
            </div>

            <Button 
              variant="outline" 
              onClick={() => setGeneratedDocId(null)}
              className="w-full"
            >
              새 문서 생성
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full max-h-[95vh] overflow-hidden bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-sm flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">{template.title}</CardTitle>
                <p className="text-blue-100 text-sm">{template.aiDescription}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 overflow-y-auto max-h-[calc(95vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* AI Processing Info */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">AI 자동화 처리 과정</h3>
                  <p className="text-sm text-gray-600">GPT-4o 엔진이 다음 단계로 문서를 생성합니다</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Zap className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-700">데이터 분석 및 검증</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Brain className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-700">AI 문서 구조화</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <FileText className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700">전문 양식으로 생성</span>
                </div>
              </div>
            </div>

            {/* Company Information Display */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3 text-emerald-700 mb-3">
                <Info className="w-5 h-5" />
                <span className="font-bold">회사 정보 자동 연동</span>
              </div>
              <p className="text-sm text-emerald-600 mb-4">사업자등록증 정보가 모든 문서에 자동으로 적용됩니다</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white/60 rounded-xl p-3">
                  <span className="font-medium text-gray-700">회사명: </span>
                  <span className="text-gray-900 font-medium">{companyInfo?.name || "주식회사 해피솔라"}</span>
                </div>
                <div className="bg-white/60 rounded-xl p-3">
                  <span className="font-medium text-gray-700">사업자등록번호: </span>
                  <span className="text-gray-900 font-medium">{companyInfo?.businessNumber || "578-87-02666"}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Form Fields */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>문서 생성 정보 입력</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {template.fields.map((field, index) => {
                  const fieldKey = `field_${index}`;

                  if (field.type === 'file') {
                    const isAudioFile = featureId === 'minutes' && field.label.includes('음성');
                    return (
                      <div key={index} className="md:col-span-2">
                        <Label className="text-sm font-bold text-gray-700 mb-3 block flex items-center space-x-2">
                          <Upload className="w-4 h-4 text-indigo-500" />
                          <span>{field.label}{field.required && ' *'}</span>
                        </Label>
                        <div 
                          className="border-2 border-dashed rounded-2xl p-6 transition-all duration-200 cursor-pointer"
                          onClick={(e) => { e.preventDefault(); }}
                          onDragOver={(e) => { e.preventDefault(); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleFileChange(e, index);
                          }}
                        >
                          <div className="text-center">
                            {isAudioFile ? (
                              <Mic className="w-12 h-12 mx-auto mb-3 text-indigo-400" />
                            ) : (
                              <Upload className="w-12 h-12 mx-auto mb-3 text-indigo-400" />
                            )}
                            <p className="text-sm font-medium mb-2 text-gray-700">파일을 드래그하거나 클릭해서 업로드</p>
                            <p className="text-xs text-gray-500">{field.placeholder}</p>
                            {formData[fieldKey] && (
                              <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-xs text-green-600 font-medium flex items-center">
                                  <Check className="w-3 h-3 mr-1" />
                                  {formData[fieldKey].name}
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleInputChange(index, null);
                                    }}
                                    className="text-xs h-6 px-2"
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    제거
                                  </Button>
                                </div>
                              </div>
                            )}
                            <input
                              id={`file-input-${index}`}
                              type="file"
                              accept={isAudioFile ? "audio/*" : "*"}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileChange(e, index);
                                }
                              }}
                              style={{ display: 'none' }}
                            />
                            <Button
                              type="button"variant="outline"
                              className="mt-3 w-full bg-white/80 hover:bg-white border-indigo-200 hover:border-indigo-300"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const fileInput = document.getElementById(`file-input-${index}`) as HTMLInputElement;
                                if (fileInput) {
                                  fileInput.click();
                                }
                              }}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              파일 선택
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (field.type === 'select') {
                    return (
                      <div key={index} className={field.label.includes('번역') || field.label.includes('유형') ? 'md:col-span-2' : ''}>
                        <Label className="text-sm font-bold text-gray-700 mb-2 block">
                          {field.label}{field.required && ' *'}
                          {field.label.includes('번역') && <Languages className="w-4 h-4 inline ml-1 text-blue-500" />}
                        </Label>
                        <Select 
                          value={formData[fieldKey] || ''} 
                          onValueChange={(value) => handleInputChange(index, value)}
                          required={field.required}
                        >
                          <SelectTrigger className="w-full border-gray-200 rounded-xl bg-white/80 hover:border-indigo-300 transition-colors">
                            <SelectValue placeholder="선택해주세요" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {field.options?.map((option) => (
                              <SelectItem key={option} value={option} className="rounded-lg">{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  } else if (field.type === 'textarea') {
                    return (
                      <div key={index} className="md:col-span-2">
                        <Label className="text-sm font-bold text-gray-700 mb-2 block">
                          {field.label}{field.required && ' *'}
                        </Label>
                        <Textarea
                          value={formData[fieldKey] || ''}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          placeholder={field.placeholder}
                          rows={4}
                          required={field.required}
                          className="resize-none border-gray-200 rounded-xl bg-white/80 hover:border-indigo-300 transition-colors"
                        />
                      </div>
                    );
                  } else if (field.type === 'checkbox') {
                    return (
                      <div key={index} className="md:col-span-2">
                        <div className="flex items-center space-x-3 bg-gray-50 rounded-xl p-4">
                          <input
                            type="checkbox"
                            id={fieldKey}
                            checked={formData[fieldKey] || false}
                            onChange={(e) => handleInputChange(index, e.target.checked)}
                            className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <Label htmlFor={fieldKey} className="text-sm font-medium text-gray-700">
                            {field.label}
                          </Label>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={index}>
                        <Label className="text-sm font-bold text-gray-700 mb-2 block">
                          {field.label}{field.required && ' *'}
                        </Label>
                        <Input
                          type={field.type}
                          value={formData[fieldKey] || ''}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          placeholder={field.placeholder}
                          required={field.required}
                          className="border-gray-200 rounded-xl bg-white/80 hover:border-indigo-300 transition-colors"
                        />
                      </div>
                    );
                  }
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500 flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>모든 데이터는 안전하게 처리됩니다</span>
              </div>
              <div className="flex items-center space-x-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  취소
                </Button>
                <Button 
                  type="submit" 
                  disabled={generateMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  {generateMutation.isPending ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      AI가 문서를 생성하고 있습니다...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      AI로 생성하기
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Button onClick={handleWebPDFDownload} className="ml-2" variant="outline">웹에서 PDF로 저장</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}