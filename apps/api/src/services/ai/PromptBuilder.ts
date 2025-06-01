import { DocumentGenerationParams } from "./types";

export function buildPrompt(params: DocumentGenerationParams): string {
  // 실제 프롬프트 생성 로직은 기존 openai.ts에서 복사/이동 필요
  return `문서 타입: ${params.type}\n회사명: ${params.companyInfo.name}`;
} 