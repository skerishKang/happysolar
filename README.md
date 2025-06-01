# HappySolar Monorepo

## 프로젝트 구조

```
.
├── apps/
│   ├── web/   # 프론트엔드 (React, Vite)
│   └── api/   # 백엔드 (Express, TypeScript)
├── packages/
│   └── shared/ # 공통 타입/스키마
├── docs/      # 문서
├── uploads/   # 업로드 파일
├── .env       # 환경변수 파일 (루트)
├── package.json (monorepo 관리)
├── tsconfig.json (공통 타입스크립트 설정)
└── ...
```

## 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행 (프론트+백 동시)
```bash
npm run dev
```
- 프론트엔드: http://localhost:5173 (또는 5174 등)
- 백엔드(API): http://localhost:5000

### 3. 빌드
```bash
npm run build
```

## 주요 폴더 설명
- `apps/web` : 프론트엔드(React, Vite)
- `apps/api` : 백엔드(Express, TypeScript)
- `packages/shared` : 공통 타입/스키마
- `docs` : 프로젝트 문서
- `uploads` : 업로드 파일 저장소

## 환경변수 예시
.env.example 파일을 참고하여 .env 파일을 생성하세요.

---

## 문의/기여
- 구조/설정/코드 관련 문의는 이슈로 남겨주세요.