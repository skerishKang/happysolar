import { API_BASE_URL } from "./config";

export async function handleFileUpload(file: File) {
  console.log('FileUploader: Starting upload for file:', file.name);
  
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    const formData = new FormData();
    formData.append('file', file);

    console.log('FileUploader: Sending request to', `${API_BASE_URL}/api/upload`);
    
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    console.log('FileUploader: Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '알 수 없는 서버 오류' }));
      throw new Error(errorData.message || '파일 업로드에 실패했습니다. 서버 응답 코드: ' + response.status);
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('FileUploader: JSON 파싱 오류:', jsonError);
      throw new Error('서버 응답을 해석할 수 없습니다. (JSON 파싱 오류)');
    }

    console.log('FileUploader: Received successful response:', data);
    
    if (!data.file) {
      console.error('FileUploader: Response missing file information:', data);
      throw new Error('서버 응답에 파일 정보가 없습니다.');
    }

    return data;
  } catch (error) {
    console.error('FileUploader: Error during fetch or JSON parsing:', error);
    throw error;
  }
} 