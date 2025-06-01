import { useState } from "react";

export function useDocumentGeneration() {
  const [status, setStatus] = useState<"idle" | "generating" | "done">("idle");
  // 실제 문서 생성 로직은 이곳에 구현
  return { status, setStatus };
} 