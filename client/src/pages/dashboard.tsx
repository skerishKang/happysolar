import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DocumentGenerator from "@/components/document-generator";
import { 
  File, 
  Receipt, 
  Handshake, 
  Presentation, 
  FileText, 
  Users, 
  Mail,
  Clock,
  TrendingUp,
  UserCheck,
  Download,
  Share,
  Building,
  IdCard,
  MapPin,
  Factory
} from "lucide-react";

interface DocumentStats {
  monthlyDocuments: number;
  timeSaved: string;
  efficiency: string;
  activeUsers: number;
}

interface RecentDocument {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  status: string;
}

interface CompanyInfo {
  name: string;
  businessNumber: string;
  address: string;
  businessType: string;
  representative: string;
}

export default function Dashboard() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch company information
  const { data: companyInfo } = useQuery<CompanyInfo>({
    queryKey: ['/api/company'],
  });

  // Fetch document statistics
  const { data: stats } = useQuery<DocumentStats>({
    queryKey: ['/api/documents/stats'],
  });

  // Fetch recent documents
  const { data: recentDocs } = useQuery<RecentDocument[]>({
    queryKey: ['/api/documents/recent'],
  });

  const handleDownload = async (docId: string, format: 'pdf' | 'pptx') => {
    try {
      await downloadDocument(docId, format);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const features = [
    {
      id: 'quotation',
      title: '자동 견적서 작성',
      description: '고객정보 입력 → AI 자동분석 → 전문 견적서 생성 → 즉시 PDF 발급. 태양광 전문 견적과 투자 회수 분석 포함.',
      icon: Receipt,
      color: 'from-indigo-500 via-purple-500 to-blue-500',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-purple-50',
      textColor: 'text-indigo-600',
      buttonColor: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700',
      estimatedTime: '30초 자동생성',
      badge: 'AI 핵심',
      aiFeatures: ['태양광 전문 견적', '투자회수 분석', '정부지원금 반영']
    },
    {
      id: 'transaction-statement',
      title: '자동 거래명세서 작성',
      description: '품목정보 → 스마트 분석 → 전문양식 완성. 수량×단가 자동계산, 할인율 적용, 사업자정보 자동매핑.',
      icon: File,
      color: 'from-emerald-500 via-teal-500 to-cyan-500',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-50',
      textColor: 'text-emerald-600',
      buttonColor: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700',
      estimatedTime: '20초 자동생성',
      badge: 'AI 핵심',
      aiFeatures: ['스마트 계산', '품목 자동분류', '회사정보 연동']
    },
    {
      id: 'contract',
      title: '자동 계약서 작성',
      description: '계약조건 입력 → 법무검토 AI AI → 리스크분석 → 표준계약서 생성. 태양광업계 특화 약관과 하자보증 조항 포함.',
      icon: Handshake,
      color: 'from-violet-500 via-purple-500 to-fuchsia-500',
      bgColor: 'bg-gradient-to-br from-violet-50 to-purple-50',
      textColor: 'text-violet-600',
      buttonColor: 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700',
      estimatedTime: '2분 자동생성',
      badge: 'AI 고급',
      aiFeatures: ['법무AI 검토', '리스크 분석', '업계 특화']
    },
    {
      id: 'presentation',
      title: '자동 PPT 작성',
      description: '주제 입력 → 구조화 분석 → 시각자료 생성 → 완성된 프레젠테이션. 차트, 그래프, 이미지 자동삽입.',
      icon: Presentation,
      color: 'from-orange-500 via-amber-500 to-yellow-500',
      bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50',
      textColor: 'text-orange-600',
      buttonColor: 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700',
      estimatedTime: '90초 자동생성',
      badge: 'AI 인기',
      aiFeatures: ['구조화 분석', '시각자료 생성', '디자인 최적화']
    },
    {
      id: 'proposal',
      title: '자동 기획서 작성',
      description: '프로젝트 개요 → 시장분석 AI → 경쟁사 리서치 → 수익성 모델링 → 완전한 사업기획서 생성.',
      icon: FileText,
      color: 'from-blue-500 via-indigo-500 to-purple-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      textColor: 'text-blue-600',
      buttonColor: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
      estimatedTime: '3분 자동생성',
      badge: 'AI 전문',
      aiFeatures: ['시장분석 AI', '경쟁사 리서치', '수익성 모델링']
    },
    {
      id: 'minutes',
      title: '자동 회의록 작성',
      description: '음성파일 업로드 → 음성인식 AI → 화자분리 → 내용요약 → 액션아이템 추출. 클로바급 정확도 지원.',
      icon: Users,
      color: 'from-teal-500 via-cyan-500 to-blue-500',
      bgColor: 'bg-gradient-to-br from-teal-50 to-cyan-50',
      textColor: 'text-teal-600',
      buttonColor: 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700',
      estimatedTime: '음성길이의 1/10',
      badge: 'AI 혁신',
      aiFeatures: ['음성인식 AI', '화자분리', '스마트 요약']
    },
    {
      id: 'email',
      title: '자동 이메일 작성',
      description: '목적 입력 → 톤앤매너 분석 → 다국어 번역 → 완성된 이메일. 한/영/일/중 4개국어 번역 지원.',
      icon: Mail,
      color: 'from-rose-500 via-pink-500 to-red-500',
      bgColor: 'bg-gradient-to-br from-rose-50 to-pink-50',
      textColor: 'text-rose-600',
      buttonColor: 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700',
      estimatedTime: '15초 자동생성',
      badge: 'AI 다국어',
      aiFeatures: ['톤앤매너 AI', '4개국어 번역', '비즈니스 최적화']
    }
  ];

  const openModal = (featureId: string) => {
    setSelectedFeature(featureId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFeature(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation Header */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Company Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">H</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">HappySolar AI</h1>
                  <p className="text-xs text-gray-600">스마트 자동화 시스템</p>
                </div>
              </div>
              <div className="hidden lg:block h-8 w-px bg-gray-300"></div>
              <div className="hidden lg:block text-sm text-gray-600">
                <span className="font-medium">{companyInfo?.name || "주식회사 해피솔라"}</span> | 
                <span className="text-xs ml-1">사업자등록번호: {companyInfo?.businessNumber || "578-87-02666"}</span>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">AI 시스템 활성</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{companyInfo?.representative || "김미희"} 대표</span>
                </div>
              </div>
              <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                <UserCheck className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-12 animate-fade-in">
          <div className="neural-gradient rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-sm flex items-center justify-center">
                  <Building className="w-6 h-6" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                  HappySolar AI 자동화 시스템
                </h2>
              </div>
              <p className="text-lg md:text-xl opacity-90 mb-6 max-w-3xl leading-relaxed">
                <span className="font-semibold text-blue-100">GPT-4o 최신 AI 엔진</span>으로 
                세금계산서부터 계약서까지 <span className="font-semibold">1분 이내 자동 생성</span>. 
                대기업 수준의 문서품질과 법무검토를 동시에 제공합니다.
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <TrendingUp className="w-4 h-4 text-blue-200" />
                  <span>95% 시간단축</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <FileText className="w-4 h-4 text-purple-200" />
                  <span>AI 법무검토</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <Clock className="w-4 h-4 text-cyan-200" />
                  <span>실시간 생성</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <UserCheck className="w-4 h-4 text-green-200" />
                  <span>대기업 품질</span>
                </div>
              </div>
            </div>
            <div className="absolute right-0 top-0 w-96 h-96 opacity-20">
              <div className="w-full h-full bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl"></div>
            </div>
            <div className="absolute -bottom-32 -left-32 w-96 h-96 opacity-10">
              <div className="w-full h-full bg-gradient-to-tr from-blue-300/30 to-transparent rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 animate-slide-up">
          <Card className="p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <File className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">이번 달 생성</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.monthlyDocuments || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">절약 시간</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.timeSaved || "0시간"}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">효율성 증가</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.efficiency || "0%"}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">활성 사용자</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeUsers || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={feature.id}
                className="p-0 shadow-lg border-0 card-hover cursor-pointer group overflow-hidden bg-white/80 backdrop-blur-sm"
                onClick={() => openModal(feature.id)}
              >
                <CardContent className="p-0">
                  <div className={`h-2 bg-gradient-to-r ${feature.color}`}></div>
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <Badge className={`${feature.bgColor} ${feature.textColor} text-xs font-bold px-3 py-1 rounded-full border-2 border-current`}>
                        {feature.badge}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                      {feature.description}
                    </p>

                    {/* AI Features Pills */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {feature.aiFeatures?.map((aiFeature, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border"
                        >
                          {aiFeature}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{feature.estimatedTime}</span>
                      </div>
                      <Button className={`${feature.buttonColor} text-white transition-all duration-300 shadow-lg hover:shadow-xl`}>
                        <span className="font-medium">AI 생성 시작</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Documents Section */}
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

        {/* Company Information Panel */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">회사 정보 자동 연동</h3>
              <p className="text-slate-300 mb-6 leading-relaxed">
                모든 문서에 회사 정보가 자동으로 입력됩니다. 
                사업자등록증 정보를 기반으로 정확한 문서를 생성합니다.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-blue-400" />
                  <span>{companyInfo?.name || "주식회사 해피솔라"}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <IdCard className="w-5 h-5 text-green-400" />
                  <span>사업자등록번호: {companyInfo?.businessNumber || "578-87-02666"}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-red-400" />
                  <span>{companyInfo?.address || "전라남도 장흥군 장흥읍 장흥로 30, 2층"}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Factory className="w-5 h-5 text-yellow-400" />
                  <span>{companyInfo?.businessType || "건설업, 전기공사업, 태양광발전소 부대장비"}</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <div className="w-24 h-24 mx-auto mb-4 gradient-bg rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-12 h-12 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-2">스마트 자동화</h4>
                <p className="text-slate-300 text-sm">AI 기술로 업무 효율성을 극대화하세요</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Document Generation Modal */}
      {isModalOpen && selectedFeature && (
        <DocumentGenerator 
          featureId={selectedFeature}
          companyInfo={companyInfo}
          onClose={closeModal}
        />
      )}
    </div>
  );
}