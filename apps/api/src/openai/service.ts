import OpenAI from "openai";
import { createPromptForDocumentType, getDocumentTypeTitle } from "./promptTemplates";
import { DocumentGenerationParams } from "./types";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-api-key-here"
});

export async function generateDocumentContent(params: DocumentGenerationParams): Promise<{
  title: string;
  content: any;
}> {
  const { type, formData, companyInfo, uploadedFiles } = params;

  try {
    const prompt = createPromptForDocumentType(type, formData, companyInfo, uploadedFiles);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert Korean business document generator for HappySolar, a solar panel installation company. 
          Generate professional, accurate documents in Korean that comply with Korean business standards and regulations.
          Always include company information accurately and format documents professionally.
          Return response in JSON format with 'title' and 'content' fields.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      title: result.title || `${getDocumentTypeTitle(type)}_${Date.now()}`,
      content: result.content || result
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error("Failed to generate document with AI. Please check your OpenAI API key configuration.");
  }
} 