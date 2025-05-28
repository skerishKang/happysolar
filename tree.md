
# 프로젝트 폴더 구조

```
HappySolar-Document-Generator/
├── attached_assets/                    # 첨부 파일 및 리소스
│   ├── (광주협동조합)태양광발전사업제안서_팜솔라.pdf
│   ├── (담양축협)사업제안서-팜솔라 조종률.pdf
│   ├── 1.해피솔라_사업자등록증(주소이전)_장흥24.6.11.pdf
│   ├── 20241204 팜솔라 중철책자.pdf
│   ├── 6.업무진행절차_팜솔라.pdf
│   ├── image_1748446842672.png
│   ├── 공사지명원-팜솔라 250317.pdf
│   ├── 메뉴.JPG
│   ├── 용두농협3호 입찰제안서-팜솔라.pdf
│   ├── 웍스AI 제품소개서 (2025_05).pdf
│   └── 해피솔라 로고.png
│
├── client/                             # 프론트엔드 (React + TypeScript)
│   ├── src/
│   │   ├── components/                 # 재사용 가능한 컴포넌트
│   │   │   ├── ui/                     # UI 컴포넌트 라이브러리
│   │   │   │   ├── accordion.tsx
│   │   │   │   ├── alert-dialog.tsx
│   │   │   │   ├── alert.tsx
│   │   │   │   ├── aspect-ratio.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── breadcrumb.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   ├── calendar.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── carousel.tsx
│   │   │   │   ├── chart.tsx
│   │   │   │   ├── checkbox.tsx
│   │   │   │   ├── collapsible.tsx
│   │   │   │   ├── command.tsx
│   │   │   │   ├── context-menu.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── drawer.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   ├── hover-card.tsx
│   │   │   │   ├── input-otp.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── loading-spinner.tsx
│   │   │   │   ├── menubar.tsx
│   │   │   │   ├── navigation-menu.tsx
│   │   │   │   ├── pagination.tsx
│   │   │   │   ├── popover.tsx
│   │   │   │   ├── progress.tsx
│   │   │   │   ├── radio-group.tsx
│   │   │   │   ├── resizable.tsx
│   │   │   │   ├── scroll-area.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── separator.tsx
│   │   │   │   ├── sheet.tsx
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── skeleton.tsx
│   │   │   │   ├── slider.tsx
│   │   │   │   ├── switch.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── textarea.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   ├── toaster.tsx
│   │   │   │   ├── toggle-group.tsx
│   │   │   │   ├── toggle.tsx
│   │   │   │   └── tooltip.tsx
│   │   │   └── document-generator.tsx  # 문서 생성 메인 컴포넌트
│   │   ├── hooks/                      # React 커스텀 훅
│   │   │   ├── use-mobile.tsx
│   │   │   └── use-toast.ts
│   │   ├── lib/                        # 유틸리티 및 API 함수
│   │   │   ├── document-api.ts         # 문서 API 호출
│   │   │   ├── queryClient.ts          # React Query 설정
│   │   │   └── utils.ts                # 공통 유틸리티
│   │   ├── pages/                      # 페이지 컴포넌트
│   │   │   ├── dashboard.tsx           # 메인 대시보드
│   │   │   └── not-found.tsx           # 404 페이지
│   │   ├── App.tsx                     # 앱 루트 컴포넌트
│   │   ├── index.css                   # 글로벌 스타일
│   │   └── main.tsx                    # 앱 엔트리 포인트
│   └── index.html                      # HTML 템플릿
│
├── server/                             # 백엔드 (Node.js + Express)
│   ├── services/                       # 비즈니스 로직
│   │   ├── document-generator.ts       # 문서 생성 서비스
│   │   └── openai.ts                   # OpenAI API 통합
│   ├── db.ts                          # 데이터베이스 설정
│   ├── index.ts                       # 서버 엔트리 포인트
│   ├── routes.ts                      # API 라우트 정의
│   ├── storage.ts                     # 데이터 저장소 추상화
│   └── vite.ts                        # Vite 개발 서버 설정
│
├── shared/                            # 공유 타입 및 스키마
│   └── schema.ts                      # Drizzle ORM 스키마 및 Zod 검증
│
├── .gitignore                         # Git 무시 파일 목록
├── .replit                           # Replit 설정 파일
├── README.md                         # 프로젝트 설명
├── components.json                   # Shadcn/ui 컴포넌트 설정
├── drizzle.config.ts                 # Drizzle ORM 설정
├── package-lock.json                 # NPM 의존성 잠금
├── package.json                      # NPM 패키지 설정
├── postcss.config.js                 # PostCSS 설정
├── tailwind.config.ts                # Tailwind CSS 설정
├── tsconfig.json                     # TypeScript 설정
└── vite.config.ts                    # Vite 빌드 설정
```

## 주요 디렉토리 설명

### `/client`
React 기반 프론트엔드 애플리케이션으로, 사용자 인터페이스와 문서 생성 폼을 담당합니다.

### `/server`
Node.js Express 백엔드로, API 엔드포인트와 OpenAI 통합, 데이터베이스 관리를 담당합니다.

### `/shared`
프론트엔드와 백엔드에서 공유하는 TypeScript 타입 정의와 데이터 스키마가 포함되어 있습니다.

### `/attached_assets`
회사 관련 문서, 로고, 제안서 등의 정적 자산이 저장되어 있습니다.
