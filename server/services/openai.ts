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
  uploadedFiles: { originalName: string; type: string; content: string; }[];
}

export async function generateDocumentContent(params: DocumentGenerationParams): Promise<{
  title: string;
  content: any;
}> {
  const { type, formData, companyInfo, uploadedFiles } = params;

  try {
    const prompt = createPromptForDocumentType(type, formData, companyInfo, uploadedFiles);

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

function createPromptForDocumentType(type: string, formData: Record<string, any>, companyInfo: any, uploadedFiles: any[]): string {
  console.log('Creating prompt with uploaded files:', uploadedFiles.length);

  let fileContents = '';
  if (uploadedFiles && uploadedFiles.length > 0) {
    fileContents = uploadedFiles.map((file, index) => {
      const contentPreview = file.content.length > 1000 
        ? file.content.substring(0, 1000) + '...(더 많은 내용 있음)' 
        : file.content;

      return `=== 업로드된 파일 ${index + 1} ===
파일명: ${file.originalName}
파일 유형: ${file.type}
내용:
${contentPreview}
================================`;
    }).join('\n\n');
  } else {
    fileContents = '업로드된 파일이 없습니다.';
  }

  const baseCompanyInfo = `회사 정보:
- 회사명: ${companyInfo.name}
- 사업자등록번호: ${companyInfo.businessNumber}
- 주소: ${companyInfo.address}
- 업종: ${companyInfo.businessType}
- 대표자: ${companyInfo.representative}

업로드된 참고 자료:
${fileContents}

사용자 입력 데이터: 
${JSON.stringify(formData, null, 2)}`;

  switch (type) {
    case 'quotation':
      return `${baseCompanyInfo}

💰 전문 견적서 자동 생성 (태양광 전문) 💰

고객 정보:
- 고객 회사명: ${formData.field_0 || '업로드된 파일에서 자동 추출'}
- 담당자명: ${formData.field_1 || '업로드된 파일에서 자동 추출'}
- 연락처: ${formData.field_2 || '업로드된 파일에서 자동 추출'}
- 이메일: ${formData.field_3 || '업로드된 파일에서 자동 추출'}

견적 내용:
- 견적 요청 내용: ${formData.field_4 || '태양광 발전시설 설치 (업로드된 파일 참고)'}
- 설치 장소: ${formData.field_5 || '업로드된 파일에서 자동 추출'}
- 예상 용량: ${formData.field_6 || '업로드된 파일에서 자동 추출'}kW
- 견적 유효기간: ${formData.field_7 || '30일'}
- 공사 예정일: ${formData.field_8 || '업로드된 파일에서 자동 추출'}
- 특별 요구사항: ${formData.field_9 || '업로드된 파일에서 자동 추출'}

💡 중요: 업로드된 파일에서 자동으로 정보를 추출하여 빈 필드를 채워주세요.

JSON 형식으로 전문적인 견적서를 생성해주세요:
{
  "title": "견적서_[고객회사명]_[날짜]",
  "content": {
    "documentType": "태양광 발전소 설치 견적서",
    "quotationNumber": "자동생성 견적서 번호",
    "issueDate": "견적서 작성일",
    "validUntil": "견적 유효기간",
    "customer": {
      "companyName": "고객 회사명 (파일에서 추출)",
      "contactPerson": "담당자명 (파일에서 추출)",
      "phone": "연락처 (파일에서 추출)",
      "email": "이메일 (파일에서 추출)",
      "address": "설치 장소 (파일에서 추출)"
    },
    "projectDetails": {
      "capacity": "설치 용량 (파일에서 추출)",
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
}`;

    case 'tax-invoice':
      return `${baseCompanyInfo}

🖋️ 국세청 양식 완벽 준수 전자세금계산서 🖋️

매입처 정보:
- 매입처 회사명: ${formData.field_0 || '업로드된 파일에서 자동 추출'}
- 사업자등록번호: ${formData.field_1 || '업로드된 파일에서 자동 추출'}
- 대표자: ${formData.field_2 || '업로드된 파일에서 자동 추출'}
- 주소: ${formData.field_3 || '업로드된 파일에서 자동 추출'}

세금계산서 정보:
- 작성일자: ${formData.field_4 || '오늘 날짜'}
- 품목: ${formData.field_5 || '업로드된 파일에서 자동 추출'} 외
- 공급가액: ${formData.field_6 || '업로드된 파일에서 자동 추출'}
- 세액: ${formData.field_7 || '업로드된 파일에서 자동 추출'}

JSON 형식으로 전자세금계산서를 생성해주세요:
{
  "title": "세금계산서_[매입처]_[날짜]",
  "content": {
    "documentType": "전자세금계산서",
    "invoiceInfo": {
      "invoiceNumber": "세금계산서 번호",
      "issueDate": "작성일자",
      "supplyDate": "공급일자",
      "currency": "통화"
    },
    "seller": {
      "companyName": "공급자(팜솔라그룹) 회사명",
      "businessNumber": "공급자 사업자등록번호",
      "representative": "공급자 대표자",
      "address": "공급자 주소"
    },
    "buyer": {
      "companyName": "매입처 회사명 (파일에서 추출)",
      "businessNumber": "매입처 사업자등록번호 (파일에서 추출)",
      "representative": "매입처 대표자 (파일에서 추출)",
      "address": "매입처 주소 (파일에서 추출)"
    },
    "items": [
      {
        "itemName": "품목명 (파일에서 추출)",
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
- 거래처명: ${formData.field_0 || '업로드된 파일에서 자동 추출'}
- 거래기간: ${formData.field_1 || '업로드된 파일에서 자동 추출'}부터 ${formData.field_2 || '업로드된 파일에서 자동 추출'}까지
- 거래유형: ${formData.field_3 || '태양광 발전시설 공급'}

거래 내용:
- 총 거래금액: ${formData.field_4 || '업로드된 파일에서 자동 추출'}
- 결제조건: ${formData.field_5 || '업로드된 파일에서 자동 추출'}
- 특이사항: ${formData.field_6 || '업로드된 파일에서 자동 추출'}

JSON 형식으로 전문적인 거래명세서를 생성해주세요:
{
  "title": "거래명세서_[거래처명]_[기간]",
  "content": {
    "documentType": "거래명세서",
    "period": "거래기간",
    "client": {
      "name": "거래처명 (파일에서 추출)",
      "businessNumber": "사업자번호 (파일에서 추출)",
      "address": "주소 (파일에서 추출)",
      "contact": "연락처 (파일에서 추출)"
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
- 계약상대방: ${formData.field_0 || '업로드된 파일에서 자동 추출'}
- 계약유형: ${formData.field_1 || '태양광 발전시설 공급계약'}
- 계약금액: ${formData.field_2 || '업로드된 파일에서 자동 추출'}
- 계약기간: ${formData.field_3 || '업로드된 파일에서 자동 추출'}
- 준공예정일: ${formData.field_4 || '업로드된 파일에서 자동 추출'}
- 특약사항: ${formData.field_5 || '업로드된 파일에서 자동 추출'}

JSON 형식으로 전문적인 계약서를 생성해주세요:
{
  "title": "[계약유형]_[상대방]_[날짜]",
  "content": {
    "documentType": "태양광 발전시설 공급계약서",
    "contractInfo": {
      "contractNumber": "계약번호",
      "contractDate": "계약일자",
      "contractType": "계약유형",
      "totalAmount": "총 계약금액 (파일에서 추출)"
    },
    "parties": {
      "contractor": "발주자(갑) 정보 (파일에서 추출)",
      "supplier": "공급자(을) 정보 - 팜솔라그룹"
    },
    "scope": {
      "projectDescription": "공사 내용 및 범위 (파일에서 추출)",
      "specifications": "시설 규모 및 사양 (파일에서 추출)",
      "deliverables": "인도물 명세"
    },
    "terms": {
      "contractPeriod": "계약기간 (파일에서 추출)",
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
      const slideCount = formData.field_7 || 5;
      const presentationTitle = formData.field_4 || formData.field_3 || formData.field_5 || '팜솔라 사업 제안서';
      const presenter = formData.field_5 || formData.field_3 || formData.field_8 || '팜솔라';
      const duration = formData.field_6 || '10분';
      const style = formData.field_9 || '전문적/비즈니스';
      const audience = formData.field_2 || '비즈니스 파트너';
      
      // 업로드된 파일에서 자동으로 정보 추출
      let extractedInfo = '';
      if (uploadedFiles && uploadedFiles.length > 0) {
        extractedInfo = '\n\n업로드된 참고 자료:\n';
        uploadedFiles.forEach(file => {
          extractedInfo += `- ${file.originalName}: ${file.content.substring(0, 500)}...\n`;
        });
      }

      return `팜솔라그룹(해피솔라)의 전문적인 ${presentationTitle} 프레젠테이션을 ${slideCount}개 슬라이드로 제작해주세요.

프레젠테이션 정보:
- 제목: ${presentationTitle}
- 발표자: ${presenter} 
- 발표 시간: ${duration}
- 스타일: ${style}
- 대상: ${audience}
- 회사: ${companyInfo.name} (${companyInfo.businessType})

회사 정보:
- 회사명: ${companyInfo.name}
- 사업영역: ${companyInfo.businessType}
- 대표자: ${companyInfo.representative}
- 소재지: ${companyInfo.address}
- 사업자등록번호: ${companyInfo.businessNumber}

${extractedInfo}

다음과 같은 구조로 전문적이고 임팩트 있는 프레젠테이션을 만들어주세요:

1. 표지 슬라이드: 회사 소개 및 프레젠테이션 제목
2. 회사 개요: 팜솔라그룹 소개 및 핵심 역량
3. 사업 현황: 주요 실적 및 성과
4. 제안 내용: 구체적인 사업 제안 또는 솔루션
5. 기술적 우위: 차별화된 기술력 및 경쟁력
6. 기대 효과: 예상 성과 및 ROI
7. 실행 계획: 단계별 추진 방안
8. 맺음말: 요약 및 제안

각 슬라이드는 다음을 포함해야 합니다:
- 명확하고 임팩트 있는 제목
- 핵심 메시지 3-5개
- 구체적인 데이터나 사례 (가능한 경우)
- 다음 슬라이드로의 자연스러운 연결

JSON 형식으로 응답해주세요:
{
  "title": "${presentationTitle}",
  "content": {
    "slideStructure": [
      {
        "title": "슬라이드 제목",
        "content": "핵심 메시지",
        "detailedContent": "상세 내용 (3-5개 포인트, 각각 구체적이고 실질적인 내용)"
      }
    ],
    "presentationInfo": {
      "totalSlides": ${slideCount},
      "duration": "${duration}",
      "presenter": "${presenter}",
      "audience": "${audience}",
      "style": "${style}"
    }
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
    'quotation': '견적서',
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