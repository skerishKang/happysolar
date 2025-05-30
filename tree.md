# 프로젝트 폴더 구조 (2024-06-XX 최신)

```
54.happysolar/
├── .config/
│   └── npm/
│       └── node_global/
│           └── lib/
├── attached_assets/                    # 첨부 파일 및 리소스 (PDF, 이미지 등)
│   ├── (광주협동조합)태양광발전사업제안서_팜솔라.pdf
│   ├── ... (다수의 PDF, PNG, JPG 등)
├── client/                             # 프론트엔드 (React + TypeScript)
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── index.css
│       ├── main.tsx
│       ├── components/
│       │   ├── document-generator.tsx
│       │   ├── presentation-viewer.tsx
│       │   └── ui/
│       │       ├── accordion.tsx
│       │       ├── ... (다수의 UI 컴포넌트)
│       ├── hooks/
│       │   ├── use-mobile.tsx
│       │   └── use-toast.ts
│       ├── lib/
│       │   ├── document-api.ts
│       │   ├── queryClient.ts
│       │   └── utils.ts
│       └── pages/
│           ├── dashboard.tsx
│           └── not-found.tsx
├── logs/                               # 서버/클라이언트 로그 (자동 생성, 현재 없음)
├── server/                             # 백엔드 (Node.js + Express)
│   ├── db.ts
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   ├── vite.ts
│   └── services/
│       ├── document-generator.ts
│       ├── file-processor.ts
│       └── openai.ts
├── shared/                             # 타입 및 스키마 공유
│   └── schema.ts
├── uploads/                            # 업로드 파일 저장소
│   └── 7a9536605721337c92953b2d46cf0c78
├── .gitignore
├── .replit
├── components.json
├── drizzle.config.ts
├── package-lock.json
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── 실행.md
├── 프로그램.md
├── README.md
└── tree.md
```

## 주요 디렉토리 설명

- `/client`: React 기반 프론트엔드, 사용자 인터페이스 및 문서 생성 폼 담당
- `/server`: Node.js Express 백엔드, API, OpenAI 연동, DB 관리
- `/shared`: 프론트/백엔드 공용 타입 및 스키마
- `/attached_assets`: 회사 문서, 로고, 제안서 등 정적 자산
- `/uploads`: 업로드 파일 저장소
- `/logs`: 서버/클라이언트 로그 저장(자동 생성)
- `*.md, *.json, *.ts(x)`: 설정, 설명, 소스코드 파일
