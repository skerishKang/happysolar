const handleFileUpload = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', file.type);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('파일 업로드에 실패했습니다.');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('파일 업로드 중 오류 발생:', error);
    throw error;
  }
}; 