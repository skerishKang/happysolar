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

interface DocumentGeneratorProps {
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

interface FormField {
  label: string;
  type: 'text' | 'number' | 'date' | 'datetime-local' | 'textarea' | 'select' | 'checkbox' | 'file';
  placeholder?: string;
  options?: string[];
  required: boolean;
}

const featureTemplates: Record<string, { title: string; icon: string; fields: FormField[]; aiDescription: string }> = {
  'quotation': {
    title: '자동 견적서 작성',
    icon: 'fas fa-file-invoice',
    aiDescription: 'AI가 업로드한 템플릿을 참고하여 전문적인 견적서를 자동 생성합니다.',
    fields: [
      { label: '참고 견적서 템플릿', type: 'file', placeholder: '기존 견적서 파일 업로드 (PDF, Excel, 이미지) - 양식을 참고하여 생성합니다', required: false },
      { label: '고객 회사명', type: 'text', placeholder: '(주)ABC건설', required: true },
      { label: '고객 담당자명', type: 'text', placeholder: '홍길동 부장', required: true },
      { label: '고객 연락처', type: 'text', placeholder: '02-1234-5678', required: true },
      { label: '고객 이메일', type: 'text', placeholder: 'customer@abc.com', required: false },
      { label: '견적 요청 내용', type: 'textarea', placeholder: '아파트 옥상 태양광 발전소 설치 (100kW급)', required: true },
      { label: '설치 장소', type: 'text', placeholder: '서울시 강남구 테헤란로 123번지', required: true },
      { label: '예상 용량 (kW)', type: 'number', placeholder: '100', required: true },
      { label: '견적 유효기간', type: 'select', options: ['30일', '60일', '90일'], required: true },
      { label: '공사 예정일', type: 'date', placeholder: '', required: false },
      { label: '특별 요구사항', type: 'textarea', placeholder: '모니터링 시스템 포함, 20년 A/S 보증 등', required: false }
    ]
  },
  'transaction-statement': {
    title: '자동 거래명세서 작성',
    icon: 'fas fa-file-invoice-dollar',
    aiDescription: 'AI가 업로드한 거래명세서 샘플을 참고하여 자동 계산 및 생성합니다.',
    fields: [
      { label: '참고 거래명세서 샘플', type: 'file', placeholder: '기존 거래명세서 파일 업로드 (PDF, Excel, 이미지) - 양식과 항목을 참고합니다', required: false },
      { label: '거래처 회사명', type: 'text', placeholder: '(주)대한건설', required: true },
      { label: '담당자명', type: 'text', placeholder: '김담당 부장', required: true },
      { label: '거래일자', type: 'date', placeholder: '', required: true },
      { label: '납기일자', type: 'date', placeholder: '', required: true },
      { label: '상품/서비스명', type: 'text', placeholder: '태양광 패널 설치 공사, 유지보수 서비스', required: true },
      { label: '규격/사양', type: 'text', placeholder: '300W 모노크리스탈, 5kW 인버터', required: true },
      { label: '공급수량', type: 'number', placeholder: '20', required: true },
      { label: '공급단가 (원)', type: 'number', placeholder: '150000', required: true },
      { label: '할인율 (%)', type: 'number', placeholder: '5', required: false },
      { label: '결제조건', type: 'select', options: ['현금', '계좌이체', '어음', '외상'], required: true },
      { label: '배송/설치 주소', type: 'text', placeholder: '실제 설치될 현장 주소', required: true }
    ]
  },
  'contract': {
    title: '자동 계약서 작성',
    icon: 'fas fa-handshake',
    aiDescription: 'AI가 업로드한 계약서 템플릿을 참고하여 법무검토 및 리스크 분석 완료',
    fields: [
      { label: '참고 계약서 템플릿', type: 'file', placeholder: '기존 계약서 파일 업로드 (PDF, Word) - 약관과 조항을 참고하여 생성합니다', required: false },
      { label: '계약 유형', type: 'select', options: ['태양광 설치 공사계약', '유지보수 서비스계약', '컨설팅 용역계약', '장비 공급계약'], required: true },
      { label: '계약상대방 법인명', type: 'text', placeholder: '(주)태양에너지', required: true },
      { label: '계약상대방 대표자', type: 'text', placeholder: '박대표', required: true },
      { label: '계약상대방 연락처', type: 'text', placeholder: '02-1234-5678', required: true },
      { label: '계약상대방 주소', type: 'text', placeholder: '서울시 중구 명동길 123', required: true },
      { label: '계약 금액 (원)', type: 'number', placeholder: '50000000', required: true },
      { label: '계약 시작일', type: 'date', placeholder: '', required: true },
      { label: '계약 종료일', type: 'date', placeholder: '', required: true },
      { label: '공사/서비스 장소', type: 'text', placeholder: '실제 시공 또는 서비스 제공 장소', required: true },
      { label: '하자보증기간', type: 'select', options: ['1년', '2년', '5년', '10년'], required: true },
      { label: '결제 조건', type: 'select', options: ['계약금 30% + 중도금 40% + 잔금 30%', '착수금 50% + 완료 후 50%', '월별 분할납부'], required: true },
      { label: '특별 약정사항', type: 'textarea', placeholder: '보증조건, 위약금, 면책사항 등 추가 조건', required: false }
    ]
  },
  'presentation': {
    title: '자동 PPT 작성',
    icon: 'fas fa-presentation',
    aiDescription: 'AI가 업로드한 자료들을 분석하여 논리적 슬라이드를 구성하고 차트를 자동 생성합니다.',
    fields: [
      { label: '회사소개서 파일', type: 'file', placeholder: '회사소개서 업로드 (PDF, PPT) - 회사 정보와 연혁을 자동 반영합니다', required: false },
      { label: '참고 PPT 템플릿', type: 'file', placeholder: '기존 PPT 파일 업로드 (PPT, PDF) - 디자인과 구성을 참고합니다', required: false },
      { label: '포함할 데이터 자료', type: 'file', placeholder: '매출현황, 실적자료 등 Excel/PDF 업로드 - 차트로 자동 변환합니다', required: false },
      { label: '프레젠테이션 제목', type: 'text', placeholder: '아파트 태양광 발전소 구축 제안서', required: true },
      { label: '발표 목적', type: 'select', options: ['신규 사업 제안', '제품/서비스 소개', '프로젝트 실적 보고', '투자 유치', '교육/세미나'], required: true },
      { label: '대상 청중', type: 'text', placeholder: '아파트 입주자대표회의, 건설사 임원진', required: true },
      { label: '발표 시간', type: 'select', options: ['10분 (간단 소개)', '20분 (표준 발표)', '30분 (상세 설명)', '60분 (워크샵형)'], required: true },
      { label: '슬라이드 수', type: 'number', placeholder: '15', required: true },
      { label: '핵심 메시지 (간단히)', type: 'text', placeholder: '태양광 에너지의 미래와 해피솔라 차별화', required: true },
      { label: '디자인 스타일', type: 'select', options: ['전문적/비즈니스', '모던/심플', '친근한/컬러풀'], required: false }
    ]
  },
  'proposal': {
    title: '자동 기획서 작성',
    icon: 'fas fa-file-alt',
    aiDescription: 'AI가 업로드한 자료를 분석하여 시장분석, 경쟁사 리서치, 수익성 모델링을 자동 수행합니다.',
    fields: [
      { label: '참고 기획서 템플릿', type: 'file', placeholder: '기존 기획서 파일 업로드 (PDF, Word) - 구성과 양식을 참고합니다', required: false },
      { label: '시장조사 자료', type: 'file', placeholder: '시장분석 보고서, 통계자료 등 업로드 (PDF, Excel) - 자동 분석됩니다', required: false },
      { label: '재무 데이터', type: 'file', placeholder: '매출현황, 손익계산서 등 업로드 (Excel, PDF) - 수익성 분석에 활용', required: false },
      { label: '프로젝트명', type: 'text', placeholder: '대형마트 옥상 태양광 발전소 구축 사업', required: true },
      { label: '사업 분야', type: 'select', options: ['태양광 발전소 구축', '에너지 컨설팅', 'ESG 솔루션', '신재생에너지 유지보수'], required: true },
      { label: '프로젝트 규모', type: 'text', placeholder: '500kW급, 총 1,000㎡ 부지', required: true },
      { label: '총 사업비 (원)', type: 'number', placeholder: '1000000000', required: true },
      { label: '사업 기간', type: 'text', placeholder: '기획 2개월 + 시공 6개월 + 운영 20년', required: true },
      { label: '타겟 고객', type: 'select', options: ['개인 주택 소유자', '소상공인', '중소기업', '대기업', '공공기관/지자체'], required: true },
      { label: '예상 투자회수기간', type: 'select', options: ['3년 이내', '5년 이내', '7년 이내', '10년 이내'], required: true }
    ]
  },
  'minutes': {
    title: '자동 회의록 작성',
    icon: 'fas fa-users',
    aiDescription: '음성파일을 업로드하면 AI가 음성인식→화자분리→내용요약→액션아이템 추출을 자동 수행합니다.',
    fields: [
      { label: '회의 음성파일', type: 'file', placeholder: 'MP3, WAV, M4A 파일 업로드', required: false },
      { label: '회의명', type: 'text', placeholder: '2025년 1분기 태양광 사업 확장 회의', required: true },
      { label: '회의 일시', type: 'datetime-local', placeholder: '', required: true },
      { label: '회의 장소', type: 'text', placeholder: '본사 2층 회의실 A', required: true },
      { label: '회의 주관자', type: 'text', placeholder: '김미희 대표', required: true },
      { label: '참석자 명단', type: 'text', placeholder: '김미희(대표), 박부장(영업), 이과장(기술), 최대리(재무)', required: true },
      { label: '회의 목적', type: 'text', placeholder: '2025년 사업계획 수립 및 예산 배정', required: true },
      { label: '주요 안건', type: 'textarea', placeholder: '음성파일이 없는 경우 수동으로 입력', required: false },
      { label: '결정 사항', type: 'textarea', placeholder: '음성파일이 없는 경우 수동으로 입력', required: false },
      { label: '액션 아이템', type: 'textarea', placeholder: '음성파일이 없는 경우 수동으로 입력', required: false },
      { label: '다음 회의 일정', type: 'text', placeholder: '차기 회의 예정일', required: false }
    ]
  },
  'email': {
    title: '자동 이메일 작성',
    icon: 'fas fa-envelope',
    aiDescription: 'AI가 업로드한 참고자료를 바탕으로 4개국어 번역까지 지원하는 전문 이메일을 작성합니다.',
    fields: [
      { label: '참고 이메일 템플릿', type: 'file', placeholder: '기존 이메일 파일 업로드 (TXT, PDF) - 형식과 문체를 참고합니다', required: false },
      { label: '첨부할 문서', type: 'file', placeholder: '이메일에 첨부할 파일 - 내용을 분석하여 이메일에 설명을 포함합니다', required: false },
      { label: '이메일 유형', type: 'select', options: ['견적서 발송', '제안서 발송', '계약서 발송', '사후관리/A/S', '신규 문의 답변', '미팅 요청'], required: true },
      { label: '수신자 성명', type: 'text', placeholder: '김고객', required: true },
      { label: '수신자 직책', type: 'text', placeholder: '부장, 대표이사 등', required: false },
      { label: '수신자 회사명', type: 'text', placeholder: '(주)태양에너지', required: false },
      { label: '이메일 제목', type: 'text', placeholder: '자동생성 또는 직접입력', required: false },
      { label: '핵심 전달내용 (간단히)', type: 'text', placeholder: '핵심 메시지를 한 줄로 요약', required: true },
      { label: '톤앤매너', type: 'select', options: ['정중하고 격식있게', '친근하고 편안하게', '간결하고 전문적으로'], required: true },
      { label: '번역 언어', type: 'select', options: ['한국어만', '한국어+영어', '한국어+일본어', '한국어+중국어', '4개국어 모두'], required: false }
    ]
  }
};

export default function DocumentGenerator({ featureId, companyInfo, onClose }: DocumentGeneratorProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [generatedDocId, setGeneratedDocId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const template = featureTemplates[featureId];
  if (!template) return null;

  const handleFileUpload = async (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setUploadedFiles(prev => [...prev, ...result.files]);
        toast({
          title: "파일 업로드 완료",
          description: `${files.length}개 파일이 업로드되었습니다.`,
        });
      }
    } catch (error) {
      toast({
        title: "파일 업로드 실패",
        description: "파일 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const generateMutation = useMutation({
    mutationFn: (data: any) => generateDocument({
      ...data,
      uploadedFiles
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

  const handleDragOver = (e: React.DragEvent, fieldIndex: number) => {
    e.preventDefault();
    setDragOver(fieldIndex);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, fieldIndex: number) => {
    e.preventDefault();
    setDragOver(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      handleInputChange(fieldIndex, file);
      toast({
        title: "파일 업로드 완료",
        description: `${file.name} 파일이 업로드되었습니다.`,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const requiredFields = template.fields.filter(field => field.required);
    const missingFields = requiredFields.filter((field, index) => 
      !formData[`field_${index}`] || formData[`field_${index}`] === ''
    );

    if (missingFields.length > 0) {
      toast({
        title: "필수 항목 누락",
        description: "모든 필수 항목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      type: featureId as any,
      formData
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
          <CardContent className="flex items-center justify-center space-x-4">
            <div className="flex space-x-3">
                <Button 
                  onClick={handlePPTDownload}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 px-6"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  프레젠테이션 다운로드
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="p-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
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

            {/* File Upload Section */}
            <div className="mb-6">
              <Label className="text-lg font-semibold text-gray-900 mb-3 block">
                📎 참고 자료 업로드
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt,.md,.jpg,.jpeg,.png,.gif"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-blue-600 hover:text-blue-500 font-medium"
                  >
                    클릭하여 파일 업로드 또는 드래그 앤 드롭
                  </label>
                  <p className="text-sm text-gray-500">
                    PDF, 텍스트, 이미지 파일 지원 (최대 10MB)
                  </p>
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">업로드된 파일:</h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-700">{file.originalName}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                          className={`border-2 border-dashed rounded-2xl p-6 transition-all duration-200 cursor-pointer ${
                            dragOver === index 
                              ? 'border-blue-400 bg-blue-50 scale-105' 
                              : 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 hover:border-indigo-300'
                          }`}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index)}
                          onClick={() => {
                            const fileInput = document.getElementById(`file-input-${index}`) as HTMLInputElement;
                            if (fileInput) {
                              fileInput.click();
                            }
                          }}
                        >
                          <div className="text-center">
                            {isAudioFile ? (
                              <Mic className={`w-12 h-12 mx-auto mb-3 transition-colors ${
                                dragOver === index ? 'text-blue-500' : 'text-indigo-400'
                              }`} />
                            ) : (
                              <Upload className={`w-12 h-12 mx-auto mb-3 transition-colors ${
                                dragOver === index ? 'text-blue-500' : 'text-indigo-400'
                              }`} />
                            )}
                            <p className={`text-sm font-medium mb-2 transition-colors ${
                              dragOver === index ? 'text-blue-700' : 'text-gray-700'
                            }`}>
                              {dragOver === index 
                                ? '여기에 파일을 놓으세요' 
                                : isAudioFile 
                                ? '음성 파일을 드래그하거나 클릭해서 업로드' 
                                : '파일을 드래그하거나 클릭해서 업로드'
                              }
                            </p>
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
                                    onClick={() => handleInputChange(index, null)}
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
                                  handleInputChange(index, file);
                                  toast({
                                    title: "파일 업로드 완료",
                                    description: `${file.name} 파일이 업로드되었습니다.`,
                                  });
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}