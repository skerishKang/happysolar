import { processUploadedFiles, ProcessedFile } from './file-processor';
import { Configuration, OpenAIApi } from 'openai';
import { config } from '../config';

const configuration = new Configuration({
  apiKey: config.openai.apiKey,
});

const openai = new OpenAIApi(configuration);

export async function generateDocumentContent(
  type: string,
  formData: Record<string, any>,
  uploadedFiles: Array<{
    originalName: string;
    type: string;
    path: string;
  }>
): Promise<string> {
  console.log('=== Document Generation Process ===');
  console.log(`Type: ${type}`);
  console.log(`Form Data:`, formData);
  console.log(`Uploaded Files Count: ${uploadedFiles.length}`);

  try {
    // 파일 처리
    const processedFiles = await processUploadedFiles(uploadedFiles);
    console.log('Processed Files:', processedFiles.map(f => ({
      name: f.originalName,
      type: f.type,
      contentLength: f.content.length
    })));

    // OpenAI API 호출
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional document generator. Generate content based on the provided form data and reference files."
        },
        {
          role: "user",
          content: JSON.stringify({
            type,
            formData,
            referenceFiles: processedFiles
          })
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const generatedContent = response.data.choices[0]?.message?.content;
    if (!generatedContent) {
      throw new Error('Failed to generate content');
    }

    console.log('=== Document Generation Complete ===');
    return generatedContent;
  } catch (error) {
    console.error('Error generating document:', error);
    throw error;
  }
} 