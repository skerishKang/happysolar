import { useState } from 'react';

export default function useDocumentForm() {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleInputChange = (fieldIndex: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      [`field_${fieldIndex}`]: value
    }));
  };

  // 파일 핸들러는 실제 업로드 로직에 따라 추가 구현 필요
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent, fieldIndex: number) => {
    // ... 파일 업로드 로직 ...
  };

  return {
    formData,
    setFormData,
    handleInputChange,
    handleFileChange,
  };
} 