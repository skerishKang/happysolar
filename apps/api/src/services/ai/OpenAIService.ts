import OpenAI from "openai";
import { buildPrompt } from "./PromptBuilder";
import { DocumentGenerationParams } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateDocumentContent(params: DocumentGenerationParams) {
  const prompt = buildPrompt(params);
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "문서 생성 시스템" },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    max_tokens: 4000,
    temperature: 0.3
  });
  return JSON.parse(response.choices[0].message.content || '{}');
} 