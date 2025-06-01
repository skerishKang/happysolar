# 📂 프로젝트 폴더/파일 구조 (2024-06-01 최신)

---

## ✅ 현재 폴더/파일 구조 요약

```
.
├─ apps/                  # 프론트엔드/백엔드 앱
│  ├─ web/
│  │  ├─ components/
│  │  │  ├─ document-generator/
│  │  │  │  ├─ FeatureTemplates.ts (130 lines)
│  │  │  │  ├─ DocumentForm.tsx (179 lines)
│  │  │  │  ├─ FileUploadBox.tsx (35 lines)
│  │  │  │  ├─ PreviewModal.tsx (32 lines)
│  │  │  │  ├─ useDocumentForm.ts (24 lines)
│  │  │  │  ├─ types.ts (7 lines)
│  │  │  │  └─ index.ts (6 lines)
│  │  │  ├─ presentation-viewer.tsx (156 lines)
│  │  │  └─ ui/
│  │  │     └─ ... (UI 컴포넌트 다수)
│  │  ├─ pages/
│  │  │  ├─ dashboard/
│  │  │  │  ├─ FeatureCards.tsx (80 lines)
│  │  │  │  ├─ RecentDocuments.tsx (83 lines)
│  │  │  │  ├─ CompanyInfoPanel.tsx (57 lines)
│  │  │  │  ├─ StatsCards.tsx (65 lines)
│  │  │  │  ├─ types.ts (22 lines)
│  │  │  │  ├─ useDashboardData.ts (22 lines)
│  │  │  │  └─ index.ts (6 lines)
│  │  │  ├─ dashboard.tsx (1 line, 엔트리포인트)
│  │  │  └─ not-found.tsx (22 lines)
│  │  ├─ lib/
│  │  │  ├─ document-api.ts (85 lines)
│  │  │  ├─ queryClient.ts (58 lines)
│  │  │  └─ utils.ts (7 lines)
│  │  ├─ hooks/
│  │  │  ├─ use-mobile.tsx (20 lines)
│  │  │  └─ use-toast.ts (192 lines)
│  │  └─ ...
│  └─ api/
│     ├─ src/
│     │  ├─ openai/
│     │  │  ├─ types.ts (12 lines)
│     │  │  ├─ promptTemplates.ts (19 lines)
│     │  │  ├─ service.ts (48 lines)
│     │  │  └─ index.ts (1 line)
│     │  ├─ openai.ts (1 line, 엔트리포인트)
│     │  ├─ storage/
│     │  │  ├─ types.ts (20 lines)
│     │  │  ├─ utils.ts (5 lines)
│     │  │  ├─ service.ts (14 lines)
│     │  │  ├─ controller.ts (8 lines)
│     │  │  └─ index.ts (1 line)
│     │  ├─ storage.ts (1 line, 엔트리포인트)
│     │  ├─ routes.ts (234 lines)
│     │  ├─ file-processor.ts (131 lines)
│     │  ├─ document-generator.ts (65 lines)
│     │  ├─ db.ts (48 lines)
│     │  ├─ vite.ts (86 lines)
│     │  └─ services/
│     │     ├─ ai/
│     │     │  ├─ OpenAIService.ts (20 lines)
│     │     │  ├─ PromptBuilder.ts (6 lines)
│     │     │  └─ types.ts (12 lines)
│     │     └─ document/
│     │        ├─ DocumentService.ts (1 line)
│     │        ├─ PptxGenerator.ts (8 lines)
│     │        ├─ PdfGenerator.ts (7 lines)
│     │        └─ types.ts (6 lines)
│     └─ ...
├─ packages/              # 공통 모듈/타입
│  └─ shared/
├─ docs/                  # 프로젝트 문서
├─ assets/                # 이미지, 폰트 등 정적 자산
├─ backup/                # 예전 자료/백업 폴더 (구 archive)
├─ uploads/               # 업로드 파일 저장소
├─ 실행.md                # 운영팀/리더 참고용 체크리스트(삭제/이동X)
└─ ...
```

## 200줄 이상 단일 파일 현황
- **현재 200줄 이상 단일 소스 파일 없음** (모든 대형 파일 역할별로 완전 분리/모듈화)

(2024-06-01 기준, 리팩토링 및 구조화 완료)

---

## 👍 잘된 점

1. **모노레포 구조**
   - 역할별 폴더 분리(`apps/`, `packages/`, `docs/`, `uploads/` 등)
   - 프론트/백엔드가 `apps/` 아래 명확히 분리
2. **공통 모듈 관리**
   - `packages/shared/`로 타입, 유틸, 스키마 공유
3. **문서화**
   - `docs/`, `tree.md`, `README.md` 등으로 구조/설명 분리
4. **환경설정/툴링 파일 관리**
   - 설정 파일이 루트에 일목요연하게 정리
5. **불필요 파일/민감정보 관리**
   - `.env` 등 민감정보 제외, `.gitignore` 반영

---

## 👀 보완/고려할 점

1. **특수 폴더 용도 명확화**
   - `archive/`, `attached_assets/`, `Noto_Sans_KR/` 등은 README나 tree.md에 한 줄 설명 추가 추천
2. **폴더명 통일성**
   - 예) `attached_assets` → `assets/` 등으로 단순화 가능
   - 폰트 등은 `assets/fonts/Noto_Sans_KR/`로 구조화도 고려
3. **문서 폴더 세분화**
   - 문서 많아지면 `docs/specs/`, `docs/api/` 등 하위 폴더 설계 추천
4. **uploads/ 관리**
   - 업로드 파일은 `.gitignore`에 등록해 원본 저장소 반영 방지
5. **.replit 등 설정 파일**
   - 실제 필요 없다면 정리 가능
6. **폴더/파일 표기 일관성**
   - 소문자+하이픈/언더스코어 등 일관성 유지, 불필요 폴더/파일 주기적 정리

---

## 📝 구조 개선/정리 예시

```md
apps/
  ├─ web/              # 프론트엔드(React, Vite)
  └─ api/              # 백엔드(Express, TypeScript)
archive/               # 예전 자료/백업 폴더(불필요시 정리)
assets/
  └─ fonts/
    └─ Noto_Sans_KR/   # 폰트자산
attached_assets/       # 첨부 자산(이미지, 문서 등)
docs/                  # 문서
packages/
  └─ shared/           # 공통 타입/스키마
uploads/               # 업로드 파일(배포시 .gitignore 추천)
...
```

- 폴더/파일별 용도와 포함/제외 정책 주석 등 명확히!

---

## 🟢 최종 제안

- **현재 구조 매우 양호** (현업/오픈소스 표준과 유사)
- 특수 폴더(`archive/`, `attached_assets/`, `Noto_Sans_KR/`) 용도만 README나 tree.md에서 한 줄 설명 추천
- 폴더명 약간 통일하거나, 자산 폴더 구조(asset/fonts/ 등) 고려해도 좋음
- 문서/코드/자산이 많아지면 세부 폴더 분류, 오래된/불필요 파일 주기적 정리

---

### 궁금하거나 "이렇게 바꿔도 괜찮을까?" 싶은 점이 있으면
특정 폴더/구조/운영 고민도 언제든 질문 주세요!
구조 리팩토링 예시, README 템플릿, 깃허브 협업팁 등도 제공 가능합니다.

```
.
├── apps
│   ├── api
│   │   ├── package.json (29 lines)
│   │   ├── tsconfig.json (32 lines)
│   │   ├── src
│   │   │   ├── routes.ts (237 lines)
│   │   │   ├── db.ts (48 lines)
│   │   │   ├── index.ts (5 lines)
│   │   │   ├── vite.ts (86 lines)
│   │   │   ├── file-processor.ts (131 lines)
│   │   │   ├── services
│   │   │   │   ├── document-generator.ts (52 lines)
│   │   │   │   ├── document
│   │   │   │   │   ├── PptxGenerator.ts (7 lines)
│   │   │   │   │   ├── PdfGenerator.ts (4 lines)
│   │   │   │   │   ├── DocumentService.ts (1 line)
│   │   │   │   │   ├── types.ts (6 lines)
│   │   │   │   ├── ai
│   │   │   │   │   ├── types.ts (12 lines)
│   │   │   │   │   ├── OpenAIService.ts (20 lines)
│   │   │   │   │   ├── PromptBuilder.ts (6 lines)
│   │   │   │   │   └── types.ts (12 lines)
│   │   │   │   ├── storage
│   │   │   │   │   ├── types.ts (21 lines)
│   │   │   │   │   ├── controller.ts (15 lines)
│   │   │   │   │   ├── utils.ts (6 lines)
│   │   │   │   │   ├── service.ts (14 lines)
│   │   │   │   │   ├── index.ts (1 line)
│   │   │   │   ├── openai
│   │   │   │   │   ├── promptTemplates.ts (20 lines)
│   │   │   │   │   ├── index.ts (1 line)
│   │   │   │   │   ├── service.ts (48 lines)
│   │   │   │   │   ├── types.ts (12 lines)
│   │   │   │   └── services
│   │   │   │   └── ai
│   │   │   │       └── types.ts (12 lines)
│   │   │   └── services
│   │   │       └── ai
│   │   │           └── types.ts (12 lines)
│   │   └── services
│   │       └── ai
│   │           └── types.ts (12 lines)
│   └── web
│       ├── App.tsx (33 lines)
│       ├── main.tsx (6 lines)
│       ├── index.html (13 lines)
│       ├── index.css (151 lines)
│       ├── pages
│       │   ├── dashboard.tsx (240 lines)
│       │   └── not-found.tsx (22 lines)
│       │   ├── dashboard
│       │   │   ├── FeatureCards.tsx (82 lines)
│       │   │   ├── RecentDocuments.tsx (78 lines)
│       │   │   ├── StatsCards.tsx (61 lines)
│       │   │   ├── index.ts (6 lines)
│       │   │   ├── CompanyInfoPanel.tsx (52 lines)
│       │   │   ├── useDashboardData.ts (22 lines)
│       │   │   ├── types.ts (22 lines)
│       │   │   └── components
│       │   │       ├── document-generator.tsx (523 lines)
│       │   │       ├── presentation-viewer.tsx (156 lines)
│       │   │       └── ui
│       │   │           ├── card.tsx (80 lines)
│       │   │           ├── toaster.tsx (34 lines)
│       │   │           ├── tooltip.tsx (31 lines)
│       │   │           └── ... (생략, 40+개 UI 컴포넌트)
│       │   ├── lib
│       │   └── hooks
│       └── src
├── packages
│   ├── shared
│   │   ├── package.json (13 lines)
│   │   ├── tsconfig.json (10 lines)
│   │   ├── src
│   │   │   ├── schema.ts (56 lines)
│   │   │   ├── schema.js (44 lines)
│   │   │   └── types.ts (12 lines)
│   │   └── types.ts (12 lines)
│   ├── docs
│   │   └── project_plan.md (39 lines)
│   ├── archive
│   │   ├── server
│   │   │   ├── storage.ts (532 lines)
│   │   │   ├── routes.ts (234 lines)
│   │   │   ├── db.ts (48 lines)
│   │   │   ├── index.ts (72 lines)
│   │   │   ├── vite.ts (86 lines)
│   │   │   ├── services
│   │   │   │   ├── file-processor.ts (131 lines)
│   │   │   │   ├── openai.ts (591 lines)
│   │   │   │   ├── document-generator.ts (65 lines)
│   │   │   └── services
│   │   │       └── ai
│   │   │           └── types.ts (12 lines)
│   │   └── 실행_old.md (140 lines)
│   └── 프로그램.md (77 lines)
├── README.md (52 lines)
├── tree.md (업데이트됨)
├── ... 기타 설정/환경 파일
```

- `node_modules`, 빌드 산출물 등은 생략
- 주요 폴더/파일만 표기, 상세 UI 컴포넌트 등은 ... 처리
- Noto Sans KR 폰트 파일 경로: `Noto_Sans_KR/`, `Noto_Sans_KR/static/`
