import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(API_KEY);

export interface GenerateQuestionsParams {
    context: string;
    count: number;
    difficulty: string;
    promptInstruction?: string;
    questionType?: 'all' | 'multiple_choice' | 'boolean';
}

export interface AIQuestion {
    content: string;
    type: 'multiple_choice' | 'boolean' | 'text_input';
    points: number;
    options?: string[]; // Simplified array of strings for CSV export
    correct_answer: string;
    explanation: string;
}

export async function generateQuestionsFromAI(params: GenerateQuestionsParams): Promise<AIQuestion[]> {
    if (!API_KEY) {
        throw new Error("VITE_GEMINI_API_KEY is not set. Please configure your environment.");
    }

    const { context, count, difficulty, promptInstruction, questionType } = params;

    // Use Gemini 1.5 Flash for speed and cost
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `
    You are a strict Data Extraction Engine. You DO NOT speak. You ONLY output a valid JSON Array.
    
    Task: Extract or Generate ${count} exam questions from the Context Material provided below.
    Difficulty Level: ${difficulty}
    Question Types Allowed: ${questionType === 'all' ? 'Multiple Choice, True/False, Short Answer' : questionType}
    
    Output JSON Schema (Strict):
    [
      {
        "content": "Question text here",
        "type": "multiple_choice" | "boolean" | "text_input",
        "points": 1,
        "options": ["Option A", "Option B", "Option C", "Option D"] (Required for multiple_choice, empty for others),
        "correct_answer": "Exact text of the correct option",
        "explanation": "Short expectation of why this is correct"
      }
    ]

    Rules:
    1. Ensure "points" is an integer (default 1).
    2. For "boolean" type, options should be ["True", "False"].
    3. Ensure the JSON is valid and parsable.
    4. Do not include markdown code blocks like \`\`\`json. Just the raw JSON array.
    `;

    const userPrompt = `
    ${promptInstruction ? `Additional Instructions: ${promptInstruction}` : ''}

    Context Material:
    ${context.substring(0, 900000)} // Limit context to avoid errors, though Flash handles 1M.
    `;

    try {
        const result = await model.generateContent([systemPrompt, userPrompt]);
        const response = result.response;
        const text = response.text();
        
        // Clean up markdown if present
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const data = JSON.parse(jsonString);
        
        if (!Array.isArray(data)) {
            throw new Error("AI response was not a JSON array.");
        }

        return data as AIQuestion[];
    } catch (error) {
        console.error("Gemini AI generation failed:", error);
        throw new Error("Failed to generate questions. Please try again or refine your prompt.");
    }
}
