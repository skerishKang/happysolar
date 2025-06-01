.
├── backend/
│   └── src/
│       ├── controllers/
│       │   └── uploadController.ts
│       ├── routes/
│       │   └── uploadRoutes.ts
│       └── services/
│           ├── document-generator.ts
│           └── file-processor.ts
├── client/
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── components/
│       │   ├── document-generator.tsx
│       │   ├── presentation-viewer.tsx
│       │   └── ui/
│       │       └── ... (UI 컴포넌트 다수)
│       ├── lib/
│       │   ├── document-api.ts
│       │   ├── queryClient.ts
│       │   └── utils.ts
│       └── pages/
│           └── ... (필요시)
├── docs/
│   └── project_plan.md
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── document-generator.tsx
│       │   └── FileUploader.tsx
│       └── utils/
│           ├── FileUploader.ts
│           └── config.ts
├── server/
│   ├── db.ts
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   ├── vite.ts
│   └── services/
│       ├── document-generator.ts
│       ├── file-processor.ts
│       └── openai.ts
├── shared/
│   └── schema.ts
├── tsconfig.json
├── package.json
├── package-lock.json
├── README.md
├── 실행.md
├── 프로그램.md
├── drizzle.config.ts
├── postcss.config.js
├── tailwind.config.ts
├── vite.config.ts
