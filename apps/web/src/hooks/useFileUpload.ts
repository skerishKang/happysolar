import { useState } from "react";

export function useFileUpload() {
  const [files, setFiles] = useState<File[]>([]);
  // 실제 파일 업로드 로직은 이곳에 구현
  return { files, setFiles };
} 