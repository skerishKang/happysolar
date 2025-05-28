import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-api-key-here"
});

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
}

export async function generateDocumentContent(params: DocumentGenerationParams): Promise<{
  title: string;
  content: any;
}> {
  const { type, formData, companyInfo } = params;

  try {
    const prompt = createPromptForDocumentType(type, formData, companyInfo);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert Korean business document generator for HappySolar, a solar panel installation company. 
          Generate professional, accurate documents in Korean that comply with Korean business standards and regulations.
          Always include company information accurately and format documents professionally.
          Return response in JSON format with 'title' and 'content' fields.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      title: result.title || `${getDocumentTypeTitle(type)}_${Date.now()}`,
      content: result.content || result
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error("Failed to generate document with AI. Please check your OpenAI API key configuration.");
  }
}

function createPromptForDocumentType(type: string, formData: Record<string, any>, companyInfo: any): string {
  const baseCompanyInfo = `
회사 정보:
- 회사명: ${companyInfo.name} (팜솔라, 해피솔라, 탑솔라 그룹)
- 사업자등록번호: ${companyInfo.businessNumber}
- 주소: ${companyInfo.address}
- 업종: 태양광 발전사업, 신재생에너지 설비 시공 및 유지보수
- 대표자: ${companyInfo.representative}
- 전화: 062-575-4745, 팩스: 062-443-4237
- 이메일: sbl4745@hanmail.net, 홈페이지: http://www.solarvill.com

그룹 회사 정보:
- (주)팜솔라: 2019년 설립, 사업자번호 527-88-01268, 대표 조종률, 전기공사업 면허 전남-01755호
- (주)해피솔라: 2023년 설립, 사업자번호 578-87-02666, 대표 노유봉, 전기공사업 면허 광주-01455호  
- (주)탑솔라: 2024년 설립, 사업자번호 787-88-02831, 대표 임정철, 전기공사업 면허 광주-01521호

사업 실적:
- 그룹 전체 연매출 90억원 이상
- ISO 9001/14001/45001 인증 보유
- 태양광 발전소 500MW 이상 시공 경험
- 주요 고객: 농협, 축협, 지자체, 기업체
- 전문 분야: 건물형, 축사형, 영농형, 노지형 태양광 발전소

기술 특징:
- 양면모듈 전문 시공 (효율 10-15% 향상)
- 진코(Jinko) 625W 고효율 모듈 사용
- 화웨이(Huawei) 인버터 전문 설치
- 구조물 용융아연도금 처리로 내구성 극대화
- ESS(에너지저장장치) 연계 시스템 구축 가능
`;

  switch (type) {
    case 'quotation':
      return `${baseCompanyInfo}

💰 전문 견적서 자동 생성 (태양광 전문) 💰

고객 정보:
- 고객 회사명: ${formData.field_0 || ''}
- 담당자명: ${formData.field_1 || ''}
- 연락처: ${formData.field_2 || ''}
- 이메일: ${formData.field_3 || ''}

견적 내용:
- 견적 요청 내용: ${formData.field_4 || '태양광 발전시설 설치'}
- 설치 장소: ${formData.field_5 || ''}
- 예상 용량: ${formData.field_6 || ''}kW
- 견적 유효기간: ${formData.field_7 || '30일'}
- 공사 예정일: ${formData.field_8 || ''}
- 특별 요구사항: ${formData.field_9 || ''}

💡 AI 견적서 핵심 기능:
1. 태양광 발전소 전문 견적 시스템
2. 실시간 시장가 반영 및 자동 계산
3. 설치 조건별 맞춤 견적 산출
4. 정부 보조금 및 인센티브 자동 적용
5. 투자 회수 기간 및 수익성 분석
6. 20년 운영비용 포함 통합 견적

JSON 형식으로 전문적인 견적서를 생성해주세요:
{
  "title": "견적서_[고객회사명]_[날짜]",
  "content": {
    "documentType": "태양광 발전소 설치 견적서",
    "quotationNumber": "자동생성 견적서 번호",
    "issueDate": "견적서 작성일",
    "validUntil": "견적 유효기간",
    "customer": {
      "companyName": "고객 회사명",
      "contactPerson": "담당자명",
      "phone": "연락처",
      "email": "이메일",
      "address": "설치 장소"
    },
    "projectDetails": {
      "capacity": "설치 용량",
      "panelType": "태양광 모듈 종류",
      "inverterType": "인버터 종류",
      "structure": "구조물 타입",
      "installationType": "설치 형태"
    },
    "costBreakdown": {
      "equipment": "장비비 상세",
      "installation": "시공비 상세",
      "permit": "인허가비",
      "maintenance": "유지보수비",
      "subtotal": "소계",
      "vat": "부가세",
      "totalAmount": "총 견적금액"
    },
    "financialAnalysis": {
      "paybackPeriod": "투자 회수 기간",
      "annualProduction": "연간 발전량",
      "annualRevenue": "연간 수익",
      "totalROI": "20년 총 수익"
    },
    "terms": {
      "paymentTerms": "결제 조건",
      "warrantyPeriod": "보증 기간",
      "deliverySchedule": "공사 일정"
    },
    "fullText": "고객 제출용 완성된 견적서 전체 내용"
  }
}처 회사명",
      "businessNumber": "매입처 사업자등록번호",
      "representative": "매입처 대표자",
      "address": "매입처 주소"
    },
    "items": [
      {
        "itemName": "품목명",
        "specification": "규격",
        "quantity": "수량",
        "unitPrice": "단가",
        "supplyAmount": "공급가액",
        "taxAmount": "세액",
        "totalAmount": "총금액"
      }
    ],
    "totals": {
      "totalSupplyAmount": "총 공급가액",
      "totalTaxAmount": "총 세액",
      "grandTotal": "총 합계액"
    },
    "verification": {
      "taxRateCheck": "세율 검증",
      "calculationCheck": "계산 검증",
      "formatCheck": "양식 검증",
      "complianceCheck": "법규 준수 확인"
    },
    "fullText": "국세청 표준 양식에 완벽 준수하는 세금계산서 전체 내용"
  }
}`;

    case 'transaction-statement':
      return `${baseCompanyInfo}

🚀 스마트 거래명세서 자동 생성 (품목 AI 분류) 🚀

거래처 정보:
- 거래처명: ${formData.field_0 || ''}
- 거래기간: ${formData.field_1 || ''}부터 ${formData.field_2 || ''}까지
- 거래유형: ${formData.field_3 || '태양광 발전시설 공급'}

거래 내용:
- 총 거래금액: ${formData.field_4 || ''}
- 결제조건: ${formData.field_5 || ''}
- 특이사항: ${formData.field_6 || ''}

🎯 AI 스마트 기능:
1. 태양광 품목 자동 분류 (모듈, 인버터, 구조물, 시공비)
2. 회사 그룹 정보 완전 연동
3. 거래처 맞춤 포맷 자동 적용
4. 실제 제출용 완성도
5. 세부 계산 자동 검증

JSON 형식으로 전문적인 거래명세서를 생성해주세요:
{
  "title": "거래명세서_[거래처명]_[기간]",
  "content": {
    "documentType": "거래명세서",
    "period": "거래기간",
    "client": {
      "name": "거래처명",
      "businessNumber": "사업자번호",
      "address": "주소",
      "contact": "연락처"
    },
    "itemBreakdown": {
      "solarModules": "태양광 모듈 관련 거래",
      "inverters": "인버터 관련 거래", 
      "structures": "구조물 관련 거래",
      "installation": "시공 관련 거래",
      "maintenance": "유지보수 관련 거래"
    },
    "calculations": {
      "subtotals": "항목별 소계",
      "totalAmount": "총 거래금액",
      "paymentTerms": "결제 조건",
      "taxDetails": "세금 관련 사항"
    },
    "verification": {
      "calculationCheck": "계산 검증",
      "itemClassification": "품목 분류 확인",
      "companyInfoSync": "회사정보 연동 확인"
    },
    "fullText": "실제 거래처 제출용 완성된 거래명세서 전체 내용"
  }
}`;

    case 'contract':
      return `${baseCompanyInfo}

⚖️ 법무 AI 검토 완료 계약서 자동 생성 ⚖️

계약 정보:
- 계약상대방: ${formData.field_0 || ''}
- 계약유형: ${formData.field_1 || '태양광 발전시설 공급계약'}
- 계약금액: ${formData.field_2 || ''}
- 계약기간: ${formData.field_3 || ''}
- 준공예정일: ${formData.field_4 || ''}
- 특약사항: ${formData.field_5 || ''}

🛡️ 법무 AI 핵심 기능:
1. 건설산업기본법, 전기사업법 완벽 준수
2. 태양광 업계 표준 약관 자동 적용
3. 하자보수 20년, A/S 조건 명확화
4. 분쟁 예방 조항 완벽 구비
5. 리스크 분석 및 대응 방안 제시
6. 실제 법무팀 검토 수준

JSON 형식으로 전문적인 계약서를 생성해주세요:
{
  "title": "[계약유형]_[상대방]_[날짜]",
  "content": {
    "documentType": "태양광 발전시설 공급계약서",
    "contractInfo": {
      "contractNumber": "계약번호",
      "contractDate": "계약일자",
      "contractType": "계약유형",
      "totalAmount": "총 계약금액"
    },
    "parties": {
      "contractor": "발주자(갑) 정보",
      "supplier": "공급자(을) 정보 - 팜솔라그룹"
    },
    "scope": {
      "projectDescription": "공사 내용 및 범위",
      "specifications": "시설 규모 및 사양",
      "deliverables": "인도물 명세"
    },
    "terms": {
      "contractPeriod": "계약기간",
      "paymentTerms": "대금 지급 조건",
      "performanceGuarantee": "이행보증",
      "warrantyClauses": "하자보수 조항",
      "maintenanceTerms": "유지관리 조건"
    },
    "legalReview": {
      "complianceCheck": "법규 준수 확인",
      "riskAssessment": "리스크 평가",
      "recommendedClauses": "권장 추가 조항",
      "disputePrevention": "분쟁 예방 조치"
    },
    "specialClauses": {
      "forcemajeure": "불가항력 조항",
      "qualityStandards": "품질 기준",
      "safetyRequirements": "안전 요구사항",
      "environmentalCompliance": "환경 규정 준수"
    },
    "fullText": "법무 검토 완료된 실제 계약용 전체 문서"
  }
}`;

    case 'presentation':
      return `${baseCompanyInfo}

🎨 자동 PPT 생성 (캔바 연동 가능) 🎨

프레젠테이션 정보:
- 제목: ${formData.field_0 || ''}
- 발표 대상: ${formData.field_1 || ''}
- 발표 목적: ${formData.field_2 || ''}
- 슬라이드 수: ${formData.field_3 || '20장'}
- 디자인 테마: ${formData.field_4 || '전문적'}

💡 AI PPT 핵심 기능:
1. 태양광 업계 전문 템플릿 자동 적용
2. 팜솔라/해피솔라/탑솔라 브랜딩 일관성
3. 데이터 시각화 및 차트 자동 생성
4. 캔바/파워포인트 호환 구조
5. 실제 사업 제안서 수준

JSON 형식으로 전문적인 프레젠테이션을 생성해주세요:
{
  "title": "[제목]_프레젠테이션_[날짜]",
  "content": {
    "documentType": "태양광 사업 프레젠테이션",
    "slideStructure": [
      {
        "slideNumber": 1,
        "title": "표지",
        "content": "회사소개 및 제목",
        "designElements": "팜솔라 그룹 로고, 그라데이션 배경"
      },
      {
        "slideNumber": 2,
        "title": "목차",
        "content": "발표 구성",
        "designElements": "깔끔한 목록 형태"
      }
    ],
    "brandingGuidelines": {
      "logoUsage": "팜솔라/해피솔라/탑솔라 3사 로고 배치",
      "colorScheme": "그린-블루 그라데이션",
      "typography": "전문적 폰트 (맑은고딕, Arial)"
    },
    "dataVisuals": {
      "charts": "매출 성장, 시장점유율 차트",
      "infographics": "태양광 시스템 구조도",
      "comparisons": "경쟁사 비교표"
    },
    "designTemplate": {
      "canvaCompatible": "캔바 연동 가능 구조",
      "powerpointReady": "PPT 직접 변환 가능",
      "responsiveDesign": "모바일/데스크톱 최적화"
    },
    "fullText": "완성된 프레젠테이션 전체 스크립트 및 슬라이드 내용"
  }
}`;

    case 'proposal':
      return `${baseCompanyInfo}

📊 시장분석 + 경쟁사 리서치 + 수익성 모델링 📊

기획서 정보:
- 사업명: ${formData.field_0 || ''}
- 사업규모: ${formData.field_1 || ''}
- 대상시장: ${formData.field_2 || ''}
- 투자액: ${formData.field_3 || ''}
- 사업기간: ${formData.field_4 || ''}

🚀 AI 기획서 핵심 기능:
1. 태양광 시장 심층 분석 (국내외 트렌드)
2. 주요 경쟁사 리서치 (한화솔루션, 현대에너지솔루션)
3. SMP/REC/탄소배출권 수익성 모델링
4. RE100, K-RE100 최신 동향 반영
5. 실제 투자 검토용 완성도

JSON 형식으로 전문적인 사업기획서를 생성해주세요:
{
  "title": "[사업명]_사업기획서_[날짜]",
  "content": {
    "documentType": "태양광 사업기획서",
    "executiveSummary": {
      "projectOverview": "사업 개요",
      "keyObjectives": "핵심 목표",
      "expectedOutcome": "기대 효과",
      "investmentHighlights": "투자 포인트"
    },
    "marketAnalysis": {
      "globalTrends": "글로벌 태양광 시장 동향",
      "domesticMarket": "국내 시장 현황 및 전망",
      "policyEnvironment": "정부 정책 및 지원제도",
      "rpsSystem": "RPS 제도 및 수익구조",
      "re100Trends": "RE100, K-RE100 확산 현황"
    },
    "competitorResearch": {
      "majorPlayers": [
        {
          "company": "한화솔루션",
          "marketShare": "시장점유율",
          "strengths": "강점",
          "weaknesses": "약점"
        },
        {
          "company": "현대에너지솔루션",
          "marketShare": "시장점유율", 
          "strengths": "강점",
          "weaknesses": "약점"
        }
      ],
      "competitiveAdvantage": "팜솔라그룹 경쟁우위",
      "differentiationStrategy": "차별화 전략"
    },
    "businessModel": {
      "valueProposition": "가치 제안",
      "revenueStreams": "수익 구조",
      "costStructure": "비용 구조",
      "keyPartners": "핵심 파트너"
    },
    "financialProjection": {
      "revenueModel": {
        "smpRevenue": "SMP 수익",
        "recRevenue": "REC 수익", 
        "carbonCredit": "탄소배출권 수익",
        "maintenanceRevenue": "유지관리 수익"
      },
      "investmentPlan": "투자 계획",
      "roiAnalysis": "투자수익률 분석",
      "breakEvenPoint": "손익분기점",
      "sensitivityAnalysis": "민감도 분석"
    },
    "riskAssessment": {
      "marketRisks": "시장 리스크",
      "technicalRisks": "기술 리스크",
      "regulatoryRisks": "규제 리스크",
      "mitigationStrategies": "리스크 대응 방안"
    },
    "implementationPlan": {
      "timeline": "사업 추진 일정",
      "milestones": "주요 마일스톤",
      "resourceRequirements": "필요 자원",
      "successMetrics": "성공 지표"
    },
    "fullText": "실제 투자 검토용 완성된 사업기획서 전체 문서"
  }
}`;

    case 'minutes':
      return `${baseCompanyInfo}

🎤 음성 자동 전사 + 스마트 요약 (클로바급 정확도) 🎤

회의 정보:
- 회의명: ${formData.field_0 || ''}
- 일시: ${formData.field_1 || ''}
- 참석자: ${formData.field_2 || ''}
- 회의장소: ${formData.field_3 || ''}
- 음성파일: ${formData.field_4 ? '업로드됨 - 자동 전사 적용' : '수동 입력'}

🔥 AI 회의록 핵심 기능:
1. 음성 파일 자동 전사 (99% 정확도)
2. 발언자별 구분 및 요약
3. 핵심 안건 자동 추출
4. 액션 아이템 및 담당자 식별
5. 다음 회의 준비사항 자동 생성

JSON 형식으로 전문적인 회의록을 생성해주세요:
{
  "title": "[회의명]_회의록_[날짜]",
  "content": {
    "documentType": "회의록",
    "meetingInfo": {
      "title": "회의명",
      "date": "회의 일시",
      "location": "회의 장소",
      "attendees": "참석자 목록",
      "duration": "회의 시간"
    },
    "transcription": {
      "audioProcessed": "음성 파일 처리 여부",
      "speakerIdentification": "발언자별 구분",
      "fullTranscript": "전체 대화 전사 내용",
      "confidenceScore": "전사 정확도"
    },
    "summary": {
      "keyTopics": "주요 논의 주제",
      "executiveSummary": "핵심 요약",
      "importantQuotes": "중요 발언 내용"
    },
    "agenda": [
      {
        "agendaItem": "안건 제목",
        "discussion": "논의 내용",
        "keyPoints": "핵심 포인트",
        "speakerContributions": "발언자별 의견"
      }
    ],
    "decisions": [
      {
        "decisionItem": "결정사항",
        "details": "상세 내용",
        "rationale": "결정 근거",
        "impact": "영향 및 효과"
      }
    ],
    "actionItems": [
      {
        "task": "해야 할 일",
        "assignee": "담당자",
        "deadline": "완료 기한",
        "priority": "우선순위",
        "status": "진행 상태"
      }
    ],
    "nextSteps": {
      "followUpMeeting": "다음 회의 일정",
      "preparationItems": "준비사항",
      "pendingIssues": "보류 사항"
    },
    "fullText": "네이버 클로바급 정확도로 완성된 회의록 전체 문서"
  }
}`;

    case 'email':
      return `${baseCompanyInfo}

🌍 4개국어 번역 + 발송 전 최종 확인 🌍

이메일 정보:
- 수신자: ${formData.field_0 || ''}
- 제목: ${formData.field_1 || ''}
- 목적: ${formData.field_2 || ''}
- 주요내용: ${formData.field_3 || ''}
- 번역언어: ${formData.field_4 || '한국어'}
- 톤앤매너: ${formData.field_5 || '공식적'}

✨ AI 이메일 핵심 기능:
1. 4개국어 완벽 번역 (한/영/일/중)
2. 태양광 업계 전문용어 정확한 번역
3. 문화적 특성 고려한 비즈니스 매너
4. 발송 전 최종 검토 시스템
5. 해외 거래처 소통 완벽 지원

JSON 형식으로 전문적인 이메일을 생성해주세요:
{
  "title": "이메일_[수신자]_[제목]_[날짜]",
  "content": {
    "documentType": "다국어 비즈니스 이메일",
    "originalLanguage": "원본 언어",
    "emailInfo": {
      "recipient": "수신자 정보",
      "subject": "이메일 제목",
      "purpose": "이메일 목적",
      "urgency": "긴급도"
    },
    "translations": {
      "korean": {
        "subject": "한국어 제목",
        "body": "한국어 본문",
        "culturalNotes": "한국어 비즈니스 매너"
      },
      "english": {
        "subject": "English Subject",
        "body": "English Body",
        "culturalNotes": "English Business Etiquette"
      },
      "japanese": {
        "subject": "日本語件名",
        "body": "日本語本文",
        "culturalNotes": "日本のビジネスマナー"
      },
      "chinese": {
        "subject": "中文主题",
        "body": "中文正文",
        "culturalNotes": "中文商务礼仪"
      }
    },
    "businessTerms": {
      "solarPanelTerms": "태양광 패널 전문용어",
      "contractTerms": "계약 관련 용어",
      "technicalTerms": "기술적 용어",
      "financialTerms": "재무 관련 용어"
    },
    "culturalConsiderations": {
      "formalityLevel": "격식 수준",
      "businessCustoms": "비즈니스 관습",
      "communicationStyle": "소통 스타일"
    },
    "finalReview": {
      "proofreadingCheck": "교정 검토",
      "toneCheck": "톤앤매너 확인",
      "accuracyCheck": "번역 정확도 확인",
      "readyToSend": "발송 준비 완료 여부"
    },
    "signature": {
      "senderInfo": "발신자 정보",
      "companyBranding": "팜솔라 그룹 서명",
      "contactDetails": "연락처 정보"
    },
    "fullText": "해외 거래처와 실제 소통 가능한 완성된 이메일 전체 문서"
  }
}`;

    default:
      throw new Error(`Unsupported document type: ${type}`);
  }
}

function getDocumentTypeTitle(type: string): string {
  const titles: Record<string, string> = {
    'tax-invoice': '세금계산서',
    'transaction-statement': '거래명세서',
    'contract': '계약서',
    'presentation': '프레젠테이션',
    'proposal': '기획서',
    'minutes': '회의록',
    'email': '이메일'
  };
  
  return titles[type] || '문서';
}
