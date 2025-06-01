import type { FormField } from './types';

export const featureTemplates: Record<string, { title: string; icon: string; fields: FormField[]; aiDescription: string }> = {
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
      { label: '프레젠테이션 제목', type: 'text', placeholder: '아파트 태양광 발전소 구축 제안서', required: false },
      { label: '발표 목적', type: 'select', options: ['신규 사업 제안', '제품/서비스 소개', '프로젝트 실적 보고', '투자 유치', '교육/세미나'], required: false },
      { label: '대상 청중', type: 'text', placeholder: '아파트 입주자대표회의, 건설사 임원진', required: false },
      { label: '발표 시간', type: 'select', options: ['10분 (간단 소개)', '20분 (표준 발표)', '30분 (상세 설명)', '60분 (워크샵형)'], required: false },
      { label: '슬라이드 수', type: 'number', placeholder: '15', required: false },
      { label: '핵심 메시지 (간단히)', type: 'text', placeholder: '태양광 에너지의 미래와 해피솔라 차별화', required: false },
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